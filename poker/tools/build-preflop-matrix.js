// Gera a matriz de equity pré-flop 169x169 (mão x mão, all-in pré-flop) usada pelo push/fold de Nash e pelo ICM.
// Uso: node tools/build-preflop-matrix.js [iteracoes]  -> escreve preflop-matrix.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const P = require(path.join(__dirname, '..', 'engine.js'));
const L = P.ALL_LABELS;
if (isMainThread) {
  const iters = +(process.argv[2] || 20000), N = L.length, pairs = [];
  for (let i = 0; i < N; i++) for (let j = i; j < N; j++) pairs.push([i, j]);
  const T = 4, eq = new Float64Array(N * N); let done = 0;
  const t0 = Date.now();
  for (let w = 0; w < T; w++) {
    const wk = new Worker(__filename, { workerData: { pairs: pairs.filter((_, k) => k % T === w), iters } });
    wk.on('message', (res) => {
      for (const [i, j, e] of res) { eq[i * N + j] = e; eq[j * N + i] = 1 - e; }
      if (++done === T) {
        const u16 = new Uint16Array(N * N); for (let k = 0; k < N * N; k++) u16[k] = Math.round(eq[k] * 10000);
        const b64 = Buffer.from(u16.buffer).toString('base64');
        require('fs').writeFileSync(path.join(__dirname, '..', 'preflop-matrix.js'),
          `/* Matriz de equity pré-flop 169x169 gerada por tools/build-preflop-matrix.js (${iters} simulações por confronto). eq[i][j] = equity da mão i contra a mão j, x10000. */\n(function(g){g.PREFLOP_MATRIX={labels:${JSON.stringify(L)},b64:"${b64}"};})(typeof window!=='undefined'?window:globalThis);\n`);
        console.log('ok', ((Date.now() - t0) / 1000).toFixed(0) + 's');
      }
    });
  }
} else {
  const { pairs, iters } = workerData, out = [];
  for (const [i, j] of pairs) {
    const A = P.COMBOS[L[i]], B = P.COMBOS[L[j]]; let win = 0, n = 0;
    while (n < iters) {
      const a = A[(Math.random() * A.length) | 0], b = B[(Math.random() * B.length) | 0];
      if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue;
      const used = new Uint8Array(52); used[a[0]] = used[a[1]] = used[b[0]] = used[b[1]] = 1;
      const board = [];
      while (board.length < 5) { const c = (Math.random() * 52) | 0; if (!used[c]) { used[c] = 1; board.push(c); } }
      const sa = P.evaluate(a.concat(board)), sb = P.evaluate(b.concat(board));
      win += sa > sb ? 1 : sa === sb ? 0.5 : 0; n++;
    }
    out.push([i, j, win / n]);
  }
  parentPort.postMessage(out);
}
