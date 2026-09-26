/**
 * Carte de repère : une icône teintée, un grand chiffre coloré,
 * un libellé, et un liseré de la même teinte en pied de carte.
 *
 * La couleur n'est pas décorative : chaque repère garde la sienne
 * d'un écran à l'autre, ce qui rend la rangée lisible sans lire.
 */
export default function Repere({ icone: Icone, valeur, libelle, couleur }) {
    return (
        <div
            className="relative flex h-full flex-col overflow-hidden rounded-2xl
                       border border-bordure bg-surface px-4 pt-5 pb-6"
        >
            <span
                className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${couleur} 13%, white)` }}
            >
                <Icone size={18} strokeWidth={2.2} style={{ color: couleur }} />
            </span>

            <div
                className="chiffres font-[family-name:var(--font-titre)] text-[30px]
                           leading-none font-bold tracking-tight"
                style={{ color: couleur }}
            >
                {valeur}
            </div>
            <div className="mt-2 text-[12.5px] leading-snug text-sourdine">{libelle}</div>

            <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[3px]"
                style={{ background: couleur }}
            />
        </div>
    );
}
