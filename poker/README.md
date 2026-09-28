# Escola do Ás

Mentoria de poker (No-Limit Texas Hold'em) que leva uma pessoa do zero ao nível elite, com três partes:

- **Formação**: 27 módulos e 147 lições em 5 níveis (Iniciante, Competente, Reg, Pro, Elite), provas por módulo, certificação teórica, carteira profissional com provas práticas, plano semanal do mentor, painel de performance com 12 áreas, revisão espaçada, mesa de treino (6-max, adversários adaptativos e heads-up) e mentor por IA.
- **Laboratório** (o software próprio): equity (range contra range), construtor e treinador de ranges, analisador de flop, solver GTO de turn e river com node locking, Treinador GTO com EV perdido e relógio, push/fold de Nash (heads-up e mesa com ICM), ICM/bubble factor/acordos/bounty, database com importação de históricos (PokerStars, GGPoker), variância, sessão e rotina, seleção de jogos e staking.
- **Alto rendimento**: registro de todas as decisões, mapa de leaks (spot → erro → causa → correção → drill → reavaliação), scorecard de Poker IQ, 7 níveis de domínio, leitor de spots em 3 camadas, visualização de ranges, blockers, adaptação bayesiana, abstração e generalização, planejamento de ruas, júri e fase Grandmaster.

## Como rodar

Sem build. Sirva a pasta e abra `index.html`:

```
cd poker && python3 -m http.server 8000
```

O progresso fica no `localStorage` do navegador (as mãos, no IndexedDB). Publicado como Artifact no claude.ai, o júri e o mentor usam o Claude pela conta de quem vê.

## Arquivos

- `engine.js` — cartas, avaliador, equity, ranges com peso, categorias de mão e mesa com bots (2 a 6 jogadores).
- `solver-core.js`, `solver-worker.js` — solver Discounted CFR de turn e river com remoção de cartas exata.
- `icm.js`, `preflop-matrix.js` — ICM e push/fold de Nash; matriz de equity 169×169 gerada por `tools/build-preflop-matrix.js`.
- `tracker.js` — parser de históricos, estatísticas, all-in EV, leaks e perfis.
- `content*.js` — currículo.
- `lab-*.js` — ferramentas do Laboratório. `elite-*.js` — Alto rendimento.
- `app.js` — navegação, estado, carteira, painel, plano, mesa e mentor.
