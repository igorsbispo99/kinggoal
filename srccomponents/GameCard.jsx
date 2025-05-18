import React from 'react';

function GameCard({ match }) {
  const { teams, fixture } = match;

  return (
    <div style={{
      backgroundColor: '#1f1f1f',
      margin: '1rem 0',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)'
    }}>
      <h2 style={{ marginBottom: '0.5rem' }}>
        {teams.home.name} vs {teams.away.name}
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
        Horário: {new Date(fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
        Estágio: {fixture.status.long}
      </p>
    </div>
  );
}

export default GameCard;
