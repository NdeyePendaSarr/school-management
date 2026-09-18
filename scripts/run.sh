#!/usr/bin/env bash
# ============================================
# run.sh — Démarrage du serveur de développement
# ============================================
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE/backend"

if [ ! -d venv ]; then
    echo "Environnement virtuel absent. Lancez d'abord ./scripts/setup.sh"
    exit 1
fi

echo "==> Application disponible sur http://localhost:8000"
exec ./venv/bin/uvicorn app.main:app --reload --port "${PORT:-8000}"
