import { libelleMatiere, note } from '../api.js';

// Une couleur par matière : la palette de séries ne sert qu'ici,
// où elle distingue réellement des catégories.
const COULEURS = [
    'var(--color-serie-1)', 'var(--color-serie-2)',
    'var(--color-serie-3)', 'var(--color-serie-4)',
    'var(--color-primaire)', 'var(--color-menthe)'
];

/**
 * Écart examen − contrôle continu, matière par matière.
 *
 * Un écart négatif signale une matière où les élèves tiennent le
 * contrôle continu mais décrochent à l'examen : c'est le signal
 * utile, donc c'est lui qui est marqué en rouge.
 */
export default function EcartMatieres({ donnees }) {
    if (!donnees.length) return null;

    const amplitude = Math.max(1, ...donnees.map((m) => Math.abs(m.ecart)));

    return (
        <>
            <p className="px-6 pb-3 text-[13px] text-sourdine sm:px-7">
                À gauche de l'axe, les élèves perdent des points à l'examen.
                À droite, ils en gagnent.
            </p>
            <ul className="divide-y divide-bordure border-t border-bordure">
                {donnees.map((m, i) => {
                    const negatif = m.ecart < 0;
                    const largeur = (Math.abs(m.ecart) / amplitude) * 50;

                    return (
                        <li key={m.libelle_matiere} className="px-6 py-4 sm:px-7">
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="flex items-center gap-2.5 text-[14px] font-semibold">
                                    <span
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                        style={{ background: COULEURS[i % COULEURS.length] }}
                                    />
                                    {libelleMatiere(m.libelle_matiere)}
                                </span>
                                <span
                                    className={`chiffres text-[14px] font-bold ${
                                        negatif ? 'text-alerte' : 'text-menthe'
                                    }`}
                                >
                                    {negatif ? '−' : '+'}
                                    {note(Math.abs(m.ecart))}
                                </span>
                            </div>

                            {/* Axe central = aucun écart. */}
                            <div className="relative mt-2.5 h-3">
                                <div className="absolute inset-y-0 left-1/2 w-px bg-bordure" />
                                <div
                                    className={`absolute top-0 h-3 rounded-md ${
                                        negatif ? 'bg-alerte' : 'bg-menthe'
                                    }`}
                                    style={
                                        negatif
                                            ? { right: '50%', width: `${largeur}%` }
                                            : { left: '50%', width: `${largeur}%` }
                                    }
                                />
                            </div>

                            <p className="chiffres mt-2 text-[12.5px] text-sourdine">
                                Devoirs {note(m.moyenne_devoirs)}, examen{' '}
                                {note(m.moyenne_examen)}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
