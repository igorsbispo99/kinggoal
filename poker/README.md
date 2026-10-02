# Escola do Ás

Mentoria de poker (No-Limit Texas Hold'em) que leva uma pessoa do zero ao nível elite, organizada assim:

- **Modo mentor** (ligado por padrão, com um botão para o modo livre): o app monta a sessão de cada dia no tempo que o aluno informou e diz exatamente o que fazer, na ordem: prova de revisão, reforço dos conceitos fracos, lição nova, consolidação (exercícios e situações de jogo), treino com meta de 85%, ferramenta do Laboratório ligada à lição, prova do módulo, mesa com meta de mãos e replay dos erros, revisão semanal e rediagnóstico mensal. Matéria nova não avança sobre base fraca, e cada fase (nível) só abre quando o nível anterior foi aprovado nas provas e no portão prático (treinos, mesa, ferramentas). No modo livre, tudo fica aberto e o aluno escolhe.
- **Dúvida com contexto**: em toda questão respondida, na revisão, no replay e nas lições há "Tenho uma dúvida". O mentor por IA recebe a questão inteira (com as cartas), a resposta do aluno, a correta e a explicação, corrige o engano com um exemplo concreto e termina com uma pergunta de verificação. "Reportar problema" salva o relato com o contexto; em Evolução os relatos podem ser copiados.
- **Mesa guiada**: para iniciantes, antes de cada decisão o mentor faz perguntas curtas (posição, se alguém aumentou, se a mão está na tabela, o que você tem, quanto custa pagar). As perguntas diminuem conforme o acerto (todas, depois só a principal, depois nenhuma); pode ser fixada em "Sempre" ou "Desligada".
- **Explicações auditadas**: uma checagem automática gera centenas de questões de cada um dos 47 geradores e treinos e confere gabarito, opções e texto; as explicações mostram o raciocínio passo a passo (as 5 cartas do melhor jogo, as outs carta a carta, por que a mesa é seca ou molhada, referências de equity).
- **Revisão como prova**: cada cartão vencido vira uma questão (do quiz da lição ou um exercício novo do mesmo conceito). O app corrige, agenda o cartão pela resposta (errou ou "Não sei": amanhã; acertou: mais tarde; acertou rápido: mais tarde ainda) e mostra, questão por questão, o que revisar.

- **Formação**: 32 módulos e 168 lições em 6 níveis. O Nível 0 (Primeiros passos) é para quem nunca jogou: o que é poker, o baralho, as combinações, uma rodada completa e as primeiras decisões. Depois vêm Iniciante, Competente, Reg, Pro e Elite. Todos os níveis são escritos em linguagem simples, com lições reveladas em partes, perguntas "Pense antes de ler", 64 mãos e situações interativas (com o "por que não" de cada alternativa), 43 exemplos resolvidos em que o aluno assume os passos aos poucos, um mapa de pré-requisitos que sugere revisar a base quando ela está fraca e um glossário de 185 termos ao toque. Inclui provas por módulo, certificação teórica, carteira profissional com provas práticas, plano semanal do mentor, painel de performance com 12 áreas, revisão espaçada, mesa de treino (6-max, adversários adaptativos e heads-up) e mentor por IA.
- **Mentor adaptativo**: diagnóstico que se adapta a quem nunca jogou e a quem joga há anos (começa pelo nível declarado, sobe quando acerta, desce quando erra, aceita "Não sei" e libera a trilha no nível certo); mapa de domínio de 54 conceitos, separando conhecimento (quizzes e exercícios) de aplicação (mesa e ferramentas); prática adaptativa com exercícios novos gerados pelo motor a cada rodada; pistas socráticas e conversa com o mentor por IA antes de mostrar a resposta; revisão espaçada com estabilidade e dificuldade por cartão, ajustada à retenção de cada aluno.
- **Aplicação e mesa real**: treino de aplicação para os 54 conceitos (situações de mesa com decisão, geradas ou escritas à mão), que alimenta o lado "aplicação" do mapa de domínio; mesas por limite (NL2, NL10, NL50) com a composição típica de adversários de cada um, estilos escondidos, HUD com VPIP/PFR observados, rotação de jogadores e perguntas de leitura de perfil; cada decisão da mesa ligada a um conceito e guardada num replay comentado (pergunta-chave, números, nota do mentor e atalhos para lição, aplicação e prática); modo pressão com relógio por decisão, pausa para respirar depois de perdas grandes e comparação da qualidade em condições normais, depois de perdas, em sessões longas e com relógio. As cartas são sempre sorteadas de forma justa.
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
- `content*.js` — currículo. `content.js` e `content-a.js` a `content-d.js` definem a estrutura; `content-kit.js` traz as ferramentas de autoria (mão interativa, exemplo resolvido, pré-requisitos); `content-zero.js` é o Nível 0; `content-n1.js` a `content-n5.js` reescrevem os níveis 1 a 5; `content-p01.js` acrescenta a prática dos níveis 0 e 1.
- `lab-*.js` — ferramentas do Laboratório. `elite-*.js` — Alto rendimento.
- `practice.js` — os 54 conceitos, as pistas socráticas, 27 geradores de exercícios e 9 geradores de decisões de mesa. `content-diag.js` — banco do diagnóstico adaptativo. `content-apply.js` — cenários de aplicação escritos à mão.
- `app.js` — navegação, estado, carteira, painel, plano, mesa (modos, limites, HUD, replay e pressão), mentor, modelo de domínio, treino de aplicação, diagnóstico e revisão espaçada.
