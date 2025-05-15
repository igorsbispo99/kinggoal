function entrar() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  if (email && senha) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    carregarJogos();
    sugerirStake();
  } else {
    alert("Digite e-mail e senha para entrar.");
  }
}

function carregarJogos() {
  const jogos = [
    {
      casa: "Flamengo",
      fora: "Palmeiras",
      analise: "Lay Goleada recomendado: O visitante não marcou mais de 2 gols nos últimos 5 jogos."
    },
    {
      casa: "Botafogo",
      fora: "Grêmio",
      analise: "+2.5 Gols: Média combinada de 3.4 gols nos últimos confrontos diretos."
    },
    {
      casa: "Corinthians",
      fora: "São Paulo",
      analise: "Ambas Marcam: Ambas as equipes marcaram em 6 dos últimos 7 clássicos."
    }
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
    ? "Boa! Essa entrada tem valor positivo. IA registra sua decisão."
    : "Entendido! A IA continuará observando o padrão da partida.";
  document.getElementById(`resposta-${i}`).innerText = resposta;
}

function sugerirStake() {
  const banca = parseFloat(document.getElementById('banca').value);
  const stake = (banca * 0.1).toFixed(2);
  document.getElementById("sugestao").innerText =
    `Stake recomendada para essa banca: R$ ${stake}`;
}