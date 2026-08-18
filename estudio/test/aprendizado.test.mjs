import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { caminhos } from '../src/nucleo/estado.js';
import { abrirObservacao, fecharObservacao, registrarReversao, placar } from '../src/diretor/memoria.js';
import { reavaliar, rebaixar, nivelDe, panorama, definirTeto, podeDecidirSozinho } from '../src/diretor/autonomia.js';
import { confiancaDe, estadoDe } from '../src/diretor/doutrina.js';

/** Cada teste começa do zero: o aprendizado é acumulativo por natureza. */
function limpar() {
  for (const f of ['autonomia.json', 'doutrina.json']) {
    const p = join(caminhos.DIR_ESTADO, f);
    if (existsSync(p)) rmSync(p);
  }
  for (let m = 1; m <= 12; m++) {
    const p = join(caminhos.DIR_ESTADO, `memoria-2026-${String(m).padStart(2, '0')}.json`);
    if (existsSync(p)) rmSync(p);
  }
}

/** Simula N decisões do dono num domínio, com o diretor prevendo antes. */
function simular(dominio, resultados) {
  const ids = [];
  resultados.forEach((certa, i) => {
    const id = abrirObservacao({
      dominio, referencia: `sim${i}`,
      situacao: { caso: i },
      previsao: { decisao: 'aprovado', confianca: 80, baseadoEm: [] },
    });
    fecharObservacao(id, { decisao: certa ? 'aprovado' : 'reprovado', motivo: '' });
    ids.push(id);
  });
  return ids;
}

test('o diretor começa sem nenhuma autonomia', () => {
  limpar();
  for (const p of panorama()) assert.equal(p.nivel, 0, `${p.dominio} deveria começar em 0`);
});

test('acertar pouco não promove', () => {
  limpar();
  simular('pauta', [true, true, true, true]);           // 4 acertos, mínimo é 8
  reavaliar();
  assert.equal(nivelDe('pauta'), 0, 'amostra pequena não pode promover');
});

test('acertar o bastante promove um degrau por vez', () => {
  limpar();
  simular('pauta', Array(10).fill(true));                // 10 acertos limpos
  reavaliar();
  assert.equal(nivelDe('pauta'), 1, 'deveria subir para 1');

  // Uma segunda reavaliação sem decisões novas não pode subir de novo:
  // o degrau 2 exige 20 observações.
  reavaliar();
  assert.equal(nivelDe('pauta'), 1, 'não pode pular degrau sem nova evidência');
});

test('nunca sobe dois degraus na mesma rodada', () => {
  limpar();
  simular('roteiro', Array(50).fill(true));              // placar de sobra para o nível 3
  reavaliar();
  assert.equal(nivelDe('roteiro'), 1, 'mesmo com placar perfeito, sobe um por vez');
  reavaliar();
  assert.equal(nivelDe('roteiro'), 2, 'segunda rodada leva ao 2');
});

test('errar derruba a taxa e trava a promoção', () => {
  limpar();
  simular('midia', [...Array(6).fill(true), ...Array(4).fill(false)]);  // 60% de acerto
  reavaliar();
  assert.equal(nivelDe('midia'), 0, 'taxa de 60% não alcança os 75% exigidos');
});

test('a sequência de acertos conta do mais recente para trás', () => {
  limpar();
  simular('custo', [...Array(9).fill(true), false]);     // o erro é o ÚLTIMO
  const p = placar('custo');
  assert.equal(p.total, 10);
  assert.equal(p.certas, 9);
  assert.equal(p.seguidasCertas, 0, 'erro recente zera a sequência mesmo com 90% de acerto');
  reavaliar();
  assert.equal(nivelDe('custo'), 0, 'sem sequência recente não promove');
});

test('reverter uma decisão rebaixa na hora', () => {
  limpar();
  simular('pauta', Array(10).fill(true));
  reavaliar();
  assert.equal(nivelDe('pauta'), 1);

  rebaixar('pauta', 'o dono reverteu a escolha de pauta');
  assert.equal(nivelDe('pauta'), 0, 'reversão custa um degrau imediatamente');
});

test('subir custa dezenas de acertos, cair custa um erro', () => {
  limpar();
  simular('estrategia', Array(50).fill(true));
  reavaliar(); reavaliar();
  assert.equal(nivelDe('estrategia'), 2, 'duas rodadas de acerto levam ao 2');

  rebaixar('estrategia', 'reversão do dono');
  assert.equal(nivelDe('estrategia'), 1, 'um erro derruba o que dezenas de acertos construíram');
});

test('o teto do dono trava a promoção', () => {
  limpar();
  simular('publicacao', Array(50).fill(true));
  definirTeto('publicacao', 1);
  reavaliar(); reavaliar(); reavaliar();
  assert.equal(nivelDe('publicacao'), 1, 'não passa do teto que o dono definiu');
});

test('baixar o teto rebaixa quem já estava acima', () => {
  limpar();
  simular('roteiro', Array(50).fill(true));
  reavaliar(); reavaliar();
  assert.equal(nivelDe('roteiro'), 2);

  definirTeto('roteiro', 0);
  assert.equal(nivelDe('roteiro'), 0, 'o dono sempre pode puxar o freio');
});

test('autonomia não autoriza chute: previsão insegura volta para o dono', () => {
  limpar();
  simular('pauta', Array(50).fill(true));
  reavaliar(); reavaliar();
  assert.equal(nivelDe('pauta'), 2);

  assert.equal(podeDecidirSozinho('pauta', { confiancaDaPrevisao: 90 }).pode, true);
  assert.equal(podeDecidirSozinho('pauta', { confiancaDaPrevisao: 40 }).pode, false,
    'no nível 2, previsão abaixo de 70% ainda precisa do dono');
});

test('reversão registrada na memória zera a sequência', () => {
  limpar();
  const ids = simular('midia', Array(10).fill(true));
  assert.equal(placar('midia').seguidasCertas, 10);

  registrarReversao(ids.at(-1), 'não era isso que eu queria');
  const p = placar('midia');
  assert.equal(p.seguidasCertas, 0, 'reversão apaga a sequência');
  assert.equal(p.reversoes, 1);
});

test('um acerto isolado não vira certeza', () => {
  assert.ok(confiancaDe({ acertos: 1, erros: 0 }) < 0.7, 'Laplace tem que puxar o novato para o meio');
  assert.equal(estadoDe({ acertos: 1, erros: 0 }), 'provisorio');
  assert.equal(estadoDe({ acertos: 3, erros: 0 }), 'firme');
  assert.equal(estadoDe({ acertos: 0, erros: 5 }), 'aposentado');
});
