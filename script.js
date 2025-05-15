function entrar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    if (email && senha) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        carregarJogos();
    } else {
        alert("Preencha e-mail e senha para entrar.");
    }
}

function carregarJogos() {
    const jogos = [
        { casa: "Time A", fora: "Time B", analise: "Lay Goleada - recomendado" },
        { casa: "Time C", fora: "Time D", analise: "+2.5 Gols - possível valor" },
        { casa: "Time E", fora: "Time F", analise: "Ambas Marcam - risco moderado" }
    ];
    let html = "";
    jogos.forEach(jogo => {
        html += `<p><strong>${jogo.casa} vs ${jogo.fora}</strong><br><em>${jogo.analise}</em></p>`;
    });
    document.getElementById('jogos').innerHTML = html;
}