import React, { useEffect, useState } from 'react';
import { getTodayMatches } from './srcservices/apiFootball';
import GameCard from './srccomponents/GameCard';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getTodayMatches();
        setMatches(data);
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>KingGoal – Jogos do Dia</h1>

      {loading ? (
        <p>Carregando jogos...</p>
      ) : matches.length === 0 ? (
        <p>Nenhum jogo encontrado para hoje.</p>
      ) : (
        matches.map((match, index) => (
          <GameCard key={index} match={match} />
        ))
      )}
    </div>
  );
}

export default App;