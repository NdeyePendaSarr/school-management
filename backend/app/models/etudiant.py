# ============================================
# models/etudiant.py
# ============================================
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
import re


class NoteMatiere(BaseModel):
    """
    Notes pour une matière.
    devoirs : liste de notes de devoirs
    examen  : note d'examen
    moyenne : calculée par le frontend
    """
    devoirs: list[float] = Field(..., min_length=1)
    examen:  float       = Field(..., ge=0, le=20)
    moyenne: float       = Field(..., ge=0, le=20)

    @field_validator('devoirs')
    @classmethod
    def valider_devoirs(cls, v):
        for note in v:
            if note < 0 or note > 20:
                raise ValueError(
                    f'Note {note} invalide — '
                    f'doit être entre 0 et 20'
                )
        return v


class EtudiantCreer(BaseModel):
    """
    Modèle complet pour la création d'un étudiant avec ses notes.
    """
    code:           str  = Field(..., min_length=6, max_length=6)
    numero:         str  = Field(..., min_length=7, max_length=7)
    nom:            str  = Field(..., min_length=2)
    prenom:         str  = Field(..., min_length=3)
    date_naissance: date
    classe:         str
    notes:          dict[str, NoteMatiere] = Field(default={})

    @field_validator('code')
    @classmethod
    def valider_code(cls, v):
        if not re.match(r'^[A-Z]{3}[0-9]{3}$', v):
            raise ValueError(
                'Code : 3 lettres majuscules + 3 chiffres. Ex: AAD004'
            )
        return v

    @field_validator('numero')
    @classmethod
    def valider_numero(cls, v):
        if not re.match(r'^[A-Z0-9]{7}$', v.upper()):
            raise ValueError(
                'Numéro : 7 caractères alphanumériques. Ex: H5G32YR'
            )
        return v.upper()

    @field_validator('nom')
    @classmethod
    def valider_nom(cls, v):
        v = v.strip()
        if not v[0].isalpha():
            raise ValueError('Le nom doit commencer par une lettre')
        return v.upper()

    @field_validator('prenom')
    @classmethod
    def valider_prenom(cls, v):
        v = v.strip()
        if not v[0].isalpha():
            raise ValueError('Le prénom doit commencer par une lettre')
        return v.title()


class EtudiantModifier(BaseModel):
    """
    Modification partielle — tous les champs optionnels.
    """
    nom:            Optional[str]  = Field(default=None, min_length=2)
    prenom:         Optional[str]  = Field(default=None, min_length=3)
    date_naissance: Optional[date] = None
    classe:         Optional[str]  = None

    @field_validator('nom')
    @classmethod
    def normaliser_nom(cls, v):
        if v is not None:
            return v.strip().upper()
        return v

    @field_validator('prenom')
    @classmethod
    def normaliser_prenom(cls, v):
        if v is not None:
            return v.strip().title()
        return v