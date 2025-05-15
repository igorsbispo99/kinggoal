function entrar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    if (email && senha) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        carregarJogos();
    } else {
        alert("Digite e-mail e senha para entrar.");
    }
}

function carregarJogos() {
    const jogos = [
        { casa: "Flamengo", fora: "Palmeiras", analise: "Lay Goleada - Flamengo tem média de 1.2 gols marcados e 0.8 sofridos nos últimos 5 jogos." },
        { casa: "Botafogo", fora: "Grêmio", analise: "+2.5 Gols - Média combinada de 3.4 gols nos últimos confrontos diretos." },
        { casa: "Corinthians", fora: "São Paulo", analise: "Ambas Marcam - Ambas marcaram em 6 dos últimos 7 clássicos." }
    ];
    let html = "";
    jogos.forEach(jogo => {
        html += `<p><strong>${jogo.casa} vs ${jogo.fora}</strong><br><em>${jogo.analise}</em></p>`;
    });
    document.getElementById('jogos').innerHTML = html;
}