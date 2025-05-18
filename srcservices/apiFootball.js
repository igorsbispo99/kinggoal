import axios from 'axios';

const apiKey = '02c0a6ce2f0a4823a857ec0d593617a1'; // Chave PRO já ativada

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io/',
  headers: {
    'x-apisports-key': apiKey,
  },
});

export const getTodayMatches = async () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  try {
    const response = await api.get(`/fixtures`, {
      params: {
        date: today,
        timezone: 'America/Sao_Paulo',
        status: 'NS,TBD,Scheduled',
      },
    });

    return response.data.response;
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return []; // fallback pode ser adicionado aqui
  }
};