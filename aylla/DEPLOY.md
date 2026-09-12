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

Vale o trabalho porque, depois de configurado, **todo commit republica sozinho**.
É o que faz as fases seguintes chegarem no celular dela sem ninguém mexer em nada.

1. No painel, clique em **Create app** (cartão "Ship something new").
   No menu lateral o mesmo lugar fica em **Compute → Workers & Pages → Create**.
2. Escolha a aba **Pages** e depois **Connect to Git** / *Import a repository*.
3. A Cloudflare vai pedir para instalar o app dela no GitHub. **Quem precisa
   autorizar aqui é o Igor**, porque o repositório é da conta dele: faça o login
   do GitHub como `igorsbispo99` nessa etapa e libere o repositório `kinggoal`
   (pode liberar só ele, não precisa dar acesso a todos).
4. Escolha o repositório `kinggoal` e preencha:

   | Campo | Valor |
   |---|---|
   | Production branch | `claude/import-resale-marketplace-system-le13if` |
   | Framework preset | `None` |
   | Build command | `npm install && npm run build` |
   | Build output directory | `dist` |
   | Root directory | `aylla` |

5. **Save and Deploy**. Em cerca de um minuto sai um endereço terminado em
   `.pages.dev`.

O arquivo `.node-version` deste diretório fixa o Node 22 na Cloudflare. Sem ele,
a suíte de testes que roda antes do build pode falhar numa versão antiga.

## Caminho B — subir o pacote pronto (60 segundos)

Se a autorização do GitHub travar, ou se a ideia for só ver no ar hoje:

1. Baixe o `aylla-imports-site.zip` que eu mando na conversa.
2. No painel, arraste o arquivo para a área **"Drop a folder, or a zip"**.
3. Dê o nome `aylla-imports` e publique.

Funciona igual para quem usa. A diferença é que **não atualiza sozinho**: a cada
fase nova eu teria que mandar um zip e alguém teria que subir de novo. Serve de
ponte, não de destino — vale migrar para o caminho A quando der.

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
