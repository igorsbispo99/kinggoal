# Publicar o Aylla Imports

Objetivo: um endereço fixo que a Aylla abre no celular e instala na tela
inicial. Custo: zero. Tempo: uns cinco minutos, todos feitos pelo navegador —
não precisa de computador.

## Por que Cloudflare Pages

O plano gratuito da Cloudflare **autoriza uso comercial** e não expira. O plano
gratuito da Vercel, que seria o caminho mais popular, proíbe uso comercial nos
próprios termos — e isto aqui é o negócio de alguém, não um projeto de estudo.

## Passo a passo

1. Crie uma conta em `dash.cloudflare.com` (grátis, sem cartão).
2. No menu lateral: **Workers & Pages** → **Create** → aba **Pages** →
   **Connect to Git**.
3. Autorize o GitHub e escolha o repositório `kinggoal`.
4. Na tela de configuração do build, preencha exatamente:

   | Campo | Valor |
   |---|---|
   | Production branch | `claude/import-resale-marketplace-system-le13if` |
   | Framework preset | `None` |
   | Build command | `npm install && npm run build` |
   | Build output directory | `dist` |
   | Root directory | `aylla` |

5. **Save and Deploy**. Em cerca de um minuto sai um endereço parecido com
   `aylla-imports.pages.dev`.

A partir daí, todo commit nessa branch republica sozinho. Não há nada para
rodar na mão, nunca mais.

## Instalar no celular dela

Abra o endereço no Chrome (Android) ou Safari (iPhone):

- **Android**: aparece o convite "Instalar" dentro do próprio app. Se não
  aparecer, use o menu ⋮ → *Adicionar à tela inicial*.
- **iPhone**: botão de compartilhar → *Adicionar à Tela de Início*.

Depois disso abre em tela cheia, com ícone próprio, e funciona sem sinal.

## Domínio próprio (opcional)

Registre `ayllaimports.com.br` no `registro.br` (cerca de R$ 40 por ano) e
aponte para o projeto em **Custom domains**, dentro do Pages. Vale pelo endereço
curto e por não depender de um subdomínio de terceiro se um dia trocarmos de
hospedagem.

## Onde os dados ficam

Neste momento, apenas no aparelho onde ela usa — não há servidor, não há conta,
não há mensalidade. Isso significa que **o backup é responsabilidade dela**:
Ajustes → Baixar backup, de vez em quando.

A sincronização entre os dois celulares entra na F5, com Cloudflare D1 (também
gratuito). O código já está preparado: toda a persistência passa por
`src/lib/armazenamento.js`.
