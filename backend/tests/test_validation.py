# ============================================
# tests/test_validation.py
# Tests des règles de validation Pydantic.
# Aucune base de données requise : on teste les modèles seuls.
# ============================================
import pytest
from pydantic import ValidationError

from app.models.etudiant import EtudiantCreer, EtudiantModifier, NoteMatiere


def etudiant_valide(**surcharges):
    base = {
        "code": "AAD004",
        "numero": "H5G32YR",
        "nom": "diallo",
        "prenom": "nourou",
        "date_naissance": "2012-01-02",
        "classe": "6emeA",
    }
    base.update(surcharges)
    return base


# ── Code élève ──────────────────────────────

def test_code_valide_est_accepte():
    assert EtudiantCreer(**etudiant_valide()).code == "AAD004"


@pytest.mark.parametrize("code", ["aad004", "AAD04", "AA1004", "AAD0045"])
def test_code_mal_forme_est_refuse(code):
    with pytest.raises(ValidationError):
        EtudiantCreer(**etudiant_valide(code=code))


# ── Numéro ──────────────────────────────────

def test_numero_est_normalise_en_majuscules():
    etudiant = EtudiantCreer(**etudiant_valide(numero="h5g32yr"))
    assert etudiant.numero == "H5G32YR"


@pytest.mark.parametrize("numero", ["H5G32Y", "H5G32YRS", "H5G-2YR"])
def test_numero_mal_forme_est_refuse(numero):
    with pytest.raises(ValidationError):
        EtudiantCreer(**etudiant_valide(numero=numero))


# ── Normalisation nom / prénom ──────────────

def test_nom_en_majuscules_et_prenom_en_title_case():
    etudiant = EtudiantCreer(**etudiant_valide(nom="  diallo ", prenom=" nourou "))
    assert etudiant.nom == "DIALLO"
    assert etudiant.prenom == "Nourou"


def test_nom_ne_peut_pas_commencer_par_un_chiffre():
    with pytest.raises(ValidationError):
        EtudiantCreer(**etudiant_valide(nom="4diallo"))


def test_modification_partielle_normalise_aussi():
    modif = EtudiantModifier(prenom="  awa ")
    assert modif.prenom == "Awa"
    assert modif.nom is None


# ── Notes bornées 0–20 ──────────────────────

def test_note_dans_les_bornes_est_acceptee():
    note = NoteMatiere(devoirs=[14, 15], examen=10, moyenne=11.5)
    assert note.moyenne == 11.5


@pytest.mark.parametrize("devoirs", [[21], [-1], [14, 25]])
def test_devoir_hors_bornes_est_refuse(devoirs):
    with pytest.raises(ValidationError):
        NoteMatiere(devoirs=devoirs, examen=10, moyenne=11.5)


def test_examen_hors_bornes_est_refuse():
    with pytest.raises(ValidationError):
        NoteMatiere(devoirs=[14], examen=21, moyenne=11.5)


def test_liste_de_devoirs_vide_est_refusee():
    with pytest.raises(ValidationError):
        NoteMatiere(devoirs=[], examen=10, moyenne=10)
