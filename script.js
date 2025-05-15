function mostrarModoTreinamento() {
  document.getElementById('modo-treinamento').style.display = 'block';
  document.getElementById('jogos-reais').style.display = 'none';
  carregarJogosTreinamento();
  sugerirStake();
}

function mostrarJogosReais() {
  document.getElementById('modo-treinamento').style.display = 'none';
  document.getElementById('jogos-reais').style.display = 'block';
  carregarJogos();
}

function sugerirStake() {
  const banca = parseFloat(document.getElementById('banca').value);
  const stake = (banca * 0.1).toFixed(2);
  document.getElementById("sugestao").innerText =
    `Stake recomendada: R$ ${stake}`;
}

function carregarJogosTreinamento() {
  const jogos = [
    { casa: "Atlético-MG", fora: "Cuiabá", analise: "Lay Goleada: mandante sofreu menos de 2 gols em todos os últimos jogos." },
    { casa: "Cruzeiro", fora: "Internacional", analise: "+2.5 Gols: Média combinada de 3.2 gols por jogo." }
  ];
  let html = "";
  jogos.forEach((jogo, i) => {
    html += `<div class="analise">
      <strong>${jogo.casa} vs ${jogo.fora}</strong><br>
      <em>${jogo.analise}</em>
    </div>`;
  });
  document.getElementById('jogos-treinamento').innerHTML = html;
}

function carregarJogos() {
  const jogos = [
    { casa: "Fluminense", fora: "Bahia", analise: "Ambas Marcam: ambas marcaram em 5 dos últimos 6 confrontos diretos." },
    { casa: "Vasco", fora: "Coritiba", analise: "Lay Goleada: visitante tem média de 0.6 gols nos últimos jogos." }
  ];
  let html = "";
  jogos.forEach((jogo, i) => {
    html += `<div class="analise">
      <strong>${jogo.casa} vs ${jogo.fora}</strong><br>
      <em>${jogo.analise}</em>
      <div class="botoes">
        <button onclick="responder(${i}, true)">Vou apostar</button>
        <button onclick="responder(${i}, false)">Não vou apostar</button>
      </div>
      <div id="resposta-${i}"></div>
    </div>`;
  });
  document.getElementById('jogos').innerHTML = html;
}

function responder(i, decisao) {
  const resposta = decisao
    ? "Decisão registrada. Essa entrada tem valor esperado positivo."
    : "Ok, a IA continuará analisando os padrões.";
  document.getElementById(`resposta-${i}`).innerText = resposta;
}