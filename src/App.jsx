import React, { useEffect, useState } from 'react';
import { getMatchesByDate } from './srcservices/apiFootball';
import GameCard from './srccomponents/GameCard';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('today');

  const getDate = () => {
    const today = new Date();
    if (selectedDate === 'yesterday') today.setDate(today.getDate() - 1);
    if (selectedDate === 'tomorrow') today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const data = await getMatchesByDate(getDate());
        setMatches(data);
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedDate]);

  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>KingGoal – Jogos</h1>

      {/* Menu de seleção de dia */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setSelectedDate('yesterday')}>Ontem</button>
        <button onClick={() => setSelectedDate('today')} style={{ margin: '0 10px' }}>Hoje</button>
        <button onClick={() => setSelectedDate('tomorrow')}>Amanhã</button>
      </div>

      {loading ? (
        <p>Carregando jogos...</p>
      ) : matches.length === 0 ? (
        <p>Nenhum jogo encontrado.</p>
      ) : (
        matches.map((match, index) => (
          <GameCard key={index} match={match} />
        ))
      )}
    </div>
  );
}

export default App;