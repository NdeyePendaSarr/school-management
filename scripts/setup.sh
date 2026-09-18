#!/usr/bin/env bash
# ============================================
# setup.sh — Installation du projet
# Crée l'environnement virtuel, installe les dépendances
# et initialise le schéma PostgreSQL.
# ============================================
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE/backend"

echo "==> Création de l'environnement virtuel"
python3 -m venv venv

echo "==> Installation des dépendances"
./venv/bin/pip install --upgrade pip --quiet
./venv/bin/pip install -r requirements.txt --quiet

if [ ! -f .env ]; then
    echo "==> Création du fichier .env à partir de .env.example"
    cp .env.example .env
    echo "    Renseignez vos identifiants PostgreSQL dans backend/.env"
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

echo "==> Initialisation du schéma PostgreSQL ($DB_NAME)"
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" \
    -f sql/init.sql

echo "==> Terminé. Lancez l'application avec : ./scripts/run.sh"
