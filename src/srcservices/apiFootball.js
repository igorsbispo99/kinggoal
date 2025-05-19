import axios from 'axios';

const apiKey = '8d9cba82ae12f5bfa9f2e4d132c71f5e'; // Chave PRO fornecida

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
  date: '2024-05-17', // << Troque por um dia que sabemos que teve jogos
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
