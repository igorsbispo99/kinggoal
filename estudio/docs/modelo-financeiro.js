const CUSTO = 120; // R$/mês operacional (US$ ~22)
const RPM = 3.00;  // R$ por 1000 views qualificadas (notícias gerais BR, conservador)
const QUAL = 0.45; // fração das views que conta como qualificada (vídeos >60s)

const cen = {
  Pessimista: {
    views: [5,9,15,22,32,45,60,78,95,112,128,142,155,165,172,177,180,182].map(v=>v*1000),
    seg:   [60,150,300,500,800,1200,1700,2300,3000,3800,4600,5400,6100,6700,7200,7700,8100,8500],
    monetiza: null,
    outras:[0,0,0,0,0,0,0,0,0,150,200,250,300,350,400,450,500,550],
  },
  Base: {
    views: [8,20,45,90,150,220,300,380,450,520,590,660,720,780,840,900,960,1020].map(v=>v*1000),
    seg:   [120,400,1000,2200,4000,6500,9000,11500,14000,17000,20000,23000,26000,29000,32000,35000,38000,41000],
    monetiza: 8,
    outras:[0,0,0,0,0,0,0,0,0,0,0,800,900,1100,1300,1600,1900,2200],
  },
  Otimista: {
    views: [25,90,250,500,800,1200,1600,2000,2400,2800,3200,3600,3900,4200,4500,4900,5300,5700].map(v=>v*1000),
    seg:   [500,2000,6000,12000,20000,30000,42000,55000,68000,80000,92000,105000,118000,130000,142000,155000,168000,180000],
    monetiza: 4,
    outras:[0,0,0,0,0,2000,2500,3500,4500,5500,6500,7500,8500,9000,10000,10500,11500,12000],
  },
};

const out = {};
for (const [nome, c] of Object.entries(cen)) {
  let acum = 0; const linhas = [];
  for (let m = 1; m <= 18; m++) {
    const i = m - 1;
    const rewards = (c.monetiza && m >= c.monetiza) ? c.views[i] * QUAL * RPM / 1000 : 0;
    const receita = rewards + c.outras[i];
    const liquido = receita - CUSTO;
    acum += liquido;
    linhas.push({ m, views: c.views[i], seg: c.seg[i], rewards, outras: c.outras[i], receita, liquido, acum });
  }
  out[nome] = linhas;
}

for (const [nome, l] of Object.entries(out)) {
  const cobreCusto = l.find(x => x.receita > CUSTO);
  const zeroAcum  = l.find(x => x.acum > 0);
  const mil3      = l.find(x => x.liquido >= 3000);
  const pior      = Math.min(...l.map(x => x.acum));
  console.log(`\n### ${nome}`);
  console.log(`  receita cobre o custo mensal .... mês ${cobreCusto ? cobreCusto.m : '—'}`);
  console.log(`  acumulado cruza zero (payback) .. mês ${zeroAcum ? zeroAcum.m : 'não cruza em 18m'}`);
  console.log(`  lucro >= R$3.000/mês ............ mês ${mil3 ? mil3.m : 'não atinge em 18m'}`);
  console.log(`  pior caixa acumulado ............ R$ ${pior.toFixed(0)}`);
  console.log(`  mês 12: receita R$ ${l[11].receita.toFixed(0)} | acum R$ ${l[11].acum.toFixed(0)} | ${(l[11].seg/1000).toFixed(0)}k seg`);
  console.log(`  mês 18: receita R$ ${l[17].receita.toFixed(0)} | acum R$ ${l[17].acum.toFixed(0)} | ${(l[17].seg/1000).toFixed(0)}k seg`);
  console.log(`  acum: [${l.map(x=>Math.round(x.acum)).join(',')}]`);
}
