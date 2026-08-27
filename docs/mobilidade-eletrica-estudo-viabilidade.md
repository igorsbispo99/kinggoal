# Rota Viva — estudo de viabilidade

App de rotas para autopropelidos (patinete/scooter elétrica), bikes elétricas e afins, com
foco inicial em São Paulo. Documento de decisão — agosto/2026.

Versão navegável (artifact): https://claude.ai/code/artifact/e937aca9-a6ea-4849-b6d1-c0fe08bde7a3

## Veredito

| Dimensão | Avaliação |
| --- | --- |
| Viabilidade técnica | **Alta** — motor de rotas, malha viária e dados de SP são livres/públicos |
| Custo do MVP pessoal | **~R$ 60/mês**; ano 1 até alfa fechado: R$ 3–8 mil |
| "Waze das elétricas" como negócio | **Difícil** — o modelo do Waze exige escala de milhões; receita real está em dados agregados e seguro |

## 1. Regra central: 40 km/h, não 50

Resolução CONTRAN nº 996/2023 (autopropelido: até 1.000 W, 32 km/h, 1,30 m; sem CNH e sem emplacamento;
campainha, sinalização noturna e indicador de velocidade obrigatórios).

| Espaço viário | Regra | Motor de rotas |
| --- | --- | --- |
| Ciclovia / ciclofaixa / ciclorrota | Preferencial, até 20 km/h | Custo mínimo |
| Via urbana com limite ≤ 40 km/h | Permitido na ausência de estrutura cicloviária | Custo médio |
| Via urbana com limite > 40 km/h | Proibido | Removida do grafo |
| Rodovia / via de trânsito rápido | Proibido | Removida do grafo, inclusive alças |
| Calçada / passeio | Só com autorização local, 6 km/h | Nunca roteada; só como "empurre aqui" |

Verificar a portaria municipal de São Paulo — pode restringir mais que a norma federal.

## 2. Concorrência

- **Google Maps (bike)**: bom e grátis, mas assume bicicleta comum; não trata limite de velocidade da via como restrição legal.
- **Waze**: otimiza para veículo motorizado; sugere corredor, marginal, viaduto expresso.
- **Strava / Komoot**: esporte e cicloturismo, não deslocamento urbano.
- **Bikemap / CicloMapa**: mapa colaborativo, sem navegação com regra legal.

Diferencial defensável: filtro legal do autopropelido + qualidade do piso + ladeira como consumo de bateria.

## 3. Prioridade de dores (ajuste na ideia original)

Recarga em trajeto é feature fraca no início: autonomia de 30–60 km, deslocamento urbano de 5–15 km,
carga em casa, e quase não existe infraestrutura pública para autopropelido em SP.

1. Por onde posso legalmente andar — MVP
2. Onde corro risco de assalto — MVP
3. Qualidade do piso (buraco, paralelepípedo, grelha) — fase 2
4. Ladeira / consumo de bateria — fase 1 (altimetria é gratuita)
5. Onde parar e prender — fase 2
6. Chuva e alagamento — fase 3
7. Recarga em trajeto — fase 3

## 4. Arquitetura

- **Dados**: OpenStreetMap (extrato RMSP) · GeoSampa / Dados Abertos SP (rede cicloviária, WFS) ·
  Copernicus DEM (altimetria) · velocidade regulamentada (CET + `maxspeed` do OSM).
- **Motor**: Valhalla self-hosted com costing customizado ("perfil autopropelido") + map-matching de traços.
- **App**: MapLibre + PMTiles (mapa próprio, sem custo por visualização) · Expo/React Native · Postgres + PostGIS.
- **Realimentação**: divergência entre rota sugerida e trajeto real = sinal mais valioso; reportes estilo Waze;
  correções devolvidas ao OSM.

Duas decisões-chave: (a) hospedar o próprio motor — API paga por requisição inviabiliza navegação em escala;
(b) gravar trajetos desde o dia um.

Lacuna conhecida: cobertura parcial de `maxspeed` no OSM em SP → estimar por classe de via e corrigir com traços.

## 5. Fases

- **Fase 0** (1–2 fins de semana): Valhalla + perfil autopropelido, sem app. Teste: 20 trajetos conhecidos.
- **Fase 1** (4–8 semanas): app só para uso próprio, navegação por voz, gravação de trajeto, 4 tipos de reporte. **Começar como PWA.**
- **Fase 2** (3–4 meses): alfa fechado 30–100 pessoas; validação de reportes por convergência; piso e ladeira no cálculo; publicar nas lojas.
- **Fase 3**: abertura + receita; segunda cidade só depois de SP saudável.

## 6. Custos

Manutenção mensal:

| Item | Fase 1 | Fase 2 | Fase 3 (10k ativos) |
| --- | ---: | ---: | ---: |
| Servidor do roteador | R$ 50 | R$ 190 | R$ 900 |
| Postgres + PostGIS | R$ 0 | R$ 140 | R$ 600 |
| Mapa (PMTiles) | R$ 0 | R$ 10 | R$ 120 |
| API / backend | R$ 0 | R$ 60 | R$ 500 |
| Monitoramento / push | R$ 0 | R$ 0 | R$ 250 |
| Domínio | R$ 5 | R$ 5 | R$ 20 |
| **Total** | **R$ 55** | **R$ 405** | **R$ 2.390** |

Construção: você com IA ≈ 60–120 h até a fase 1 · dev PJ R$ 45–80 mil · agência R$ 150–300 mil.

Fixos: Apple R$ 550/ano · Play R$ 140 · MEI/contabilidade R$ 80–600/mês · INPI ~R$ 400 · jurídico LGPD R$ 1,5–4 mil.

## 7. Modelo de negócio

O Waze praticamente não monetizou — foi vendido por usuários e dados. Com 10k ativos e 3% a R$ 14,90:
~R$ 4,5 mil/mês (cobre infra, não salário). Receita deve vir de quem tem orçamento:

- **A. Dados agregados** para CET, subprefeituras, seguradoras e fabricantes (modelo Strava Metro). Maior potencial; exige anonimização desde a arquitetura (LGPD).
- **B. Seguro / rastreamento por afiliação** — roubo é a dor nº 1; comissão 15–25% da apólice. Receita mais rápida.
- **C. Entregadores de app** como usuário-âncora — volume e frequência altos, R$ 9,90–19,90.
- **D. Assinatura consumer** — só depois de retenção comprovada.
- **E. Marca branca** para fabricantes/lojas.
- **F. Publicidade** — só com centenas de milhares de usuários.

## 8. Riscos principais

Retenção (rota repetida mata o uso diário) · responsabilidade por rota insegura · dado de velocidade
regulamentada incompleto · ovo-e-galinha da contribuição · LGPD em dados de localização · Google adicionar
modo micromobilidade · consumo de bateria do celular.

## 9. Próximos 30 dias (< R$ 200)

- [ ] Gravar todos os trajetos em GPX a partir de hoje (conjunto de validação)
- [ ] Marcar todo ponto onde houve dúvida "por aqui pode?"
- [ ] Subir Valhalla com extrato da Grande SP + perfil autopropelido
- [ ] Comparar 20 rotas geradas vs. reais — meta de 70% de aprovação
- [ ] Ler a norma municipal de SP sobre autopropelidos
- [ ] Conversar com 5 entregadores de bike elétrica
