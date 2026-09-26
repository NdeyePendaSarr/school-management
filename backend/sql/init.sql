-- ============================================
-- PROJET DEV DATA P8
-- Script d'initialisation de la base de données
-- ============================================

-- Suppression dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS rejet CASCADE;
DROP TABLE IF EXISTS devoir CASCADE;
DROP TABLE IF EXISTS resultat_matiere CASCADE;
DROP TABLE IF EXISTS etudiant CASCADE;
DROP TABLE IF EXISTS import_run CASCADE;
DROP TABLE IF EXISTS matiere CASCADE;
DROP TABLE IF EXISTS classe CASCADE;

-- ============================================
-- TABLE IMPORT_RUN
-- Journal d'exécution du pipeline d'ingestion.
-- Une ligne par exécution, qu'elle soit lancée en ligne de
-- commande ou déclenchée depuis l'interface. Sans ce journal,
-- une ingestion qui se passe mal ne laisse aucune trace.
-- ============================================
CREATE TABLE import_run (
    id_run          SERIAL PRIMARY KEY,
    source          VARCHAR(160) NOT NULL,
    declencheur     VARCHAR(10)  NOT NULL
                    CHECK (declencheur IN ('CLI', 'API')),
    statut          VARCHAR(12)  NOT NULL DEFAULT 'EN_COURS'
                    CHECK (statut IN ('EN_COURS', 'SUCCES', 'ECHEC')),
    demarre_le      TIMESTAMP    NOT NULL DEFAULT NOW(),
    termine_le      TIMESTAMP,
    lignes_lues     INTEGER      NOT NULL DEFAULT 0,
    lignes_inserees INTEGER      NOT NULL DEFAULT 0,
    lignes_doublons INTEGER      NOT NULL DEFAULT 0,
    lignes_rejetees INTEGER      NOT NULL DEFAULT 0,
    message         TEXT
);

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
    id_classe      INTEGER      NOT NULL REFERENCES classe(id_classe),
    -- Traçabilité : quelle exécution du pipeline a chargé cette ligne.
    id_run         INTEGER      REFERENCES import_run(id_run)
);

CREATE INDEX idx_etudiant_numero  ON etudiant (numero);
CREATE INDEX idx_etudiant_archive ON etudiant (est_archive);
CREATE INDEX idx_etudiant_run     ON etudiant (id_run);

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
-- TABLE REJET
-- Quarantaine : une ligne écartée n'est pas perdue, elle est
-- conservée avec son motif et sa charge utile d'origine, pour
-- être corrigée puis réinjectée.
-- ============================================
CREATE TABLE rejet (
    id_rejet     SERIAL PRIMARY KEY,
    id_run       INTEGER REFERENCES import_run(id_run) ON DELETE CASCADE,
    numero       VARCHAR(40),
    code         VARCHAR(40),
    motif        VARCHAR(40) NOT NULL,
    detail       TEXT,
    charge_utile JSONB,
    rejete_le    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rejet_motif ON rejet (motif);
CREATE INDEX idx_rejet_run   ON rejet (id_run);

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

