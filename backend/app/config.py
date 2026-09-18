# ============================================
# config.py
# Lecture des variables d'environnement
# ============================================
import os
from dotenv import load_dotenv

# Charger le fichier .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Variables de connexion à la base de données
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "5432")
DB_NAME     = os.getenv("DB_NAME", "integrateur_web_db")
DB_USER     = os.getenv("DB_USER", "nps_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
