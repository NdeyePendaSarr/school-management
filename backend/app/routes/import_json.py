# ============================================
# routes/import_json.py
# ============================================
from fastapi import APIRouter
from app.services.json_service import (
    importer_selection,
    lire_json_pagine
)

router = APIRouter()


@router.get("/json/etudiants")
def liste_json(page: int = 1, limite: int = 5):
    """
    Retourne les étudiants du fichier JSON
    qui ne sont PAS encore dans PostgreSQL.
    Utilisé pour compléter l'affichage.
    """
    return lire_json_pagine(page=page, limite=limite)


@router.post("/import/json")
def importer_depuis_json(numeros: list[str]):
    """
    Importe une sélection depuis valides.json vers PostgreSQL.
    """
    return importer_selection(numeros)
