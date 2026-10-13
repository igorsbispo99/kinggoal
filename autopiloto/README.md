# Projeto Autopiloto — Radar Antigolpe

Negócio de conteúdo curto sem rosto, com o TikTok como canal de aquisição.

- `docs/01-fase1-inteligencia-de-mercado.md`: 12 nichos, matriz ponderada, top 3 e a recomendação.
- `docs/02-primeira-entrega.md`: modelo de negócio, monetização, arquitetura, orçamento, plano de 30 dias, riscos e próximos passos.

## Como rodar

```bash
pip install -r requirements.txt            # e ffmpeg instalado no sistema
python3 ferramentas/matriz.py              # matriz de nichos + sensibilidade
python3 -m pipeline.qa                     # valida os roteiros
python3 -m pipeline.produzir --tts silencio            # render de teste, sem voz
AUTOPILOTO_TTS=azure AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=brazilsouth \
  python3 -m pipeline.produzir 001                     # produção (não testado ainda)
python3 -m pipeline.fila listar
python3 -m pipeline.fila aprovar 001 --por "Seu nome"  # só passa se o roteiro estiver aprovado e com fonte verificada
python3 -m pipeline.fila publicado 001 --url https://www.tiktok.com/@.../video/...
python3 -m pipeline.painel --idade 7
python3 -m unittest discover -s testes
```

## Fluxo de aprovação de um roteiro

1. Abra as URLs de `fontes`, confirme cada `afirmacao` na fonte primária e marque `"verificada": true`.
2. Preencha `revisao_humana`: `{"aprovado": true, "por": "nome", "em": "AAAA-MM-DD"}`.
3. Rode `python3 -m pipeline.qa`. O status deve aparecer como `PUBLICÁVEL`.
4. Publique no TikTok Studio. Ative o rótulo de conteúdo gerado por IA e adicione música da Biblioteca Comercial, se quiser.
5. Registre a URL com `pipeline.fila publicado`.

Chaves de API ficam **somente** em variáveis de ambiente, nunca no repositório.
