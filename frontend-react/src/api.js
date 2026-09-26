// ============================================
// Accès à l'API FastAPI.
// URL relative : le backend sert le frontend construit, donc
// l'application fonctionne sur n'importe quel domaine.
// ============================================
const BASE = '/api/v1';

async function demander(chemin, options) {
    const reponse = await fetch(`${BASE}${chemin}`, options);
    if (!reponse.ok) {
        let detail = `Erreur ${reponse.status}`;
        try {
            const corps = await reponse.json();
            if (corps?.detail) detail = corps.detail;
        } catch {
            /* la réponse n'était pas du JSON : on garde le code */
        }
        throw new Error(detail);
    }
    return reponse.json();
}

const envoyer = (chemin, methode, corps) =>
    demander(chemin, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps)
    });

export const api = {
    etudiants:    (params) => demander(`/etudiants?${new URLSearchParams(params)}`),
    creer:        (corps)  => envoyer('/etudiants', 'POST', corps),
    modifier:     (id, c)  => envoyer(`/etudiants/${id}`, 'PUT', c),
    archiver:     (id)     => envoyer(`/etudiants/${id}/archive`, 'POST'),
    restaurer:    (id)     => envoyer(`/etudiants/${id}/restore`, 'POST'),

    classes:       () => demander('/stats/classes'),
    importer:      (numeros) => envoyer('/import/json', 'POST', numeros),

    globales:     () => demander('/stats/globales'),
    distribution: () => demander('/stats/distribution'),
    matieres:     () => demander('/stats/matieres'),
    aSuivre:      () => demander('/stats/eleves-a-suivre?limite=8'),
    topMoyennes:  () => demander('/stats/top-moyennes'),
    dispersion:   () => demander('/stats/dispersion-classes'),

    // Observabilité du pipeline d'ingestion
    qualite:      () => demander('/qualite/indicateurs'),
    rejets:       () => demander('/qualite/rejets'),
    runs:         () => demander('/qualite/runs?limite=6')
};

// ── Matières ────────────────────────────────
// La clé technique ("Francais") est celle de la base et du JSON :
// on ne la renomme pas, on l'affiche seulement correctement.
export const MATIERES = ['Math', 'Francais', 'Anglais', 'PC', 'SVT', 'HG'];

const LIBELLES = {
    Math:     'Mathématiques',
    Francais: 'Français',
    Anglais:  'Anglais',
    PC:       'Physique-Chimie',
    SVT:      'SVT',
    HG:       'Histoire-Géographie'
};

export const libelleMatiere = (cle) => LIBELLES[cle] || cle;

// ── Formatage ───────────────────────────────
export const note = (valeur) =>
    valeur === null || valeur === undefined || valeur === ''
        ? '—'
        : Number(valeur).toFixed(2).replace('.', ',');

/**
 * Les deux sources ne datent pas de la même façon : la base renvoie
 * de l'ISO (2012-01-02), le fichier JSON du jour/mois/année déjà
 * formaté. On accepte les deux plutôt que de supposer l'une.
 */
export const dateFr = (valeur) => {
    if (!valeur) return '—';
    const texte = String(valeur).slice(0, 10);
    if (texte.includes('/')) return texte;
    const [a, m, j] = texte.split('-');
    return j && m && a ? `${j}/${m}/${a}` : texte;
};

/**
 * Moyenne générale d'un élève.
 *
 * Les lignes de la base l'apportent déjà, calculée en SQL. Celles du
 * JSON ne sont pas encore en base : leur moyenne est dérivée des
 * notes par matière, à titre indicatif et sans être enregistrée.
 */
export const moyenneGenerale = (eleve) => {
    if (eleve.moyenne_generale !== undefined && eleve.moyenne_generale !== null) {
        return Number(eleve.moyenne_generale);
    }
    const parMatiere = Object.values(eleve.notes ?? {})
        .map((n) => n?.moyenne)
        .filter((n) => typeof n === 'number');

    if (!parMatiere.length) return null;
    return parMatiere.reduce((a, b) => a + b, 0) / parMatiere.length;
};

export const BARRE = 10;
