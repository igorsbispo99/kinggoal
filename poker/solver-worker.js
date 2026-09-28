/* Worker do solver: roda o CFR fora da thread da interface. */
importScripts('engine.js', 'solver-core.js');
let S = null, stop = false;
function send(type, data) { postMessage(Object.assign({ type }, data || {})); }
onmessage = (e) => {
  const m = e.data;
  try {
    if (m.cmd === 'solve') {
      stop = false;
      S = Solver.build(m.cfg);
      send('built', { n: S.n, nodes: S.nodes });
      const target = m.target || 0.3, max = m.iters || 1000, step = m.step || (S.isTurn ? 10 : 50);
      let st = Solver.stats(S);
      const loop = () => {
        if (stop) { send('done', { stats: st, stopped: true }); return; }
        Solver.iterate(S, step);
        st = Solver.stats(S);
        send('progress', { stats: st });
        if (st.explPct <= target || S.iter >= max) send('done', { stats: st });
        else setTimeout(loop, 0);
      };
      setTimeout(loop, 0);
    } else if (m.cmd === 'stop') stop = true;
    else if (m.cmd === 'node') send('node', { id: m.id, info: Solver.nodeInfo(S, m.path) });
    else if (m.cmd === 'lock') { Solver.lockNode(S, m.path, m.freqs); send('locked', {}); }
    else if (m.cmd === 'resolve') {
      stop = false; Solver.resetRegrets(S);
      let st; const max = m.iters || 600, step = S.isTurn ? 10 : 50;
      const loop = () => { if (stop) { send('done', { stats: st, stopped: true }); return; } Solver.iterate(S, step); st = Solver.stats(S); send('progress', { stats: st }); if (st.explPct <= (m.target || 0.3) || S.iter >= max) send('done', { stats: st }); else setTimeout(loop, 0); };
      setTimeout(loop, 0);
    }
  } catch (err) { send('error', { message: err.message }); }
};
