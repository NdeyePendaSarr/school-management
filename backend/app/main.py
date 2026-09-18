# ============================================
# main.py
# Point d'entrée de l'application FastAPI
# ============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import etudiants, stats, import_json
import os

app = FastAPI(
    title="DEV DATA P8 - API",
    description="API de gestion des étudiants",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir les fichiers statiques du frontend
FRONTEND_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'frontend'
)
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

# Enregistrement des routes API
app.include_router(etudiants.router,   prefix="/api/v1")
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


@app.get("/")
def servir_index():
    """Sert la page principale"""
    chemin = os.path.join(FRONTEND_DIR, 'index.html')
    return FileResponse(chemin)


@app.get("/dashboard")
def servir_dashboard():
    """Sert la page dashboard"""
    chemin = os.path.join(FRONTEND_DIR, 'dashboard.html')
    return FileResponse(chemin)
