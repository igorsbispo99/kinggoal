"""Narracao sintetica com backends intercambiaveis.

Backends (variavel AUTOPILOTO_TTS):
  azure   - Azure AI Speech via REST. Producao: plano F0 gratuito (0,5 mi caracteres
            neurais/mes) permite uso comercial. Requer AZURE_SPEECH_KEY e
            AZURE_SPEECH_REGION. AINDA NAO TESTADO neste ambiente (sem chave/rede).
  piper   - Piper local (offline). Requer PIPER_MODEL=<arquivo .onnx>. Use para
            testes; confira a licenca da voz antes de qualquer uso comercial.
  silencio - gera silencio com a duracao estimada de leitura. Para testes e CI.

Todo backend devolve um WAV 44,1 kHz estereo, para concatenar sem surpresas.
"""
import os
import subprocess
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

CARACTERES_POR_SEGUNDO = 15.0  # ritmo medio de narracao em pt-BR (premissa)


def _normalizar(entrada, saida):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(entrada),
                    "-ar", "44100", "-ac", "2", str(saida)], check=True)


def duracao(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(arquivo)],
                       check=True, capture_output=True, text=True)
    return float(r.stdout.strip())


def _silencio(texto, saida):
    segundos = max(1.0, len(texto) / CARACTERES_POR_SEGUNDO)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                    "anullsrc=r=44100:cl=stereo", "-t", f"{segundos:.2f}", str(saida)],
                   check=True)


def _piper(texto, saida):
    modelo = os.environ.get("PIPER_MODEL")
    if not modelo:
        raise RuntimeError("defina PIPER_MODEL com o caminho do modelo .onnx")
    bruto = Path(saida).with_suffix(".piper.wav")
    subprocess.run(["python3", "-m", "piper", "-m", modelo, "-f", str(bruto)],
                   input=texto, text=True, check=True, capture_output=True)
    _normalizar(bruto, saida)
    bruto.unlink()


def _azure(texto, saida):
    chave = os.environ.get("AZURE_SPEECH_KEY")
    regiao = os.environ.get("AZURE_SPEECH_REGION")
    if not chave or not regiao:
        raise RuntimeError("defina AZURE_SPEECH_KEY e AZURE_SPEECH_REGION")
    voz = os.environ.get("AZURE_SPEECH_VOICE", "pt-BR-AntonioNeural")
    ssml = (f"<speak version='1.0' xml:lang='pt-BR'><voice name='{voz}'>"
            f"<prosody rate='+8%'>{escape(texto)}</prosody></voice></speak>")
    req = urllib.request.Request(
        f"https://{regiao}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={"Ocp-Apim-Subscription-Key": chave,
                 "Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
                 "User-Agent": "autopiloto"})
    bruto = Path(saida).with_suffix(".azure.wav")
    with urllib.request.urlopen(req, timeout=60) as r:
        bruto.write_bytes(r.read())
    _normalizar(bruto, saida)
    bruto.unlink()


BACKENDS = {"silencio": _silencio, "piper": _piper, "azure": _azure}


def sintetizar(texto, saida, backend=None):
    backend = backend or os.environ.get("AUTOPILOTO_TTS", "silencio")
    BACKENDS[backend](texto, saida)
    return duracao(saida)
