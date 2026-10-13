# Fase 1 — Inteligência de mercado

> **Atualização:** a escolha de nicho deste documento foi substituída pela revisão v2 (`03-revisao-estrategica-v2.md`). O antigolpe virou uma série dentro da marca "Dinheiro do dia a dia". A pipeline, o funil e as regras de operação continuam valendo.

Data da pesquisa: 13/10/2026. Reproduza a matriz com `python3 ferramentas/matriz.py`.

## Legenda de confiança

- **VERIFICADO**: número encontrado em reportagem que cita fonte institucional (FBSP, Febraban, CNC, Serasa, BCB). A fonte primária ainda precisa ser aberta antes de o dado ir para um vídeo, e o QA da pipeline bloqueia a publicação até isso ser feito.
- **ESTIMATIVA**: meu julgamento, sem medição. Precisa ser testado.
- **NÃO VERIFICÁVEL DAQUI**: o ambiente não acessa tiktok.com, bcb.gov.br nem Google Trends. Não tenho volume de buscas, contagem de concorrentes nem dados de faturamento de nenhum nicho, e não invento esses números.

## Contexto da plataforma (o que vale para qualquer nicho)

| Fato | Status | Implicação |
|---|---|---|
| Creator Rewards: o Brasil aparece como mercado elegível na maioria das fontes; exige 18+, 10 mil seguidores, 100 mil visualizações em 30 dias e vídeos com **mais de 1 minuto** | Fontes secundárias e conflitantes; **confirmar no TikTok Studio** | Pagamento por visualização é receita **terciária**, não base do negócio |
| Content Posting API: clientes não auditados só publicam em **modo privado**, com limite de usuários por dia; a publicação pública exige auditoria | Documentação oficial de desenvolvedores do TikTok | Publicação 100% automática **não** existe no dia 1. Começamos com publicação assistida |
| Conteúdo de IA realista precisa de rótulo; diretrizes revisadas em 13/09/2025 | Reportagens (TechCrunch, 08/2025) | Usar motion graphics (não realista) e mesmo assim ativar o rótulo de IA por causa da voz sintética |
| Estudo da Kapwing: cerca de 59% dos vídeos mostrados a uma conta nova eram "AI slop" | Amostra de **uma** conta; empresa interessada no tema | O espaço está saturado de IA genérica. Diferenciação = utilidade + fonte + identidade visual própria |
| TikTok Shop opera no Brasil desde 08/05/2025, com afiliados | Reportagens (Canaltech, Propmark) | Afiliado de produto físico é viável, mas exige produto em mãos para filmar |

## Os 12 nichos analisados

1. **Antigolpe e segurança digital do dia a dia**: golpes de Pix, WhatsApp, falsa central, falsa venda, com prevenção e o que fazer depois.
2. **Finanças para endividados**: sair das dívidas, negociar, organizar o orçamento.
3. **Inglês prático para brasileiros.**
4. **Concursos públicos e estudos.**
5. **IA aplicada ao trabalho.**
6. **Direitos do consumidor no dia a dia.**
7. **Saúde e emagrecimento.**
8. **Direitos trabalhistas e INSS.**
9. **Achadinhos do TikTok Shop (casa e cozinha).**
10. **Receitas baratas.**
11. **Histórias de mistério e terror (ficção).**
12. **Curiosidades de história e ciência.**

## Critérios e pesos

| Critério | Peso | Por quê |
|---|---|---|
| Monetização | 20 | O objetivo é renda recorrente, não visualização |
| Demanda | 15 | Sem dor real não há audiência fiel |
| Produção com IA sem rosto | 15 | Restrição dura do projeto: sem rosto, sem voz própria, pouca edição manual |
| Concorrência / diferenciação | 10 | Nicho saturado de IA genérica afunda no feed |
| Alcance orgânico | 10 | O TikTok é o canal de aquisição |
| Risco (5 = baixo) | 10 | Desinformação, regulação e políticas da plataforma |
| Audiência fora do TikTok | 10 | Lista própria reduz a dependência do algoritmo |
| Frequência de pautas | 5 | Precisa haver tema novo toda semana |
| Custo (5 = barato) | 5 | Orçamento inicial reduzido |

Notas de 1 a 5. Pontuação final = média ponderada × 20 (escala de 20 a 100).

## Matriz

| # | Nicho | Dem | Conc | Alc | IA | Pautas | Monet | Custo | Risco | Externa | **Nota** | Evidência de demanda |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Antigolpe e segurança digital | 5 | 3 | 5 | 5 | 5 | 3 | 5 | 3 | 5 | **84** | VERIFICADO: 2.261.055 registros de estelionato em 2025 (FBSP, 20º Anuário); 15,8% da população 16+ (≈26,3 mi) sofreu golpe em 2025 (FBSP); Febraban, 1º sem/2025: falsa venda 174 mil, falsa central 139 mil, golpe do WhatsApp 73 mil relatos |
| 2 | Finanças para endividados | 5 | 2 | 4 | 4 | 4 | 4 | 5 | 3 | 4 | **78** | VERIFICADO: 82% das famílias endividadas em jul/2026 (CNC/Peic); 82,8 mi de inadimplentes em mar/2026 (Serasa) |
| 3 | Inglês prático | 4 | 1 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | **77** | ESTIMATIVA |
| 4 | Concursos públicos | 4 | 2 | 3 | 4 | 3 | 4 | 5 | 4 | 4 | **74** | ESTIMATIVA |
| 5 | IA no trabalho | 4 | 1 | 4 | 3 | 5 | 4 | 4 | 4 | 4 | **72** | ESTIMATIVA |
| 6 | Direitos do consumidor | 4 | 3 | 4 | 4 | 4 | 3 | 5 | 3 | 3 | **71** | PARCIAL: reclamações sobre Pix no Procon-SP subiram de 3.194 para 6.613 (jan–out, 2021→2022) |
| 7 | Saúde e emagrecimento | 5 | 1 | 4 | 3 | 4 | 4 | 4 | 1 | 3 | **66** | ESTIMATIVA |
| 8 | Direitos trabalhistas / INSS | 5 | 2 | 4 | 4 | 4 | 2 | 5 | 2 | 3 | **66** | ESTIMATIVA |
| 9 | Achadinhos TikTok Shop | 5 | 1 | 4 | 2 | 4 | 4 | 2 | 3 | 2 | **63** | PARCIAL: o Shop existe desde 05/2025; não há dado de demanda |
| 10 | Receitas baratas | 4 | 2 | 4 | 2 | 4 | 3 | 3 | 4 | 3 | **63** | ESTIMATIVA |
| 11 | Mistério e terror | 4 | 1 | 5 | 4 | 5 | 1 | 3 | 3 | 2 | **58** | ESTIMATIVA |
| 12 | Curiosidades | 4 | 1 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | **57** | ESTIMATIVA |

**As notas de concorrência, alcance, IA, monetização e risco são julgamento meu (ESTIMATIVA)**, com a justificativa abaixo. A demanda só é VERIFICADA nos nichos 1 e 2.

### Justificativas resumidas

- **Antigolpe**: alcance 5 porque o conteúdo de proteção é naturalmente compartilhável ("manda pra sua mãe"). Produção com IA 5 porque conversa reconstituída, alerta e checklist se fazem 100% em motion graphics, sem cena realista. Pautas 5 porque surgem golpes novos e mudanças de regra (MED, Pix) o tempo todo. Externa 5 porque um canal de alertas no WhatsApp ou por e-mail é um produto natural. Monetização só 3: afiliados de segurança são fracos no Brasil e vender antivírus num canal antigolpe parece *scareware*. Risco 3: há risco de ensinar o golpe sem querer, de difamar empresas e de errar fatos.
- **Endividados**: demanda máxima e monetização melhor (planilhas, cursos), mas concorrência alta de finfluencers. Há risco ético nos afiliados de crédito (oferecer crédito a quem está endividado) e risco CVM se o conteúdo derivar para recomendação de investimento (Res. CVM 20/2021).
- **Inglês**: risco mínimo e boa monetização, mas a concorrência é altíssima e a demanda não foi medida.
- **IA no trabalho**: monetização por SaaS é boa, mas os demos exigem gravação real de tela (produção 3), há obsolescência rápida e concorrência máxima.
- **Saúde e trabalhista**: demanda alta, mas o risco de desinformação, e de captação irregular no caso trabalhista (regras da OAB), derruba a nota.
- **Ficção e curiosidades**: alcance alto, monetização quase só por views, e é exatamente o território do conteúdo de IA em massa.

## Robustez da escolha

A análise de sensibilidade (`ferramentas/matriz.py`) sobe e desce cada peso em ±50% (18 cenários). **O Antigolpe fica em 1º lugar nos 18.** Mesmo com monetização 2 em vez de 3, ele ainda soma 80 e continua em 1º. A escolha resiste a erros moderados nos pesos. Ela **não** resiste a erros nas notas em si, e por isso a Etapa A testa as notas mais incertas (alcance e monetização).

## Top 3

1. **Antigolpe e segurança digital (84)**
2. **Finanças para endividados (78)**: é o plano B e uma extensão natural ("proteção financeira").
3. **Inglês prático (77)**: alternativa de baixo risco caso o público antigolpe não converta.

## Recomendação: **Antigolpe e segurança digital do dia a dia**

**Por quê**
- É a dor mais documentada da lista: milhões de registros por ano e crescimento contínuo (FBSP, Febraban).
- O formato encaixa perfeitamente no "sem rosto": conversas reconstituídas, alertas e checklists são originais, desenhados por código, sem risco de direitos autorais e sem *deepfake*.
- Há um mecanismo de distribuição embutido: as pessoas compartilham para proteger a família.
- Há um caminho natural para uma audiência própria (canal de alertas no WhatsApp ou newsletter) e para um produto (kit família antigolpe).
- Existem pautas novas toda semana (golpes novos, regras novas do BCB).

**Incertezas que vou testar, não assumir**
- Se a audiência compra alguma coisa. A monetização tem nota 3 e é o elo fraco.
- Se o TikTok distribui bem conteúdo com voz sintética nesse tema.
- Quantos perfis antigolpe em português já existem e qual a qualidade deles. Não consegui acessar o TikTok daqui; essa é a tarefa A2 do plano, com levantamento manual de 20 perfis.

**Critério para abandonar e ir ao plano B**: após 30 vídeos e 30 dias, se a mediana de compartilhamentos por mil views ficar abaixo da dos vídeos de controle **e** a captação da lista ficar abaixo de 100 contatos, migrar para "Finanças para endividados", reaproveitando a pipeline.

## Fontes

- FBSP, 20º Anuário (via [Brasil 61](https://brasil61.com/n/anuario-de-seguranca-publica-brasil-registrou-mais-de-2-2-milhoes-de-casos-de-estelionato-em-2025-bras2616801), [Xataka](https://www.xataka.com.br/informatica/a-nova-epidemia-brasileira-nao-esta-nas-ruas-os-golpes-digitais-ja-atingem-56-milhoes-pessoas-e-crime-fisico-ficou-para))
- Febraban, golpes do 1º sem/2025 (via [Istoé Dinheiro](https://istoedinheiro.com.br/golpe-da-falsa-venda-lidera-ranking), [Diário de Pernambuco](https://www.diariodepernambuco.com.br/economia/2025/11/11700388-febraban-golpe-da-falsa-venda-lidera-entre-os-golpes-mais-relatados-por-clientes-bancarios-no-primeiro-semestre.html))
- [ENCCLA 2025 — Ministério da Justiça](https://www.gov.br/mj/pt-br/assuntos/sua-protecao/lavagem-de-dinheiro/enccla/acoes-enccla/arquivos-enccla-2025/e2025a01-acao-1-enccla-2025-produto-1.pdf)
- CNC/Peic (via [Metrópoles](https://www.metropoles.com/brasil/endividamento-das-familias-bate-recorde-e-atinge-82-diz-cnc), [Poder360](https://www.poder360.com.br/poder-economia/apos-5-meses-de-alta-endividamento-das-familias-fica-estavel/))
- Serasa (via [DGABC](https://www.dgabc.com.br/Noticia/4317691/inadimplencia-bate-82-8-milhoes-de-brasileiros-em-marco-segundo-serasa), [Times Brasil](https://timesbrasil.com.br/brasil/economia-brasileira/brasil-atinge-817-milhoes-de-inadimplentes-em-fevereiro-de-2026-maior-nivel-da-serie-diz-serasa/))
- Procon-SP Pix (via [Gazeta SP](https://www.gazetasp.com.br/brasil/reclamacoes-sobre-problemas-com-pix-dobram-em-2022-aponta-dados-do/))
- TikTok Content Posting API: [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines), [Direct Post reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post)
- Creator Rewards, fontes secundárias e conflitantes: [quasa.io](https://quasa.io/media/tiktok-creator-rewards-program-eligible-countries-in-2026), [Metricool](https://metricool.com/es/que-es-tiktok-creativity-program/), [flowshorts](https://flowshorts.app/blog/tiktok-monetization-requirements)
- Diretrizes e IA: [TechCrunch 08/2025](https://techcrunch.com/2025/08/15/tiktoks-new-guidelines-add-subtle-changes-for-live-creators-ai-content-and-more/)
- Kapwing "AI slop": [Search Engine Journal](https://searchenginejournal.com/tiktok-shows-3x-more-ai-slop-than-youtube-report-finds/579521/)
- TikTok Shop Brasil: [Canaltech](https://canaltech.com.br/e-commerce/tiktok-shop-inicia-as-atividades-no-brasil-e-compete-com-gigantes-do-e-commerce/)
- CVM e finfluencers: [ANBIMA](https://www.anbima.com.br/pt_br/especial/espaco-finfluence.htm), [Conjur](https://www.conjur.com.br/?p=796802)
