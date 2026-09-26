import { note } from '../api.js';
import { TEINTES } from './Graphiques.jsx';

const MOTIFS = {
    CHAMP_MANQUANT:   'Champ obligatoire absent',
    FORMAT_CODE:      'Code hors format',
    FORMAT_NUMERO:    'Numéro hors format',
    FORMAT_NOM:       'Nom ou prénom non conforme',
    FORMAT_DATE:      'Date illisible',
    CLASSE_INCONNUE:  'Classe hors référentiel',
    NOTE_HORS_BORNES: 'Note hors de 0–20',
    NOTES_ABSENTES:   'Aucune note exploitable'
};

const pourcent = (v) => `${Number(v).toFixed(1).replace('.', ',')} %`;

/** Deux taux, lus d'un coup d'œil, avec leur jauge. */
function Taux({ libelle, valeur, aide, couleur }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[13.5px] font-semibold">{libelle}</span>
                <span
                    className="chiffres shrink-0 text-[19px] font-bold whitespace-nowrap"
                    style={{ color: couleur }}
                >
                    {pourcent(valeur)}
                </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-fond">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, valeur)}%`, background: couleur }}
                />
            </div>
            <p className="mt-1.5 text-[12px] text-sourdine">{aide}</p>
        </div>
    );
}

export function IndicateursQualite({ qualite, rejets }) {
    const maximum = Math.max(1, ...rejets.map((r) => r.nb_rejets));

    return (
        <div className="space-y-6 px-6 pb-6 sm:px-7">
            <div className="grid gap-5 sm:grid-cols-2">
                <Taux
                    libelle="Taux d'acceptation"
                    valeur={qualite.taux_acceptation}
                    couleur={TEINTES.menthe}
                    aide={`${qualite.lignes_inserees} lignes chargées sur ${
                        qualite.lignes_inserees + qualite.lignes_rejetees
                    } traitées, hors doublons.`}
                />
                <Taux
                    libelle="Complétude des dossiers"
                    valeur={qualite.taux_completude}
                    couleur={TEINTES.indigo}
                    aide={`${qualite.dossiers_complets} dossiers sur ${
                        qualite.dossiers_total
                    } ont les ${qualite.matieres_attendues} matières renseignées.`}
                />
            </div>

            <dl className="chiffres grid grid-cols-2 gap-x-6 gap-y-3 border-t
                           border-bordure pt-5 text-[13px] sm:grid-cols-4">
                {[
                    ['Exécutions',     qualite.nb_runs],
                    ['Lignes lues',    qualite.lignes_lues],
                    ['Doublons ignorés', qualite.lignes_doublons],
                    ['En quarantaine', qualite.lignes_rejetees]
                ].map(([libelle, valeur]) => (
                    <div key={libelle}>
                        <dt className="text-sourdine">{libelle}</dt>
                        <dd className="text-[17px] font-bold">{valeur}</dd>
                    </div>
                ))}
            </dl>

            {rejets.length > 0 && (
                <div className="border-t border-bordure pt-5">
                    <h3 className="mb-3 text-[13.5px] font-semibold">
                        Motifs de rejet
                    </h3>
                    <ul className="space-y-2.5">
                        {rejets.map((r) => (
                            <li key={r.motif}>
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="text-[13px]">
                                        {MOTIFS[r.motif] ?? r.motif}
                                    </span>
                                    <span className="chiffres text-[13px] font-bold text-alerte">
                                        {r.nb_rejets}
                                    </span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fond">
                                    <div
                                        className="h-full rounded-full bg-alerte"
                                        style={{ width: `${(r.nb_rejets / maximum) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function JournalRuns({ runs }) {
    if (!runs.length) {
        return (
            <p className="px-6 pb-6 text-[13.5px] text-sourdine sm:px-7">
                Aucune ingestion enregistrée. Lancez&nbsp;
                <code className="rounded bg-fond px-1.5 py-0.5 text-[12.5px]">
                    python -m app.pipeline
                </code>
                &nbsp;depuis le dossier <code>backend</code>.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto border-t border-bordure">
            <table className="w-full min-w-[500px] border-collapse">
                <thead>
                    <tr className="border-b border-bordure text-[12.5px] text-sourdine">
                        <th className="px-6 py-3 text-left font-semibold sm:px-7">Run</th>
                        <th className="px-3 py-3 text-left font-semibold">Source</th>
                        <th className="px-3 py-3 text-left font-semibold">Origine</th>
                        <th className="px-3 py-3 text-right font-semibold">Lues</th>
                        <th className="px-3 py-3 text-right font-semibold">Insérées</th>
                        <th className="px-3 py-3 text-right font-semibold">Doublons</th>
                        <th className="px-6 py-3 text-right font-semibold sm:px-7">Rejetées</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-bordure">
                    {runs.map((r) => (
                        <tr key={r.id_run}>
                            <td className="chiffres px-6 py-3 text-[13.5px] font-bold sm:px-7">
                                #{r.id_run}
                            </td>
                            <td className="px-3 py-3 text-[13px]">
                                <span className="block max-w-[150px] truncate" title={r.source}>
                                    {r.source}
                                </span>
                                <span className="chiffres block text-[11.5px] text-sourdine">
                                    {r.demarre_le}
                                </span>
                            </td>
                            <td className="px-3 py-3">
                                <span
                                    className="rounded-md bg-fond px-2 py-0.5 text-[11.5px]
                                               font-bold text-sourdine"
                                    title={
                                        r.declencheur === 'CLI'
                                            ? `Ligne de commande, le ${r.demarre_le}`
                                            : `Interface, le ${r.demarre_le}`
                                    }
                                >
                                    {r.declencheur}
                                </span>
                            </td>
                            <td className="chiffres px-3 py-3 text-right text-[13.5px]">
                                {r.lignes_lues}
                            </td>
                            <td className="chiffres px-3 py-3 text-right text-[13.5px] font-bold text-menthe">
                                {r.lignes_inserees}
                            </td>
                            <td className="chiffres px-3 py-3 text-right text-[13.5px] text-sourdine">
                                {r.lignes_doublons}
                            </td>
                            <td
                                className={`chiffres px-6 py-3 text-right text-[13.5px]
                                            font-bold sm:px-7 ${
                                                r.lignes_rejetees > 0
                                                    ? 'text-alerte'
                                                    : 'text-sourdine'
                                            }`}
                            >
                                {r.lignes_rejetees}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
