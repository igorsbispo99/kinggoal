import React from 'react';

function GameCard({ match }) {
  const { teams, fixture, league } = match;

  const horario = new Date(fixture.date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{
      backgroundColor: '#1f1f1f',
      marginBottom: '1rem',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Times */}
        <div style={{ flex: 1, textAlign: 'right', paddingRight: '1rem' }}>
          <p>{teams.home.name}</p>
          <img src={teams.home.logo} alt="home logo" width="40" />
        </div>

        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>vs</div>

        <div style={{ flex: 1, textAlign: 'left', paddingLeft: '1rem' }}>
          <p>{teams.away.name}</p>
          <img src={teams.away.logo} alt="away logo" width="40" />
        </div>
      </div>

      {/* Detalhes adicionais */}
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#ccc' }}>
        <p><strong>Horário:</strong> {horario}</p>
        <p><
