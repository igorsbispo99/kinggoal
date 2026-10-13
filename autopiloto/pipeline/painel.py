"""Painel inicial de metricas a partir de metricas/metricas.csv.

O CSV e preenchido com o que o TikTok Studio mostra (manual ate existir API),
com uma linha por video por idade de medicao (D+1, D+3, D+7). Assim so
comparamos videos na mesma idade: um video de 3 dias contra um de 7 nao vale.

Uso: python3 -m pipeline.painel [--idade 7] [--custos 0]
"""
import argparse
import csv
import statistics
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CSV = RAIZ / "metricas" / "metricas.csv"
MINIMO_POR_GRUPO = 5  # abaixo disso nao declaramos vencedor


def taxa(linha, campo):
    v = int(linha["views"])
    return 1000 * int(linha[campo]) / v if v else 0.0


def relatorio(linhas, idade=7, custos=0.0, receita=0.0):
    linhas = [l for l in linhas if int(l["idade_dias"]) == idade]
    if not linhas:
        return f"Sem vídeos medidos com idade D+{idade}."
    saida = [f"# Painel — vídeos com idade D+{idade} ({len(linhas)} vídeos)", "",
             "| id | formato | gancho | views | compart/mil | salvos/mil | seg/mil | conclusão % | cadastros |",
             "|---|---|---|---|---|---|---|---|---|"]
    for l in sorted(linhas, key=lambda l: -taxa(l, "compart")):
        saida.append(f"| {l['id']} | {l['formato']} | {l['gancho_tipo']} | {l['views']} | "
                     f"{taxa(l, 'compart'):.1f} | {taxa(l, 'salvos'):.1f} | {taxa(l, 'seguidores'):.1f} | "
                     f"{l['conclusao_pct']} | {l['cadastros']} |")
    for dim in ("formato", "gancho_tipo"):
        grupos = defaultdict(list)
        for l in linhas:
            grupos[l[dim]].append(l)
        saida += ["", f"## Por {dim} (mediana de compartilhamentos por mil views)", ""]
        for g, ls in sorted(grupos.items()):
            med = statistics.median(taxa(l, "compart") for l in ls)
            nota = "" if len(ls) >= MINIMO_POR_GRUPO else f" — amostra pequena (n={len(ls)}), sem conclusão"
            saida.append(f"- {g}: {med:.1f} (n={len(ls)}){nota}")
    saida += ["", f"Receita registrada: R$ {receita:.2f} · Custos: R$ {custos:.2f} · "
              f"Resultado: R$ {receita - custos:.2f}"]
    return "\n".join(saida)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--idade", type=int, default=7)
    ap.add_argument("--custos", type=float, default=0.0)
    ap.add_argument("--receita", type=float, default=0.0)
    args = ap.parse_args()
    with open(CSV, encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    print(relatorio(linhas, args.idade, args.custos, args.receita))


if __name__ == "__main__":
    main()
