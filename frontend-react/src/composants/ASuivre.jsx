import { libelleMatiere, note } from '../api.js';
import { Vide } from './Ui.jsx';

export default function ASuivre({ donnees }) {
    if (!donnees.length) {
        return (
            <Vide
                titre="Aucune moyenne calculée"
                aide="Importez des élèves depuis le fichier JSON pour voir ce classement."
            />
        );
    }

    return (
        <ul className="divide-y divide-bordure border-t border-bordure">
            {donnees.map((e) => (
                <li
                    key={`${e.nom_complet}-${e.libelle_classe}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 sm:px-7"
                >
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">
                            {e.nom_complet}
                        </p>
                        <p className="chiffres truncate text-[12.5px] text-sourdine">
                            {e.libelle_classe} — plus faible en{' '}
                            {libelleMatiere(e.matiere_faible)} à {note(e.note_faible)}
                        </p>
                    </div>
                    <span
                        className={`chiffres shrink-0 rounded-lg px-3 py-1.5 text-[15px]
                                    font-bold ${
                                        e.sous_la_barre
                                            ? 'bg-alerte-10 text-alerte'
                                            : 'bg-fond text-texte'
                                    }`}
                    >
                        {note(e.moyenne_generale)}
                    </span>
                </li>
            ))}
        </ul>
    );
}
