# Revisão estratégica v2 — de nicho estreito para marca de mídia

**Decisão anterior (v1):** canal "Radar Antigolpe".
**Feedback recebido:** o antigolpe é um tema limitado, que não comporta virar um canal grande e profissional com o tempo.
**Concordo.** A v1 não media o **teto de escala**, ou seja, quantas séries, plataformas, produtos e linhas de receita o tema comporta sem perder identidade. Com esse critério, o antigolpe cai de 1º lugar para uma **série** dentro de uma marca maior.

Contexto de referência: **Brasil, outubro de 2026.** As afirmações marcadas como VERIFICADO vêm de reportagens que citam fonte institucional. A fonte primária precisa ser aberta antes de qualquer uso em vídeo, e o QA bloqueia a publicação até isso ser feito.

---

## 1. Nova matriz (v2)

Pesos: monetização 20 · **teto de escala 15** · demanda 12 · produção sem rosto 12 · risco 10 · concorrência 8 · alcance 8 · audiência própria 8 · pautas 4 · custo 3.
Reproduza com: `python3 ferramentas/matriz.py`. Os dados estão em `dados/nichos_v2.csv`.

| # | Tema-guarda-chuva | Nota |
|---|---|---|
| 1 | **Dinheiro do dia a dia** (dívidas, direitos, golpes, impostos, benefícios, consumo) | **87,2** |
| 2 | Antigolpe (nicho estreito, só para comparação) | 75,8 |
| 3 | Carreira, trabalho e renda extra | 75,4 |
| 4 | Inglês prático | 74,8 |
| 5 | Tecnologia e IA no dia a dia | 73,6 |
| 6 | Concursos públicos | 72,0 |
| 7 | Saúde e bem-estar | 70,6 |
| 8 | Casa e consumo | 66,4 |
| 9 | Direitos do cidadão | 66,2 |
| 10 | Curiosidades e entretenimento | 55,4 |

**Sensibilidade:** com cada peso a ±50%, o 1º lugar é o mesmo em **20 de 20 cenários**, com 11 pontos de vantagem.
A nota de "teto de escala" é **julgamento meu**. O argumento está abaixo, e o mês 2 testa a parte mais incerta.

## 2. Por que "Dinheiro do dia a dia" no Brasil de 2026

**Dor medida e em nível recorde (VERIFICADO):**
- 82% das famílias endividadas em julho de 2026, recorde da série CNC/Peic. A inadimplência estava em 29,9% em junho.
- 82,8 milhões de pessoas inadimplentes em março de 2026 (Serasa), cerca de metade da população adulta.
- 2,26 milhões de registros de estelionato em 2025 (FBSP). Os golpes são uma série dentro do tema, não o tema inteiro.

**Pautas de 2026 e 2027 com calendário previsível:**
- **Isenção do IR até R$ 5 mil**, em vigor desde 01/01/2026 (cerca de 15 milhões de beneficiados). Ela aparece pela primeira vez na **declaração de 2027 (março a maio)**, o maior pico de busca por dinheiro do ano que vem. Precisamos chegar lá com audiência.
- **Juros altos:** Selic em torno de 14% (corte em 05/08/2026; a decisão de setembro não foi verificada). Isso significa dívida cara e renda fixa rendendo bem, dois lados da mesma pauta. O próximo Copom é em 3 e 4 de novembro.
- **Sazonais garantidos:** 13º salário (até 30/11 e 20/12), Black Friday (27/11/2026), contas de início de ano (IPVA, IPTU, material escolar), IR 2027, Dia do Consumidor (15/03).
- **Regras novas do Pix e do MED** (prazos ampliados em 2026) e a transição da **reforma tributária** (a parte da reforma ainda precisa de pesquisa em fonte oficial).

**O mercado que paga (parcialmente verificado):**
- Os bancos digitais trabalham com creators em escala: o C6 cita mais de 100 parcerias em dois anos.
- Há relato de aumento de 57% nos orçamentos de marketing de influência no Brasil em 2026 (HeartBit; fonte de mercado, não independente).
- **Finanças tem o maior RPM em Shorts** segundo blogs de ferramentas: US$ 0,08–0,35 por mil views, contra US$ 0,03–0,12 em entretenimento. É estimativa, não dado oficial.

**Teto de escala:** o tema comporta pelo menos 6 séries no lançamento e se desdobra em produtos (planilha → curso → comunidade), públicos (CLT, MEI, aposentado, jovem) e plataformas. Comporta também B2B (educação financeira corporativa) e spin-offs (MEI, primeiro investimento), sem perder a identidade.

**Por que não os outros:**
- **Carreira/renda extra:** escala alta, mas fica colado ao golpe da "renda fácil". É risco reputacional constante.
- **Inglês e concursos:** monetização boa, mas teto menor e concorrência alta.
- **Saúde:** o risco regulatório e de desinformação inviabiliza um conteúdo feito por IA.

## 3. Arquitetura da marca

**Marca-mãe (proposta): GRANA CLARA**, "Dinheiro explicado sem enrolação, com fonte."
Alternativas: "Bolso em Dia" e "Conta Certa".
**Disponibilidade não verificada.** Antes de usar o nome, confira TikTok, Instagram, YouTube, domínio no registro.br e INPI. Um registro de marca no INPI protege o ativo, e isso é decisão sua.

**Séries ("quadros"), cada uma com vinheta, cor e promessa próprias:**

| Série | Promessa | Função no negócio |
|---|---|---|
| **Sai das Dívidas** | Método prático, um passo por vídeo | Núcleo do produto (planilha → programa de 90 dias) |
| **Radar Antigolpe** | O golpe explicado antes de chegar em você | Alcance por compartilhamento (aproveita os roteiros 001–003) |
| **Seu Direito, Seu Dinheiro** | O que banco, loja e cobrador não podem fazer | Confiança, salvamentos |
| **Conta da Vida Real** | A conta feita na tela | Retenção, base para calculadoras próprias |
| **Leão Sem Medo** | Imposto de renda e reforma tributária sem medo | Pico sazonal (IR 2027), captação de lista |
| **Notícia no Bolso** | A notícia de economia em 60 s: o que muda para você | Recorrência, autoridade |

**Personalidade:** clara, calma, prática, sem culpar quem está endividado, sem promessa de enriquecimento.
**Linhas vermelhas (implementadas no QA):** nenhuma recomendação de ação ou ativo específico (CVM, Res. 20/2021), **nenhuma bet ou aposta**, nenhuma oferta de crédito a endividado, nenhuma promessa de resultado, nenhum conteúdo político durante a eleição.

## 4. Como o canal vira uma máquina de receita ao longo do tempo

Não há garantia de resultado. O que dá para projetar é **uma escada em que cada degrau só sobe com evidência**. Os limiares de audiência abaixo são hipóteses, não promessas.

| Degrau | Gatilho para entrar (hipótese) | Receitas novas | O que precisa existir |
|---|---|---|---|
| **0. Ativo próprio** | Dia 1 | Nenhuma ainda | Lista (e-mail e canal de WhatsApp) com isca gratuita: planilha de dívidas e checklist antigolpe |
| **1. Produto de entrada** | ≥ 300 contatos e sinal de demanda | Planilha premium ou kit (R$ 19–29) | Página de venda; Kiwify ou Hotmart |
| **2. Monetização de plataforma** | 10 mil seguidores | Creator Rewards (vídeos > 1 min); reaproveitamento em Shorts e Reels | Versões de 61–90 s das séries mais fortes |
| **3. Patrocínio** | ≥ 20–50 mil seguidores **e** engajamento comprovado | Publis de fintechs e serviços (sem crédito, sem bet) | CNPJ, mídia kit, tabela de preços, contrato padrão, rotulagem do CONAR |
| **4. Produto principal** | Lista ≥ 3 mil e conversão do degrau 1 medida | Programa "90 dias fora do vermelho" (R$ 97–197) ou comunidade mensal | Conteúdo validado pelas dúvidas da lista |
| **5. Multiplataforma** | Formato vencedor (n ≥ 5) | YouTube longo (compilações por série); newsletter patrocinada | Pipeline de "corte longo" |
| **6. Escala de marca** | Receita recorrente cobre custos com folga por 3 meses | B2B (bem-estar financeiro em empresas), licenciamento, spin-off (MEI, primeiro investimento) | Equipe humana mínima; jurídico |

**O volante:** vídeos evergreen se acumulam numa biblioteca → buscas no TikTok, onde a Geração Z pesquisa (o dado do Sicoob não foi verificado) → lista própria → produtos e patrocínio → reinvestimento em voz, revisão e novas séries → mais vídeos.

## 5. Estrutura profissional de operação

| Cadeira | Quem | Responsabilidade |
|---|---|---|
| Editor-chefe | **Você** | Aprova pautas, roteiros, gastos, ofertas e parcerias |
| Pesquisa e roteiro | Claude | Pautas com fonte, 30 roteiros por mês, hipóteses |
| Checagem e compliance | QA automático + **você** (depois um checador freelancer) | Fonte primária, CVM, CONAR, LGPD |
| Produção | Pipeline (`pipeline/`) | Voz, render, legendas, metadados |
| Distribuição | Você no TikTok Studio → API após auditoria | Agendamento, registro de URL |
| Análise | `pipeline/painel.py` + relatório semanal do Claude | Leitura em D+7 e regras de decisão |
| Comercial | Você (depois agência ou freelancer) | Mídia kit, negociação, contratos |

**Ritos:**
- Segunda: pauta da semana.
- Quarta: produção do lote.
- Sexta: leitura D+7.
- Último dia útil do mês: decisão de continuar ou cortar cada série.

**Compliance de 2026:**
- O **novo Guia do CONAR para influenciadores** produz efeitos desde 01/06/2026.
- Link de afiliado e cupom contam como publicidade.
- A identificação deve aparecer na primeira visualização, usando a ferramenta nativa "conteúdo pago" + #publi.
- Conteúdo feito com IA precisa ser transparente. O selo "Narração gerada por IA" já está no render.

## 6. O que mudou no repositório

- `dados/nichos_v2.csv` e a matriz v2. A v1 fica em `dados/nichos_v1.csv` como histórico.
- Os roteiros agora têm `marca` e `serie` (campos obrigatórios no QA), e o render mostra a série no topo.
- 2 roteiros novos fora do antigolpe: **004 — Isenção do IR até R$ 5 mil** (Leão Sem Medo) e **005 — 13º: qual dívida pagar primeiro** (Sai das Dívidas).
- O QA bloqueia conteúdo fora do escopo editorial (recomendação de ação, bets, crédito fácil).
- O painel agrupa por série e por tipo de CTA.
- `dados/calendario_30_dias.csv`: 30 publicações de **26/10 a 24/11/2026**.
  - O início fica depois do 2º turno (25/10), para não disputar atenção com a eleição nem cair em pauta política.
  - Inclui Copom (05/11), Black Friday (17 a 21/11) e 13º.
  - Distribuição: 7 Sai das Dívidas, 7 Radar Antigolpe, 5 Seu Direito, 5 Conta da Vida Real, 3 Leão Sem Medo, 3 Notícia no Bolso.

## 7. Orçamento: o que muda com a estrutura profissional

Os cenários do documento 02 continuam valendo, com três itens novos:

| Item | Quando | Custo estimado (verificar) |
|---|---|---|
| CNPJ + contador (exigido para emitir nota de patrocínio) | Degrau 3 | ~R$ 150–400/mês |
| Registro de marca no INPI (1 classe) | Assim que o nome for confirmado | Taxa única, na casa das centenas de reais |
| Checador de fatos freelancer | Quando passar de 1 vídeo por dia | Por peça; a cotar |

Recomendação: **Mínimo** até o degrau 1 ficar comprovado; **Intermediário** a partir daí.

## 8. Decisões que preciso de você

1. Aprovar o tema "Dinheiro do dia a dia" e a arquitetura de séries.
2. Escolher o nome: Grana Clara, Bolso em Dia, Conta Certa ou outro. Depois, verificar a disponibilidade dos @ e do domínio.
3. Confirmar o início das publicações em 26/10/2026.

## Fontes desta revisão

- Isenção do IR: [Planning](https://planning.com.br/reforma-tributaria/blog-imposto-de-renda-2026-isencao-5-mil-declaracao/), [Serasa Experian](https://www.serasaexperian.com.br/conteudos/isento-imposto-de-renda-2026/), [Times Brasil](https://timesbrasil.com.br/minhas-financas/quem-ganha-ate-r-5-mil-precisa-declarar-ir-2026-regras/)
- Selic: [Itatiaia](https://www.itatiaia.com.br/economia/copom-realiza-o-terceiro-corte-na-taxa-de-juros-em-2026-selic-vai-a-1425/), [bl2020/CNN](https://www.bl2020.com/misc_bl/index.cfm/fuseaction/shownewsroompage/newsid/3a8a1294-3aa7-4c9f-b475-b45a5ea4d89d/slang/en), [Renova Invest](https://renovainvest.com.br/?p=106745)
- Endividamento: [Metrópoles/CNC](https://www.metropoles.com/brasil/endividamento-das-familias-bate-recorde-e-atinge-82-diz-cnc), [Monitor Mercantil](https://monitormercantil.com.br/endividamento-e-inadimplencia-estabilizaram-em-junho-diz-cnc/), [DGABC/Serasa](https://www.dgabc.com.br/Noticia/4317691/inadimplencia-bate-82-8-milhoes-de-brasileiros-em-marco-segundo-serasa)
- Mercado de influência: [Finsiders](https://finsidersbrasil.com.br/reportagem-exclusiva-fintechs/fintechs-apostam-em-influenciadores-para-aproximar-marca-do-publico/), [Propmark](https://propmark.com.br/mercado/brasil-ganha-importancia-global-no-crescimento-da-creator-economy/)
- Gen Z e TikTok como busca (não verificado na origem): [Let's Money/Sicoob](https://www.letsmoney.com.br/noticias/sicoob-tiktok-educacao-financeira-geracao-z/), [BB Asset](https://investalk.bb.com.br/noticias/quero-aprender/como-as-redes-sociais-contribuem-para-a-educacao-financeira-dos-jovens)
- CONAR 2026: [Meio & Mensagem](https://www.meioemensagem.com.br/midia/conar-atualiza-guia-para-influenciadores-digitais), [Cescon Barrieu](https://cesconbarrieu.com.br/novas-diretrizes-do-conar-para-marketing-de-influencia-o-que-muda/)
- RPM de Shorts (estimativas de mercado): [AIR Media-Tech](https://air.io/pt/monetization/what-rpm-can-you-expect-from-shorts-in-2026), [vidIQ](https://vidiq.com/fr/blog/post/youtube-shorts-monetization/)
- CVM e finfluencers: [ANBIMA](https://www.anbima.com.br/pt_br/especial/espaco-finfluence.htm)
- 13º salário: [Lei 4.749/1965](https://www.planalto.gov.br/ccivil_03/leis/l4749.htm)
