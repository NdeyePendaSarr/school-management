# ============================================
# main.py
# Point d'entrée de l'application FastAPI
# ============================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import etudiants, stats, import_json, qualite
from app.config import CORS_ORIGINS
import os

app = FastAPI(
    title="DEV DATA P8 - API",
    description="API de gestion des étudiants",
    version="1.0.0"
)

# Configuration CORS
# Liste blanche pilotée par la variable d'environnement CORS_ORIGINS.
# allow_origins=["*"] avec allow_credentials=True est refusé par les
# navigateurs et ouvre inutilement l'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

# ── Frontend ────────────────────────────────
# L'interface est une application React construite par Vite.
# `npm run build` produit frontend-react/dist, que FastAPI sert ici.
RACINE       = os.path.join(os.path.dirname(__file__), '..', '..')
FRONTEND_DIR = os.path.abspath(os.path.join(RACINE, 'frontend-react', 'dist'))
INDEX        = os.path.join(FRONTEND_DIR, 'index.html')

if os.path.isdir(os.path.join(FRONTEND_DIR, 'assets')):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIR, 'assets')),
        name="assets"
    )

# Enregistrement des routes API
app.include_router(etudiants.router,   prefix="/api/v1")
app.include_router(qualite.router, prefix="/api/v1", tags=["Qualité"])
app.include_router(stats.router,       prefix="/api/v1")
app.include_router(import_json.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    try:
        from app.database.connection import get_connection
        conn = get_connection()
        conn.close()
        return {
            "status": "ok",
            "message": "Serveur et base de données opérationnels"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def servir_application():
    """
    Renvoie l'application React.

    Le routage est géré côté navigateur : toutes les pages de
    l'interface partagent le même index.html.
    """
    if not os.path.isfile(INDEX):
        raise HTTPException(
            status_code=503,
            detail="Interface non construite. Lancez : "
                   "cd frontend-react && npm install && npm run build"
        )
    return FileResponse(INDEX)


@app.get("/")
def page_eleves():
    return servir_application()


@app.get("/dashboard")
def page_tableau_de_bord():
    return servir_application()
