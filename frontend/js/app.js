// ============================================
// app.js — Logique principale du frontend
// ============================================

const API = 'http://localhost:8000/api/v1';

// ── État global de l'application ──
const etat = {
    page:       1,
    limite:     5,
    recherche:  '',
    classe:     '',
    source:     'tous',
    archive:    false,
    validite:   '',
    total:      0,
    totalPages: 0,
    selection:  new Set()
};

// ── Initialisation au chargement ──
document.addEventListener('DOMContentLoaded', () => {
    chargerClasses();
    chargerDonnees();
    attacherEvenements();

    document.getElementById('modalOverlay')
        .addEventListener('click', function(e) {
            if (e.target === this) fermerModal();
        });
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function chargerDonnees() {
    afficherChargement(true);

    try {
        const params = new URLSearchParams({
            page:   etat.page,
            limite: etat.limite
        });
        if (etat.recherche) params.append('recherche', etat.recherche);
        if (etat.classe)    params.append('classe',    etat.classe);
        if (etat.archive)   params.append('archive',   'true');
        if (etat.validite)  params.append('valide',    etat.validite);

        const repDB  = await fetch(`${API}/etudiants?${params}`);
        const dataDB = await repDB.json();

        let etudiants  = dataDB.data;
        let total_db   = dataDB.pagination.total;
        let totalPages = dataDB.pagination.total_pages;

        // Compléter avec JSON si nécessaire
        if (etudiants.length < etat.limite
            && !etat.archive
            && etat.source !== 'db'
            && !etat.validite) {

            const manquants     = etat.limite - etudiants.length;
            const offset_global = (etat.page - 1) * etat.limite;
            const offset_json   = Math.max(
                0, offset_global - total_db
            );
            const page_json     = Math.floor(
                offset_json / manquants
            ) + 1;

            const repJSON  = await fetch(
                `${API}/json/etudiants` +
                `?page=${page_json}&limite=${manquants}`
            );
            const dataJSON = await repJSON.json();

            let jsonFiltres = dataJSON.data;

            if (etat.recherche) {
                const terme = etat.recherche.toLowerCase();
                jsonFiltres = jsonFiltres.filter(e =>
                    e.nom.toLowerCase().includes(terme)    ||
                    e.prenom.toLowerCase().includes(terme) ||
                    e.numero.toLowerCase().includes(terme) ||
                    e.code.toLowerCase().includes(terme)
                );
            }
            if (etat.classe) {
                jsonFiltres = jsonFiltres.filter(
                    e => e.classe === etat.classe
                );
            }

            etudiants = [...etudiants, ...jsonFiltres];

            const total_json = dataJSON.pagination.total;
            const total      = total_db + total_json;
            totalPages       = Math.ceil(total / etat.limite) || 1;

            etat.total      = total;
            etat.totalPages = totalPages;

        } else {
            etat.total      = total_db;
            etat.totalPages = totalPages;
        }

        // Filtrer par source si demandé
        if (etat.source === 'db') {
            etudiants = etudiants.filter(e => e.origine === 'DB');
        } else if (etat.source === 'json') {
            etudiants = etudiants.filter(e => e.origine === 'JSON');
        }

        afficherTableau(etudiants);
        afficherPagination();
        afficherInfo(etat.total);

    } catch (err) {
        console.error(err);
        afficherErreur('Impossible de charger les données');
    } finally {
        afficherChargement(false);
    }
}

async function chargerClasses() {
    try {
        const rep  = await fetch(`${API}/etudiants?page=1&limite=500`);
        const data = await rep.json();
        const classes = [
            ...new Set(data.data.map(e => e.libelle_classe))
        ].sort();

        const select = document.getElementById('filtreClasse');
        classes.forEach(c => {
            const opt       = document.createElement('option');
            opt.value       = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Erreur chargement classes', err);
    }
}

// ============================================
// AFFICHAGE
// ============================================

function afficherTableau(etudiants) {
    const tbody = document.getElementById('tbody');

    if (etudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;
                    padding:40px; color:#64748b;">
                    Aucun étudiant trouvé
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = etudiants.map(e => {
        const estJSON    = e.origine === 'JSON';
        const badgeClass = estJSON ? 'badge-json' : 'badge-db';
        const badgeTexte = estJSON ? 'JSON' : 'DB';

        let moyenne = e.moyenne_generale;
        if (moyenne === undefined && e.notes) {
            const moyennes = Object.values(e.notes)
                .map(n => n.moyenne);
            moyenne = moyennes.length
                ? (moyennes.reduce((a, b) => a + b, 0)
                   / moyennes.length).toFixed(2)
                : '-';
        }

        let boutonsActions = '';
        if (estJSON) {
            boutonsActions = `
                <span style="color:#94a3b8; font-size:12px;">
                    Lecture seule
                </span>`;
        } else if (etat.archive) {
            boutonsActions = `
                <button class="btn btn-success btn-sm"
                    onclick="restaurerEtudiant(${e.id_etudiant})"
                    title="Restaurer">
                    ♻️ Restaurer
                </button>`;
        } else {
            boutonsActions = `
                <div style="display:flex; flex-direction:column;
                            gap:4px;">
                    <label style="display:flex; align-items:center;
                                  gap:6px; cursor:pointer;
                                  font-size:12px; white-space:nowrap;">
                        <input type="checkbox"
                            class="cb-mode-edition"
                            onchange="toggleModeEdition(
                                this, ${e.id_etudiant})">
                        Mode édition
                    </label>
                    <button class="btn btn-danger btn-sm"
                        onclick="archiverEtudiant(${e.id_etudiant})"
                        title="Archiver">
                        🗄️ Archiver
                    </button>
                </div>`;
        }

        return `
        <tr data-id="${e.id_etudiant || ''}"
            data-numero="${e.numero}"
            data-origine="${e.origine}"
            data-date-iso="${e.date_naissance || ''}">
            <td>
                <input type="checkbox"
                    class="cb-selection"
                    data-numero="${e.numero}"
                    ${estJSON ? '' : 'disabled'}
                    ${etat.selection.has(e.numero)
                        ? 'checked' : ''}>
            </td>
            <td>${e.code}</td>
            <td>${e.numero}</td>
            <td>${e.nom}</td>
            <td>${e.prenom}</td>
            <td data-iso="${e.date_naissance || ''}">
                ${formaterDate(e.date_naissance)}
            </td>
            <td>${e.libelle_classe || e.classe}</td>
            <td>${moyenne ?? '-'}</td>
            <td>
                <span class="badge ${badgeClass}">
                    ${badgeTexte}
                </span>
            </td>
            <td>${boutonsActions}</td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.cb-selection').forEach(cb => {
        cb.addEventListener('change', e => {
            const numero = e.target.dataset.numero;
            if (e.target.checked) {
                etat.selection.add(numero);
            } else {
                etat.selection.delete(numero);
            }
            majBoutonImport();
        });
    });
}

function afficherPagination() {
    const conteneur = document.getElementById('pagination');
    const { page, totalPages } = etat;
    let html = '';

    html += `<button class="page-btn"
        onclick="changerPage(${page - 1})"
        ${page <= 1 ? 'disabled' : ''}>‹</button>`;

    const debut = Math.max(1, page - 2);
    const fin   = Math.min(totalPages, page + 2);

    if (debut > 1) {
        html += `<button class="page-btn"
            onclick="changerPage(1)">1</button>`;
        if (debut > 2) html +=
            `<span style="padding:0 4px">…</span>`;
    }

    for (let i = debut; i <= fin; i++) {
        html += `<button class="page-btn
            ${i === page ? 'active' : ''}"
            onclick="changerPage(${i})">${i}</button>`;
    }

    if (fin < totalPages) {
        if (fin < totalPages - 1) html +=
            `<span style="padding:0 4px">…</span>`;
        html += `<button class="page-btn"
            onclick="changerPage(${totalPages})">
            ${totalPages}</button>`;
    }

    html += `<button class="page-btn"
        onclick="changerPage(${page + 1})"
        ${page >= totalPages ? 'disabled' : ''}>›</button>`;

    conteneur.innerHTML = html;
}

function afficherInfo(total) {
    const debut = (etat.page - 1) * etat.limite + 1;
    const fin   = Math.min(etat.page * etat.limite, total);
    document.getElementById('paginationInfo').textContent =
        total > 0
        ? `Affichage ${debut}–${fin} sur ${total} étudiants`
        : 'Aucun résultat';
}

function afficherChargement(actif) {
    document.getElementById('loading').style.display =
        actif ? 'block' : 'none';
    document.getElementById('tableWrapper').style.display =
        actif ? 'none' : 'block';
}

function afficherErreur(msg) {
    document.getElementById('tbody').innerHTML = `
        <tr><td colspan="10" style="text-align:center;
            color:#dc2626; padding:40px;">${msg}</td></tr>`;
}

// ============================================
// PAGINATION ET FILTRES
// ============================================

function changerPage(page) {
    if (page < 1 || page > etat.totalPages) return;
    etat.page = page;
    chargerDonnees();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function majBoutonImport() {
    const btn = document.getElementById('btnImporter');
    if (!btn) return;
    btn.disabled    = etat.selection.size === 0;
    btn.textContent = etat.selection.size > 0
        ? `⬆️ Importer (${etat.selection.size})`
        : '⬆️ Importer sélection';
}

async function importerSelection() {
    if (etat.selection.size === 0) return;

    const numeros = [...etat.selection];
    try {
        const rep = await fetch(`${API}/import/json`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(numeros)
        });
        const resultat = await rep.json();
        afficherToast(
            `${resultat.total_importes} étudiant(s) importé(s)`,
            'success'
        );
        etat.selection.clear();
        majBoutonImport();
        chargerDonnees();
    } catch (err) {
        afficherToast("Erreur lors de l'import", 'error');
    }
}

async function archiverEtudiant(id) {
    if (!confirm('Archiver cet étudiant ?')) return;
    try {
        const rep = await fetch(
            `${API}/etudiants/${id}/archive`,
            { method: 'POST' }
        );
        if (rep.ok) {
            afficherToast('Étudiant archivé', 'success');
            chargerDonnees();
        } else {
            const err = await rep.json();
            afficherToast(err.detail, 'error');
        }
    } catch (err) {
        afficherToast('Erreur archivage', 'error');
    }
}

async function restaurerEtudiant(id) {
    try {
        const rep = await fetch(
            `${API}/etudiants/${id}/restore`,
            { method: 'POST' }
        );
        if (rep.ok) {
            afficherToast('Étudiant restauré', 'success');
            chargerDonnees();
        } else {
            const err = await rep.json();
            afficherToast(err.detail, 'error');
        }
    } catch (err) {
        afficherToast('Erreur restauration', 'error');
    }
}

// ============================================
// MODE ÉDITION LIGNE COMPLÈTE
// ============================================

function toggleModeEdition(checkbox, idEtudiant) {
    const tr = checkbox.closest('tr');

    if (checkbox.checked) {
        const tdNom  = tr.cells[3];
        const valNom = tdNom.textContent.trim();
        tdNom.innerHTML = `
            <input type="text" class="edit-field"
                value="${valNom}"
                style="padding:4px; width:100%;
                       border:1px solid #2563eb;
                       border-radius:4px;">`;

        const tdPrenom  = tr.cells[4];
        const valPrenom = tdPrenom.textContent.trim();
        tdPrenom.innerHTML = `
            <input type="text" class="edit-field"
                value="${valPrenom}"
                style="padding:4px; width:100%;
                       border:1px solid #2563eb;
                       border-radius:4px;">`;

        const tdDate  = tr.cells[5];
        const isoDate = tdDate.dataset.iso || '';
        tdDate.innerHTML = `
            <input type="date" class="edit-field"
                value="${isoDate}"
                style="padding:4px;
                       border:1px solid #2563eb;
                       border-radius:4px;">`;

        const tdClasse  = tr.cells[6];
        const valClasse = tdClasse.textContent.trim();
        tdClasse.innerHTML = `
            <select class="edit-field"
                style="padding:4px;
                       border:1px solid #2563eb;
                       border-radius:4px;">
                ${genererOptionsClasses()}
            </select>`;
        tdClasse.querySelector('select').value = valClasse;

        const tdActions = tr.cells[tr.cells.length - 1];
        tdActions.innerHTML = `
            <div style="display:flex; flex-direction:column;
                        gap:4px;">
                <label style="display:flex; align-items:center;
                              gap:6px; cursor:pointer;
                              font-size:12px;">
                    <input type="checkbox"
                        class="cb-mode-edition" checked
                        onchange="toggleModeEdition(
                            this, ${idEtudiant})">
                    Mode édition
                </label>
                <button class="btn btn-success btn-sm"
                    onclick="sauvegarderLigne(
                        ${idEtudiant},
                        this.closest('tr'))">
                    💾 Sauvegarder
                </button>
            </div>`;

    } else {
        chargerDonnees();
    }
}

async function sauvegarderLigne(idEtudiant, tr) {
    const champs = tr.querySelectorAll('.edit-field');

    if (champs.length < 4) {
        afficherToast('Erreur : champs introuvables', 'error');
        return;
    }

    const donnees = {
        nom:            champs[0].value.trim(),
        prenom:         champs[1].value.trim(),
        date_naissance: champs[2].value,
        classe:         champs[3].value
    };

    try {
        const rep = await fetch(`${API}/etudiants/${idEtudiant}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(donnees)
        });

        if (rep.ok) {
            afficherToast('Modifications sauvegardées', 'success');
            chargerDonnees();
        } else {
            const err = await rep.json();
            afficherToast(err.detail || 'Erreur', 'error');
        }
    } catch (err) {
        afficherToast('Erreur réseau', 'error');
    }
}

// ============================================
// MODIFICATION INLINE (double-clic cellule)
// ============================================

document.addEventListener('dblclick', function(e) {
    const td = e.target.closest('td');
    const tr = e.target.closest('tr');

    if (!td || !tr) return;
    if (tr.dataset.origine !== 'DB') return;

    const index = td.cellIndex;
    if (index !== 3 && index !== 4) return;
    if (td.querySelector('input')) return;

    const valeurActuelle = td.textContent.trim();
    const idEtudiant     = tr.dataset.id;
    const champ          = index === 3 ? 'nom' : 'prenom';

    td.innerHTML = `
        <input type="text"
            value="${valeurActuelle}"
            style="width:100%; padding:4px 8px;
                   border:2px solid #2563eb;
                   border-radius:4px; font-size:14px;"
            onkeydown="gererToucheInline(event, this,
                ${idEtudiant}, '${champ}',
                '${valeurActuelle}')"
            autofocus>
    `;
});

async function gererToucheInline(event, input,
                                  idEtudiant, champ,
                                  valeurOriginale) {
    if (event.key === 'Escape') {
        input.closest('td').textContent = valeurOriginale;
        return;
    }

    if (event.key === 'Enter') {
        const nouvelleValeur = input.value.trim();
        if (!nouvelleValeur) {
            afficherToast('La valeur ne peut pas être vide', 'error');
            return;
        }

        try {
            const corps  = {};
            corps[champ] = nouvelleValeur;

            const rep = await fetch(
                `${API}/etudiants/${idEtudiant}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(corps)
            });

            if (rep.ok) {
                input.closest('td').textContent = nouvelleValeur;
                afficherToast('Modifié', 'success');
            } else {
                input.closest('td').textContent = valeurOriginale;
                afficherToast('Erreur modification', 'error');
            }
        } catch (err) {
            input.closest('td').textContent = valeurOriginale;
            afficherToast('Erreur réseau', 'error');
        }
    }
}

// ============================================
// AJOUT D'UN ÉTUDIANT AVEC NOTES
// ============================================

function ouvrirAjout() {
    document.getElementById('modalTitre').textContent =
        'Ajouter un étudiant';

    const matieres = ['Math','Francais','Anglais','PC','SVT','HG'];

    const champsNotes = matieres.map(m => `
        <fieldset style="border:1px solid #e2e8f0;
                         border-radius:8px; padding:12px;
                         margin-bottom:10px;">
            <legend style="font-weight:600; padding:0 8px;
                           color:#2563eb; font-size:13px;">
                ${m}
            </legend>
            <div style="display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:10px;">
                <div>
                    <label style="font-size:12px; color:#64748b;">
                        Devoirs
                        <small>(séparés par virgule)</small>
                    </label>
                    <input type="text"
                        id="note-${m}-devoirs"
                        placeholder="Ex: 12, 14, 10"
                        style="width:100%; padding:6px;
                               border:1px solid #e2e8f0;
                               border-radius:4px; margin-top:4px;"
                        oninput="calculerMoyenneMatiere('${m}')">
                </div>
                <div>
                    <label style="font-size:12px; color:#64748b;">
                        Examen (0–20)
                    </label>
                    <input type="number"
                        id="note-${m}-examen"
                        min="0" max="20" step="0.01"
                        placeholder="0 - 20"
                        style="width:100%; padding:6px;
                               border:1px solid #e2e8f0;
                               border-radius:4px; margin-top:4px;"
                        oninput="calculerMoyenneMatiere('${m}')">
                </div>
            </div>
            <div style="margin-top:6px; font-size:12px;
                        color:#64748b;">
                Moyenne calculée :
                <strong id="moy-${m}"
                    style="color:#2563eb;">—</strong>
            </div>
        </fieldset>
    `).join('');

    document.getElementById('modalContenu').innerHTML = `
        <div style="max-height:72vh; overflow-y:auto;
                    padding-right:6px;">

            <p style="font-size:13px; color:#64748b;
                      margin-bottom:14px;">★ Champs obligatoires</p>

            <div style="display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:12px; margin-bottom:16px;">
                <div class="form-group">
                    <label>Code ★</label>
                    <input type="text" id="f-code"
                        placeholder="AAD004" maxlength="6"
                        style="text-transform:uppercase">
                    <div class="form-error" id="err-code"></div>
                </div>
                <div class="form-group">
                    <label>Numéro ★</label>
                    <input type="text" id="f-numero"
                        placeholder="H5G32YR" maxlength="7"
                        style="text-transform:uppercase">
                    <div class="form-error" id="err-numero"></div>
                </div>
                <div class="form-group">
                    <label>Nom ★</label>
                    <input type="text" id="f-nom">
                    <div class="form-error" id="err-nom"></div>
                </div>
                <div class="form-group">
                    <label>Prénom ★</label>
                    <input type="text" id="f-prenom">
                    <div class="form-error" id="err-prenom"></div>
                </div>
                <div class="form-group">
                    <label>Date de naissance ★</label>
                    <input type="date" id="f-date">
                    <div class="form-error" id="err-date"></div>
                </div>
                <div class="form-group">
                    <label>Classe ★</label>
                    <select id="f-classe">
                        <option value="">-- Choisir --</option>
                        ${genererOptionsClasses()}
                    </select>
                    <div class="form-error" id="err-classe"></div>
                </div>
            </div>

            <h3 style="font-size:13px; text-transform:uppercase;
                       letter-spacing:1px; color:#475569;
                       margin-bottom:12px;">
                Notes par matière
                <small style="font-size:11px; color:#94a3b8;
                              text-transform:none;">
                    (optionnel — saisir devoirs ET examen)
                </small>
            </h3>

            ${champsNotes}

            <div style="display:flex; gap:12px; margin-top:16px;
                        position:sticky; bottom:0; background:white;
                        padding:12px 0;
                        border-top:1px solid #e2e8f0;">
                <button class="btn btn-primary"
                    onclick="soumettrAjout()">
                    ✅ Enregistrer
                </button>
                <button class="btn btn-outline"
                    onclick="fermerModal()">
                    Annuler
                </button>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('open');
}

function calculerMoyenneMatiere(matiere) {
    const devoirsStr = document.getElementById(
        `note-${matiere}-devoirs`
    ).value;
    const examenVal  = parseFloat(
        document.getElementById(`note-${matiere}-examen`).value
    );

    const devoirs = devoirsStr
        .split(',')
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));

    if (devoirs.length === 0 || isNaN(examenVal)) {
        document.getElementById(`moy-${matiere}`)
            .textContent = '—';
        return;
    }

    const moyDevoirs = devoirs.reduce((a, b) => a + b, 0)
                       / devoirs.length;
    const moyenne    = (moyDevoirs + 2 * examenVal) / 3;

    document.getElementById(`moy-${matiere}`).textContent =
        moyenne.toFixed(2);
}

function collecterNotes() {
    const matieres = ['Math','Francais','Anglais','PC','SVT','HG'];
    const notes    = {};

    for (const m of matieres) {
        const devoirsStr = document.getElementById(
            `note-${m}-devoirs`
        ).value.trim();
        const examenStr  = document.getElementById(
            `note-${m}-examen`
        ).value.trim();

        if (!devoirsStr && !examenStr) continue;

        const devoirs = devoirsStr
            .split(',')
            .map(v => parseFloat(v.trim()))
            .filter(v => !isNaN(v));

        const examen = parseFloat(examenStr);

        if (devoirs.length === 0 || isNaN(examen)) {
            afficherToast(
                `${m} : remplis les devoirs ET l'examen`,
                'error'
            );
            return null;
        }

        // Validation 0-20
        for (const note of devoirs) {
            if (note < 0 || note > 20) {
                afficherToast(
                    `${m} : note ${note} invalide (0–20)`,
                    'error'
                );
                return null;
            }
        }

        if (examen < 0 || examen > 20) {
            afficherToast(
                `${m} : examen ${examen} invalide (0–20)`,
                'error'
            );
            return null;
        }

        const moyDevoirs = devoirs.reduce((a, b) => a + b, 0)
                           / devoirs.length;
        const moyenne    = Math.round(
            ((moyDevoirs + 2 * examen) / 3) * 100
        ) / 100;

        notes[m] = { devoirs, examen, moyenne };
    }

    return notes;
}

function genererOptionsClasses() {
    const classes = [
        '6emeA','6emeB','6emeC','6emeD',
        '5emeA','5emeB','5emeC','5emeD',
        '4emeA','4emeB','4emeC','4emeD',
        '3emeA','3emeB','3emeC','3emeD'
    ];
    return classes.map(c =>
        `<option value="${c}">${c}</option>`
    ).join('');
}

function fermerModal() {
    document.getElementById('modalOverlay')
        .classList.remove('open');
}

function validerFormAjout() {
    let valide = true;

    const code   = document.getElementById('f-code').value.trim();
    const numero = document.getElementById('f-numero').value.trim();
    const nom    = document.getElementById('f-nom').value.trim();
    const prenom = document.getElementById('f-prenom').value.trim();
    const date   = document.getElementById('f-date').value;
    const classe = document.getElementById('f-classe').value;

    ['code','numero','nom','prenom','date','classe'].forEach(id => {
        document.getElementById(`err-${id}`).textContent = '';
    });

    if (!/^[A-Z]{3}[0-9]{3}$/.test(code)) {
        document.getElementById('err-code').textContent =
            '3 lettres majuscules + 3 chiffres. Ex: AAD004';
        valide = false;
    }

    if (!/^[A-Z0-9]{7}$/.test(numero.toUpperCase())) {
        document.getElementById('err-numero').textContent =
            '7 caractères alphanumériques majuscules';
        valide = false;
    }

    if (nom.length < 2 || !/^[a-zA-ZÀ-ÿ]/.test(nom)) {
        document.getElementById('err-nom').textContent =
            'Au moins 2 lettres, commence par une lettre';
        valide = false;
    }

    if (prenom.length < 3 || !/^[a-zA-ZÀ-ÿ]/.test(prenom)) {
        document.getElementById('err-prenom').textContent =
            'Au moins 3 lettres, commence par une lettre';
        valide = false;
    }

    if (!date) {
        document.getElementById('err-date').textContent =
            'Date obligatoire';
        valide = false;
    }

    if (!classe) {
        document.getElementById('err-classe').textContent =
            'Classe obligatoire';
        valide = false;
    }

    return valide
        ? { code, numero, nom, prenom,
            date_naissance: date, classe }
        : null;
}

async function soumettrAjout() {
    const infos = validerFormAjout();
    if (!infos) return;

    const notes = collecterNotes();
    if (notes === null) return;

    const donnees = { ...infos, notes };

    try {
        const rep = await fetch(`${API}/etudiants`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(donnees)
        });

        if (rep.ok) {
            fermerModal();
            afficherToast('Étudiant ajouté avec succès', 'success');
            chargerDonnees();
        } else {
            const err = await rep.json();
            afficherToast(
                err.detail || "Erreur lors de l'ajout",
                'error'
            );
        }
    } catch (err) {
        afficherToast('Erreur réseau', 'error');
    }
}

// ============================================
// ÉVÉNEMENTS
// ============================================

function attacherEvenements() {
    let timer;
    document.getElementById('recherche')
        .addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                etat.recherche = e.target.value;
                etat.page      = 1;
                chargerDonnees();
            }, 400);
        });

    document.getElementById('filtreClasse')
        .addEventListener('change', e => {
            etat.classe = e.target.value;
            etat.page   = 1;
            chargerDonnees();
        });

    document.getElementById('filtreSource')
        .addEventListener('change', e => {
            etat.source = e.target.value;
            etat.page   = 1;
            chargerDonnees();
        });

    document.getElementById('filtreValidite')
        .addEventListener('change', e => {
            etat.validite = e.target.value;
            etat.page     = 1;
            chargerDonnees();
        });

    document.getElementById('limitePage')
        .addEventListener('change', e => {
            etat.limite = parseInt(e.target.value);
            etat.page   = 1;
            chargerDonnees();
        });

    document.getElementById('toggleArchive')
        .addEventListener('click', () => {
            etat.archive = !etat.archive;
            etat.page    = 1;
            const btn    = document.getElementById('toggleArchive');
            btn.textContent = etat.archive
                ? '📋 Actifs'
                : '🗄️ Archives';
            btn.className = etat.archive
                ? 'btn btn-warning'
                : 'btn btn-outline';
            chargerDonnees();
        });
}

// ============================================
// UTILITAIRES
// ============================================

function formaterDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
}

function afficherToast(message, type = 'info') {
    const toast       = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.changerPage            = changerPage;
window.importerSelection      = importerSelection;
window.archiverEtudiant       = archiverEtudiant;
window.restaurerEtudiant      = restaurerEtudiant;
window.ouvrirAjout            = ouvrirAjout;
window.fermerModal            = fermerModal;
window.soumettrAjout          = soumettrAjout;
window.toggleModeEdition      = toggleModeEdition;
window.sauvegarderLigne       = sauvegarderLigne;
window.gererToucheInline      = gererToucheInline;
window.calculerMoyenneMatiere = calculerMoyenneMatiere;