// O que dá errado com este produto, segundo quem comprou.
//
// Esta é a peça que faltava para a observação dela fazer sentido:
// "os comentários só passam a ser úteis se eu souber exatamente de qual
// bolsa estamos falando". Agora o app sabe — a ficha de catálogo é
// específica, com nome exato e foto — e então ler os comentários vira
// informação de verdade.
//
// A sonda mediu que /reviews/item/{id}?rating=1 responde: dá para pedir
// só as avaliações de uma estrela. São as mais úteis de todas. Quem dá
// cinco estrelas escreve "amei, chegou rápido"; quem dá uma escreve
// exatamente o que veio errado — e, num produto importado, o que veio
// errado para o comprador brasileiro é quase sempre o que o fornecedor
// chinês faz de errado.
//
// A lista de queixas vira a lista de perguntas que ela manda para o
// fornecedor ANTES de pagar. É a diferença entre importar no escuro e
// importar sabendo onde o produto costuma falhar.
//
// LIMITE, dito na cara: isto é contagem de palavra, não compreensão de
// texto. Acerta o assunto e erra a ironia, a negação e o sarcasmo —
// "não é frágil como diziam" conta como frágil. Por isso a tela mostra
// quantas avaliações foram lidas e sempre um trecho real do comentário:
// o número orienta, a frase da pessoa é que decide.

const semAcento = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()

/**
 * Os defeitos que aparecem em produto importado, e o que perguntar ao
 * fornecedor sobre cada um.
 *
 * `pistas` são trechos normalizados (sem acento, minúsculo). Preferi
 * frases a palavras soltas: "foto" sozinho pega qualquer elogio à foto,
 * "diferente da foto" pega a reclamação.
 */
export const TEMAS = [
  {
    id: 'tamanho',
    nome: 'Tamanho menor do que o esperado',
    pistas: ['menor do que', 'menor que', 'bem pequeno', 'muito pequeno', 'nao serviu', 'nao coube',
      'tamanho errado', 'minusculo', 'pequeno demais', 'medida errada'],
    oQueFazer: 'Peça as medidas em centímetros e uma foto do produto ao lado de uma régua. Tabela de tamanho asiática não é a brasileira.',
  },
  {
    id: 'material',
    nome: 'Material frágil ou acabamento ruim',
    pistas: ['muito fragil', 'material fragil', 'plastico fino', 'parece brinquedo', 'ma qualidade',
      'pessima qualidade', 'qualidade pessima', 'acabamento ruim', 'material barato', 'bem fraquinho',
      'frouxo', 'mal acabado'],
    oQueFazer: 'Peça amostra antes do lote e pergunte a espessura e a gramatura do material. Foto de catálogo não mostra acabamento.',
  },
  {
    id: 'quebrado',
    nome: 'Chegou quebrado ou amassado',
    pistas: ['chegou quebrado', 'veio quebrado', 'chegou amassado', 'veio amassado', 'chegou danificado',
      'veio danificado', 'rachado', 'trincado', 'avariado', 'quebrou na primeira'],
    oQueFazer: 'Problema de embalagem, e no seu caso a viagem é muito mais longa. Exija embalagem individual com proteção e peça foto do pacote fechado.',
  },
  {
    id: 'nao-funciona',
    nome: 'Não funciona ou parou de funcionar',
    pistas: ['nao funciona', 'nao funcionou', 'parou de funcionar', 'veio com defeito', 'com defeito',
      'nao liga', 'queimou', 'deu defeito', 'durou uma semana', 'durou dois dias'],
    oQueFazer: 'Peça a taxa de defeito do lote e negocie reposição por peça defeituosa. Sem isso o prejuízo é todo seu.',
  },
  {
    id: 'diferente',
    nome: 'Diferente da foto do anúncio',
    pistas: ['diferente da foto', 'diferente do anuncio', 'nada a ver com a foto', 'nao e o que',
      'propaganda enganosa', 'foto enganosa', 'cor diferente', 'nao corresponde'],
    oQueFazer: 'Peça foto real do produto que ele tem em estoque, não a do catálogo. Cor na foto do fornecedor quase nunca é a cor que chega.',
  },
  {
    id: 'entrega',
    nome: 'Não chegou ou demorou demais',
    pistas: ['nao chegou', 'nunca chegou', 'demorou muito', 'muito atraso', 'extraviado',
      'ate hoje nao', 'atrasou'],
    oQueFazer: 'Isto é do vendedor, não do produto — e é o que você pode ganhar deles. Estoque no Brasil entrega em dias; quem manda direto da China demora semanas.',
    doVendedor: true,
  },
  {
    id: 'bateria',
    nome: 'Bateria fraca ou não carrega',
    pistas: ['bateria fraca', 'bateria nao', 'nao carrega', 'descarrega rapido', 'dura pouco',
      'bateria ruim', 'bateria viciada'],
    oQueFazer: 'Peça a capacidade real em mAh e o certificado da célula. Bateria também tem regra de transporte aéreo — confira antes de fechar.',
  },
  {
    id: 'falsificado',
    nome: 'Suspeita de falsificação',
    pistas: ['falsificado', 'replica', 'nao e original', 'produto pirata', 'copia barata', 'imitacao'],
    oQueFazer: 'Sinal vermelho. Produto de marca sem autorização é apreendido na alfândega e dá processo. Procure similar sem marca.',
    grave: true,
  },
  {
    id: 'faltando',
    nome: 'Veio incompleto',
    pistas: ['veio sem', 'faltando', 'incompleto', 'faltou', 'sem o manual', 'sem acessorio'],
    oQueFazer: 'Feche por escrito o que compõe cada unidade, item por item, e peça foto do kit completo montado.',
  },
  {
    id: 'cheiro',
    nome: 'Cheiro forte de produto químico',
    pistas: ['cheiro forte', 'cheiro ruim', 'mau cheiro', 'fedor', 'cheiro de quimico', 'cheiro horrivel'],
    oQueFazer: 'Comum em plástico e couro sintético baratos. Pergunte o material exato e peça amostra — cheiro é motivo de devolução e nota baixa.',
  },
  {
    id: 'voltagem',
    nome: 'Voltagem ou tomada errada',
    pistas: ['110v', '220v', 'voltagem', 'tomada errada', 'plugue errado', 'padrao chines',
      'nao cabe na tomada', 'precisa de adaptador'],
    oQueFazer: 'Especifique bivolt e plugue padrão brasileiro por escrito. Adaptador avulso derruba a avaliação do anúncio.',
  },
  {
    id: 'manual',
    nome: 'Manual em outro idioma',
    pistas: ['manual em chines', 'em chines', 'manual em ingles', 'nao entendi o manual',
      'sem instrucoes em portugues'],
    oQueFazer: 'Peça o manual em português, ou escreva o seu. Custa pouco e é uma das poucas coisas que te diferencia de quem revende o mesmo produto.',
  },
]

/**
 * Lê um bolo de avaliações e devolve os assuntos que mais se repetem.
 *
 * Conta uma vez por avaliação por tema: alguém que escreve "pequeno,
 * muito pequeno, pequeno demais" reclamou de tamanho uma vez, não três.
 */
export function lerQueixas(avaliacoes, { quantos = 4 } = {}) {
  const lista = (Array.isArray(avaliacoes) ? avaliacoes : [])
    .map((a) => (typeof a === 'string' ? { texto: a } : a))
    .filter((a) => a && (a.texto || a.titulo))
    .map((a) => ({
      texto: String(a.texto || ''),
      titulo: String(a.titulo || ''),
      nota: Number.isFinite(Number(a.nota)) ? Number(a.nota) : null,
      normalizado: semAcento(`${a.titulo || ''} ${a.texto || ''}`),
    }))

  if (!lista.length) return { lidas: 0, queixas: [], semTexto: true }

  const queixas = TEMAS.map((tema) => {
    const casos = lista.filter((a) => tema.pistas.some((p) => a.normalizado.includes(p)))
    if (!casos.length) return null
    // O trecho mais curto que ainda diz alguma coisa: comentário de dez
    // linhas não cabe na tela e não ajuda a decidir.
    const exemplo = casos
      .map((c) => (c.texto || c.titulo).trim().replace(/\s+/g, ' '))
      .filter((t) => t.length >= 12)
      .sort((a, b) => a.length - b.length)[0] || null
    return {
      id: tema.id,
      nome: tema.nome,
      quantas: casos.length,
      fracao: casos.length / lista.length,
      oQueFazer: tema.oQueFazer,
      grave: Boolean(tema.grave),
      doVendedor: Boolean(tema.doVendedor),
      exemplo: exemplo && exemplo.length > 180 ? `${exemplo.slice(0, 177)}...` : exemplo,
    }
  }).filter(Boolean)

  // Grave primeiro (falsificação muda a decisão inteira), depois por
  // quantas pessoas reclamaram da mesma coisa.
  queixas.sort((a, b) => (Number(b.grave) - Number(a.grave)) || (b.quantas - a.quantas))

  return {
    lidas: lista.length,
    // Quantas avaliações não casaram com nenhum tema. Mostrar isso é o que
    // impede o app de parecer mais esperto do que é: se metade não casou,
    // a leitura está deixando coisa passar.
    semTema: lista.filter((a) => !TEMAS.some((t) => t.pistas.some((p) => a.normalizado.includes(p)))).length,
    queixas: queixas.slice(0, quantos),
    semTexto: false,
  }
}

/** A frase de cima: o que perguntar ao fornecedor, em uma linha. */
export function resumirQueixas(leitura) {
  if (!leitura || !leitura.lidas) return null
  if (!leitura.queixas.length) {
    return `Li ${leitura.lidas} ${leitura.lidas === 1 ? 'avaliação ruim' : 'avaliações ruins'} e não achei um defeito que se repita. Bom sinal, mas leia você mesma antes de comprar.`
  }
  const p = leitura.queixas[0]
  return `De ${leitura.lidas} ${leitura.lidas === 1 ? 'avaliação ruim' : 'avaliações ruins'}, ${p.quantas} ${p.quantas === 1 ? 'fala' : 'falam'} da mesma coisa: ${p.nome.toLowerCase()}.`
}
