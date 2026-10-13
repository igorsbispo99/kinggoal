"""Testes de aceitacao da pipeline. Rode: python3 -m unittest discover -s testes"""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(RAIZ / "ferramentas"))

from pipeline import fila, painel, qa, render  # noqa: E402
import matriz  # noqa: E402

ROTEIRO = json.loads((RAIZ / "conteudo/roteiros/001-codigo-whatsapp.json").read_text(encoding="utf-8"))


class TestMatriz(unittest.TestCase):
    def test_lider_estavel(self):
        nichos = matriz.carregar()
        vitorias, cenarios = matriz.sensibilidade(nichos)
        self.assertEqual(sum(vitorias.values()), cenarios)
        self.assertEqual(matriz.ranking(nichos)[0]["id"], "1")


class TestQA(unittest.TestCase):
    def test_roteiros_do_repositorio_passam(self):
        todos = qa.carregar_todos(RAIZ / "conteudo/roteiros")
        for r in todos:
            erros, _ = qa.validar(r, todos)
            self.assertEqual(erros, [], r["id"])

    def test_promessa_proibida_bloqueia_mas_negacao_nao(self):
        r = copy.deepcopy(ROTEIRO)
        r["cenas"][1]["narracao"] = "Com isso você fica 100% seguro."
        self.assertTrue(any("proibida" in e for e in qa.validar(r)[0]))
        r["cenas"][1]["narracao"] = "A devolução não é garantida."
        self.assertFalse(any("proibida" in e for e in qa.validar(r)[0]))

    def test_fora_do_escopo_financeiro_bloqueia(self):
        r = copy.deepcopy(ROTEIRO)
        r["cenas"][1]["narracao"] = "Hoje eu recomendo a ação da empresa X e uma bet nova."
        erros = qa.validar(r)[0]
        self.assertTrue(sum("fora do escopo" in e for e in erros) >= 2)

    def test_plagio_interno_bloqueia(self):
        copia = copy.deepcopy(ROTEIRO)
        copia["id"] = "999"
        self.assertTrue(any("parecida" in e for e in qa.validar(copia, [ROTEIRO])[0]))

    def test_publicacao_exige_verificacao_e_aprovacao(self):
        self.assertFalse(qa.pronto_para_publicar(ROTEIRO)[0])
        r = copy.deepcopy(ROTEIRO)
        for f in r["fontes"]:
            f["verificada"] = True
        r["revisao_humana"] = {"aprovado": True, "por": "teste", "em": "2026-10-13"}
        self.assertTrue(qa.pronto_para_publicar(r)[0])


class TestFilaERender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp())
        fila.LOG = cls.tmp / "log.jsonl"
        curto = copy.deepcopy(ROTEIRO)
        curto["cenas"] = curto["cenas"][:2]
        caminho = cls.tmp / "001-teste.json"
        caminho.write_text(json.dumps(curto, ensure_ascii=False), encoding="utf-8")
        cls.mp4, cls.meta = render.renderizar(caminho, cls.tmp / "saida", "silencio")

    def test_video_vertical_com_audio(self):
        import subprocess
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
                            "-of", "json", str(self.mp4)], capture_output=True, text=True, check=True)
        streams = json.loads(r.stdout)["streams"]
        video = next(s for s in streams if s["codec_type"] == "video")
        self.assertEqual((video["width"], video["height"]), (1080, 1920))
        self.assertTrue(any(s["codec_type"] == "audio" for s in streams))
        self.assertTrue((self.mp4.parent / "legendas.srt").read_text().startswith("1\n00:00:00,000"))

    def test_ciclo_da_fila(self):
        f = {}
        fila.adicionar(f, "001", self.mp4, self.meta)
        with self.assertRaises(ValueError):  # mesmo arquivo com outro id
            fila.adicionar(f, "002", self.mp4, self.meta)
        with self.assertRaises(ValueError):  # roteiro sem aprovacao humana
            fila.aprovar(f, "001", "teste", ROTEIRO)
        aprovado = copy.deepcopy(ROTEIRO)
        for fonte in aprovado["fontes"]:
            fonte["verificada"] = True
        aprovado["revisao_humana"] = {"aprovado": True, "por": "teste", "em": "2026-10-13"}
        fila.aprovar(f, "001", "teste", aprovado)
        with self.assertRaises(ValueError):
            fila.marcar_publicado(f, "001", "sem-url")
        fila.marcar_publicado(f, "001", "https://www.tiktok.com/@x/video/1")
        with self.assertRaises(ValueError):  # nao regrava o que ja foi publicado
            fila.adicionar(f, "001", self.mp4, self.meta)

    def test_falhas_repetidas_pausam(self):
        f = {}
        fila.adicionar(f, "003", self.mp4, self.meta)
        estados = [fila.marcar_falha(f, "003", "erro") for _ in range(fila.MAX_TENTATIVAS)]
        self.assertEqual(estados[-1], "pausado")


class TestPainel(unittest.TestCase):
    def test_compara_apenas_mesma_idade(self):
        # Dados SINTETICOS de teste, nao sao resultados reais.
        linhas = [
            {"id": "a", "formato": "chat", "gancho_tipo": "frase", "idade_dias": "7", "views": "1000",
             "compart": "50", "salvos": "10", "coment": "5", "seguidores": "8", "conclusao_pct": "40",
             "cliques_bio": "3", "cadastros": "1"},
            {"id": "b", "formato": "lista", "gancho_tipo": "numero", "idade_dias": "3", "views": "9000",
             "compart": "90", "salvos": "10", "coment": "5", "seguidores": "8", "conclusao_pct": "30",
             "cliques_bio": "3", "cadastros": "1"},
        ]
        rel = painel.relatorio(linhas, idade=7)
        self.assertIn("a", rel)
        self.assertNotIn("| b |", rel)


if __name__ == "__main__":
    unittest.main()
