import { useCallback, useRef, useState } from 'react';

export function useNotifications() {
    const [liste, setListe] = useState([]);
    const compteur = useRef(0);

    const retirer = useCallback(
        (id) => setListe((l) => l.filter((n) => n.id !== id)),
        []
    );

    const ajouter = useCallback(
        (texte, type = 'succes') => {
            const id = ++compteur.current;
            setListe((l) => [...l, { id, texte, type }]);
            setTimeout(() => retirer(id), 4500);
        },
        [retirer]
    );

    return { liste, ajouter, retirer };
}

export function Notifications({ liste, retirer }) {
    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex
                       flex-col items-center gap-2 p-4"
        >
            {liste.map((n) => (
                <button
                    key={n.id}
                    type="button"
                    onClick={() => retirer(n.id)}
                    className={[
                        'pointer-events-auto max-w-md rounded-lg px-4 py-2.5 text-left',
                        'text-[13.5px] shadow-lg shadow-texte/15',
                        n.type === 'erreur'
                            ? 'bg-alerte text-white'
                            : 'bg-texte text-white'
                    ].join(' ')}
                >
                    {n.texte}
                </button>
            ))}
        </div>
    );
}
