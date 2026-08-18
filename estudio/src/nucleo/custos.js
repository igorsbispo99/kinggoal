import { lerConfig } from './estado.js';

/**
 * Converte o bloco `usage` da API em custo em dólares.
 * Tokens lidos do cache custam uma fração do preço de entrada, e é isso que
 * segura o custo da esteira: o prompt de sistema de cada time é longo e se
 * repete a cada vídeo.
 */
export function custoDaChamada(modelo, usage) {
  const tabela = lerConfig().custos.precos[modelo];
  if (!tabela) return 0;

  const entradaNova   = usage.input_tokens || 0;
  const cacheEscrita  = usage.cache_creation_input_tokens || 0;
  const cacheLeitura  = usage.cache_read_input_tokens || 0;
  const saida         = usage.output_tokens || 0;

  return (
    (entradaNova  * tabela.entrada      / 1e6) +
    (cacheEscrita * tabela.entrada * 1.25 / 1e6) +  // gravar no cache custa 25% a mais
    (cacheLeitura * tabela.cacheLeitura / 1e6) +
    (saida        * tabela.saida        / 1e6)
  );
}

export function formatarUSD(v) {
  return `US$ ${v.toFixed(4)}`;
}
