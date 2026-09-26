import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Bouton } from './Ui.jsx';

/**
 * Boîte de confirmation pour une action qu'on ne veut pas déclencher
 * par un clic malheureux.
 *
 * Le focus part sur « Annuler » et non sur l'action : la touche Entrée
 * juste après l'ouverture ne doit pas valider une archive. Échap ferme,
 * et le focus revient sur le bouton d'origine à la fermeture.
 */
export default function Confirmation({
    titre,
    message,
    libelleAction = 'Confirmer',
    variante = 'alerte',
    occupe = false,
    onConfirmer,
    onAnnuler
}) {
    const boutonAnnuler = useRef(null);
    const elementPrecedent = useRef(null);

    useEffect(() => {
        elementPrecedent.current = document.activeElement;
        boutonAnnuler.current?.focus();

        const surTouche = (e) => {
            if (e.key === 'Escape') onAnnuler();
        };
        window.addEventListener('keydown', surTouche);

        return () => {
            window.removeEventListener('keydown', surTouche);
            elementPrecedent.current?.focus?.();
        };
    }, [onAnnuler]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-texte/45
                       p-4 backdrop-blur-[2px]"
            onMouseDown={(e) => e.target === e.currentTarget && onAnnuler()}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="titre-confirmation"
                aria-describedby="message-confirmation"
                className="w-full max-w-md rounded-2xl border border-bordure bg-surface
                           p-6 shadow-2xl shadow-texte/20"
            >
                <span
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center
                                rounded-xl ${
                                    variante === 'alerte'
                                        ? 'bg-alerte-10 text-alerte'
                                        : 'bg-primaire-10 text-primaire'
                                }`}
                >
                    <TriangleAlert size={21} strokeWidth={2.2} />
                </span>

                <h2 id="titre-confirmation" className="text-[19px]">
                    {titre}
                </h2>
                <p
                    id="message-confirmation"
                    className="mt-2 text-[14px] text-sourdine"
                >
                    {message}
                </p>

                <div className="mt-6 flex justify-end gap-2.5">
                    <Bouton ref={boutonAnnuler} onClick={onAnnuler} disabled={occupe}>
                        Annuler
                    </Bouton>
                    <Bouton
                        variante={variante === 'alerte' ? 'danger' : 'principal'}
                        onClick={onConfirmer}
                        disabled={occupe}
                    >
                        {occupe ? 'En cours…' : libelleAction}
                    </Bouton>
                </div>
            </div>
        </div>
    );
}
