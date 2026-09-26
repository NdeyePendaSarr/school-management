import { useCallback, useEffect, useState } from 'react';
import Eleves from './pages/Eleves.jsx';
import TableauDeBord from './pages/TableauDeBord.jsx';
import { Notifications, useNotifications } from './composants/Notifications.jsx';

const PAGES = [
    { chemin: '/',          nom: 'Élèves',          composant: Eleves },
    { chemin: '/dashboard', nom: 'Tableau de bord', composant: TableauDeBord }
];

/**
 * Routeur minimal : deux pages, pas de dépendance supplémentaire.
 * popstate est écouté pour que les boutons précédent/suivant
 * du navigateur continuent de fonctionner.
 */
function useChemin() {
    const [chemin, setChemin] = useState(window.location.pathname);

    useEffect(() => {
        const surRetour = () => setChemin(window.location.pathname);
        window.addEventListener('popstate', surRetour);
        return () => window.removeEventListener('popstate', surRetour);
    }, []);

    const naviguer = useCallback((cible) => {
        if (cible === window.location.pathname) return;
        window.history.pushState({}, '', cible);
        setChemin(cible);
        window.scrollTo(0, 0);
    }, []);

    return [chemin, naviguer];
}

function Marque() {
    return (
        <span className="font-[family-name:var(--font-titre)] text-[17px] font-bold tracking-tight text-entete-texte">
            Gestion scolaire
        </span>
    );
}

export default function App() {
    const [chemin, naviguer] = useChemin();
    const notifs = useNotifications();

    const page = PAGES.find((p) => p.chemin === chemin) ?? PAGES[0];
    const Contenu = page.composant;

    const lien = (p) => {
        const actif = p.chemin === page.chemin;
        return (
            <a
                key={p.chemin}
                href={p.chemin}
                aria-current={actif ? 'page' : undefined}
                onClick={(e) => {
                    e.preventDefault();
                    naviguer(p.chemin);
                }}
                className={[
                    'rounded-xl px-4 py-2 text-[14px] transition-colors',
                    actif
                        ? 'bg-entete-actif font-bold text-entete-texte'
                        : 'text-entete-texte/65 hover:bg-entete-actif/60 hover:text-entete-texte'
                ].join(' ')}
            >
                {p.nom}
            </a>
        );
    };

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 bg-entete">
                <div
                    className="mx-auto flex h-16 w-full max-w-[1180px] items-center
                               justify-between gap-6 px-5 sm:px-8"
                >
                    <Marque />
                    <nav className="flex items-center gap-1">{PAGES.map(lien)}</nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-9 sm:px-8 sm:py-12">
                <Contenu notifier={notifs.ajouter} />
            </main>

            <footer className="border-t border-bordure">
                <div
                    className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center
                               justify-between gap-3 px-5 py-5 text-[12.5px]
                               text-sourdine sm:px-8"
                >
                    <span>
                        Développé par{' '}
                        <strong className="font-semibold text-texte">
                            Ndeye Penda Sarr
                        </strong>
                    </span>
                    <span>FastAPI, PostgreSQL et React</span>
                </div>
            </footer>

            <Notifications liste={notifs.liste} retirer={notifs.retirer} />
        </div>
    );
}
