import { note } from '../api.js';

/**
 * Répartition des moyennes par tranche.
 *
 * Les tranches sous la barre des 10 sont marquées en rouge — étiquette
 * et ligne de base — plutôt que par un trait vertical : la frontière
 * tombe entre deux colonnes, là où un axe catégoriel ne sait pas la
 * placer proprement.
 */
export default function Distribution({ donnees }) {
    const { tranches, moyenne } = donnees;

    const maximum = Math.max(1, ...tranches.map((t) => t.nb_etudiants));
    const sousLaBarre = tranches
        .filter((t) => t.sous_la_barre)
        .reduce((total, t) => total + t.nb_etudiants, 0);

    return (
        <div className="px-6 pt-5 pb-5 sm:px-7">
            <ul className="flex h-[260px] items-end gap-4 sm:gap-6">
                {tranches.map((t) => {
                    const vide = t.nb_etudiants === 0;
                    const hauteur = (t.nb_etudiants / maximum) * 100;
                    return (
                        <li
                            key={t.tranche}
                            title={`${t.nb_etudiants} élève(s), moyenne de ${t.tranche}`}
                            className="group flex h-full flex-1 flex-col justify-end gap-2"
                        >
                            <span
                                className={`chiffres text-center text-[15px] font-bold ${
                                    vide
                                        ? 'text-sourdine/60'
                                        : t.sous_la_barre
                                          ? 'text-alerte'
                                          : 'text-texte'
                                }`}
                            >
                                {t.nb_etudiants}
                            </span>
                            {vide ? (
                                /* Une tranche vide garde une ligne de base :
                                   la colonne reste lisible comme un zéro. */
                                <div
                                    className={`h-[3px] w-full rounded-full ${
                                        t.sous_la_barre
                                            ? 'bg-alerte/25'
                                            : 'bg-primaire/20'
                                    }`}
                                />
                            ) : (
                                <div
                                    className={`w-full rounded-t-lg transition-opacity
                                                group-hover:opacity-85 ${
                                                    t.sous_la_barre
                                                        ? 'bg-alerte'
                                                        : 'bg-primaire'
                                                }`}
                                    style={{ height: `${hauteur}%` }}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>

            <ul className="mt-3 flex gap-4 sm:gap-6">
                {tranches.map((t) => (
                    <li
                        key={t.tranche}
                        className={`chiffres flex-1 text-center text-[13px] ${
                            t.sous_la_barre ? 'text-alerte' : 'text-sourdine'
                        }`}
                    >
                        {t.tranche}
                    </li>
                ))}
            </ul>

            <p className="chiffres mt-5 border-t border-bordure pt-4 text-[13.5px] text-sourdine">
                Moyenne de la promotion{' '}
                <strong className="font-bold text-texte">{note(moyenne)}</strong>.{' '}
                {sousLaBarre === 0 ? (
                    'Aucun élève sous la barre des 10.'
                ) : (
                    <>
                        <strong className="font-bold text-alerte">{sousLaBarre}</strong>
                        {sousLaBarre > 1 ? ' élèves sont ' : ' élève est '}
                        sous la barre des 10.
                    </>
                )}
            </p>
        </div>
    );
}
