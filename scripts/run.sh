#!/usr/bin/env bash
# ============================================
# run.sh — Démarrage du serveur
# FastAPI sert l'API et l'interface React construite.
# ============================================
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$RACINE/backend/venv" ]; then
    echo "Environnement virtuel absent. Lancez d'abord ./scripts/setup.sh"
    exit 1
fi

if [ ! -f "$RACINE/frontend-react/dist/index.html" ]; then
    echo "Interface non construite. Lancez :"
    echo "  cd frontend-react && npm install && npm run build"
    exit 1
fi

cd "$RACINE/backend"
echo "==> http://localhost:8000"
exec ./venv/bin/uvicorn app.main:app --reload --port "${PORT:-8000}"
