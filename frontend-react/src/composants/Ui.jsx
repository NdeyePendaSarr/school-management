// ============================================
// Briques d'interface partagées.
// Cartes blanches à coins larges sur fond bleuté, séparées par
// l'espace plutôt que par des ombres portées.
// ============================================

export function Panneau({ titre, constat, actions, children, className = '' }) {
    return (
        <section
            className={`flex flex-col rounded-2xl border border-bordure
                        bg-surface ${className}`}
        >
            {(titre || actions) && (
                <header
                    className="flex flex-wrap items-center justify-between gap-x-6
                               gap-y-2 px-6 pt-5 pb-4 sm:px-7"
                >
                    <div className="min-w-0">
                        <h2 className="text-[18px] leading-snug">{titre}</h2>
                        {constat && (
                            <p className="mt-1 max-w-[64ch] text-[13.5px] text-sourdine">
                                {constat}
                            </p>
                        )}
                    </div>
                    {actions}
                </header>
            )}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
    );
}

/** Carte de repère : un grand nombre, un libellé court. */
export function Repere({ valeur, libelle, alerte = false }) {
    return (
        <div className="rounded-2xl border border-bordure bg-surface px-5 py-4">
            <div
                className={`chiffres font-[family-name:var(--font-titre)] text-[32px]
                            leading-none font-bold tracking-tight ${
                                alerte ? 'text-alerte' : 'text-texte'
                            }`}
            >
                {valeur}
            </div>
            <div className="mt-2 text-[13px] text-sourdine">{libelle}</div>
        </div>
    );
}

const STYLES_BOUTON = {
    principal:
        'bg-primaire text-white hover:bg-primaire-fonce ' +
        'disabled:bg-bordure disabled:text-sourdine',
    discret:
        'border border-bordure bg-surface text-texte hover:border-primaire ' +
        'disabled:text-sourdine disabled:hover:border-bordure',
    alerte:
        'border border-alerte/35 bg-surface text-alerte hover:bg-alerte-10 ' +
        'disabled:border-bordure disabled:text-sourdine',
    danger:
        'bg-alerte text-white hover:brightness-95 ' +
        'disabled:bg-bordure disabled:text-sourdine'
};

export function Bouton({ variante = 'discret', className = '', ...props }) {
    return (
        <button
            type="button"
            {...props}
            className={[
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2',
                'text-[13.5px] font-semibold whitespace-nowrap transition-colors',
                'disabled:cursor-not-allowed',
                STYLES_BOUTON[variante],
                className
            ].join(' ')}
        />
    );
}

const BASE_CHAMP =
    'w-full rounded-xl border border-bordure bg-surface px-3.5 py-2 ' +
    'text-[14px] text-texte placeholder:text-sourdine/70 ' +
    'focus:border-primaire focus:outline-none';

export function Champ({ etiquette, erreur, className = '', ...props }) {
    return (
        <label className={`block ${className}`}>
            {etiquette && (
                <span className="mb-1.5 block text-[13px] text-sourdine">
                    {etiquette}
                </span>
            )}
            <input
                {...props}
                aria-invalid={erreur ? 'true' : undefined}
                className={`${BASE_CHAMP} ${erreur ? 'border-alerte' : ''}`}
            />
            {erreur && (
                <span className="mt-1 block text-[12.5px] text-alerte">{erreur}</span>
            )}
        </label>
    );
}

export function Liste({ etiquette, options, erreur, className = '', ...props }) {
    return (
        <label className={`block ${className}`}>
            {etiquette && (
                <span className="mb-1.5 block text-[13px] text-sourdine">
                    {etiquette}
                </span>
            )}
            <select
                {...props}
                aria-invalid={erreur ? 'true' : undefined}
                className={`${BASE_CHAMP} cursor-pointer pr-8 ${
                    erreur ? 'border-alerte' : ''
                }`}
            >
                {options.map((o) => (
                    <option key={o.valeur} value={o.valeur}>
                        {o.texte}
                    </option>
                ))}
            </select>
            {erreur && (
                <span className="mt-1 block text-[12.5px] text-alerte">{erreur}</span>
            )}
        </label>
    );
}

/** Pastille pleine : la source d'une ligne, lue d'un coup d'œil. */
export function Pastille({ ton = 'primaire', children }) {
    const tons = {
        primaire: 'bg-primaire',
        menthe:   'bg-menthe',
        sourdine: 'bg-sourdine'
    };
    return (
        <span
            className={`inline-block rounded-md px-2.5 py-1 text-[11.5px]
                        font-bold text-white ${tons[ton]}`}
        >
            {children}
        </span>
    );
}

/** Étiquette discrète, sur fond teinté. */
export function Etiquette({ ton = 'alerte', children }) {
    const tons = {
        alerte: 'bg-alerte-10 text-alerte',
        menthe: 'bg-menthe-10 text-menthe',
        primaire: 'bg-primaire-10 text-primaire'
    };
    return (
        <span
            className={`inline-block rounded-lg px-3 py-1 text-[12.5px]
                        font-bold ${tons[ton]}`}
        >
            {children}
        </span>
    );
}

export function Chargement({ hauteur = 'h-40' }) {
    return (
        <div
            role="status"
            aria-label="Chargement"
            className={`flex ${hauteur} items-center justify-center`}
        >
            <span
                className="h-6 w-6 animate-spin rounded-full border-2
                           border-bordure border-t-primaire"
            />
        </div>
    );
}

export function Vide({ titre, aide, action }) {
    return (
        <div className="px-6 py-16 text-center">
            <p className="text-[15.5px] font-bold">{titre}</p>
            {aide && <p className="mt-1.5 text-[13.5px] text-sourdine">{aide}</p>}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

export function Erreur({ message, reessayer }) {
    return (
        <div className="px-6 py-14 text-center">
            <p className="text-[15.5px] font-bold text-alerte">
                Les données n'ont pas pu être chargées
            </p>
            <p className="mt-1.5 text-[13.5px] text-sourdine">{message}</p>
            {reessayer && (
                <div className="mt-5 flex justify-center">
                    <Bouton onClick={reessayer}>Réessayer</Bouton>
                </div>
            )}
        </div>
    );
}
