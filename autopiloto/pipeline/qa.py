"""Validacao automatica de roteiros antes de produzir e antes de publicar.

Erros bloqueiam. Avisos exigem leitura humana mas nao bloqueiam a producao.
O portao de publicacao e mais rigido: exige fonte verificada e aprovacao humana.
"""
import json
import re
from pathlib import Path

CAMPOS = ["id", "slug", "pilar", "formato", "objetivo", "publico", "gancho", "hipotese",
          "criterio_sucesso", "cenas", "cta", "legenda_post", "hashtags", "fontes",
          "rotulo_ia", "revisao_humana"]

# Promessas que o canal nao pode fazer (seguranca nunca e absoluta).
PROIBIDAS = [r"\bgarantid[oa]s?\b", r"\b100\s?%\s?segur", r"\bnunca mais\b.*\bgolpe",
             r"\bimposs[ií]vel\b", r"\bganhe dinheiro\b", r"\blucro\b"]
# Mencoes que pedem cuidado: acusar empresa real ou parecer canal oficial.
SENSIVEIS = [r"\bnubank\b", r"\bita[uú]\b", r"\bbradesco\b", r"\bcaixa\b", r"\bbanco do brasil\b",
             r"\bsantander\b", r"\binter\b", r"\bmercado pago\b", r"\bpicpay\b", r"\boficial\b"]

CHARS_POR_SEGUNDO = 15.0
DURACAO_MIN, DURACAO_MAX = 15, 90


def texto_falado(r):
    return " ".join(c["narracao"] for c in r.get("cenas", []))


def trigramas(texto):
    p = re.findall(r"\w+", texto.lower())
    return {tuple(p[i:i + 3]) for i in range(len(p) - 2)}


def similaridade(a, b):
    ta, tb = trigramas(a), trigramas(b)
    return len(ta & tb) / len(ta | tb) if ta and tb else 0.0


def validar(roteiro, outros=()):
    erros, avisos = [], []
    for c in CAMPOS:
        if c not in roteiro or roteiro[c] in ("", [], None):
            erros.append(f"campo obrigatório ausente: {c}")
    if erros:
        return erros, avisos
    for i, cena in enumerate(roteiro["cenas"]):
        if not cena.get("narracao", "").strip():
            erros.append(f"cena {i}: narração vazia")
        if "visual" not in cena:
            erros.append(f"cena {i}: sem visual")
    if roteiro["cenas"][0].get("papel") != "gancho":
        erros.append("a primeira cena precisa ser o gancho")
    if roteiro["cenas"][-1].get("papel") != "cta":
        avisos.append("a última cena não é a chamada para ação")
    falado = texto_falado(roteiro)
    estimada = len(falado) / CHARS_POR_SEGUNDO
    if not DURACAO_MIN <= estimada <= DURACAO_MAX:
        erros.append(f"duração estimada {estimada:.0f}s fora de {DURACAO_MIN}-{DURACAO_MAX}s")
    elif estimada < 60:
        avisos.append(f"duração estimada {estimada:.0f}s: abaixo de 1 min não conta para o Creator Rewards")
    tudo = " ".join([falado, roteiro["legenda_post"], roteiro["gancho"]])
    for padrao in PROIBIDAS:
        for m in re.finditer(padrao, tudo, re.I):
            # "não é garantida" é justamente o aviso honesto que queremos
            if not re.search(r"\bn[ãa]o\b", tudo[max(0, m.start() - 15):m.start()], re.I):
                erros.append(f"promessa proibida: /{padrao}/ em '{m.group(0)}'")
    for padrao in SENSIVEIS:
        if re.search(padrao, tudo, re.I):
            avisos.append(f"menção sensível, revisar tom: /{padrao}/")
    if re.search(r"\d", falado) and not roteiro["fontes"]:
        erros.append("há números na narração e nenhuma fonte")
    for f in roteiro["fontes"]:
        if not f.get("url", "").startswith("https://"):
            erros.append(f"fonte sem URL https: {f.get('descricao')}")
        if not f.get("afirmacao"):
            erros.append(f"fonte sem a afirmação que sustenta: {f.get('descricao')}")
    if len(roteiro["hashtags"]) > 5:
        avisos.append("mais de 5 hashtags")
    if len(roteiro["legenda_post"]) > 2200:
        erros.append("legenda da publicação acima de 2.200 caracteres")
    for outro in outros:
        if outro["id"] == roteiro["id"]:
            continue
        s = similaridade(falado, texto_falado(outro))
        if s > 0.35:
            erros.append(f"narração {s:.0%} parecida com o roteiro {outro['id']}")
    return erros, avisos


def pronto_para_publicar(roteiro):
    """Portao de publicacao: verificacao factual + aprovacao humana."""
    motivos = []
    if not any(f.get("verificada") for f in roteiro.get("fontes", [])):
        motivos.append("nenhuma fonte marcada como verificada por um humano")
    if any(f.get("tipo") == "secundaria" and not f.get("verificada") for f in roteiro.get("fontes", [])):
        motivos.append("há fonte secundária não verificada na fonte primária")
    rev = roteiro.get("revisao_humana", {})
    if not (rev.get("aprovado") and rev.get("por") and rev.get("em")):
        motivos.append("sem aprovação humana registrada (aprovado, por, em)")
    return not motivos, motivos


def carregar_todos(pasta):
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(Path(pasta).glob("*.json"))]


def main():
    import sys
    pasta = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent.parent / "conteudo" / "roteiros")
    todos = carregar_todos(pasta)
    falhou = False
    for r in todos:
        erros, avisos = validar(r, todos)
        ok, motivos = pronto_para_publicar(r)
        estado = "ERRO" if erros else ("PUBLICÁVEL" if ok else "PRODUZÍVEL (publicação bloqueada)")
        print(f"[{r.get('id')}] {estado}")
        for e in erros:
            print(f"   erro: {e}")
        for a in avisos:
            print(f"   aviso: {a}")
        for m in motivos:
            print(f"   bloqueio de publicação: {m}")
        falhou |= bool(erros)
    sys.exit(1 if falhou else 0)


if __name__ == "__main__":
    main()
