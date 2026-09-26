import { useEffect, useRef, useState } from 'react';
import { Archive, RotateCcw, Save, X } from 'lucide-react';
import { dateFr, moyenneGenerale, note } from '../api.js';
import { Bouton, Pastille } from './Ui.jsx';

const CHAMPS = {
    nom:            { libelle: 'Nom',               type: 'text' },
    prenom:         { libelle: 'Prénom',            type: 'text' },
    date_naissance: { libelle: 'Date de naissance', type: 'date' },
    classe:         { libelle: 'Classe',            type: 'select' }
};

/**
 * Champ de saisie ouvert dans une cellule.
 *
 * `onSaisie` suit la frappe : le mode édition en a besoin pour
 * garder son brouillon à jour sans que l'on valide chaque champ.
 * `onValider` ne se déclenche qu'à la touche Entrée, pour
 * l'édition d'une cellule isolée.
 */
function Cellule({ champ, valeur, classes, onSaisie, onValider, onAnnuler }) {
    const entree = useRef(null);

    useEffect(() => {
        entree.current?.focus();
        entree.current?.select?.();
    }, []);

    const surTouche = (e) => {
        if (e.key === 'Enter')  onValider(e.target.value);
        if (e.key === 'Escape') onAnnuler();
    };

    const style =
        'w-full rounded-lg border border-primaire bg-surface px-2 py-1 ' +
        'text-[13.5px] focus:outline-none';

    if (CHAMPS[champ].type === 'select') {
        return (
            <select
                ref={entree}
                defaultValue={valeur ?? ''}
                aria-label={CHAMPS[champ].libelle}
                onKeyDown={surTouche}
                onChange={(e) =>
                    onSaisie ? onSaisie(e.target.value) : onValider(e.target.value)
                }
                onBlur={onAnnuler}
                className={`${style} min-w-[104px]`}
            >
                <option value="">—</option>
                {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        );
    }

    return (
        <input
            ref={entree}
            type={CHAMPS[champ].type}
            defaultValue={valeur ?? ''}
            aria-label={CHAMPS[champ].libelle}
            onKeyDown={surTouche}
            onChange={onSaisie ? (e) => onSaisie(e.target.value) : undefined}
            onBlur={onAnnuler}
            className={style}
        />
    );
}

/**
 * Une ligne du tableau, avec deux façons de modifier une donnée de
 * la base — jamais une ligne venue du JSON, qui reste en lecture
 * seule tant qu'elle n'a pas été importée :
 *
 *  - double-clic sur une cellule : Entrée valide, Échap annule ;
 *  - case « Mode édition » : les quatre champs s'ouvrent ensemble
 *    et un bouton enregistre le tout.
 */
export default function LigneEleve({
    eleve, classes, selection, onArchiver, onRestaurer, onModifier
}) {
    const estJSON = eleve.origine === 'JSON';
    const moyenne = moyenneGenerale(eleve);

    const [celluleOuverte, setCelluleOuverte] = useState(null);
    const [modeEdition, setModeEdition]       = useState(false);
    const [brouillon, setBrouillon]           = useState({});
    const [envoi, setEnvoi]                   = useState(false);

    const valeurs = {
        nom:            eleve.nom,
        prenom:         eleve.prenom,
        date_naissance: (eleve.date_naissance ?? '').slice(0, 10),
        classe:         eleve.libelle_classe ?? eleve.classe
    };

    function ouvrirModeEdition(actif) {
        setModeEdition(actif);
        setCelluleOuverte(null);
        if (actif) setBrouillon({ ...valeurs });
    }

    async function enregistrerCellule(champ, valeur) {
        setCelluleOuverte(null);
        if (String(valeur) === String(valeurs[champ] ?? '')) return;
        await onModifier(eleve.id_etudiant, { [champ]: valeur });
    }

    async function enregistrerLigne() {
        const modifies = Object.fromEntries(
            Object.entries(brouillon).filter(
                ([cle, v]) => String(v) !== String(valeurs[cle] ?? '')
            )
        );
        if (Object.keys(modifies).length === 0) {
            setModeEdition(false);
            return;
        }
        setEnvoi(true);
        try {
            await onModifier(eleve.id_etudiant, modifies);
            setModeEdition(false);
        } finally {
            setEnvoi(false);
        }
    }

    /** Cellule modifiable : double-clic pour ouvrir. */
    const cellule = (champ, affichage, className) => {
        if (modeEdition && !estJSON) {
            return (
                <td className={className}>
                    <Cellule
                        champ={champ}
                        valeur={brouillon[champ]}
                        classes={classes}
                        onSaisie={(v) =>
                            setBrouillon((b) => ({ ...b, [champ]: v }))
                        }
                        onValider={enregistrerLigne}
                        onAnnuler={() => {}}
                    />
                </td>
            );
        }

        if (celluleOuverte === champ) {
            return (
                <td className={className}>
                    <Cellule
                        champ={champ}
                        valeur={valeurs[champ]}
                        classes={classes}
                        onValider={(v) => enregistrerCellule(champ, v)}
                        onAnnuler={() => setCelluleOuverte(null)}
                    />
                </td>
            );
        }

        return (
            <td
                className={className}
                title={estJSON ? undefined : 'Double-cliquez pour modifier'}
                onDoubleClick={
                    estJSON ? undefined : () => setCelluleOuverte(champ)
                }
            >
                {affichage}
            </td>
        );
    };

    return (
        <tr className="hover:bg-fond/60">
            <td className="px-5 py-3.5 sm:pl-7">
                {estJSON && (
                    <input
                        type="checkbox"
                        aria-label={`Sélectionner ${eleve.nom} ${eleve.prenom}`}
                        checked={selection.contient(eleve.numero)}
                        onChange={() => selection.basculer(eleve.numero)}
                        className="h-[18px] w-[18px] accent-[#4a47d8]"
                    />
                )}
            </td>

            <td className="chiffres px-3 py-3.5 text-[13.5px] text-sourdine">
                {eleve.numero}
            </td>

            {cellule(
                'nom',
                <span className="text-[14.5px] font-bold">{eleve.nom}</span>,
                'px-3 py-3.5'
            )}
            {cellule(
                'prenom',
                <span className="text-[14.5px]">{eleve.prenom}</span>,
                'px-3 py-3.5'
            )}
            {cellule(
                'date_naissance',
                dateFr(eleve.date_naissance),
                'chiffres px-3 py-3.5 text-[13.5px] text-sourdine'
            )}
            {cellule(
                'classe',
                eleve.libelle_classe ?? eleve.classe,
                'px-3 py-3.5 text-[14px] min-w-[116px]'
            )}

            <td className="chiffres px-3 py-3.5 text-right text-[15px] font-bold">
                <span className={moyenne !== null && moyenne < 10 ? 'text-alerte' : ''}>
                    {note(moyenne)}
                </span>
            </td>

            <td className="px-3 py-3.5">
                <Pastille ton={estJSON ? 'menthe' : 'primaire'}>
                    {estJSON ? 'JSON' : 'Base'}
                </Pastille>
            </td>

            <td className="px-5 py-3.5 text-right sm:pr-7">
                {estJSON ? (
                    <span className="text-[13px] text-sourdine">Lecture seule</span>
                ) : (
                    <div className="flex items-center justify-end gap-3">
                        <label className="flex items-center gap-2 text-[13px] text-sourdine">
                            <input
                                type="checkbox"
                                checked={modeEdition}
                                onChange={(e) => ouvrirModeEdition(e.target.checked)}
                                className="h-4 w-4 accent-[#4a47d8]"
                            />
                            Mode édition
                        </label>

                        {modeEdition ? (
                            <div className="flex gap-1.5">
                                <Bouton
                                    onClick={() => ouvrirModeEdition(false)}
                                    disabled={envoi}
                                >
                                    <X size={15} strokeWidth={2.4} /> Annuler
                                </Bouton>
                                <Bouton
                                    variante="principal"
                                    onClick={enregistrerLigne}
                                    disabled={envoi}
                                >
                                    <Save size={15} strokeWidth={2.2} />
                                    {envoi ? 'Enregistrement…' : 'Sauvegarder'}
                                </Bouton>
                            </div>
                        ) : eleve.est_archive ? (
                            <Bouton onClick={() => onRestaurer(eleve.id_etudiant)}>
                                <RotateCcw size={15} strokeWidth={2.2} /> Restaurer
                            </Bouton>
                        ) : (
                            <Bouton variante="alerte" onClick={() => onArchiver(eleve)}>
                                <Archive size={15} strokeWidth={2.2} /> Archiver
                            </Bouton>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}
