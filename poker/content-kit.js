/* Escola do Ás — kit de autoria das lições.
   Carregado depois do currículo base e antes das reescritas. Oferece:
   - think(pergunta, resposta): bloco "Pense antes de ler";
   - spot({...}): mão interativa com decisão, feedback da escolha e "por que não" de cada alternativa;
   - worked({...}): exemplo resolvido em passos; passos com `ask` pedem a resposta do aluno (fading);
   - put(id, meta, lições, prova): substitui as lições de um módulo mantendo ids, treinos e ferramentas;
   - append(id, html): acrescenta uma seção ao fim do corpo de uma lição;
   - C.PRE: mapa de pré-requisitos (lição → lições de base). */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });
  const think = (pergunta, resposta) => `<details class="think"><summary><span>Pense antes de ler</span>${pergunta}</summary><div>${resposta}</div></details>`;

  // Dados vão num atributo; naipes viram \uXXXX para que a colorização das cartas no texto não toque neles.
  const attr = (o) => JSON.stringify(o).replace(/[♠-♧]/g, (c) => '\\u' + c.charCodeAt(0).toString(16)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* spot({ title, pos, hero: 'As Qs', board: 'Kd 7c 2h', pot, stack, hist, q, opts: [[rótulo, nota, explicação]] })
     nota: 1 = a melhor, 0.5 = aceitável, 0 = erro. */
  const spot = (o) => `<div class="spot" data-spot="${attr(o)}"></div>`;

  /* worked({ title, setup, steps: [{ t, a, ask?: { q, opts, a } }] }) */
  const worked = (o) => `<div class="worked" data-worked="${attr(o)}"></div>`;

  const mod = (id) => C.MODULES.find((m) => m.id === id);
  function put(id, meta, lessons, exam) {
    const m = mod(id);
    if (!m) throw new Error('módulo inexistente: ' + id);
    const old = new Map(m.lessons.map((l) => [l.id, l]));
    m.lessons = lessons.map((l) => {
      const o = old.get(l.id) || {};
      const keep = {};
      if (o.drill) keep.drill = o.drill;
      if (o.lab) keep.lab = o.lab;
      return Object.assign(keep, l);
    });
    Object.assign(m, meta || {});
    if (exam) m.exam = exam;
  }
  function append(id, html) {
    for (const m of C.MODULES) for (const l of m.lessons) if (l.id === id) { l.body += html; return; }
    throw new Error('lição inexistente: ' + id);
  }

  C.PRE = C.PRE || {};
  C.kit = { q, think, spot, worked, put, append, mod };
})(typeof window !== 'undefined' ? window : globalThis);
