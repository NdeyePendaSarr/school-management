# ============================================
# routes/stats.py
# Routes dashboard et statistiques
# ============================================
from fastapi import APIRouter
from app.services.stats_service import (
    get_stats_globales,
    get_stats_classes,
    get_top_moyennes
)

router = APIRouter()


@router.get("/stats/globales")
def stats_globales():
    """
    Retourne les KPI globaux de l'application.
    """
    return get_stats_globales()


@router.get("/stats/classes")
def stats_classes():
    """
    Retourne les statistiques par classe.
    """
    return get_stats_classes()


@router.get("/stats/top-moyennes")
def top_moyennes():
    """
    Retourne le top 10 des meilleures moyennes.
    """
    return get_top_moyennes()