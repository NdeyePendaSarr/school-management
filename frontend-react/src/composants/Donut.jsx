/**
 * Anneau de répartition, dessiné en SVG.
 *
 * Une forme ronde au milieu des cartes rectangulaires : elle casse
 * la monotonie de la grille autant qu'elle informe.
 */
const RAYON = 58;
const EPAISSEUR = 24;
const PERIMETRE = 2 * Math.PI * RAYON;

export default function Donut({ parts, total, legendeTotal }) {
    const somme = parts.reduce((t, p) => t + p.valeur, 0) || 1;

    let debut = 0;
    const arcs = parts.map((p) => {
        const fraction = p.valeur / somme;
        const arc = {
            ...p,
            longueur: fraction * PERIMETRE,
            decalage: -debut * PERIMETRE,
            pourcent: Math.round(fraction * 100)
        };
        debut += fraction;
        return arc;
    });

    return (
        <div className="flex h-full flex-col items-center justify-center gap-6
                        px-6 pt-2 pb-7 sm:px-7">
            <div className="relative">
                <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    role="img"
                    aria-label={`Répartition : ${parts
                        .map((p) => `${p.libelle} ${p.valeur}`)
                        .join(', ')}`}
                >
                    <g transform="rotate(-90 80 80)">
                        {arcs.map((a) => (
                            <circle
                                key={a.libelle}
                                cx="80"
                                cy="80"
                                r={RAYON}
                                fill="none"
                                stroke={a.couleur}
                                strokeWidth={EPAISSEUR}
                                strokeDasharray={`${a.longueur} ${PERIMETRE - a.longueur}`}
                                strokeDashoffset={a.decalage}
                            />
                        ))}
                    </g>
                </svg>
                <div
                    className="pointer-events-none absolute inset-0 flex flex-col
                               items-center justify-center"
                >
                    <span
                        className="chiffres font-[family-name:var(--font-titre)] text-[26px]
                                   leading-none font-bold"
                    >
                        {total}
                    </span>
                    <span className="mt-1 text-[12px] text-sourdine">{legendeTotal}</span>
                </div>
            </div>

            <ul className="flex w-full flex-col gap-2.5">
                {arcs.map((a) => (
                    <li
                        key={a.libelle}
                        className="flex items-center justify-between gap-3 text-[13.5px]"
                    >
                        <span className="flex items-center gap-2.5">
                            <span
                                aria-hidden="true"
                                className="h-3 w-3 rounded-sm"
                                style={{ background: a.couleur }}
                            />
                            {a.libelle}
                        </span>
                        <span className="chiffres text-sourdine">
                            <strong className="font-bold text-texte">{a.valeur}</strong>{' '}
                            ({a.pourcent}%)
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
