# Primeira entrega — Projeto Autopiloto

> **Atualização:** a escolha de nicho deste documento foi substituída pela revisão v2 (`03-revisao-estrategica-v2.md`). O antigolpe virou uma série dentro da marca "Dinheiro do dia a dia". A pipeline, o funil e as regras de operação continuam valendo.

Nicho recomendado: **Antigolpe e segurança digital do dia a dia** (ver `01-fase1-inteligencia-de-mercado.md`).
Premissas monetárias: **US$ 1 ≈ R$ 5,50** (premissa, não verifiquei o câmbio de hoje). Taxas de plataformas vêm de fontes secundárias e conflitantes; confirmar antes de contratar.

---

## 1. Modelo de negócio (Fase 2, resumo)

### Público
- **Primário (quem assiste e compartilha):** adultos de 25 a 55 anos, conectados, que se sentem responsáveis pela segurança digital da família (pais, avós, sogros).
- **Secundário (quem precisa da ajuda):** pessoas de 50 anos ou mais, que costumam receber o conteúdo por compartilhamento, e quem acabou de cair em golpe.
- **Dores:** medo de perder dinheiro, vergonha depois de cair num golpe, não saber o que fazer nas primeiras horas, não conseguir explicar aos pais "o que não fazer".
- **Desejos:** regras simples e memoráveis, saber agir rápido, proteger a família sem virar especialista.
- **Dúvidas recorrentes (hipótese, validar nos comentários):** "isso é golpe?", "caí, e agora?", "como recupero meu WhatsApp?", "o banco devolve?".

### Posicionamento e proposta de valor
> **"O golpe explicado em 60 segundos, antes de chegar em você. Com fonte em cada vídeo."**

### Nome e identidade (a verificar disponibilidade no TikTok, tarefa do usuário)
- **Nome principal:** Radar Antigolpe (@radarantigolpe). Alternativas: "Desconfia Antes" e "Golpe à Vista".
- Evitei "Pix" no nome porque é marca do Banco Central e o nome poderia sugerir vínculo oficial.
- **Visual:** fundo azul-marinho, selo amarelo de alerta, vermelho para perigo e verde para ação correta. Tipografia Inter (licença OFL). Já está implementado em `pipeline/render.py`.
- **Bio (rascunho):** "Golpes explicados antes de chegarem em você. Fonte em cada vídeo. Narração por IA. Checklist grátis ↓"
- **Personalidade editorial:** calma e direta, sem sensacionalismo. **Nunca culpa a vítima** ("golpe acontece com qualquer um"). Nunca acusa empresa real sem decisão oficial. Nunca ensina a executar o golpe: mostra só o suficiente para reconhecê-lo.

### Diferenciais (hipóteses competitivas; a análise manual de 20 perfis, tarefa A2, confirma ou derruba)
1. **Fonte citada em todo vídeo com número**, com bloqueio automático no QA.
2. **Encenação original desenhada por código**: sem prints reais de vítimas, sem *deepfake*, sem vídeo de banco de imagens.
3. **Foco em ação**: cada vídeo termina com uma regra de bolso ou um passo a passo.
4. **Formato "mande para quem você ama"**: distribuição por compartilhamento, não só pelo algoritmo.

### Pilares editoriais e formatos
| Pilar | Formato | Objetivo principal | Métrica-alvo |
|---|---|---|---|
| Anatomia do golpe | Conversa reconstituída | Alcance e compartilhamento | compart./mil views |
| Frase que entrega o golpe | Frase-alerta + regra de bolso | Seguidores | seguidores/mil views |
| Caí no golpe, e agora? | Passo a passo | Salvamentos e lista | salvos/mil, cadastros |
| Radar da semana | Golpe novo / regra nova com fonte oficial | Recorrência | retorno de seguidores |
| Proteja quem você ama | Configuração guiada para pais e avós | Produto | cliques na bio |
| Golpe ou não? | Quiz | Comentários | coment./mil |

### Funil
`Vídeo (TikTok) → perfil → link da bio → checklist gratuito (e-mail ou canal do WhatsApp, com consentimento) → sequência de 5 e-mails/mensagens úteis → oferta low-ticket`

**Bloqueio a confirmar:** pelo que sei, o link clicável na bio exige 1.000 seguidores em conta pessoal, e a conta empresa libera o link mais cedo mas perde o Creator Rewards e parte da biblioteca musical. **Não consegui verificar isso daqui.** Recomendação: começar com **conta pessoal**. Antes dos 1.000 seguidores o CTA é "seguir" e "compartilhar", não "link".

---

## 2. Monetização (Fase 2 + Fase 6)

### Comparação das fontes de receita
| Fonte | Encaixe no nicho | Custo inicial | Margem | Dependências | Risco | Quando |
|---|---|---|---|---|---|---|
| **Produto digital próprio** (Kit Família Antigolpe: guia, cartões imprimíveis, roteiro de conversa com os pais, configuração passo a passo) | Alto | ~R$ 0 (Kiwify/Hotmart sem mensalidade) | ~75–80% após taxas e impostos | Lista mínima e prova de interesse | Baixo | **Inicial**, após validação |
| **Patrocínio** (fintechs, bancos, empresas de segurança) | Alto, se a audiência for de confiança | R$ 0 | ~100% | Audiência relevante (≥ 20–50 mil seguidores, estimativa) e mídia kit | Conflito de interesse: nunca patrocinador "isento de golpe" | **Segunda**, a partir do mês 3–6 |
| **Programa da plataforma** (Creator Rewards) | Médio | R$ 0 | 100% | 10 mil seguidores, vídeos com mais de 1 min, Brasil elegível (a confirmar) | Receita por mil views não verificada; muda sem aviso | Complemento |
| **Afiliados** (gerenciador de senhas, antivírus, TikTok Shop) | Baixo/médio | R$ 0 | Comissão variável | Programas que aceitem tráfego do Brasil (não verificado) | Parecer "scareware" mina a confiança | Teste pontual |

**Escolha:** fonte **inicial** = **produto digital low-ticket**, validado antes de ser construído. **Segunda** = **patrocínio** (preparar o mídia kit desde já), com Creator Rewards como complemento automático.

### Validação antes de construir (regra: nada de produto complexo sem sinal)
1. Publicar o **checklist gratuito** ("O que fazer nas primeiras 2 horas depois de um golpe") como isca. São 2 páginas, feitas por mim.
2. Na página de cadastro, perguntar: "Você pagaria R$ 27 por um kit completo para proteger seus pais?" e oferecer uma **lista de espera**.
3. **Critério para construir o kit:** ≥ 300 cadastros **e** ≥ 10% deles na lista de espera, ou ≥ 15 pré-vendas.

### Ponto de equilíbrio (produto a R$ 27)
| Item | Valor |
|---|---|
| Preço | R$ 27,00 |
| Taxa Kiwify (8,99% + R$ 2,49; fonte secundária) | − R$ 4,92 |
| Imposto (premissa de 6%, Simples Anexo III; **confirmar com contador**) | − R$ 1,62 |
| **Líquido por venda** | **≈ R$ 20,46** |

| Cenário de custo/mês | Vendas/mês para empatar | Leads/mês necessários com conversão lead→compra de 2% (hipótese) |
|---|---|---|
| Mínimo (~R$ 15) | 1 | 50 |
| Intermediário (~R$ 400) | 20 | 1.000 |
| Avançado (~R$ 2.500) | 123 | 6.150 |

A taxa de 2% é uma **hipótese a medir**, não um dado. **Indicadores que comprovam demanda:** cadastros por mil views, taxa de abertura dos e-mails, % na lista de espera, respostas espontâneas pedindo ajuda.

---

## 3. Arquitetura técnica mínima

```
 PESQUISA            PLANEJAR/ESCREVER         VALIDAR                 PRODUZIR
 Febraban, BCB,  →   Claude gera roteiro   →   pipeline/qa.py      →   pipeline/tts.py (Azure F0)
 gov.br, Procon,     JSON com fontes e         (campos, promessas,     pipeline/render.py
 comentários         hipótese testável         plágio, duração)        (Pillow + ffmpeg)
                                                     ↓                        ↓
                                              REVISÃO HUMANA          saida/<id>/ mp4 + srt
                                              (fonte verificada,      + metadados.json
                                               aprovado/por/em)             ↓
 APRENDER            MEDIR                     PUBLICAR                FILA
 regras de      ←    metricas/metricas.csv ←   TikTok Studio       ←   pipeline/fila.py
 decisão             pipeline/painel.py        (manual/agendado);      (estados, hash anti-
                     (D+1/D+3/D+7)             API só após auditoria    duplicação, 3 falhas = pausa)
```

**Já implementado e testado neste repositório** (`python3 -m unittest discover -s testes`, 9 testes passando):
- Roteiro JSON com todos os campos exigidos (objetivo, público, gancho, narração, cenas, texto na tela, CTA, legenda, hipótese, critério de sucesso, fontes).
- QA automático: campos obrigatórios, promessas proibidas (com exceção para negação), duração de 15 a 90 s, número sem fonte, similaridade com outros roteiros, alerta para menção a marcas reais, aviso de vídeo com menos de 1 min para o Creator Rewards.
- Portão de publicação: exige fonte verificada por humano e aprovação registrada (quem e quando).
- Render 1080×1920 com legendas queimadas, revelação progressiva de chat e listas, zona segura do TikTok, selo de marca, aviso "Narração gerada por IA", além de `.srt` e `metadados.json`.
- Narração: backends `azure` (produção, **não testado**: sem chave e com rede bloqueada aqui), `piper` (offline, testado; voz de baixa qualidade, só para teste) e `silencio` (testes).
- Fila com estados, escrita atômica, deduplicação por hash e por URL, registro em `execucao.jsonl`, pausa após 3 falhas.
- Painel que compara vídeos **somente na mesma idade** e se recusa a concluir com amostras menores que 5.

**Não implementado (depende de você ou de aprovação externa):** publicação automática (API do TikTok exige app aprovado e auditoria; sem auditoria, posts saem privados), coleta automática de métricas, voz de produção (Azure), landing page e lista de e-mails.

### Ferramentas escolhidas (uma por função)
| Função | Escolha | Custo | Licença/limitação | Status |
|---|---|---|---|---|
| Roteiro e pesquisa | Claude (este agente) | já incluso no seu plano | — | Em uso |
| Voz | **Azure AI Speech F0** | grátis até 0,5 mi caracteres neurais/mês (≈ 500 vídeos de 60 s) | Uso comercial permitido nos termos Azure (confirmar); conta pode exigir cartão | Precisa de conta |
| Voz (upgrade) | ElevenLabs Starter/Creator | ~US$ 5–22/mês | Plano grátis **não** permite uso comercial | Opcional |
| Visual + edição + legendas | Python + Pillow + ffmpeg (próprio) | R$ 0 | Tudo original; sem banco de imagens | **Pronto** |
| Música | Biblioteca de Música Comercial do TikTok, no app | R$ 0 | Não embutir música de terceiros no arquivo | Na publicação |
| Armazenamento | Git (roteiros/metadados) + Google Drive 15 GB (vídeos) | R$ 0 | — | Repo pronto |
| Publicação | TikTok Studio (web), com agendamento | R$ 0 | Manual assistida | Precisa da conta |
| Lista | MailerLite ou Brevo, plano grátis (limites a confirmar) | R$ 0 | LGPD: consentimento explícito | Precisa de conta |
| Página | GitHub Pages ou Cloudflare Pages + domínio .com.br | ~R$ 40/ano | — | Precisa do domínio |
| Venda | Kiwify ou Hotmart | taxa por venda | Taxas divergentes entre fontes | Depois da validação |

Evitado de propósito: **edge-tts** (usa um endpoint não oficial da Microsoft; licença comercial incerta) e ferramentas "tudo em um" de vídeo com IA (custo recorrente e conteúdo genérico).

---

## 4. Orçamento mensal estimado (R$)

| Item | Mínimo | Intermediário | Avançado |
|---|---|---|---|
| Voz | 0 (Azure F0) | 121 (ElevenLabs Creator) | 545 (ElevenLabs Pro) |
| LLM / roteiros | 0 (plano atual) | 55–110 (API Claude, automação) | 275–550 |
| Domínio + página | 4 (R$ 40/ano) | 4 | 4 |
| Servidor para automações | 0 (rodar local/GitHub Actions) | 30 (VPS pequena) | 60–120 |
| E-mail marketing | 0 (plano grátis) | 0–80 | 150–300 |
| Revisão humana terceirizada | 0 (você revisa) | 0 | 800–1.500 |
| Testes de anúncio do funil | 0 | 100 | 300–500 |
| **Total aproximado** | **≈ R$ 5–15/mês** | **≈ R$ 310–450/mês** | **≈ R$ 2.100–3.500/mês** |

**Regra:** só subir de cenário quando o anterior provar o funil (ver critérios da seção 5). Todo gasto novo passa pela sua aprovação.

---

## 5. Plano dos primeiros 30 dias

Frequência **hipótese**: 1 vídeo por dia, alternando dois horários (12h e 20h) para testar o melhor. Não é regra universal.

| Semana | Entregas | Quem |
|---|---|---|
| **1 — Validação** | Você: confirma o nome, cria a conta (pessoal), checa a disponibilidade do @ e cria a conta Azure. Eu: escrevo os 30 conceitos completos, a análise manual de 20 perfis concorrentes (com você me passando links/prints) e o checklist gratuito | Ambos |
| **2 — MVP** | 7 vídeos publicados (1/dia) a partir dos roteiros aprovados. Mínimo de 2 formatos diferentes. Métricas registradas em D+1, D+3 e D+7 | Você publica; eu produzo |
| **3 — Ajuste** | 7 vídeos. Primeira leitura do painel, ainda sem declarar vencedores (n pequeno). Landing page e lista no ar | Ambos |
| **4 — Decisão** | 7 a 9 vídeos. Leitura D+7 dos ~20 primeiros. Decidir: manter nicho, ajustar pilares ou plano B. Abrir a lista de espera do kit | Você decide; eu analiso |

### Critérios para avançar de etapa
- **A → B:** nicho e nome confirmados, 10 roteiros aprovados com fontes verificadas, conta criada.
- **B → C:** ≥ 20 vídeos publicados, métricas D+7 completas, ao menos 1 formato com mediana de compartilhamentos por mil views ≥ 1,5× a dos demais e n ≥ 5.
- **C → D:** ≥ 300 cadastros na lista e sinal de demanda (≥ 10% na lista de espera ou ≥ 15 pré-vendas).

### Regras de decisão do painel
- **Ampliar:** formato ou gancho com n ≥ 5 e mediana ≥ 1,5× a do restante, na mesma idade de medição.
- **Modificar:** formato com retenção boa e compartilhamento fraco → trocar o CTA. Formato com compartilhamento bom e seguidores fracos → reforçar a série ou a promessa de continuidade.
- **Interromper:** n ≥ 8 e mediana abaixo de 0,5× a do restante.
- Nunca concluir causalidade a partir de um único vídeo viral. Quando possível, testar variações A/B do mesmo roteiro (gancho diferente).

---

## 6. Riscos e dependências

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Erro factual (prazo do MED, números) | Média | Alto (credibilidade) | QA bloqueia sem fonte verificada; revisão humana obrigatória |
| Conteúdo interpretado como "ensinar golpe" | Média | Alto (remoção/strike) | Mostrar só o reconhecimento; nunca o passo a passo do criminoso |
| Difamação de empresa ou pessoa | Baixa | Alto | QA alerta para nomes de bancos e empresas; sem acusar sem decisão oficial |
| Distribuição baixa para conteúdo com voz de IA | Média | Alto | Voz neural de qualidade, rótulo de IA, utilidade alta; medir no MVP |
| Monetização fraca no nicho | Média | Alto | Validar com lista antes de construir; plano B (endividados) |
| Publicação automática negada | Alta no curto prazo | Médio | Publicação assistida; auditoria da API só na Etapa C |
| Dependência do TikTok | Alta | Alto | Lista própria desde o mês 1; reaproveitar os vídeos em Reels e Shorts |
| Segurança da conta | Baixa | Alto | Verificação em duas etapas; senhas em gerenciador; chaves só em variáveis de ambiente, nunca no repo |
| LGPD na lista | Baixa | Médio | Consentimento explícito, política de privacidade, descadastro fácil |

**Dependências suas:** criar contas (TikTok, Azure, e-mail marketing, Kiwify), registrar domínio, verificar fontes primárias e aprovar roteiros, publicar até a API ser auditada, e decisões fiscais com contador.

---

## 7. O que já executei e o que vem a seguir

**Executado nesta sessão (verificável no repositório):**
1. Pesquisa de mercado e matriz ponderada de 12 nichos, com análise de sensibilidade (`ferramentas/matriz.py`).
2. 3 roteiros-piloto completos, com fontes (`conteudo/roteiros/`). **Status: produzíveis, publicação bloqueada** até a verificação das fontes primárias.
3. Pipeline de produção funcionando (QA → voz → render → fila → painel), coberta por 9 testes.
4. 3 vídeos-piloto renderizados localmente com voz de teste (Piper, baixa qualidade). **Não publiquei nada.**

**Próximas tarefas que posso executar já (sem credenciais):**
- Escrever os 30 conceitos completos com fontes, no formato JSON da pipeline.
- Escrever o checklist gratuito e a landing page estática.
- Criar o mídia kit em rascunho e a sequência de 5 e-mails.
- Montar um GitHub Actions que roda QA e testes a cada roteiro novo.

**Decisões que preciso de você:**
1. Aprovar o nicho "Antigolpe" ou escolher o plano B.
2. Aprovar o nome "Radar Antigolpe" (ou alternativa) e verificar se o @ está livre.
3. Confirmar o cenário de orçamento inicial (recomendo **Mínimo**).
