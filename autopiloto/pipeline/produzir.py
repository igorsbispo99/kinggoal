"""Produz videos a partir dos roteiros: QA -> narracao -> render -> fila.

Uso: python3 -m pipeline.produzir [IDs...] [--tts silencio|piper|azure] [--saida DIR]
Sem IDs, produz todos os roteiros que passam no QA. Nada e publicado aqui.
"""
import argparse
from pathlib import Path

from . import fila, qa, render

RAIZ = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--tts")
    ap.add_argument("--saida", default=str(RAIZ / "saida"))
    args = ap.parse_args()
    pasta = RAIZ / "conteudo" / "roteiros"
    todos = qa.carregar_todos(pasta)
    f = fila.carregar()
    for r in todos:
        if args.ids and r["id"] not in args.ids:
            continue
        erros, avisos = qa.validar(r, todos)
        if erros:
            print(f"[{r['id']}] pulado pelo QA: {'; '.join(erros)}")
            fila.registrar_log("qa_reprovado", id=r["id"], erros=erros)
            continue
        caminho = next(pasta.glob(f"{r['id']}-*.json"))
        try:
            mp4, meta = render.renderizar(caminho, args.saida, args.tts)
            fila.adicionar(f, r["id"], mp4, meta)
            fila.salvar(f)
            print(f"[{r['id']}] ok: {mp4} ({meta['duracao_s']}s)")
        except Exception as e:  # registra e segue para o proximo roteiro
            fila.registrar_log("erro_producao", id=r["id"], erro=str(e))
            print(f"[{r['id']}] erro na produção: {e}")


if __name__ == "__main__":
    main()
