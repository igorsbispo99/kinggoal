import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig, lerEstado, gravarEstado, caminhos, dataDeHoje } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { aplicarConsertos, bloqueios, avisos } from './contratos.js';
import { log } from '../nucleo/log.js';

export function lerRegras() {
  return JSON.parse(readFileSync(join(caminhos.DIR_CONFIG, 'regras.json'), 'utf8'));
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * O supervisor é o braço executivo do DiTV.IA.
 *
 * Ele não decide o que é uma boa pauta — decide se um time pode rodar agora,
 * o que fazer quando ele falha, e quando parar o dia. É a diferença entre um
 * estúdio que quebra por inteiro quando uma peça falha e um que degrada de
 * forma prevista e continua no ar.
 */
export class Supervisor {
  constructor({ data = dataDeHoje() } = {}) {
    this.data = data;
    this.regras = lerRegras();
    this.cfg = lerConfig();
    this.inicio = Date.now();
    this.diario = [];
    this.incidentes = [];
    this.desligados = new Set();

    // Times desligados em execuções anteriores continuam desligados até que o
    // diretor ou o dono religue — senão o estúdio repete o mesmo erro todo dia.
    const memoria = lerEstado('diretor-times', { desligados: {} });
    this.memoriaTimes = memoria;
    for (const [time, info] of Object.entries(memoria.desligados || {})) {
      if (info.ate && info.ate < this.data) continue; // quarentena venceu
      this.desligados.add(time);
    }
  }

  essencial(time) {
    return this.regras.timesOpcionais.essenciais.includes(time);
  }

  ligado(time) {
    return !this.desligados.has(time);
  }

  registrar(evento) {
    this.diario.push({ em: new Date().toISOString(), ...evento });
  }

  /** Barreiras que valem para a esteira toda, não para um time específico. */
  conferirLimites() {
    const problemas = [];
    const op = this.regras.operacao;

    const gasto = gastoDoMes().totalUSD;
    if (gasto >= this.cfg.custos.tetoMensalUSD) {
      problemas.push({
        regra: 'teto-de-custo',
        detalhe: `o mês já custou US$ ${gasto.toFixed(2)}, no teto de US$ ${this.cfg.custos.tetoMensalUSD}`,
      });
    }

    const minutos = (Date.now() - this.inicio) / 60000;
    if (minutos > op.minutosMaximosPorEsteira) {
      problemas.push({
        regra: 'tempo-de-esteira',
        detalhe: `a esteira já roda há ${minutos.toFixed(0)} minutos, acima do limite de ${op.minutosMaximosPorEsteira}`,
      });
    }
    return problemas;
  }

  /** Modo econômico: perto do teto, os times criativos caem para o modelo barato. */
  aplicarDegradacaoDeCusto() {
    const gasto = gastoDoMes().totalUSD;
    if (gasto >= this.cfg.custos.alertaEmUSD && !this.economico) {
      this.economico = true;
      this.registrar({ tipo: 'degradacao', motivo: 'custo do mês passou do alerta', acao: 'times criativos no modelo barato' });
      log.aviso(`DiTV.IA: modo econômico ligado — US$ ${gasto.toFixed(2)} gastos no mês`);
    }
    return this.economico === true;
  }

  desligarTime(time, motivo, { diasDeQuarentena = 1 } = {}) {
    this.desligados.add(time);
    const ate = new Date(Date.now() + diasDeQuarentena * 86400000).toISOString().slice(0, 10);
    this.memoriaTimes.desligados[time] = { motivo, desde: this.data, ate };
    gravarEstado('diretor-times', this.memoriaTimes);
    this.registrar({ tipo: 'desligamento', time, motivo, ate });
    log.aviso(`DiTV.IA: time ${time} desligado até ${ate} — ${motivo}`);
  }

  religarTime(time) {
    this.desligados.delete(time);
    delete this.memoriaTimes.desligados[time];
    gravarEstado('diretor-times', this.memoriaTimes);
    this.registrar({ tipo: 'religamento', time });
  }

  /**
   * Roda um time sob supervisão: confere se pode, executa com retentativa,
   * confere a saída contra o contrato e decide o que fazer com o resultado.
   *
   * Devolve { ok, valor, achados, pulado }. Nunca lança por falha de time
   * opcional — a esteira precisa poder seguir sem ele.
   */
  async executar(time, tarefa, { contrato = null, opcional = null, plandoB = null } = {}) {
    const ehOpcional = opcional ?? !this.essencial(time);

    if (!this.ligado(time)) {
      const motivo = this.memoriaTimes.desligados[time]?.motivo || 'desligado pelo diretor';
      this.registrar({ tipo: 'pulado', time, motivo });
      log.aviso(`DiTV.IA: pulando ${time} — ${motivo}`);
      return { ok: false, pulado: true, valor: plandoB ? await plandoB() : null, achados: [] };
    }

    const limites = this.conferirLimites();
    if (limites.length) {
      for (const l of limites) this.incidentes.push({ time, gravidade: 'parada', ...l });
      throw new Error(`DiTV.IA parou a esteira: ${limites.map((l) => l.detalhe).join(' · ')}`);
    }

    const tentativas = this.regras.operacao.tentativasPorTime;
    let ultimoErro;

    for (let t = 1; t <= tentativas; t++) {
      try {
        const t0 = Date.now();
        let valor = await tarefa({ economico: this.aplicarDegradacaoDeCusto(), tentativa: t });
        const segundos = ((Date.now() - t0) / 1000).toFixed(1);

        // --- double check -------------------------------------------------
        let achados = contrato ? contrato(valor) : [];
        const consertados = aplicarConsertos(valor, achados);
        if (consertados.aplicados) {
          valor = consertados.objeto;
          this.registrar({ tipo: 'conserto', time, quantos: consertados.aplicados });
          log.info(`DiTV.IA: ${consertados.aplicados} conserto(s) automático(s) em ${time}`);
        }

        const barram = bloqueios(achados);
        if (barram.length) {
          // Bloqueio de contrato é problema do trabalho, não da infraestrutura:
          // tentar de novo pode resolver, porque o modelo produz outra saída.
          ultimoErro = new Error(barram.map((b) => `${b.regra}: ${b.detalhe}`).join(' · '));
          this.registrar({ tipo: 'reprovado-no-contrato', time, tentativa: t, achados: barram });
          log.aviso(`DiTV.IA: ${time} reprovado no double check (tentativa ${t}/${tentativas}) — ${barram[0].detalhe}`);
          if (t < tentativas) continue;
          throw ultimoErro;
        }

        for (const a of avisos(achados)) {
          this.registrar({ tipo: 'aviso', time, regra: a.regra, detalhe: a.detalhe });
        }

        this.registrar({ tipo: 'concluido', time, segundos: Number(segundos), avisos: avisos(achados).length });
        return { ok: true, valor, achados, pulado: false };

      } catch (e) {
        ultimoErro = e;
        this.registrar({ tipo: 'falha', time, tentativa: t, erro: String(e.message).slice(0, 300) });
        if (t < tentativas) {
          const pausa = 3000 * t;
          log.aviso(`DiTV.IA: ${time} falhou (${t}/${tentativas}), repetindo em ${pausa / 1000}s`);
          await espera(pausa);
        }
      }
    }

    // Esgotou as tentativas.
    this.incidentes.push({
      time,
      gravidade: ehOpcional ? 'contornado' : 'parada',
      regra: 'time-falhou',
      detalhe: String(ultimoErro?.message || 'erro desconhecido').slice(0, 400),
    });

    if (ehOpcional) {
      const falhasSeguidas = (this.memoriaTimes.falhas?.[time] || 0) + 1;
      this.memoriaTimes.falhas = { ...this.memoriaTimes.falhas, [time]: falhasSeguidas };
      gravarEstado('diretor-times', this.memoriaTimes);

      if (falhasSeguidas >= this.regras.operacao.desligarTimeApos) {
        this.desligarTime(time, `falhou ${falhasSeguidas} vezes seguidas`);
      }
      log.aviso(`DiTV.IA: ${time} é opcional e falhou — seguindo sem ele`);
      return { ok: false, pulado: false, valor: plandoB ? await plandoB() : null, achados: [] };
    }

    throw new Error(`DiTV.IA: time essencial ${time} falhou depois de ${tentativas} tentativas — ${ultimoErro?.message}`);
  }

  /** Zera o contador de falhas de um time que voltou a funcionar. */
  marcarSucesso(time) {
    if (this.memoriaTimes.falhas?.[time]) {
      delete this.memoriaTimes.falhas[time];
      gravarEstado('diretor-times', this.memoriaTimes);
    }
  }

  resumo() {
    const porTipo = {};
    for (const e of this.diario) porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
    return {
      data: this.data,
      duracaoMinutos: Number(((Date.now() - this.inicio) / 60000).toFixed(1)),
      economico: this.economico === true,
      eventos: porTipo,
      incidentes: this.incidentes,
      desligados: [...this.desligados],
      diario: this.diario,
    };
  }
}
