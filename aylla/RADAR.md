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

Conferido na prática em 12/09/2026. O portal mudou e vários caminhos que a
documentação indica não existem mais.

### Chegar no formulário certo

1. Faça login em `mercadolivre.com.br` com a conta de vendedora **antes**.
2. Na mesma aba, vá para `developers.mercadolivre.com.br/devcenter/create-app`.

Sem a sessão do Mercado Livre ativa, `/devcenter` redireciona para o Mercado
Pago, e o assistente de lá só oferece integrações de pagamento — Checkout,
Bricks, Point. Nenhuma delas serve, e não há opção de Mercado Livre naquele
fluxo. Se você caiu em "Escolha o tipo de pagamento que quer integrar",
está no formulário errado.

### Informações básicas

| Campo | Valor |
|---|---|
| Nome | `Aylla Imports` |
| Nome curto | `aylla-imports` (único no Mercado Livre inteiro) |
| Descrição | a frase que ela vê na tela de autorização |
| Propósito | Negócios |
| Usuários | a menor faixa |
| Logotipo | **obrigatório** — use `public/icone-512.png` |

### Configuração e scopes

| O quê | Como |
|---|---|
| URI de redirect | `https://<worker>/api/ml/callback`, e clique em **Adicionar** |
| Fluxos OAuth | **os três marcados**, inclusive **Refresh Token** |
| PKCE | **desmarcado** |
| Negócios | **Mercado Livre** marcado, VIS não |

Três detalhes que custam tempo:

**O `Refresh Token` vem desmarcado.** É o equivalente do `offline_access`:
sem ele o Mercado Livre autoriza, devolve um token de seis horas e o radar
morre no dia seguinte sem erro que aponte a causa. O código recusa essa
conexão de propósito, com a explicação na tela.

**O PKCE tem que ficar desmarcado.** Nosso fluxo roda no servidor com o
segredo protegido e não envia `code_challenge`. Marcar PKCE quebra toda
autorização.

**Clicar em "Adicionar URI de redirect" cria uma linha vazia** que passa a ser
obrigatória e trava o formulário. Preencha só o primeiro campo.

### Permissões: peça o mínimo

O formulário exige **pelo menos uma permissão com acesso** — não aceita tudo
em "Sem acesso". Sendo obrigatório escolher uma, escolha **Métricas do
negócio → Leitura**: são dados da própria conta dela (vendas, estoque,
reputação), e é a permissão que a importação automática de vendas vai usar
quando existir.

| Permissão | Valor |
|---|---|
| Usuários | fixo em Leitura e escrita, não editável |
| Métricas do negócio | **Leitura** — a obrigatória |
| Todas as outras | **Sem acesso** |

A que mais importa manter fechada é **Publicação e sincronização**: ela
permite *"pausar e excluir uma ou todas as publicações da loja"*. Um app que
só lê o mercado não tem motivo para poder apagar os anúncios dela.

Em **Tópicos**, não marque nada. São notificações que o Mercado Livre
empurraria para um endereço nosso a cada evento; o radar só pergunta quando
ela pede.

### Descoberta

O fluxo **Client Credentials** existe no formulário, ao contrário do que a
documentação pública sugere. Se o diagnóstico confirmar que ele funciona para
busca, dá para consultar o mercado sem depender da autorização dela — e a
conexão fica mais simples. Deixe marcado.

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

**Salvar o segredo não basta.** Este Worker usa versionamento: alterar uma
variável cria uma versão nova, e a versão em execução continua sendo a
anterior — sem os segredos — até que a nova seja publicada. Se o painel não
oferecer um botão de implantar ali mesmo, qualquer commit novo resolve,
porque o build seguinte nasce já com eles.

O sintoma é enganoso: o painel mostra os dois segredos no lugar certo, com
os nomes certos, e mesmo assim `/api/ml/estado` responde
`"variaveisVisiveis": []`. Não é nome errado nem Worker errado — é versão
velha rodando.

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
