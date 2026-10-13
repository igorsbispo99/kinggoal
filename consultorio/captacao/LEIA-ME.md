# Página de captação

Formulário de 5 passos que termina abrindo o WhatsApp com a triagem já
escrita. Não salva nenhum dado (nada de banco, nada de LGPD extra): as
respostas só existem na mensagem que a própria pessoa envia.

## Colocar no ar

1. Abra `index.html` e preencha o bloco `CONFIG` no fim do arquivo: nome, CRP,
   WhatsApp (só dígitos, com 55 e DDD), link da agenda e, se quiser, a foto
   (coloque `foto.jpg` nesta pasta e escreva `foto: "foto.jpg"`).
2. Publique grátis: em netlify.com/drop basta arrastar esta pasta; ou use
   Cloudflare Pages / GitHub Pages.
3. Coloque o link na bio do Instagram.

## Saber de onde veio cada contato

Acrescente `?origem=` ao link em cada lugar onde ele aparece. A origem chega
no fim da mensagem do WhatsApp:

- Bio: `.../?origem=bio`
- Story: `.../?origem=story`
- Anúncio: `.../?origem=anuncio`

Anote a origem na etiqueta/planilha do funil (ver `../atendimento.md`).
