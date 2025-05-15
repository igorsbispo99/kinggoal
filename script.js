function entrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if (email && senha) {
    document.getElementById("login").style.display = "none";
    document.getElementById("menu").style.display = "block";
    carregarJogos();
  }
}

function carregarJogos() {
  const jogos = [
    {
      casa: "Fortaleza",
      fora: "Corinthians",
      oddJusta: 1.55,
      comentario: "Lay Goleada: visitante com média baixa de gols."
    },
    {
      casa: "Grêmio",
      fora: "Cruzeiro",
      oddJusta: 1.75,
      comentario: "Ambas Marcam: tendência nos últimos confrontos."
    }
  ];

  let html = "";
  jogos.forEach((jogo, i) => {
    html += `<div class="analise">
      <strong>${jogo.casa} x ${jogo.fora}</strong><br>
      <em>${jogo.comentario}</em><br><br>
      <label>Odd oferecida:</label>
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