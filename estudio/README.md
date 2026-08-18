# Z News — estúdio de TV com IA

> A sua notícia do nosso jeito

Uma redação automatizada que produz um telejornal vertical por dia. Treze times
de IA trabalham em sequência sob a direção do **DiTV.IA**; você aprova em dois
pontos e posta.

**Tudo roda dentro do GitHub.** Nada é executado na sua máquina — o estúdio foi
montado assim de propósito, porque a operação é feita pelo navegador do tablet.

| Peça | Onde vive |
|---|---|
| Motor | GitHub Actions (grátis e ilimitado em repositório público) |
| Estado | arquivos JSON em `estado/`, versionados neste repositório |
| Aprovações | issues, com reação de polegar ou comentário |
| Vídeo pronto | arquivo de Release, para baixar direto no tablet |
| Painel | GitHub Pages |

---

## Ativação — 6 passos, tudo pelo navegador

### 1. Cadastrar a chave da API

Aba **Settings** › **Secrets and variables** › **Actions** › **New repository secret**

| Nome | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | sua chave da API da Claude |

Essa é a única chave obrigatória. A chave fica criptografada e não aparece nos
registros de execução, mesmo com o repositório público.

**Opcionais**, que melhoram o resultado:

| Nome | Para quê |
|---|---|
| `PEXELS_API_KEY` | imagens melhores; cadastro gratuito em pexels.com/api |
| `PIXABAY_API_KEY` | segunda fonte de imagem; gratuito |
| `FAL_KEY` | apresentador realista em vez de ilustrado; pago por vídeo |

Sem nenhuma delas o estúdio funciona: a busca de imagem cai para o Wikimedia,
que não exige cadastro, e o apresentador fica no modo ilustrado.

### 2. Ligar o GitHub Pages

Aba **Settings** › **Pages** › em **Source**, escolher **GitHub Actions**.

O painel passa a viver em `https://SEU-USUARIO.github.io/kinggoal/`.

### 3. Rodar o diagnóstico

Aba **Actions** › **Estúdio · Diagnóstico** › botão **Run workflow**.

Esse teste não chama modelo nenhum, então **não custa nada**. Ele confere
FFmpeg, motor de voz, busca de imagem, movimento da boca e montagem, e termina
com um vídeo de teste em **Artifacts** para você baixar e assistir.

Se aparecer ❌ em alguma linha, o resumo diz exatamente o que falta. Não siga
para o passo seguinte com o diagnóstico vermelho.

### 4. Definir o canal e o apresentador

Editar `config/estudio.json` pelo próprio GitHub (botão de lápis no arquivo):

- `canal.nome` — o nome do canal
- `apresentador.nome`, `apresentador.jeito` — quem apresenta e como fala
- `formato.duracaoAlvoSegundos` — deixe acima de 61, ou o vídeo não monetiza

### 5. Subir os retratos da bancada

O Z News tem **dupla de apresentadores**, definida em `config/estudio.json`:

| | Voz | Puxa melhor |
|---|---|---|
| **Nina** | pt-BR Francisca | economia, política, comportamento |
| **Zeca** | pt-BR Antonio | esporte, cultura, bizarro, tech |

Para eles aparecerem em vídeo, suba um retrato de cada pelo navegador:

1. No GitHub, abra a pasta `estudio/ativos/`
2. **Add file › Upload files** (funciona no tablet)
3. Nomeie exatamente:
   - `apresentador-nina.png`
   - `apresentador-zeca.png`

Um arquivo por pessoa. Não precisa de versão de boca aberta — quem move a boca
é o lipsync.

**O que o retrato precisa ter:** rosto de frente, **boca fechada** e expressão
neutra, dos ombros para cima, luz uniforme, fundo simples. Retrato sorrindo com
os dentes à mostra funciona pior, porque é dele que o lipsync parte.

#### Como os dois se revezam

`elenco.modo` em `config/estudio.json`:

| Modo | O que faz | Custo de lipsync |
|---|---|---|
| **`alternado`** (padrão) | Revezam por dia, um por vídeo | ~US$ 9/mês |
| `duo` | Os dois no mesmo vídeo, trocando a cada notícia | ~US$ 18/mês |
| `fixo` | Sempre o mesmo, definido em `fixoEm` | ~US$ 9/mês |

O revezamento é por número de aparições, não por dia do calendário: dia sem
produção ou vídeo reprovado desequilibrariam o rodízio e um dos dois sumiria do
canal por semanas.

#### Sem retrato, ou sem chave de lipsync

Nada quebra. O estúdio usa o apresentador ilustrado que vem no repositório, e o
DiTV.IA registra no relatório que o modo realista não entrou. O lipsync exige
`FAL_KEY` e custa ~US$ 0,30 por vídeo.

Prefere sua própria arte ilustrada? Substitua `ativos/apresentador-fechada.png`
e `ativos/apresentador-aberta.png`, quadrados, fundo transparente, 512×512.

### 6. Ligar a esteira

Aba **Actions** › **Estúdio · Portão 1 (pauta)** › **Run workflow**.

A partir daí ela roda sozinha todo dia.

---

## O dia a dia

| Horário | O que acontece | O que você faz |
|---|---|---|
| 07:00 | Pauta levantada, **portão 1** abre como issue | Reage 👍 ou comenta o que mudar |
| 14:00 | Vídeo produzido, **portão 2** abre com tudo pronto | Baixa, posta, reage 👍 |
| 17:00 e 20:00 | Nova tentativa, se a pauta não tiver sido aprovada | — |
| Segunda, 08:00 | Estratégia da semana | Lê e executa as ações marcadas **[você]** |

Aprovar é um toque. Reprovar com motivo escrito é melhor que reprovar sem: o
texto do comentário vira instrução para o roteiro.

### Lançar os números

Depois de postar, os números do TikTok alimentam os times de Indicadores,
Estratégia e Marca. Editar `estado/metricas.json`:

```json
{
  "videos": [
    { "data": "2026-08-18", "views": 12000, "retencaoMedia": 42,
      "curtidas": 890, "comentarios": 47, "compartilhamentos": 120,
      "seguidoresGanhos": 63, "plataforma": "tiktok" }
  ]
}
```

E `estado/numeros.json` com o retrato atual da conta:

```json
{ "seguidoresTiktok": 1240, "seguidoresInstagram": 310,
  "views30d": 86000, "receitaMensalBRL": 0 }
```

Sem esses números o estúdio produz, mas não aprende.

---

## DiTV.IA — o diretor

O cérebro da operação. Cobre onze cargos do organograma de uma emissora: os que
existem para que os outros consigam trabalhar.

| Faz | Como |
|---|---|
| **Double check** | Confere cada entrega antes de seguir. Conserta o que dá, repete o que não passou, para o que fere regra |
| **Liga e desliga robôs** | Time opcional que falha 3 vezes entra em quarentena e volta sozinho |
| **Julga o conjunto** | Tom, fio, piada fora de hora, fórmula repetida — o que código não vê |
| **Plantão** | Classifica a falha e separa o que resolve sozinho do que depende de você |
| **Guarda as regras** | `config/regras.json` — 6 inegociáveis e 6 de qualidade |
| **Relata** | Toda segunda: entrega, incidentes, custo por vídeo, times instáveis |

### Ele aprende e ganha independência

O diretor **aposta no que você vai decidir antes de você decidir**, e a aposta
fica registrada antes de a resposta existir. É o que separa aprendizado
verificável de um resumo plausível do histórico.

| Nível | O que ele faz |
|---|---|
| 0 · Observa | Não decide nada. Só prevê e registra o acerto |
| 1 · Sugere | Recomenda com o motivo, mas espera você |
| 2 · Decide e avisa | Decide sozinho e te informa. Você pode reverter |
| 3 · Conduz | Decide e registra. Só te chama fora do padrão |

A escada é **por domínio** — pauta, roteiro, publicação, mídia, custo e
estratégia — porque ele pode já ser confiável para escolher pauta e ainda não
ser para publicar. Sobe no máximo um degrau por rodada, e a promoção depende do
placar de previsões: 8 decisões e 75% de acerto para o nível 1, 20 e 85% para o
2, 40 e 92% para o 3.

**Uma reversão sua derruba um nível na hora.** A assimetria é deliberada: subir
exige dezenas de acertos, cair exige um erro. Para travar um domínio, ajuste
`tetoDoDono` em `estado/autonomia.json`.

Os precedentes que ele aprende ficam em `estado/doutrina.json`. Cada um só ganha
confiança prevendo certo, e precedente que erra demais é aposentado sozinho.

**Duas conferências, dois mecanismos.** O que se verifica com código é verificado
com código (`src/diretor/contratos.js`); o julgamento editorial vem depois, e só
sobre o que passou. Conferir com o mesmo mecanismo que produziu herdaria os
mesmos pontos cegos.

O diretor **só barra citando uma regra inegociável**. Se quiser barrar sem
regra, é rebaixado para "segurar" e a decisão volta para você.

### As regras que ele faz valer

Editáveis em `config/regras.json`, sem tocar em código:

- vídeo abaixo da duração monetizável não vai ao ar
- todo vídeo carrega o rótulo de IA
- apontamento grave da checagem barra
- pauta sensível nunca recebe tratamento cômico
- a operação nunca passa do teto de custo
- nunca comprar seguidor ou engajamento

---

## Os treze times

| # | Time | Modelo | O que faz |
|---|---|---|---|
| 00 | **DiTV.IA** | topo | Dirige, confere, liga e desliga, atende o plantão, relata |
| 01 | Pauta | barato | Agrupa manchetes e pontua por retenção, não por importância |
| 02 | Editorial | topo | Escolhe a edição e acha o fio que costura as notícias |
| 03 | Roteiro | topo | Escreve para ouvido, com gancho nos 3 primeiros segundos |
| 04 | Checagem | barato | Confere contra a origem e barra o vídeo em caso grave |
| 05 | Voz | — | Locução em pt-BR com marcas de tempo |
| 06 | Arte | — | Imagem por segmento em bancos de uso comercial livre |
| 07 | Apresentador | — | Move a boca pela envoltória do áudio, sem GPU |
| 08 | Montagem | — | 9:16, legenda queimada, selo de IA |
| 09 | Indicadores | topo | Transforma número em regra para os times de conteúdo |
| 10 | Estratégia | topo | Diagnostica a fase e define o plano de crescimento |
| 11 | Marca e Instagram | topo | Guarda a identidade e adapta para Reels, Carrossel e Stories |
| 12 | Áudio | — | Normaliza o loudness em dois passos e mixa a trilha |
| 13 | GC | — | Selo do canal, placa de abertura, lower-thirds e destaque de número |

Mais o **continuísta**, que vive no diretor porque olha o histórico e não o
vídeo de hoje: avisa quando um assunto volta sem fato novo, quando o fio é
reciclado e quando três edições seguidas abrem com a mesma estrutura.

O mapeamento completo dos 56 cargos de uma emissora está em
[`docs/ORGANOGRAMA.md`](docs/ORGANOGRAMA.md).

---

## Custo

Cerca de **US$ 0,55 a 0,87 por vídeo**, quase tudo em chamadas de modelo. A
um vídeo por dia, **US$ 17 a 26 por mês**.

O gasto é rastreado por time em `estado/custos-AAAA-MM.json` e aparece na aba
**Custo** do painel, com alerta ao se aproximar do teto configurado em
`config/estudio.json`.

Voz, imagens, montagem, hospedagem e execução são gratuitos. O detalhamento
está em [`docs/ORCAMENTO.md`](docs/ORCAMENTO.md), e a projeção de retorno em
[`docs/PROJECAO.md`](docs/PROJECAO.md).

---

## Aviso de segurança

Este repositório é **público**, o que torna a execução gratuita e ilimitada. Em
troca, qualquer pessoa consegue ler as pautas, os roteiros, a estratégia e os
números. A chave da API continua protegida.

O time de Estratégia monitora isso e **abre um alerta automático** recomendando
fechar o repositório quando o canal passar de 10 mil seguidores ou de R$ 500 por
mês — o que vier primeiro. Os gatilhos ficam em `config/estudio.json`, em
`seguranca.alertarMigracaoPrivadoQuando`.

---

## Quando algo dá errado

| Sintoma | Causa provável |
|---|---|
| Portão 1 não abriu | `ANTHROPIC_API_KEY` ausente, ou todas as fontes de RSS fora do ar |
| Portão 2 não abriu | Pauta ainda não aprovada — a esteira tenta de novo às 17h e 20h |
| Vídeo mudo ou sem legenda | edge-tts recusou por volume; o serviço é gratuito e não oficial |
| Vídeo todo em fundo sólido | Nenhum banco de imagens respondeu |
| Issue com ⛔ no título | A checagem ou o diretor barraram — leia e corrija a fonte |
| Issue com ✋ no título | O DiTV.IA segurou o vídeo e quer sua decisão — comente **aprovado** ou **reprovado** |
| Issue com 🔧 no título | Plantão do diretor: algo quebrou e ele diz se depende de você |
| Um time sumiu da produção | O diretor desligou por falhas seguidas; veja a aba DiTV.IA do painel |

O diagnóstico do passo 3 pode ser disparado a qualquer momento e é a forma mais
rápida de descobrir qual peça quebrou.
