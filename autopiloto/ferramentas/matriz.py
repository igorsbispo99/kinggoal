"""Matriz ponderada de nichos com analise de sensibilidade.

Uso: python3 ferramentas/matriz.py [--md saida.md]

Notas de 1 a 5 (5 = melhor). Em "concorrencia", "custo" e "risco" a escala ja
esta invertida: 5 = pouca concorrencia / custo baixo / risco baixo.
A pontuacao final vai de 20 a 100.
"""
import argparse
import csv
import itertools
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# v1 (descartada): nichos estreitos, sem medir o teto de escala.
PESOS_V1 = {
    "demanda": 15,
    "concorrencia": 10,
    "alcance": 10,
    "producao_ia": 15,
    "frequencia_pautas": 5,
    "monetizacao": 20,
    "custo": 5,
    "risco": 10,
    "audiencia_externa": 10,
}
# v2 (vigente): acrescenta "teto_escala" — quantas series, plataformas, produtos
# e linhas de receita o tema comporta sem perder a identidade da marca.
PESOS = {
    "monetizacao": 20,
    "teto_escala": 15,
    "demanda": 12,
    "producao_ia": 12,
    "risco": 10,
    "concorrencia": 8,
    "alcance": 8,
    "audiencia_externa": 8,
    "frequencia_pautas": 4,
    "custo": 3,
}
assert sum(PESOS.values()) == 100 and sum(PESOS_V1.values()) == 100


def carregar(caminho=RAIZ / "dados" / "nichos_v2.csv"):
    with open(caminho, encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    for l in linhas:
        for c in PESOS:
            l[c] = int(l[c])
    return linhas


def pontuar(nicho, pesos=PESOS):
    total = sum(pesos.values())
    return round(sum(nicho[c] * p for c, p in pesos.items()) / (5 * total) * 100, 1)


def ranking(nichos, pesos=PESOS):
    return sorted(nichos, key=lambda n: pontuar(n, pesos), reverse=True)


def sensibilidade(nichos, variacao=0.5):
    """Sobe e desce cada peso em +-50% e conta quantas vezes cada nicho fica em 1o."""
    vitorias = {}
    cenarios = 0
    for criterio, fator in itertools.product(PESOS, (1 - variacao, 1 + variacao)):
        pesos = dict(PESOS)
        pesos[criterio] = PESOS[criterio] * fator
        lider = ranking(nichos, pesos)[0]["nicho"]
        vitorias[lider] = vitorias.get(lider, 0) + 1
        cenarios += 1
    return vitorias, cenarios


def tabela_md(nichos):
    cab = ["#", "Nicho"] + list(PESOS) + ["Pontuação"]
    linhas = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    for i, n in enumerate(ranking(nichos), 1):
        linhas.append("| " + " | ".join(
            [str(i), n["nicho"]] + [str(n[c]) for c in PESOS] + [f"**{pontuar(n)}**"]) + " |")
    return "\n".join(linhas)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", help="grava a tabela em Markdown neste arquivo")
    args = ap.parse_args()
    nichos = carregar()
    for i, n in enumerate(ranking(nichos), 1):
        print(f"{i:>2}. {pontuar(n):>5}  {n['nicho']}")
    vitorias, cenarios = sensibilidade(nichos)
    print(f"\nSensibilidade (cada peso +-50%, {cenarios} cenarios):")
    for nome, v in sorted(vitorias.items(), key=lambda x: -x[1]):
        print(f"  {v:>2}/{cenarios} em 1o lugar: {nome}")
    if args.md:
        Path(args.md).write_text(tabela_md(nichos) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
