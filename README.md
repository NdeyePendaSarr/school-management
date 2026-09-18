# DEV DATA P8 — Gestion des Étudiants

Application full-stack de gestion d'étudiants développée dans le cadre du projet intégrateur web. Elle fusionne deux sources de données — une base PostgreSQL modifiable et un fichier JSON hérité en lecture seule — et expose le tout via une API FastAPI et un tableau de bord interactif.

## Fonctionnalités

- Liste paginée des étudiants avec recherche et filtres (classe, source, validité, archives)
- Création, modification partielle et archivage logique (soft delete) des étudiants en base
- Import sélectif d'étudiants depuis `valides.json` (115 étudiants) vers PostgreSQL
- Traçabilité de l'origine de chaque étudiant (`DB` ou `IMPORT_JSON`) — seuls les enregistrements en base sont modifiables tant qu'ils n'ont pas été importés
- Dashboard avec 5 graphiques Chart.js (répartition par classe, par source, par validité, distribution des moyennes, top 10)
- Validation stricte des données (code élève, numéro, notes bornées 0–20, normalisation nom/prénom)

## Stack technique

| Composant | Technologie |
|---|---|
| Backend | FastAPI 0.115, Uvicorn |
| Base de données | PostgreSQL, accès via `psycopg2` (SQL brut paramétré, pas d'ORM) |
| Validation | Pydantic 2.7 |
| Frontend | HTML / CSS / JavaScript vanilla, Chart.js |
| Police / design | Plus Jakarta Sans + Instrument Serif |

## Structure du projet

```
projet_integrateur_web_fastAPI/
├── backend/
│   ├── app/
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── config.py            # Lecture des variables d'environnement
│   │   ├── database/
│   │   │   └── connection.py    # Connexion PostgreSQL
│   │   ├── models/
│   │   │   └── etudiant.py      # Schémas Pydantic + règles de validation
│   │   ├── routes/
│   │   │   ├── etudiants.py     # CRUD étudiants
│   │   │   ├── import_json.py   # Import depuis le JSON
│   │   │   └── stats.py         # Endpoints dashboard
│   │   └── services/            # Logique métier (requêtes SQL, fusion DB/JSON)
│   ├── data/
│   │   └── valides.json         # Étudiants hérités (115)
│   ├── sql/
│   │   └── init.sql             # Création des tables + données initiales
│   ├── requirements.txt
│   └── .env                     # Variables de connexion (non versionné)
├── frontend/
│   ├── index.html               # Tableau étudiants
│   ├── dashboard.html           # Dashboard statistiques
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       └── dashboard.js
├── scripts/
│   ├── setup.sh
│   └── run.sh
└── .gitignore
```

## Modèle de données

Cinq tables PostgreSQL avec cascades de suppression (supprimer un étudiant supprime ses résultats et devoirs) :

- **classe** — `id_classe`, `libelle_classe` (ex. `6emeA`)
- **matiere** — `id_matiere`, `libelle_matiere` (Math, Français, Anglais, PC, SVT, HG)
- **etudiant** — `id_etudiant`, `code`, `numero`, `nom`, `prenom`, `date_naissance`, `est_archive`, `est_valide`, `source`, `id_classe`
- **resultat_matiere** — note d'examen et moyenne par étudiant/matière (contrainte d'unicité sur le couple)
- **devoir** — notes de devoirs rattachées à un `resultat_matiere`

Le script `backend/sql/init.sql` crée les tables et insère les 6 matières et 16 classes (6ème à 3ème, sections A à D) de base.

## Installation

### Prérequis
- Python 3.12
- PostgreSQL (instance locale ou distante)

### 1. Cloner le dépôt

```bash
git clone https://github.com/NdeyePendaSarr/school-management.git
cd school-management
```

### 2. Créer l'environnement virtuel et installer les dépendances

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configurer la base de données

Créer un fichier `backend/.env` (non versionné, voir `.gitignore`) :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=integrateur_web_db
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
```

Puis initialiser le schéma :

```bash
psql -U votre_utilisateur -d integrateur_web_db -f sql/init.sql
```

### 4. Lancer le serveur

```bash
uvicorn app.main:app --reload
```

L'application est servie sur `http://localhost:8000` :
- `/` — tableau des étudiants
- `/dashboard` — statistiques
- `/api/v1/health` — vérifie que le serveur et la base répondent

## Endpoints API

Base : `/api/v1`

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/etudiants` | Liste paginée, recherche, filtres classe/validité/archive |
| GET | `/etudiants/{id}` | Détail complet d'un étudiant |
| POST | `/etudiants` | Création manuelle (validation stricte) |
| PUT | `/etudiants/{id}` | Modification partielle |
| POST | `/etudiants/{id}/archive` | Archivage logique |
| POST | `/etudiants/{id}/restore` | Restauration depuis les archives |
| GET | `/json/etudiants` | Étudiants du JSON pas encore importés en base |
| POST | `/import/json` | Importe une sélection du JSON vers PostgreSQL |
| GET | `/stats/globales` | KPI globaux du dashboard |
| GET | `/stats/classes` | Statistiques par classe |
| GET | `/stats/top-moyennes` | Top 10 des meilleures moyennes |

## Règles de validation

- **Code élève** : 3 lettres majuscules + 3 chiffres (ex. `AAD004`)
- **Numéro** : 7 caractères alphanumériques, normalisé en majuscules (ex. `H5G32YR`)
- **Notes** : bornées entre 0 et 20
- **Nom / prénom** : normalisés automatiquement (nom en majuscules, prénom en title-case)

## Notes

- `CORSMiddleware` autorise `allow_origins=["*"]` — adapté à un contexte pédagogique, à restreindre avant toute mise en production.
- Les requêtes SQL construisent le `WHERE` dynamiquement, mais les valeurs sont systématiquement passées en paramètres (`%s`), ce qui évite l'injection SQL malgré le f-string sur la structure de la clause.
