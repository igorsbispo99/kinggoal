# Projeção financeira — 18 meses

Companheiro do `ORCAMENTO.md`. Responde: quando o estúdio se paga e quando
começa a dar lucro.

Modelo reproduzível em `modelo-financeiro.js` (`node modelo-financeiro.js`).

---

## Resposta curta

| | |
|---|---|
| **Máximo em risco** | **R$ 1.080** — pior saldo acumulado, no cenário em que o canal não engrena |
| **Payback (cenário base)** | **mês 9** |
| **R$ 3.000/mês (cenário base)** | **mês 17** |

A R$ 120/mês, **um único vídeo com 40 mil views paga o mês inteiro de operação.**
O que demora não é cobrir o custo — é virar renda relevante.

---

## Correção do orçamento anterior: vídeos > 60 segundos

O orçamento original previa vídeos de 60s. O programa de criadores do TikTok só
remunera **vídeos com mais de 1 minuto** — com exatos 60s o canal fica fora da
monetização inteira.

**Formato corrigido para 75–90 segundos.** Efeito no custo: de US$ 0,47–0,77 para
**US$ 0,55–0,87** por vídeo. O modelo já usa R$ 120/mês com a correção embutida.

---

## As três travas de monetização

Todas precisam estar abertas ao mesmo tempo:

- **10.000 seguidores** — a trava que costuma demorar mais
- **100.000 views em 30 dias** — sustentado, não um pico isolado
- **vídeo > 60 segundos** — vídeo curto viraliza mas não paga

---

## Os três cenários

| Cenário | Cobre o custo | Payback | R$ 3.000/mês | Mês 18 |
|---|---|---|---|---|
| Pessimista | mês 10 | mês 16 | não chega | 8,5k seg · R$ 550/mês (só afiliados) |
| **Base** | mês 8 | **mês 9** | mês 17 | 41k seg · R$ 3.577/mês · acum. R$ 18,2k |
| Otimista | mês 4 | mês 4 | mês 6 | 180k seg · R$ 19,7k/mês · acum. R$ 154k |

A diferença entre pessimista e base **não é o sistema — é o conteúdo**. Os dois
postam todo dia, no mesmo custo, com a mesma esteira. O que muda é se os vídeos
prendem a atenção até o fim. É por isso que a recomendação foi gastar no cérebro
e economizar em todo o resto.

### Resultado acumulado (R$)

| Mês | Pessimista | Base | Otimista |
|---:|---:|---:|---:|
| 3 | −360 | −360 | −360 |
| 6 | −720 | −720 | 4.655 |
| 9 | −1.080 | 41 | 22.895 |
| 12 | −840 | 2.870 | 54.995 |
| 15 | −150 | 8.969 | 99.145 |
| 18 | 990 | 18.197 | 154.250 |

---

## O custo que não está no orçamento: seu tempo

Três aprovações/dia + postagem ≈ **12 horas/mês**. A R$ 50/h isso são
**R$ 600/mês** — cinco vezes o custo de infraestrutura.

| Momento | Receita/mês | Por hora do seu tempo |
|---|---|---|
| Mês 8 (base) | R$ 513 | R$ 43/h — ainda é investimento |
| Mês 12 (base) | R$ 1.691 | R$ 141/h — começa a fazer sentido |
| Mês 18 (base) | R$ 3.577 | R$ 298/h — renda de verdade |

Argumento forte para automatizar ao máximo: cada minuto tirado do seu dia melhora
essa coluna **sem depender de o canal crescer**. A dois vídeos/dia, dá para
reduzir os três portões a um só (aprovação do pacote do dia).

---

## O que pode invalidar a projeção

- **O TikTok mira exatamente esse tipo de conteúdo.** Há política contra conteúdo
  "não original e de baixo esforço", e o exemplo citado pela plataforma é vídeo com
  voz robótica lendo texto sobre imagem genérica. Conteúdo de IA não é proibido —
  precisa ser **rotulado** e genuinamente original. Ação: rótulo de IA em todo
  vídeo por padrão, e o investimento no cérebro deixa de ser opcional.
- **O RPM é a parte mais frágil do modelo.** Usei R$ 3,00/mil views qualificadas.
  Fontes de mercado citam R$ 4,50–8,50 para finanças/negócios; notícias gerais
  rendem menos, então fiquei abaixo. O TikTok não publica tabela oficial.
- **A maioria dos canais não chega a 10 mil seguidores.** O cenário pessimista é o
  desfecho mais comum. Não há benchmark público confiável de tempo até 10k — as
  curvas são cenários construídos, não previsões.
  **Ponto de reavaliação honesto: mês 3.** Se nenhum vídeo passou de 20 mil views
  até lá, o problema é de formato, não de paciência.
- **Publicidade direta depende de você.** Metade da receita base a partir do mês 12
  vem de publieditorial, que exige responder marcas, negociar e emitir nota.

---

## Premissas do modelo

- Custo fixo R$ 120/mês · 30 vídeos/mês de 75–90s
- RPM R$ 3,00 por mil views **qualificadas**
- 45% das views totais contam como qualificadas
- Dólar a R$ 5,40
- Publicidade entra a partir de 20k seguidores (base) e 30k (otimista), dentro da
  faixa de mercado de R$ 1.500–8.000/publicação para perfis de 10k–100k
- Ignora impostos; assume que o volume de publicação nunca cai
