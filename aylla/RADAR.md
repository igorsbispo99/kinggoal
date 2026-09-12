# Ligar o radar de mercado

O radar lê o Mercado Livre e responde a pergunta que a Aylla ainda não sabe
fazer: não é *"isso vende?"*, é **"dá para eu entrar aqui?"**.

Sem ele o sistema funciona inteiro — os campos de pesquisa continuam existindo
para preencher à mão. Com ele, o que era uma tarde de contar anúncios vira
cinco segundos.

## Por que precisa de configuração

Três fatos que a pesquisa da API deixou claros:

1. **A busca exige token.** A documentação chama `/sites/MLB/search` de
   recurso público, mas ela pede `Authorization: Bearer`. E não há fluxo de
   aplicação sem usuário documentado — então a conta da Aylla autoriza o app
   uma vez, e o token é dela.
2. **O token dura seis horas** e o refresh é de uso único: cada renovação
   troca o refresh anterior. Isso obriga a guardar o token em algum lugar que
   sobreviva entre requisições — daí o banco.
3. **O segredo do aplicativo não pode ir para o navegador.** Por isso tudo
   acontece no Worker.

## Passo 1 — criar o aplicativo no Mercado Livre

Em `developers.mercadolivre.com.br`, com a conta da Aylla, crie uma aplicação:

| Campo | Valor |
|---|---|
| Nome | Aylla Imports |
| URI de redirect | `https://aylla-imports.igorsilva1971.workers.dev/api/ml/callback` |
| Escopos | leitura (`read`) |

Guarde o **App ID** e a **Secret Key**.

> A URI de redirect precisa bater **exatamente** com o endereço do Worker. Se
> um dia mudar o domínio, atualize aqui também, senão a autorização falha com
> `invalid_grant`.

## Passo 2 — criar o banco na Cloudflare

No painel: **Armazenamento e bancos → D1 → Criar**, com o nome `aylla`.

Copie o **Database ID** e me mande. Eu acrescento o binding no
`wrangler.jsonc` — ele fica comentado de propósito, porque um id inválido
derruba o deploy inteiro, e não vale a pena arriscar o app por uma função
opcional.

## Passo 3 — guardar as credenciais como segredo

No Worker `aylla-imports`: **Configurações → Variáveis e segredos → Adicionar**,
os dois como tipo **Secret** (criptografado), nunca como texto puro:

- `ML_CLIENT_ID` — o App ID
- `ML_CLIENT_SECRET` — a Secret Key

## Passo 4 — conectar e conferir

1. Abra o app, vá em **Ajustes → Radar de mercado → Conectar conta**.
2. Autorize com a conta da Aylla. Você volta para o app com um aviso verde.
3. Toque em **Diagnosticar a API** e me mande o resultado.

## Sobre a tela de diagnóstico

Ela existe porque a documentação do Mercado Livre não responde com segurança
o que a API libera hoje, e porque o ambiente onde este código foi escrito não
alcança `api.mercadolibre.com` para testar. Em vez de adivinhar, o sistema
pergunta à API e mostra a resposta, linha por linha:

- a busca funciona sem token, ou exige mesmo?
- os campos `sold_quantity`, `official_store_id` e `catalog_listing` vêm?
- o multiget devolve `date_created`, que é o que permite medir velocidade?
- `/trends` e `/highlights` ainda existem?

Cada linha vermelha ali é uma decisão de arquitetura que eu tomo depois,
com dado em vez de suposição.

## O que o radar mede, e o que ele só estima

Esta separação está na tela e é o ponto mais importante do módulo.

**Medido — pode confiar como número:**
número de anúncios ativos, preços praticados, quantos vendedores dominam o
topo, quantos são lojas oficiais, quantos disputam por catálogo, quantos já
oferecem frete grátis.

**Estimado — serve para comparar, não para prever:**
vendas por mês. O `sold_quantity` do Mercado Livre é **referencial**: ele
mesmo arredonda o número nos recursos públicos. E é **acumulado**, não mensal
— um anúncio de cinco anos com 600 vendas e um de dois meses com 600 vendas
não são a mesma coisa. Por isso o sistema cruza com a data de publicação e
calcula velocidade, marcando o resultado com `~`.

## O sinal que quase ninguém mede

Duas categorias com 400 anúncios podem ser opostas para quem está começando:

- 400 anúncios de 300 vendedores diferentes, sem marca dominando: **acessível**.
- 400 anúncios onde lojas oficiais ocupam o topo e a disputa é por catálogo
  (onde só o mais barato aparece): **parede**.

As duas "vendem muito". A barreira de entrada, de 0 a 100, é o que separa as
duas — e é ela que evita a compra que parecia ótima na planilha e encalha.

## Limitação conhecida

As rotas `/api/ml/*` são públicas: quem tiver o endereço do app pode consumir
a cota do Mercado Livre dela. O risco hoje é baixo — o endereço não é
divulgado e não há dado sensível em jogo. Quando a sincronização entrar e os
dados financeiros passarem a viver no servidor, isso se resolve de vez com o
Cloudflare Access, que é gratuito até 50 usuários.
