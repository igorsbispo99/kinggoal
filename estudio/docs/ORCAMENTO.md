# Orçamento — Estúdio de TV com IA

Proposta de custos para o canal de notícias no TikTok. Documento de decisão:
nenhum código foi escrito ainda.

Versão visual: publicada como artifact em 17/08/2026.
Valores em dólar convertidos a R$ 5,40. Preços verificados em agosto de 2026.

---

## Veredito

Dos oito componentes de um estúdio automatizado, **sete têm solução gratuita de
qualidade profissional**. O único item onde a versão gratuita entrega um produto
visivelmente pior é o **cérebro** — os modelos que escolhem a pauta, encontram o
ângulo, escrevem o roteiro e criam o humor.

**Recomendação: gastar US$ 14–20/mês só com o cérebro e zerar todo o resto.**

Custo por vídeo: **US$ 0,47–0,77 ≈ R$ 2,50–4,15**.

---

## Cenários

| Cenário | Custo/mês | O que muda |
|---|---|---|
| **Redação Enxuta** | R$ 0 | Esteira completa no ar. Apresentador ilustrado. Cérebro nas cotas gratuitas, sujeito a limites e filas. |
| **Estúdio Completo** *(recomendado)* | US$ 14–20 (≈ R$ 75–110) | Cérebro no melhor modelo sem fila. Apresentador realista com lipsync. Escala até 60 vídeos/mês. |
| **Grande Emissora** | US$ 79 (≈ R$ 430) | Voz e avatar pagos. Ganho de qualidade pequeno, ganho de tempo de setup alto. Não recomendado antes de ter audiência. |

---

## Peça por peça

| Componente | Solução | Custo | Por quê |
|---|---|---|---|
| Notícias | RSS dos portais + GDELT | R$ 0 | Feeds públicos ilimitados, sem chave de API |
| Cérebro | API da Claude, modelos misturados por etapa | US$ 14–28/mês | Único gasto que muda a qualidade do produto |
| Voz | edge-tts (vozes neurais pt-BR) | R$ 0 | Qualidade muito próxima da paga, sem chave |
| Imagens / B-roll | Pexels, Pixabay, Wikimedia Commons | R$ 0 | APIs gratuitas com uso comercial liberado |
| Apresentador | LatentSync / MuseTalk (código aberto) | US$ 0–9/mês | Zero em créditos gratuitos de GPU; US$ 0,30/vídeo no gerenciado |
| Montagem | FFmpeg | R$ 0 | É o que as ferramentas pagas usam por baixo |
| Motor da esteira | GitHub Actions + VPS gratuito Oracle | R$ 0 | 2.000 min/mês agendados + máquina 24h sem cobrança |
| Portal de aprovação | Página estática | R$ 0 | Abre no celular, aprova ou devolve |
| Publicação | Manual (você) | R$ 0 | API do TikTok é gratuita mas exige auditoria de semanas |

**Total recomendado: US$ 14–37/mês (≈ R$ 75–200), conforme volume.**

---

## O que decidi NÃO pagar

| Ferramenta | Preço evitado | Substituto | O que se perde |
|---|---|---|---|
| ElevenLabs Creator | US$ 22/mês | edge-tts | Controle fino de emoção e clonagem de voz |
| HeyGen Creator | US$ 29/mês | LatentSync / MuseTalk | Só conveniência — e o plano trava em 30 min/mês de avatar realista |
| NewsAPI comercial | US$ 15+/mês | RSS direto + GDELT | Nada relevante |
| Agendador de posts | US$ 13+/mês | Você posta | Nada, já é decisão de projeto |
| Hospedagem gerenciada | US$ 10+/mês | GitHub Actions + Oracle | Nada nesse volume |

**Evitado: ~US$ 89/mês (≈ R$ 480).**

---

## Custo por vídeo (60s, três notícias)

| Etapa | Modelo | Custo |
|---|---|---|
| Curadoria de notícias | barato | US$ 0,075 |
| Pauta e ângulo | topo | US$ 0,120 |
| Roteiro e humor | topo | US$ 0,170 |
| Checagem de fatos | barato | US$ 0,030 |
| Direção de arte | barato | US$ 0,023 |
| Análise de indicadores (rateado) | topo | US$ 0,050 |
| Lipsync | — | US$ 0,000–0,300 |
| Voz, imagens, montagem, hospedagem | — | US$ 0,000 |
| **Total** | | **US$ 0,47–0,77** |

- 1 vídeo/dia → US$ 14–23/mês
- 2 vídeos/dia → US$ 28–46/mês

O reaproveitamento de contexto entre chamadas derruba a parte de leitura em ~90%,
então na prática o número tende ao piso da faixa.

---

## A esteira: nove times, três portões

1. **Pauta** — varre RSS + GDELT de hora em hora, agrupa manchetes do mesmo
   assunto, pontua por potencial de retenção. *(grátis)*
2. **Editorial** — escolhe 3–5 notícias, define ordem e o fio que amarra
   assuntos diferentes no mesmo vídeo. *(modelo topo)*

   → **PORTÃO 1 — você aprova a pauta do dia**

3. **Roteiro** — gancho nos 3 primeiros segundos, ritmo jovem, piadas onde a
   atenção cai. *(modelo topo)*
4. **Checagem** — confere cada afirmação contra a fonte original. *(modelo barato)*

   → **PORTÃO 2 — você aprova o roteiro**

5. **Voz** — locução + marcação de tempo palavra por palavra. *(grátis)*
6. **Arte** — imagens por trecho, selos, legendas animadas em 9:16. *(grátis)*
7. **Apresentador** — anima o rosto contra o áudio. Personagem fixo. *(grátis ou US$ 0,30)*
8. **Montagem** — FFmpeg junta tudo, queima legendas, mixa trilha. *(grátis)*

   → **PORTÃO 3 — você aprova o vídeo e posta**

9. **Indicadores** — você cola os números do TikTok, o time cruza retenção com
   as escolhas de pauta/gancho/duração e devolve regras para o time 01 usar
   amanhã. *(modelo topo)*

---

## Riscos conhecidos

- **A voz gratuita depende de serviço não oficial.** O edge-tts conversa com um
  endpoint da Microsoft não projetado para isso. Funciona bem e é muito usado,
  mas pode ser limitado por volume. Mitigação: motor de voz trocável por
  configuração.
- **O apresentador realista precisa de GPU.** Créditos gratuitos cobrem ~1
  vídeo/dia. Acima disso: serviço gerenciado a US$ 0,30/vídeo, ou volta ao
  apresentador ilustrado, que roda em qualquer máquina.
- **A publicação continua manual.** A API do TikTok exige auditoria de 1–2
  semanas e, até sair, só publica vídeos visíveis apenas para o autor.
- **Direito de imagem e som.** Todas as fontes escolhidas liberam uso comercial.
  Notícia não tem dono, mas texto de portal tem — o roteiro sempre reescreve.

---

## O que preciso para começar

1. **Aprovar um cenário.** Recomendação: Estúdio Completo, US$ 14–20/mês.
2. **Uma chave da API da Claude.** Único cadastro pago; cobrança por uso, com
   teto de gasto configurável na própria conta.
3. **Definir o apresentador.** Nome, idade aparente, jeito de falar, senso de
   humor. Posso propor três personagens.
4. **Definir o ritmo.** 1 vídeo/dia é o ponto de partida saudável.

---

## Fontes consultadas

- ElevenLabs — planos e créditos 2026
- HeyGen — planos, créditos por minuto de avatar 2026
- edge-tts (rany2/edge-tts) — vozes neurais Microsoft, pt-BR
- fal.ai LatentSync — US$ 0,20 até 40s, US$ 0,005/s adicional
- MuseTalk — lipsync open source próximo de tempo real
- TikTok Content Posting API — gratuita, com auditoria obrigatória para post público
- Oracle Cloud Always Free — VPS ARM sem prazo de expiração
- Modal — US$ 30/mês de créditos gratuitos de GPU
- RunPod — RTX 4090 a US$ 0,69/h
