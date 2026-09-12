# Aylla Imports

Sistema de importação simplificada e revenda em marketplace. Calcula o custo
real de um lote importado — com imposto, ICMS por dentro, câmbio e IOF — e diz
quanto sobra vendendo no Mercado Livre, na Amazon ou na Shopee.

Feito para ser usado no celular. Instala na tela inicial, abre sem internet e
não depende de servidor nenhum: os dados ficam no próprio aparelho.

## Estado atual

**No ar em `aylla-imports.igorsilva1971.workers.dev`.** Fase 1 de 8, mais a base
de segurança dos dados. O que já funciona:

- Cálculo de importação com a regra vigente desde 12/05/2026 (MP 1.357/2026):
  isenção de Imposto de Importação até US$ 50, 60% com desconto de US$ 30
  acima disso, e ICMS estadual calculado por dentro.
- Cotação do dólar pelo Banco Central (PTAX), buscada pelo Worker em `/api/ptax`
  porque o Banco Central não autoriza chamadas vindas do navegador. Cai para a
  AwesomeAPI e depois para o valor manual — o sistema nunca trava por câmbio.
- Custo desembarcado por unidade e do lote inteiro, com memória de cálculo.
- Lucro, margem e retorno em cada marketplace, com comissão, taxa fixa por item
  e frete grátis obrigatório acima de R$ 79.
- Preço sugerido para a margem alvo e ponto de equilíbrio, calculados por
  bissecção — que é o que faz a conta acertar em cima dos degraus de taxa.
- Comparativo dos três canais ao mesmo preço.
- Limites do MEI: teto de faturamento e o teto menos conhecido, o de 80% em
  custo de mercadoria, que é o que aperta primeiro em operação de margem baixa.
- Fornecedores com pedido mínimo, prazo prometido e forma de pagamento.
- Produtos com os fornecedores comparados pelo **custo desembarcado**, não pelo
  preço de etiqueta — e um aviso quando a ordem se inverte entre os dois.
- Histórico de preço por fornecedor.
- Taxas de marketplace marcadas como referência até ela confirmar no painel
  de vendedor dela.
- Ranking de oportunidades com nota de 0 a 100, pesos ajustáveis e a
  explicação em uma frase de cada posição. Nota incompleta fica num grupo
  separado, abaixo das completas, mesmo quando o número é maior.
- Compras com o câmbio travado na data do pagamento, recebimento com avarias,
  vendas com o custo do estoque congelado no momento, estoque com custo médio
  ponderado, caixa, quanto dá para reinvestir, curva ABC, cobertura de estoque
  e o prazo real de cada fornecedor contra o prometido.
- Os medidores do MEI se alimentam sozinhos das compras e vendas do ano.
- Radar de mercado: lê o Mercado Livre e mede concorrência, faixa de preço,
  concentração de vendedores e **barreira de entrada** — o sinal que separa
  uma categoria acessível de uma parede. Configuração em `RADAR.md`.
- Backup e restauração em JSON, com cópia fiel do formato de origem.
- Migração de dados entre versões, com cópia de socorro antes de migrar.
- 104 testes automatizados sobre as regras de negócio.

## Roadmap

| Fase | Entrega | Situação |
|------|---------|----------|
| F0 | Aplicativo instalável, offline, tema claro e escuro | pronta |
| F1 | Calculadora de importação e revenda | pronta |
| F2 | Produtos e fornecedores | pronta |
| F3 | Ranking de oportunidades | pronta |
| F4 | Controle financeiro | pronta |
| F5 | Radar de mercado | parcial: radar pronto, sincronização a fazer |
| F6 | Camada de inteligência | a fazer |
| F7 | Acabamento: câmera, notificações, checklist fiscal | a fazer |

## Como rodar

```
npm install
npm run dev      # desenvolvimento
npm test         # 104 testes, sem dependência externa
npm run build    # roda os testes, gera os ícones e compila
npm run preview  # serve o que foi gerado
```

`npm run build` roda a suíte antes de compilar de propósito: numa ferramenta
cuja única função é acertar uma conta, publicar com o cálculo quebrado é pior
do que não publicar.

Não há dependência de imagem: `npm run icones` desenha os PNGs do aplicativo a
partir do mesmo traçado do logotipo, em Node puro.

## Estrutura

```
src/lib/          regras de negócio, sem React
  tributos.js       imposto de importação e ICMS por dentro
  marketplaces.js   comissões, taxa fixa e frete de cada canal
  precificacao.js   lucro, margem, preço alvo e ponto de equilíbrio
  mei.js            os dois tetos do MEI
  catalogo.js       fornecedores, produtos e a comparação de ofertas
  ranking.js        a nota de oportunidade e a frase que a explica
  financeiro.js     lotes, vendas, estoque, caixa e curva ABC
  cambio.js         PTAX do Banco Central, com plano B
  armazenamento.js  persistência local e backup
  configuracoes.js  ajustes da operação
servidor/         o Worker
  analise.js        leitura de mercado a partir de uma busca do Mercado Livre
  mercadolivre.js   token, busca, enriquecimento e o diagnóstico da API
src/telas/        Calculadora, Produtos, Fornecedores, Ajustes
src/componentes/  campos, avisos, medidores, ícones
test/             testes das regras de negócio, com node:test
```

As regras de negócio são funções puras e ficam fora do React de propósito: são
elas que precisam de teste, e são elas que vão continuar iguais quando a F5
trocar o armazenamento local por sincronização entre aparelhos.

## Sobre medido e estimado

O radar nunca mistura os dois. Anúncios, preços e composição do topo vêm
medidos da API. Vendas por mês é estimativa: o `sold_quantity` do Mercado
Livre é referencial por decisão dele, e é acumulado, não mensal — por isso é
cruzado com a data de publicação e mostrado com `~`. A tela diz qual é qual,
porque quem está começando não tem como saber a diferença sozinha.

## Sobre lucro e caixa

São coisas diferentes e o sistema nunca as mistura. Lucro é o que sobrou das
vendas; caixa é o dinheiro que existe. Dá para ter lucro no papel e não ter com
que comprar, porque ele está todo parado em mercadoria. Por isso o painel
responde "pode comprar hoje" — já com a reserva descontada — em vez de mostrar
o lucro como se fosse saldo.

## Sobre dado que falta

Em `ranking.js`, um componente sem dado vale `null`, nunca zero. Zero é um
juízo ("não vende nada"); ausência não é juízo nenhum. E tirar o ausente da
média também engana, só que para o outro lado: o produto passa a ser julgado
apenas pelos pontos fortes dele. Por isso a nota parcial existe, é marcada com
asterisco e nunca compete com uma nota completa.

## Sobre mudar o formato dos dados

Ao mudar a estrutura de qualquer coisa gravada, suba `VERSAO` em
`src/lib/armazenamento.js` e registre a migração correspondente em `MIGRACOES`.
Sem a migração registrada, o dado antigo é devolvido como está — nunca
descartado. Há teste cobrindo os quatro caminhos: com migração, sem migração,
com migração quebrada e com dado de uma versão futura.

## Sobre este diretório

O projeto vive dentro do repositório `kinggoal` porque a sessão que o criou não
tinha permissão para abrir repositório novo. Ele é autossuficiente: tem o
próprio `package.json` e não toca em nada do KingGoal. Para mudá-lo de casa,
basta copiar a pasta `aylla/` para a raiz de um repositório novo.

## Avisos

As alíquotas e comissões mudam. Todas ficam em tela de configuração, com data de
vigência registrada, e o sistema avisa quando a regra passa de um ano. Confira a
alíquota do seu estado na Sefaz antes de fechar uma compra grande.

Este sistema calcula. Ele não substitui contador.
