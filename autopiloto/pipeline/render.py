"""Monta o video vertical (1080x1920) a partir de um roteiro JSON.

Tudo e desenhado por codigo (Pillow): nenhuma imagem, video ou musica de
terceiros entra no arquivo, entao nao ha risco de direitos autorais na imagem.
Trilha sonora fica de fora de proposito: se quiser musica, adicione no proprio
TikTok, pela Biblioteca de Musica Comercial, no momento da publicacao.
"""
import functools
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from . import tts

L, A = 1080, 1920
FPS = 30
MARGEM = 90
# Zona segura: a interface do TikTok cobre o rodape (~380 px) e a lateral direita.
TOPO_VISUAL, BASE_VISUAL = 260, 1120
Y_LEGENDA = 1230

COR = {
    "fundo": (12, 18, 38),
    "fundo2": (24, 33, 64),
    "texto": (245, 247, 250),
    "suave": (148, 163, 184),
    "marca": (250, 204, 21),
    "alerta": (239, 68, 68),
    "ok": (34, 197, 94),
    "balao_eles": (40, 52, 90),
    "balao_voce": (21, 94, 62),
}

FONTES = [
    "/usr/share/fonts/opentype/inter/Inter-{peso}.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


@functools.lru_cache(maxsize=None)
def fonte(tamanho, peso="Bold"):
    for modelo in FONTES:
        caminho = modelo.format(peso=peso)
        if Path(caminho).exists():
            return ImageFont.truetype(caminho, tamanho)
    return ImageFont.load_default(tamanho)


def quebrar(draw, texto, f, largura):
    linhas, atual = [], ""
    for palavra in texto.split():
        teste = f"{atual} {palavra}".strip()
        if draw.textlength(teste, font=f) <= largura:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def blocos_legenda(narracao, max_chars=22):
    blocos, atual = [], ""
    for palavra in narracao.split():
        teste = f"{atual} {palavra}".strip()
        if len(teste) > max_chars and atual:
            blocos.append(atual)
            atual = palavra
        else:
            atual = teste
        if atual.endswith((".", "?", "!", ":")):
            blocos.append(atual)
            atual = ""
    if atual:
        blocos.append(atual)
    return blocos


@functools.lru_cache(maxsize=1)
def _degrade():
    img = Image.new("RGB", (L, A), COR["fundo"])
    d = ImageDraw.Draw(img)
    for y in range(A):  # degrade vertical sutil
        t = y / A
        c = tuple(int(COR["fundo"][i] * (1 - t) + COR["fundo2"][i] * t) for i in range(3))
        d.line([(0, y), (L, y)], fill=c)
    return img


def base(marca):
    img = _degrade().copy()
    d = ImageDraw.Draw(img)
    f = fonte(40, "ExtraBold")
    d.rounded_rectangle([MARGEM, 120, MARGEM + d.textlength(marca, font=f) + 50, 190],
                        radius=35, fill=COR["marca"])
    d.text((MARGEM + 25, 155), marca, font=f, fill=COR["fundo"], anchor="lm")
    return img, d


def texto_centralizado(d, texto, f, cor, y_centro, largura=L - 2 * MARGEM, entre=1.2):
    linhas = quebrar(d, texto, f, largura)
    alt = f.size * entre
    y = y_centro - alt * len(linhas) / 2
    for linha in linhas:
        d.text((L / 2, y + alt / 2), linha, font=f, fill=cor, anchor="mm")
        y += alt


def triangulo_alerta(d, cx, cy, lado, cor):
    h = lado * 0.87
    d.polygon([(cx, cy - h / 2), (cx - lado / 2, cy + h / 2), (cx + lado / 2, cy + h / 2)], fill=cor)
    d.text((cx, cy + h * 0.12), "!", font=fonte(int(lado * 0.55), "Black"), fill=COR["fundo"], anchor="mm")


def desenhar_visual(d, visual, progresso):
    tipo = visual["tipo"]
    meio = (TOPO_VISUAL + BASE_VISUAL) / 2
    if tipo == "titulo":
        cor = COR["alerta"] if visual.get("destaque") == "alerta" else COR["texto"]
        texto_centralizado(d, visual["texto"], fonte(96, "Black"), cor, meio)
    elif tipo == "alerta":
        triangulo_alerta(d, L / 2, TOPO_VISUAL + 170, 230, COR["alerta"])
        texto_centralizado(d, visual["texto"], fonte(80, "Black"), COR["texto"], meio + 120)
    elif tipo == "chat":
        d.rounded_rectangle([MARGEM, TOPO_VISUAL, L - MARGEM, TOPO_VISUAL + 110], radius=24,
                            fill=COR["fundo2"])
        d.ellipse([MARGEM + 25, TOPO_VISUAL + 20, MARGEM + 95, TOPO_VISUAL + 90], fill=COR["suave"])
        d.text((MARGEM + 120, TOPO_VISUAL + 55), visual.get("contato", "Desconhecido"),
               font=fonte(44, "SemiBold"), fill=COR["texto"], anchor="lm")
        msgs = visual["mensagens"]
        visiveis = max(1, round(progresso * len(msgs) + 0.49))
        f = fonte(46, "Medium")
        y = TOPO_VISUAL + 150
        for m in msgs[:visiveis]:
            linhas = quebrar(d, m["texto"], f, 640)
            larg = max(d.textlength(x, font=f) for x in linhas) + 60
            alt = len(linhas) * 58 + 40
            if m["de"] == "voce":
                x0, cor = L - MARGEM - larg, COR["balao_voce"]
            else:
                x0, cor = MARGEM, COR["balao_eles"]
            d.rounded_rectangle([x0, y, x0 + larg, y + alt], radius=28, fill=cor)
            for i, linha in enumerate(linhas):
                d.text((x0 + 30, y + 20 + i * 58), linha, font=f, fill=COR["texto"])
            y += alt + 26
    elif tipo == "lista":
        d.text((MARGEM, TOPO_VISUAL + 30), visual["titulo"], font=fonte(64, "Black"), fill=COR["marca"])
        itens = visual["itens"]
        visiveis = max(1, round(progresso * len(itens) + 0.49))
        f = fonte(52, "SemiBold")
        y = TOPO_VISUAL + 150
        for item in itens[:visiveis]:
            d.ellipse([MARGEM, y + 8, MARGEM + 44, y + 52], fill=COR["ok"])
            linhas = quebrar(d, item, f, L - 2 * MARGEM - 80)
            for i, linha in enumerate(linhas):
                d.text((MARGEM + 75, y + i * 64), linha, font=f, fill=COR["texto"])
            y += len(linhas) * 64 + 40
    else:
        raise ValueError(f"tipo de visual desconhecido: {tipo}")


def desenhar_legenda(d, texto):
    f = fonte(66, "ExtraBold")
    linhas = quebrar(d, texto, f, L - 2 * MARGEM)
    for i, linha in enumerate(linhas):
        d.text((L / 2, Y_LEGENDA + i * 88), linha, font=f, fill=COR["texto"], anchor="mt",
               stroke_width=8, stroke_fill=(0, 0, 0))


def quadro(roteiro, cena, legenda, progresso):
    img, d = base(roteiro["marca"])
    if roteiro.get("serie"):
        d.text((MARGEM, 215), roteiro["serie"].upper(), font=fonte(32, "SemiBold"), fill=COR["suave"])
    desenhar_visual(d, cena["visual"], progresso)
    desenhar_legenda(d, legenda)
    if roteiro.get("rotulo_ia"):
        d.text((MARGEM, A - 330), "Narração gerada por IA", font=fonte(30, "Medium"), fill=COR["suave"])
    return img


def srt_tempo(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def renderizar(caminho_roteiro, pasta_saida, backend_tts=None):
    roteiro = json.loads(Path(caminho_roteiro).read_text(encoding="utf-8"))
    saida = Path(pasta_saida) / roteiro["id"]
    saida.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        concat_video, cenas_audio, srt = [], [], []
        t, n = 0.0, 0
        for i, cena in enumerate(roteiro["cenas"]):
            audio = tmp / f"cena{i:02}.wav"
            dur = tts.sintetizar(cena["narracao"], audio, backend_tts) + 0.25  # respiro entre cenas
            cenas_audio.append((audio, dur))
            blocos = blocos_legenda(cena["narracao"])
            pesos = [len(b) + 4 for b in blocos]
            acumulado = 0
            for b, p in zip(blocos, pesos):
                d_bloco = dur * p / sum(pesos)
                acumulado += p
                png = tmp / f"q{n:04}.png"
                quadro(roteiro, cena, b, acumulado / sum(pesos)).save(png)
                concat_video += [f"file '{png}'", f"duration {d_bloco:.3f}"]
                srt.append(f"{n + 1}\n{srt_tempo(t)} --> {srt_tempo(t + d_bloco)}\n{b}\n")
                t += d_bloco
                n += 1
        concat_video.append(concat_video[-2])  # o demuxer concat exige repetir o ultimo quadro
        (tmp / "v.txt").write_text("\n".join(concat_video))
        entradas, filtro = [], []
        for i, (audio, dur) in enumerate(cenas_audio):
            entradas += ["-i", str(audio)]
            filtro.append(f"[{i}:a]apad=whole_dur={dur:.3f}[a{i}]")
        juncao = "".join(f"[a{i}]" for i in range(len(cenas_audio)))
        filtro.append(f"{juncao}concat=n={len(cenas_audio)}:v=0:a=1[aout]")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtro),
                        "-map", "[aout]", str(tmp / "audio.wav")], check=True)
        mp4 = saida / f"{roteiro['id']}-{roteiro['slug']}.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                        "-i", str(tmp / "v.txt"), "-i", str(tmp / "audio.wav"),
                        "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "medium",
                        "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-shortest",
                        "-movflags", "+faststart", str(mp4)], check=True)
    (saida / "legendas.srt").write_text("\n".join(srt), encoding="utf-8")
    meta = {k: roteiro[k] for k in ("id", "slug", "marca", "serie", "legenda_post", "hashtags", "fontes", "cta", "rotulo_ia")}
    meta["duracao_s"] = round(tts.duracao(mp4), 2)
    meta["arquivo"] = mp4.name
    (saida / "metadados.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return mp4, meta
