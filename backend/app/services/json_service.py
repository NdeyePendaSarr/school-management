# ============================================
# json_service.py
# Import des données depuis valides.json
# vers PostgreSQL
# ============================================
import json
import os
from datetime import datetime
from app.database.connection import get_connection


def charger_json():
    """
    Lit et retourne le contenu de valides.json
    """
    chemin = os.path.join(
        os.path.dirname(__file__),
        '..', '..', 'data', 'valides.json'
    )
    with open(chemin, 'r', encoding='utf-8') as f:
        return json.load(f)


def convertir_date(date_str):
    """
    Convertit une date du format JJ/MM/AAAA
    vers un objet date Python compatible PostgreSQL.
    """
    return datetime.strptime(date_str, "%d/%m/%Y").date()


def normaliser_classe(classe_str):
    """
    Normalise le nom de classe.
    """
    return classe_str.strip()


def importer_tout():
    """
    Importe tous les étudiants de valides.json dans PostgreSQL.
    """
    etudiants = charger_json()
    conn = get_connection()
    cursor = conn.cursor()

    compteur_ok    = 0
    compteur_skip  = 0
    compteur_erreur = 0

    try:
        for etudiant in etudiants:
            try:
                classe_libelle = normaliser_classe(etudiant['classe'])
                cursor.execute(
                    "SELECT id_classe FROM classe "
                    "WHERE libelle_classe = %s",
                    (classe_libelle,)
                )
                resultat_classe = cursor.fetchone()

                if resultat_classe is None:
                    print(f"  CLASSE INCONNUE : {classe_libelle} "
                          f"pour {etudiant['numero']}")
                    compteur_skip += 1
                    continue

                id_classe = resultat_classe[0]

                cursor.execute(
                    "SELECT id_etudiant FROM etudiant "
                    "WHERE numero = %s",
                    (etudiant['numero'],)
                )
                if cursor.fetchone() is not None:
                    print(f"  DOUBLON ignoré : {etudiant['numero']}")
                    compteur_skip += 1
                    continue

                date_naissance = convertir_date(etudiant['date_naissance'])

                cursor.execute("""
                    INSERT INTO etudiant
                        (code, numero, nom, prenom,
                         date_naissance, id_classe,
                         est_archive, est_valide, source)
                    VALUES (%s, %s, %s, %s, %s, %s,
                            FALSE, TRUE, 'IMPORT_JSON')
                    RETURNING id_etudiant
                """, (
                    etudiant['code'],
                    etudiant['numero'],
                    etudiant['nom'].upper(),
                    etudiant['prenom'].title(),
                    date_naissance,
                    id_classe
                ))
                id_etudiant = cursor.fetchone()[0]

                for matiere_nom, donnees in etudiant['notes'].items():
                    cursor.execute(
                        "SELECT id_matiere FROM matiere "
                        "WHERE libelle_matiere = %s",
                        (matiere_nom,)
                    )
                    resultat_matiere = cursor.fetchone()

                    if resultat_matiere is None:
                        print(f"  MATIERE INCONNUE : {matiere_nom}")
                        continue

                    id_matiere = resultat_matiere[0]

                    cursor.execute("""
                        INSERT INTO resultat_matiere
                            (note_examen, moyenne_matiere,
                             id_etudiant, id_matiere)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id_resultat
                    """, (
                        donnees['examen'],
                        donnees['moyenne'],
                        id_etudiant,
                        id_matiere
                    ))
                    id_resultat = cursor.fetchone()[0]

                    for note_devoir in donnees['devoirs']:
                        cursor.execute("""
                            INSERT INTO devoir
                                (note_devoir, id_resultat)
                            VALUES (%s, %s)
                        """, (note_devoir, id_resultat))

                compteur_ok += 1

            except Exception as e:
                print(f"  ERREUR pour "
                      f"{etudiant.get('numero', '?')} : {e}")
                conn.rollback()
                compteur_erreur += 1
                continue

        conn.commit()

    finally:
        cursor.close()
        conn.close()

    print(f"\n Import terminé :")
    print(f"   Insérés avec succès  : {compteur_ok}")
    print(f"   Ignorés              : {compteur_skip}")
    print(f"   Erreurs              : {compteur_erreur}")


if __name__ == "__main__":
    importer_tout()


def lire_json():
    """
    Retourne les données de valides.json sous forme
    de dictionnaire indexé par numero.
    """
    etudiants = charger_json()
    return {e['numero']: e for e in etudiants}


def importer_selection(numeros: list):
    """
    Importe la sélection faite depuis l'interface.

    L'import déclenché par un clic emprunte exactement le même
    pipeline que l'ingestion en ligne de commande : mêmes règles de
    validation, même quarantaine, même journal d'exécution. Deux
    chemins d'entrée, une seule logique — sinon les deux finissent
    par diverger.
    """
    import os
    from app.pipeline.ingestion import executer_ingestion

    chemin = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)))),
        'data', 'valides.json'
    )

    rapport = executer_ingestion(chemin, declencheur='API', numeros=numeros)

    return {
        "id_run":         rapport['id_run'],
        "total_importes": rapport['inserees'],
        "doublons":       rapport['doublons'],
        "rejetes":        rapport['rejetees'],
        "motifs":         rapport['motifs']
    }


def lire_json_pagine(page=1, limite=5):
    """
    Retourne les étudiants du JSON qui ne sont
    pas encore dans PostgreSQL, avec pagination.
    Normalise nom et prénom à la volée.
    """
    tous = charger_json()
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT numero FROM etudiant")
        numeros_en_base = {row[0] for row in cursor.fetchall()}

        non_importes = [
            e for e in tous
            if e['numero'] not in numeros_en_base
        ]

        total     = len(non_importes)
        offset    = (page - 1) * limite
        page_data = non_importes[offset:offset + limite]

        # Normaliser nom/prénom et ajouter origine
        for e in page_data:
            e['origine'] = 'JSON'
            e['nom']     = e['nom'].upper()
            e['prenom']  = e['prenom'].title()

        return {
            "data": page_data,
            "pagination": {
                "page":        page,
                "limite":      limite,
                "total":       total,
                "total_pages": -(-total // limite)
                               if total > 0 else 0
            }
        }

    finally:
        cursor.close()
        conn.close()

def lire_json_filtre(recherche=None, classe=None):
    """
    Étudiants du JSON absents de PostgreSQL, filtrés et normalisés.

    Sert de source secondaire à la fusion : les mêmes critères que
    la requête SQL sont appliqués ici, sinon la page mélangerait
    des lignes filtrées et des lignes qui ne le sont pas.
    """
    tous = charger_json()
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT numero FROM etudiant")
        numeros_en_base = {ligne[0] for ligne in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()

    resultats = []
    terme = recherche.lower() if recherche else None

    for e in tous:
        if e['numero'] in numeros_en_base:
            continue
        if classe and e.get('classe') != classe:
            continue

        nom    = e['nom'].upper()
        prenom = e['prenom'].title()

        if terme and not any(
            terme in champ.lower()
            for champ in (nom, prenom, e['numero'], e['code'])
        ):
            continue

        moyennes = [n['moyenne'] for n in e.get('notes', {}).values()
                    if n.get('moyenne') is not None]

        resultats.append({
            **e,
            'nom':              nom,
            'prenom':           prenom,
            'libelle_classe':   e.get('classe'),
            'origine':          'JSON',
            'moyenne_generale': round(sum(moyennes) / len(moyennes), 2)
                                if moyennes else None
        })

    return resultats
