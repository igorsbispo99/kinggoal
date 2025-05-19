import axios from 'axios';

const apiKey = '02c0a6ce2f0a4823a857ec0d593617a1'; // Chave PRO fornecida

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io/',
  headers: {
    'x-apisports-key': apiKey,
  },
});

export const getMatchesByDate = async (date) => {
  try {
    const response = await api.get('/fixtures', {
      params: {
        date,
        timezone: 'America/Sao_Paulo',
        // ❌ Removido filtro status para trazer todos os jogos da data (inclusive FT)
      },
    });
    return response.data.response;
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return [];
  }
};
