function entrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if (email && senha) {
    document.getElementById("login").style.display = "none";
    document.getElementById("menu").style.display = "block";
  }
}

function mostrarTreinamento() {
  document.getElementById("modo-reais").style.display = "none";
  document.getElementById("modo-treinamento").style.display = "block";
  carregarTreinamento();
  sugerirStake();
}

function mostrarReais() {
  document.getElementById("modo-treinamento").style.display = "none";
  document.getElementById("modo-reais").style.display = "block";
  carregarReais();
}

function sugerirStake() {
  const banca = parseFloat(document.getElementById("banca").value);
  const stake = (banca * 0.1).toFixed(2);
  document.getElementById("sugestao").innerText = `Stake sugerida: R$ ${stake}`;
}

function carregarTreinamento() {
  const jogos = [
    { casa: "Santos", fora: "Chapecoense", analise: "Lay Goleada: média de 0.8 gols do visitante." }
  ];
  let html = "";
  jogos.forEach(j => {
    html += `<div class="analise"><strong>${j.casa} x ${j.fora}</strong><br><em>${j.analise}</em></div>`;
  });
  document.getElementById("simulados").innerHTML = html;
}

function carregarReais() {
  const jogos = [
    { casa: "Bragantino", fora: "Atlético-GO", analise: "Ambas Marcam: padrão nos últimos confrontos." },
    { casa: "Bahia", fora: "Vasco", analise: "Lay Goleada: visitante com baixa produção ofensiva recente." }
  ];
  let html = "";
  jogos.forEach(j => {
    html += `<div class="analise"><strong>${j.casa} x ${j.fora}</strong><br><em>${j.analise}</em></div>`;
  });
  document.getElementById("reais").innerHTML = html;
}