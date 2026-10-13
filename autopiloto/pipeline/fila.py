"""Fila de publicacao com estados, deduplicacao e tentativas controladas.

Estados: produzido -> aprovado -> publicado
                         \\-> falhou (ate MAX_TENTATIVAS) -> pausado
Ate a API oficial estar auditada, a publicacao e manual: o humano publica no
TikTok Studio e registra aqui o link e o horario efetivo. Nenhum item vira
"publicado" sem URL.

Uso:
  python3 -m pipeline.fila listar
  python3 -m pipeline.fila aprovar 001 --por "Igor"
  python3 -m pipeline.fila publicado 001 --url https://www.tiktok.com/@.../video/...
  python3 -m pipeline.fila falha 001 --erro "upload recusado"
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from . import qa

RAIZ = Path(__file__).resolve().parent.parent
ROTEIROS = RAIZ / "conteudo" / "roteiros"
ARQUIVO = RAIZ / "fila" / "fila.json"
LOG = RAIZ / "fila" / "execucao.jsonl"
MAX_TENTATIVAS = 3


def agora():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def registrar_log(evento, **dados):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps({"em": agora(), "evento": evento, **dados}, ensure_ascii=False) + "\n")


def carregar(arquivo=None):
    arquivo = Path(arquivo or ARQUIVO)
    return json.loads(arquivo.read_text(encoding="utf-8")) if arquivo.exists() else {}


def salvar(fila, arquivo=None):
    arquivo = Path(arquivo or ARQUIVO)
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    tmp = arquivo.with_suffix(".tmp")
    tmp.write_text(json.dumps(fila, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(arquivo)  # escrita atomica: nunca deixa a fila pela metade


def hash_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def adicionar(fila, id_, video, metadados):
    digest = hash_arquivo(video)
    for outro_id, item in fila.items():
        if item["hash"] == digest and outro_id != id_:
            raise ValueError(f"vídeo idêntico já está na fila como {outro_id}")
    atual = fila.get(id_)
    if atual and atual["estado"] == "publicado":
        raise ValueError(f"{id_} já foi publicado em {atual['publicado_em']}; não regravo")
    fila[id_] = {"estado": "produzido", "video": str(video), "hash": digest,
                 "metadados": metadados, "tentativas": 0, "erros": [],
                 "produzido_em": agora(), "aprovado_por": None, "url": None, "publicado_em": None}
    registrar_log("produzido", id=id_, hash=digest)


def aprovar(fila, id_, por, roteiro):
    ok, motivos = qa.pronto_para_publicar(roteiro)
    if not ok:
        raise ValueError("roteiro bloqueado para publicação: " + "; ".join(motivos))
    item = fila[id_]
    if item["estado"] not in ("produzido", "falhou"):
        raise ValueError(f"{id_} está '{item['estado']}', não pode ser aprovado")
    item.update(estado="aprovado", aprovado_por=por, aprovado_em=agora())
    registrar_log("aprovado", id=id_, por=por)


def marcar_publicado(fila, id_, url):
    item = fila[id_]
    if item["estado"] != "aprovado":
        raise ValueError(f"{id_} está '{item['estado']}'; só itens aprovados podem ser publicados")
    if not url.startswith("https://www.tiktok.com/"):
        raise ValueError("informe a URL real do vídeo publicado no TikTok")
    if any(i.get("url") == url for i in fila.values()):
        raise ValueError("esta URL já está registrada em outro item")
    item.update(estado="publicado", url=url, publicado_em=agora())
    registrar_log("publicado", id=id_, url=url)


def marcar_falha(fila, id_, erro):
    item = fila[id_]
    item["tentativas"] += 1
    item["erros"].append({"em": agora(), "erro": erro})
    item["estado"] = "pausado" if item["tentativas"] >= MAX_TENTATIVAS else "falhou"
    registrar_log("falha", id=id_, erro=erro, tentativas=item["tentativas"], estado=item["estado"])
    return item["estado"]


def carregar_roteiro(id_):
    achados = list(ROTEIROS.glob(f"{id_}-*.json"))
    if len(achados) != 1:
        raise SystemExit(f"esperava 1 roteiro para {id_}, achei {len(achados)}")
    return json.loads(achados[0].read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("listar")
    a = sub.add_parser("aprovar"); a.add_argument("id"); a.add_argument("--por", required=True)
    p = sub.add_parser("publicado"); p.add_argument("id"); p.add_argument("--url", required=True)
    f = sub.add_parser("falha"); f.add_argument("id"); f.add_argument("--erro", required=True)
    args = ap.parse_args()
    fila = carregar()
    if args.cmd == "listar":
        for id_, item in sorted(fila.items()):
            print(f"{id_}  {item['estado']:<10} {item.get('url') or ''}")
        return
    {"aprovar": lambda: aprovar(fila, args.id, args.por, carregar_roteiro(args.id)),
     "publicado": lambda: marcar_publicado(fila, args.id, args.url),
     "falha": lambda: print("estado:", marcar_falha(fila, args.id, args.erro))}[args.cmd]()
    salvar(fila)


if __name__ == "__main__":
    main()
