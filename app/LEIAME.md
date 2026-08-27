# Rota Viva — v0.1

Navegação para autopropelidos e bikes elétricas, feita para o uso real em São Paulo.
Roda no navegador do celular, sem app store, sem backend, sem servidor para manter.

## Colocar no ar (uma vez, ~5 minutos)

1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. A action `Publicar Rota Viva` roda sozinha a cada push em `app/`.
   Se quiser rodar agora: aba **Actions → Publicar Rota Viva → Run workflow**.
3. O endereço fica `https://<seu-usuario>.github.io/kinggoal/`.
   Abra no celular e use **Adicionar à tela de início** — vira app em tela cheia.

> A página é pública (é o padrão do Pages), mas não guarda nada seu: chave, trajetos e
> reportes ficam apenas no seu celular, no armazenamento do navegador.

## Antes do primeiro rolê

1. **Config → chave do OpenRouteService.** Crie grátis em `openrouteservice.org`
   (Sign up → Dashboard → Request a token, plano gratuito). São 2.000 rotas/dia.
   Sem a chave o app funciona, mas não traça rota.
2. **Config → como você conduz.** Sentado = vias até 50 km/h; em pé = até 40 km/h
   (Portaria SMT/SEMTRA nº 023, em vigor desde 28/08/2026). Isso muda o que o mapa
   pinta de vermelho.
3. **Camadas → Baixar mapa desta região**, ainda no wi-fi. Puxa ciclovias e vias
   proibidas num raio de 5 km e guarda no celular.
4. Deixe a gravação ligada. É o que transforma o seu uso em dado.

## O que ele faz

- Mapa com **rede cicloviária em verde** e **vias onde você não pode andar em vermelho tracejado**
  (rodovia, via expressa e qualquer via com limite acima do seu).
- Rota pelo perfil `cycling-electric`, com **auditoria**: quantos trechos caem em via proibida,
  quanto do trajeto é ciclovia, se tem escada e se tem ladeira forte.
- Navegação com instrução na tela, **voz em português** e aviso quando você sai da rota.
- **Modo guidão**: o mapa gira com você e a tela não apaga.
- Gravação do trajeto e **botões de reporte** (buraco, ciclofaixa acabou, obra, perigo,
  não deu pra passar, trecho ótimo). Exporta GPX e GeoJSON.
- Todo desvio da rota sugerida é registrado automaticamente — é o sinal que melhora o
  roteador depois.

## Limites conhecidos desta versão

- A checagem de via proibida usa o que o OpenStreetMap tem de `maxspeed` e classe de via.
  Onde o OSM não tem a informação, o trecho não é pintado. **A sinalização da rua vale mais
  que o app.**
- A rota vem do OpenRouteService, que ainda não conhece a regra dos 40/50 km/h — por isso a
  auditoria existe: ela confere depois de pronta e avisa. Corrigir isso na origem é a
  próxima etapa (motor de rotas próprio).
- Sem tiles offline pré-baixados: o mapa guarda só o que você já viu.

## Rodar localmente

    npx serve app      # ou: python3 -m http.server 8899 --directory app

Geolocalização exige HTTPS ou localhost.
