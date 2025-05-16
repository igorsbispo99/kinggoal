function entrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if (email && senha) {
    document.getElementById("login").style.display = "none";
    document.getElementById("menu").style.display = "block";
  }
}

function mostrarTreinamento() {
  document.getElementById("modo-jogos").style.display = "none";
  document.getElementById("modo-treinamento").style.display = "block";
  const html = `<div class="analise">
    <strong>Simulado: Botafogo x Goiás</strong><br>
    Stake sugerida: 10% da banca simulada.<br>
    Padrão observado: Goiás com média de 0.7 gols.
  </div>`;
  document.getElementById("treinamento").innerHTML = html;
  sugerirStake();
}

function mostrarJogos() {
  document.getElementById("modo-treinamento").style.display = "none";
  document.getElementById("modo-jogos").style.display = "block";
  carregarJogosReais();
}

function sugerirStake() {
  const banca = parseFloat(document.getElementById("banca").value);
  const stake = (banca * 0.1).toFixed(2);
  document.getElementById("sugestao").innerText = `Stake sugerida: R$ ${stake}`;
}

function carregarJogosReais() {
  const jogos = [
    {
      casa: "Fluminense", fora: "Cuiabá",
      oddJusta: 1.45,
      comentario: "Lay Goleada: visitante tem média de 0.5 gols.",
      real: true
    },
    {
      casa: "Palmeiras", fora: "Internacional",
      oddJusta: 1.70,
      comentario: "Ambas Marcam: tendência recente.",
      real: true
    }
  ];
  let html = "";
  jogos.forEach((jogo, i) => {
    html += `<div class="analise">
      <strong>${jogo.casa} x ${jogo.fora}</strong> <br>
      <em>${jogo.comentario}</em><br>
      <small>${jogo.real ? "🟢 Jogo real (mock)" : "🟡 Jogo simulado"}</small><br><br>
      <label>Odd oferecida (na casa de aposta que você utiliza):</label>
      <input type="number" id="odd-${i}" placeholder="Ex: 1.60" oninput="avaliarValor(${i}, ${jogo.oddJusta})" />
      <div id="valor-${i}"></div>
      <div style="margin-top:10px;">
        <button onclick="decisao(${i}, true)">Vou apostar</button>
        <button onclick="decisao(${i}, false)">Não vou apostar</button>
        <div id="resposta-${i}" style="margin-top:5px;"></div>
      </div>
    </div>`;
  });
  document.getElementById("jogos").innerHTML = html;
}

function avaliarValor(i, oddJusta) {
  const odd = parseFloat(document.getElementById("odd-" + i).value);
  const div = document.getElementById("valor-" + i);
  if (isNaN(odd)) {
    div.innerText = "";
    return;
  }

  if (odd > oddJusta) {
    div.innerHTML = `<span class='valor-positivo'>✅ Odd com valor: está acima da justa (${oddJusta})</span>`;
  } else if (odd < oddJusta) {
    div.innerHTML = `<span class='valor-negativo'>⚠️ Odd sem valor: abaixo da justa (${oddJusta})</span>`;
  } else {
    div.innerHTML = `<span class='valor-neutro'>⚪ Odd igual à justa (${oddJusta})</span>`;
  }
}

function decisao(i, vaiApostar) {
  const mensagem = vaiApostar
    ? "👍 Sua decisão de apostar foi registrada."
    : "🚫 Você optou por não apostar nesse jogo.";
  document.getElementById("resposta-" + i).innerText = mensagem;
}