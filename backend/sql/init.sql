-- ============================================
-- PROJET DEV DATA P8
-- Script d'initialisation de la base de données
-- ============================================

-- Suppression dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS devoir CASCADE;
DROP TABLE IF EXISTS resultat_matiere CASCADE;
DROP TABLE IF EXISTS etudiant CASCADE;
DROP TABLE IF EXISTS matiere CASCADE;
DROP TABLE IF EXISTS classe CASCADE;

-- ============================================
-- TABLE CLASSE
-- ============================================
CREATE TABLE classe (
    id_classe      SERIAL PRIMARY KEY,
    libelle_classe VARCHAR(20) NOT NULL UNIQUE
);

-- ============================================
-- TABLE MATIERE
-- ============================================
CREATE TABLE matiere (
    id_matiere      SERIAL PRIMARY KEY,
    libelle_matiere VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================
-- TABLE ETUDIANT
-- ============================================
CREATE TABLE etudiant (
    id_etudiant    SERIAL PRIMARY KEY,
    code           VARCHAR(6)   NOT NULL,
    numero         VARCHAR(7)   NOT NULL UNIQUE,
    nom            VARCHAR(100) NOT NULL,
    prenom         VARCHAR(100) NOT NULL,
    date_naissance DATE         NOT NULL,
    est_archive    BOOLEAN      NOT NULL DEFAULT FALSE,
    est_valide     BOOLEAN      NOT NULL DEFAULT TRUE,
    source         VARCHAR(20)  NOT NULL DEFAULT 'IMPORT_JSON',
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    id_classe      INTEGER      NOT NULL REFERENCES classe(id_classe)
);

-- ============================================
-- TABLE RESULTAT_MATIERE
-- ============================================
CREATE TABLE resultat_matiere (
    id_resultat     SERIAL PRIMARY KEY,
    note_examen     NUMERIC(5,2) NOT NULL,
    moyenne_matiere NUMERIC(5,2) NOT NULL,
    id_etudiant     INTEGER NOT NULL REFERENCES etudiant(id_etudiant)
                    ON DELETE CASCADE,
    id_matiere      INTEGER NOT NULL REFERENCES matiere(id_matiere),
    CONSTRAINT uq_etudiant_matiere UNIQUE (id_etudiant, id_matiere)
);

-- ============================================
-- TABLE DEVOIR
-- ============================================
CREATE TABLE devoir (
    id_devoir   SERIAL PRIMARY KEY,
    note_devoir NUMERIC(5,2) NOT NULL,
    id_resultat INTEGER NOT NULL REFERENCES resultat_matiere(id_resultat)
                ON DELETE CASCADE
);

-- ============================================
-- DONNEES INITIALES : MATIERES
-- ============================================
INSERT INTO matiere (libelle_matiere) VALUES
    ('Math'),
    ('Francais'),
    ('Anglais'),
    ('PC'),
    ('SVT'),
    ('HG');

-- ============================================
-- DONNEES INITIALES : CLASSES
-- ============================================
INSERT INTO classe (libelle_classe) VALUES
    ('6emeA'), ('6emeB'), ('6emeC'), ('6emeD'),
    ('5emeA'), ('5emeB'), ('5emeC'), ('5emeD'),
    ('4emeA'), ('4emeB'), ('4emeC'), ('4emeD'),
    ('3emeA'), ('3emeB'), ('3emeC'), ('3emeD');

