# ============================================
# pipeline/__main__.py
# Ingestion en ligne de commande
#
#   python -m app.pipeline                        (valides.json)
#   python -m app.pipeline --fichier chemin.json
#   python -m app.pipeline --rapport-seul
# ============================================
import argparse
import os
import sys

from app.pipeline.ingestion import executer_ingestion


def chemin_par_defaut():
    racine = os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))
    return os.path.join(racine, 'data', 'valides.json')


def afficher(rapport):
    largeur = 58
    print()
    print('─' * largeur)
    print(f"  Ingestion #{rapport['id_run']}  ·  {rapport['source']}")
    print('─' * largeur)
    print(f"  Lignes lues        {rapport['lues']:>6}")
    print(f"  Insérées           {rapport['inserees']:>6}")
    print(f"  Doublons ignorés   {rapport['doublons']:>6}")
    print(f"  Rejetées           {rapport['rejetees']:>6}")

    if rapport['motifs']:
        print('─' * largeur)
        print('  Motifs de rejet')
        for motif, nombre in sorted(rapport['motifs'].items(),
                                    key=lambda x: -x[1]):
            print(f"    {motif:<20} {nombre:>5}")

    controle = (rapport['inserees'] + rapport['doublons']
                + rapport['rejetees'])
    print('─' * largeur)
    print(f"  Contrôle : {controle} lignes traitées sur "
          f"{rapport['lues']} lues")
    print(f"  Statut   : {rapport['statut']}")
    print('─' * largeur)
    print()


def principal():
    analyseur = argparse.ArgumentParser(
        prog='python -m app.pipeline',
        description="Ingère un fichier JSON d'étudiants dans PostgreSQL. "
                    "L'opération est idempotente : une relance sur le même "
                    "fichier n'insère rien de nouveau."
    )
    analyseur.add_argument(
        '--fichier', default=chemin_par_defaut(),
        help="Chemin du fichier JSON (défaut : backend/data/valides.json)"
    )
    arguments = analyseur.parse_args()

    try:
        afficher(executer_ingestion(arguments.fichier, declencheur='CLI'))
        return 0
    except FileNotFoundError as erreur:
        print(f"Erreur : {erreur}", file=sys.stderr)
        return 1
    except Exception as erreur:
        print(f"Ingestion interrompue : {erreur}", file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(principal())
