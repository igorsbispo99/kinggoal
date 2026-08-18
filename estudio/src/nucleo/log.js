const ICONES = { info: '·', ok: '✓', aviso: '!', erro: '✗', time: '▸' };

function agora() {
  return new Date().toISOString().slice(11, 19);
}

function escrever(nivel, msg, extra) {
  const linha = `${agora()} ${ICONES[nivel] || '·'} ${msg}`;
  const destino = nivel === 'erro' ? console.error : console.log;
  destino(extra === undefined ? linha : `${linha} ${JSON.stringify(extra)}`);
}

export const log = {
  info:  (m, e) => escrever('info', m, e),
  ok:    (m, e) => escrever('ok', m, e),
  aviso: (m, e) => escrever('aviso', m, e),
  erro:  (m, e) => escrever('erro', m, e),
  time:  (nome, m) => escrever('time', `[${nome}] ${m}`),
};
