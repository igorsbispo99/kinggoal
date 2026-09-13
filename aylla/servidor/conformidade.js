// Conformidade: o alerta que pode salvar o capital inteiro dela de uma vez.
//
// Os outros números deste sistema erram para menos — uma margem otimista
// custa lucro. Este erra para tudo: mercadoria retida na alfândega é o
// dinheiro parado, a multa e o produto que nunca chega. Para quem está
// começando com capital contado, é o erro que encerra o negócio.
//
// E a ironia que motivou o arquivo: "fone bluetooth" e "smartwatch"
// estavam entre as tendências que este próprio aplicativo sugeriu. Os dois
// exigem homologação da Anatel. O app estava mandando ela para lá sem
// dizer nada.
//
// O que isto é: um indicador que manda conferir. O que não é: parecer
// jurídico. A tela diz isso, e cada alerta aponta onde confirmar.
//
// Fontes das regras, conferidas em 12-13/09/2026:
//   Anatel  — Ato nº 18.086/2025: a partir de 25/05/2026 a homologação
//             passa a ser cruzada com a declaração de importação em tempo
//             real. Homologação já era obrigatória; o que muda é a
//             fiscalização automática.
//   Anvisa  — cosmético importado para revenda exige AFE, responsável
//             técnico com CRF e notificação/registro. Courier e importação
//             simplificada não sustentam revenda nesse segmento.
//   Inmetro — Portaria 302/2021 para brinquedos; certificação compulsória
//             também para EPI, capacete, material elétrico e eletrodoméstico.
//             Carregador de celular com fio NÃO é Inmetro — é Anatel.

const semAcento = (t) => String(t || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * As regras.
 *
 * `gravidade`:
 *   bloqueia — para quem está começando, é caminho fechado. Não é "difícil":
 *              é exigência que não se cumpre com MEI e importação simplificada.
 *   exige ... dá para fazer, mas tem etapa obrigatória antes de comprar.
 *   atencao .. não impede, muda o custo ou o risco.
 */
export const REGRAS = [
  {
    id: 'anatel',
    orgao: 'Anatel',
    gravidade: 'exige',
    termos: [
      'bluetooth', 'wi-fi', 'wifi', 'wireless', 'sem fio', 'smartwatch', 'smart watch',
      'fone de ouvido', 'fone ouvido', 'headset', 'airpod', 'tws', 'caixa de som',
      'roteador', 'repetidor', 'drone', 'rastreador', 'gps', 'celular', 'smartphone',
      'tablet', 'carregador por inducao', 'carregador inducao', 'carregador sem fio',
      'teclado sem fio', 'mouse sem fio', 'controle remoto', 'radio', 'telefone',
    ],
    categorias: ['celulares', 'telefones', 'audio', 'eletronicos', 'informatica', 'smartwatch'],
    porque: 'Produto que transmite sinal de rádio só pode ser importado e vendido com homologação da Anatel.',
    oQueFazer: 'Peça ao fornecedor o número de homologação Anatel do modelo exato, ou escolha outro produto. '
      + 'Desde 25/05/2026 a Anatel cruza a declaração de importação com a base de homologados automaticamente.',
    onde: 'https://sistemas.anatel.gov.br/sch/Consulta/ConsultaProduto',
  },
  {
    id: 'anvisa-cosmetico',
    orgao: 'Anvisa',
    gravidade: 'bloqueia',
    termos: [
      'perfume', 'cosmetico', 'maquiagem', 'batom', 'base facial', 'rimel', 'mascara de cilios',
      'creme facial', 'hidratante', 'shampoo', 'condicionador', 'esmalte', 'protetor solar',
      'serum', 'acido hialuronico', 'sabonete', 'desodorante', 'tintura de cabelo',
    ],
    categorias: ['beleza', 'cuidado pessoal', 'perfumes', 'maquiagem', 'cabelo'],
    porque: 'Cosmético importado para revenda exige Autorização de Funcionamento da Anvisa, responsável técnico '
      + 'com CRF e notificação do produto — antes de qualquer venda.',
    oQueFazer: 'Este caminho não se abre com MEI e importação simplificada. Para começar, escolha outra categoria.',
    onde: 'https://www.gov.br/anvisa',
  },
  {
    id: 'anvisa-ingerivel',
    orgao: 'Anvisa',
    gravidade: 'bloqueia',
    termos: [
      'suplemento', 'vitamina', 'whey', 'creatina', 'colageno', 'emagrecedor',
      'cha emagrecedor', 'alimento', 'tempero', 'chupeta', 'mamadeira',
      'copo infantil', 'pote de papinha', 'canudo infantil',
    ],
    categorias: ['alimentos', 'bebidas', 'suplementos', 'saude'],
    porque: 'Produto ingerido — ou que encosta na boca de criança — é regulado pela Anvisa e exige registro '
      + 'e responsável técnico para revenda.',
    oQueFazer: 'Não dá para começar por aqui com MEI. Escolha outra categoria.',
    onde: 'https://www.gov.br/anvisa',
  },
  {
    id: 'inmetro-infantil',
    orgao: 'Inmetro',
    gravidade: 'exige',
    termos: [
      'brinquedo', 'boneca', 'carrinho de brinquedo', 'quebra-cabeca', 'lego', 'blocos de montar',
      'pelucia', 'cadeirinha', 'bebe conforto', 'carrinho de bebe', 'berco', 'andador',
    ],
    categorias: ['brinquedos', 'bebes'],
    porque: 'Brinquedo e produto infantil têm certificação Inmetro compulsória (Portaria 302/2021): '
      + 'segurança química, mecânica, elétrica e contra fogo.',
    oQueFazer: 'Exija do fornecedor o certificado Inmetro do modelo. Sem selo, a mercadoria é apreendida '
      + 'e a venda é infração.',
    onde: 'https://www.gov.br/inmetro',
  },
  {
    id: 'inmetro-eletrico',
    orgao: 'Inmetro',
    gravidade: 'exige',
    termos: [
      'tomada', 'extensao eletrica', 'filtro de linha', 'plugue', 'benjamim', 'adaptador de tomada',
      'cabo de energia', 'fonte de alimentacao', 'lampada', 'chuveiro eletrico',
      'secador de cabelo', 'chapinha', 'air fryer', 'fritadeira eletrica', 'liquidificador',
      'capacete', 'oculos de protecao', 'luva de seguranca', 'bota de seguranca',
    ],
    categorias: ['eletrodomesticos', 'construcao', 'ferramentas', 'capacetes'],
    porque: 'Material elétrico, eletrodoméstico, EPI e capacete têm certificação Inmetro compulsória.',
    oQueFazer: 'Exija o certificado Inmetro do modelo antes de fechar a compra. '
      + 'Carregador de celular com fio é exceção: esse é Anatel, não Inmetro.',
    onde: 'https://www.gov.br/inmetro',
  },
  {
    id: 'bateria',
    orgao: 'Transporte',
    gravidade: 'atencao',
    termos: [
      'bateria', 'power bank', 'powerbank', 'carregador portatil', 'patinete eletrico',
      'bicicleta eletrica', 'lanterna recarregavel', 'li-ion', 'litio',
    ],
    categorias: [],
    porque: 'Bateria de lítio tem restrição de transporte aéreo. Muitos couriers recusam, e o frete '
      + 'costuma ser mais caro que o previsto.',
    oQueFazer: 'Confirme com o fornecedor se ele envia por courier para o Brasil antes de pagar, '
      + 'e peça o frete fechado — não o estimado.',
    onde: null,
  },
  {
    id: 'marca',
    orgao: 'Marca registrada',
    gravidade: 'atencao',
    termos: [
      'apple', 'iphone', 'samsung', 'xiaomi', 'nike', 'adidas', 'disney', 'lego',
      'sony', 'jbl', 'marvel', 'hello kitty', 'stanley',
    ],
    categorias: [],
    porque: 'Produto de marca registrada comprado de fornecedor não autorizado costuma ser falsificado. '
      + 'A apreensão é na alfândega e a responsabilidade é de quem importou.',
    oQueFazer: 'Prefira produto genérico ou de marca própria. Se for original, exija nota e autorização do fabricante.',
    onde: null,
  },
]

/**
 * Avalia um produto e devolve o que precisa ser conferido antes de comprar.
 *
 * Casa contra o nome E contra o caminho da categoria, porque nenhum dos
 * dois sozinho basta: "TWS" não diz que é fone para quem lê a palavra, e
 * "Eletrônicos" não diz que aquele item específico transmite rádio.
 */
export function avaliarConformidade({ nome = '', categoria = '', caminho = [] } = {}) {
  const texto = semAcento([nome, categoria, ...(caminho || [])].join(' '))
  const alertas = []

  for (const regra of REGRAS) {
    const porTermo = regra.termos.find((t) => texto.includes(semAcento(t)))
    const porCategoria = (regra.categorias || []).find((c) => texto.includes(semAcento(c)))
    if (!porTermo && !porCategoria) continue

    alertas.push({
      id: regra.id,
      orgao: regra.orgao,
      gravidade: regra.gravidade,
      porque: regra.porque,
      oQueFazer: regra.oQueFazer,
      onde: regra.onde,
      // O que disparou: sem isso ela não tem como julgar se o alerta faz
      // sentido para o produto dela, e alerta que não se pode julgar vira
      // alerta que se ignora.
      disparadoPor: porTermo || porCategoria,
    })
  }

  const ordem = { bloqueia: 0, exige: 1, atencao: 2 }
  alertas.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade])

  return {
    alertas,
    bloqueia: alertas.some((a) => a.gravidade === 'bloqueia'),
    exige: alertas.some((a) => a.gravidade === 'exige'),
    // Silêncio aqui não é atestado. As regras cobrem o que é comum em
    // revenda importada, não a legislação inteira.
    conferido: true,
  }
}
