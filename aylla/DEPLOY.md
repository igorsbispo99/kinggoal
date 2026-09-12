# Publicar o Aylla Imports

Objetivo: um endereço fixo que a Aylla abre no celular e instala na tela
inicial. Custo: zero. Tudo pelo navegador — não precisa de computador.

## Por que Cloudflare

O plano gratuito da Cloudflare **autoriza uso comercial** e não expira. O plano
gratuito da Vercel, que seria o caminho mais popular, proíbe uso comercial nos
próprios termos — e isto aqui é o negócio de alguém, não um projeto de estudo.

## Antes de começar: quem é dono do quê

A conta da Cloudflare está no e-mail da Aylla. O repositório está no GitHub do
Igor. São contas diferentes, de pessoas diferentes, e isso importa no caminho A.

## Caminho A — conectar ao GitHub (recomendado)

Depois de configurado, **todo commit republica sozinho**. É o que faz as fases
seguintes chegarem no celular dela sem ninguém mexer em nada.

1. **Página inicial da conta → Ship something new** (ou **Computação → Workers e
   Pages → Criar**) e escolha importar um repositório Git.
2. Selecione `kinggoal`. Se ele não aparecer, há um link na tela para configurar
   quais repositórios a Cloudflare enxerga — libere o `kinggoal` e volte.
3. Dê ao projeto o nome **`aylla-imports`**, não `kinggoal`: é o nome que vira o
   endereço.
4. O fluxo novo da Cloudflare não pergunta o diretório raiz na criação. Depois
   que o projeto existir, vá em **Configurações → Build** e ajuste:

   | Campo | Valor |
   |---|---|
   | Diretório raiz | `aylla` |
   | Comando de build | `npm install && npm run build` |
   | Branch de produção | `claude/import-resale-marketplace-system-le13if` |

   O diretório raiz é o campo decisivo. Sem ele a Cloudflare compila o KingGoal,
   que é outro projeto que mora no mesmo repositório.

5. **Repetir implantação**. O log deve terminar em verde, e sai um endereço
   terminado em `.workers.dev`.

### Não crie um `_redirects` aqui

O Workers recusa a regra `/*  /index.html  200` com *"infinite loop detected"*,
porque `/index.html` casa com `/*` e a regra se chamaria de novo. Quem cuida
disso é o `not_found_handling` do `wrangler.jsonc`, de forma nativa. O arquivo
existia por engano, sobra do plano de usar Pages, e foi removido.

### O que o `wrangler.jsonc` resolve

Este diretório tem um `wrangler.jsonc` declarando que o projeto é um Worker só
de arquivos estáticos, servindo `dist`. Sem ele, o Workers Builds tenta adivinhar
o projeto, escolhe o caminho do plugin oficial de Vite e falha com
*"cannot be automatically configured, please update Vite to at least 6"*.

O Vite aqui foi atualizado para a versão 6 pelo mesmo motivo, e o
`.node-version` fixa o Node 22 — sem ele, a suíte de testes que roda antes do
build pode quebrar numa versão antiga do ambiente.

## Caminho B — subir o pacote pronto

Serve de ponte para ver no ar hoje, se o caminho A travar. Arraste o
`aylla-imports-site.zip` para a área **"Drop a folder, or a zip"** e publique.

Funciona igual para quem usa, mas **não atualiza sozinho**: a cada fase alguém
teria que subir um zip novo. Migre para o caminho A quando der.

### Se o upload ficar com as rodinhas girando sem parar

Elas não param nesse fluxo — é indicador por arquivo, não barra de progresso.
Role a caixa, preencha o nome e clique em **Deploy** mesmo assim.

## Uma conta do GitHub não conecta em duas contas Cloudflare

A integração é 1:1 na prática. Se o repositório é da conta do Igor, a
hospedagem tem que ficar na conta Cloudflare dele. Isso não muda nada para a
Aylla: ela só abre um endereço, não precisa de conta nenhuma.

A conta Cloudflare dela serve melhor para registrar o domínio em nome dela e,
na F5, hospedar o banco de dados do negócio.

## Instalar no celular dela

Abra o endereço no Chrome (Android) ou Safari (iPhone):

- **Android**: aparece o convite "Instalar" dentro do próprio app. Se não
  aparecer, use o menu ⋮ → *Adicionar à tela inicial*.
- **iPhone**: botão de compartilhar → *Adicionar à Tela de Início*.

Depois disso abre em tela cheia, com ícone próprio, e funciona sem sinal.

## Primeira coisa a conferir depois de publicar

Vá em **Ajustes → Buscar cotação do dia**. Essa chamada ao Banco Central nunca
foi testada fora do ambiente de desenvolvimento. Se der erro, me avise: resolve-se
com uma função no Cloudflare, continua de graça, e enquanto isso o valor digitado
à mão segue valendo.

## Domínio próprio (opcional)

Registre `ayllaimports.com.br` no `registro.br` (cerca de R$ 40 por ano) e
aponte em **Custom domains**. Vale pelo endereço curto e por não depender de um
subdomínio de terceiro se um dia trocarmos de hospedagem.

## Onde os dados ficam

Neste momento, apenas no aparelho onde ela usa — não há servidor, não há conta,
não há mensalidade. Isso significa que **o backup é responsabilidade dela**:
Ajustes → Baixar backup, de vez em quando.

A sincronização entre os dois celulares entra na F5, com Cloudflare D1 (também
gratuito). O código já está preparado: toda a persistência passa por
`src/lib/armazenamento.js`, com migrações de versão já cobertas por teste.
