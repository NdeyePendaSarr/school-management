# ============================================
# stats_service.py
# Calculs statistiques pour le dashboard
# ============================================
from app.database.connection import get_connection
from app.services.json_service import charger_json


def get_stats_globales():
    """
    Calcule les KPI globaux en combinant
    PostgreSQL et valides.json.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Nombre total en DB
        cursor.execute("SELECT COUNT(*) FROM etudiant")
        total_db = cursor.fetchone()[0]

        # Nombre archivés
        cursor.execute(
            "SELECT COUNT(*) FROM etudiant WHERE est_archive = TRUE"
        )
        total_archives = cursor.fetchone()[0]

        # Nombre valides en DB
        cursor.execute(
            "SELECT COUNT(*) FROM etudiant WHERE est_valide = TRUE"
        )
        total_valides_db = cursor.fetchone()[0]

        # Nombre invalides en DB
        cursor.execute(
            "SELECT COUNT(*) FROM etudiant WHERE est_valide = FALSE"
        )
        total_invalides_db = cursor.fetchone()[0]

        # Numéros déjà en base
        cursor.execute("SELECT numero FROM etudiant")
        numeros_en_base = {row[0] for row in cursor.fetchall()}

        # Données JSON non encore importées
        tous_json = charger_json()
        non_importes = [
            e for e in tous_json
            if e['numero'] not in numeros_en_base
        ]
        total_json = len(non_importes)

        return {
            "total_db":           total_db,
            "total_json":         total_json,
            "total_general":      total_db + total_json,
            "total_archives":     total_archives,
            "total_valides":      total_valides_db,
            "total_invalides":    total_invalides_db,
            "total_actifs":       total_db - total_archives
        }

    finally:
        cursor.close()
        conn.close()


def get_stats_classes():
    """
    Statistiques par classe :
    - nombre d'étudiants
    - moyenne générale de la classe
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                c.libelle_classe,
                COUNT(DISTINCT e.id_etudiant) AS nb_etudiants,
                ROUND(AVG(r.moyenne_matiere)::numeric, 2)
                    AS moyenne_classe
            FROM classe c
            LEFT JOIN etudiant e
                ON e.id_classe = c.id_classe
                AND e.est_archive = FALSE
            LEFT JOIN resultat_matiere r
                ON r.id_etudiant = e.id_etudiant
            GROUP BY c.libelle_classe
            ORDER BY c.libelle_classe
        """)

        colonnes = [desc[0] for desc in cursor.description]
        lignes   = cursor.fetchall()

        resultats = []
        for ligne in lignes:
            row = dict(zip(colonnes, ligne))
            row['moyenne_classe'] = float(row['moyenne_classe']) \
                if row['moyenne_classe'] else 0
            resultats.append(row)

        return resultats

    finally:
        cursor.close()
        conn.close()


def get_top_moyennes():
    """
    Top 10 des étudiants avec les meilleures
    moyennes générales.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                e.nom,
                e.prenom,
                c.libelle_classe,
                ROUND(AVG(r.moyenne_matiere)::numeric, 2)
                    AS moyenne_generale
            FROM etudiant e
            JOIN classe c ON e.id_classe = c.id_classe
            JOIN resultat_matiere r
                ON r.id_etudiant = e.id_etudiant
            WHERE e.est_archive = FALSE
            GROUP BY e.id_etudiant, e.nom, e.prenom,
                     c.libelle_classe
            ORDER BY moyenne_generale DESC
            LIMIT 10
        """)

        colonnes = [desc[0] for desc in cursor.description]
        lignes   = cursor.fetchall()

        resultats = []
        for ligne in lignes:
            row = dict(zip(colonnes, ligne))
            row['moyenne_generale'] = float(row['moyenne_generale'])
            row['nom_complet'] = f"{row['nom']} {row['prenom']}"
            resultats.append(row)

        return resultats

    finally:
        cursor.close()
        conn.close()
