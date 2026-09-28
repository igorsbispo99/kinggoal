# Escola do Ás

App de estudo de poker (No-Limit Texas Hold'em) que leva um iniciante do zero ao nível profissional, com mentor, teoria, prática e métricas de evolução.

## O que tem

- **Trilha**: 8 níveis e 42 lições (fundamentos, pré-flop, matemática, pós-flop, ranges e leitura, torneios, mental e banca, rumo ao profissional). Cada lição tem "por que isso importa", teoria curta, exemplo, dica do mentor e quiz. Cada nível termina com uma prova (80% para avançar) e o curso termina com uma certificação de 30 questões (85%).
- **Treinos**: 9 treinos gerados na hora com um motor de poker real (quem vence, qual a sua mão, tabela de abertura por posição, contagem de outs, pot odds/MDF/alfa, pagar ou desistir, textura de mesa, equity, gestão de banca).
- **Mesa**: cash 6-max contra 5 perfis de bot (nit, TAG, LAG, recreativo, maníaco), com o mentor mostrando pot odds e equity estimada e avaliando cada decisão.
- **Revisão**: cartões com repetição espaçada (sistema de Leitner).
- **Evolução**: IPP (Índice de Proficiência em Poker, 0 a 100), radar por área, diagnóstico inicial x atual, precisão por treino, critérios de profissional e conquistas.
- **Carreira**: calculadora de banca, diário de sessões reais com bb/100 e intervalo de confiança, backup do progresso.

## Como rodar

Não precisa de build. Sirva a pasta e abra `index.html`:

```
cd poker && python3 -m http.server 8000
```

O progresso fica salvo no `localStorage` do navegador.

## Arquivos

- `engine.js` — cartas, avaliador de mãos, equity por Monte Carlo, ranges e mesa 6-max com bots.
- `content.js` — currículo, provas, diagnóstico e fontes.
- `app.js` — interface, gamificação, métricas e persistência.
- `index.html` — estilos e estrutura.
