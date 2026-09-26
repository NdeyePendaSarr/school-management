import { BARRE, note } from '../api.js';

/**
 * Échelle commune à toutes les lignes, cadrée sur les valeurs
 * réellement présentes : un axe 0–20 laisserait la moitié du
 * graphique vide et écraserait les écarts entre classes.
 */
function construireEchelle(donnees) {
    const valeurs = donnees.flatMap((c) => [c.moyenne_min, c.moyenne_max]);
    const min = Math.max(0,  Math.floor(Math.min(...valeurs, BARRE) - 0.5));
    const max = Math.min(20, Math.ceil(Math.max(...valeurs) + 0.5));
    return (valeur) => ((valeur - min) / (max - min)) * 100;
}

/**
 * Une classe n'est pas résumée par sa seule moyenne : deux classes
 * à 12 n'ont pas le même profil selon qu'elles sont homogènes ou
 * éclatées. Chaque ligne montre l'étendue min–max, la position de
 * la moyenne, et l'écart-type en clair.
 */
export default function Classes({ donnees }) {
    if (!donnees.length) return null;

    const pourcent = construireEchelle(donnees);
    const plusDispersee = donnees.reduce((a, b) =>
        b.ecart_type > a.ecart_type ? b : a
    );

    return (
        <div>
            <div className="overflow-x-auto border-t border-bordure">
                <table className="w-full min-w-[660px] border-collapse">
                    <thead>
                        <tr className="border-b border-bordure text-[12.5px] text-sourdine">
                            <th className="px-6 py-3 text-left font-semibold sm:px-7">
                                Classe
                            </th>
                            <th className="px-3 py-3 text-right font-semibold">Élèves</th>
                            <th className="px-3 py-3 text-right font-semibold">Moyenne</th>
                            <th className="px-3 py-3 text-right font-semibold">Écart-type</th>
                            <th className="px-6 py-3 text-left font-semibold sm:px-7">
                                Étendue des moyennes
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bordure">
                        {donnees.map((c) => {
                            const gauche = pourcent(c.moyenne_min);
                            const largeur = Math.max(
                                0.8,
                                pourcent(c.moyenne_max) - gauche
                            );
                            const alerte = c.moyenne_classe < BARRE;

                            return (
                                <tr key={c.libelle_classe}>
                                    <td className="px-6 py-3.5 text-[14px] font-semibold sm:px-7">
                                        {c.libelle_classe}
                                    </td>
                                    <td className="chiffres px-3 py-3.5 text-right text-[14px] text-sourdine">
                                        {c.nb_etudiants}
                                    </td>
                                    <td
                                        className={`chiffres px-3 py-3.5 text-right text-[14px]
                                                    font-bold ${alerte ? 'text-alerte' : ''}`}
                                    >
                                        {note(c.moyenne_classe)}
                                    </td>
                                    <td className="chiffres px-3 py-3.5 text-right text-[14px] text-sourdine">
                                        {note(c.ecart_type)}
                                    </td>
                                    <td className="px-6 py-3.5 sm:px-7">
                                        <div
                                            className="relative h-5 min-w-[180px]"
                                            title={`De ${note(c.moyenne_min)} à ${note(
                                                c.moyenne_max
                                            )}`}
                                        >
                                            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-bordure" />
                                            <div
                                                className="absolute top-1/2 h-1.5 -translate-y-1/2
                                                           rounded-full bg-primaire/20"
                                                style={{
                                                    left: `${gauche}%`,
                                                    width: `${largeur}%`
                                                }}
                                            />
                                            <div
                                                className={`absolute top-1/2 h-4 w-[3px] -translate-x-1/2
                                                            -translate-y-1/2 rounded-full ${
                                                                alerte ? 'bg-alerte' : 'bg-primaire'
                                                            }`}
                                                style={{ left: `${pourcent(c.moyenne_classe)}%` }}
                                            />
                                            <div
                                                className="absolute top-1/2 h-5 w-px -translate-y-1/2
                                                           bg-alerte/40"
                                                style={{ left: `${pourcent(BARRE)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="border-t border-bordure px-6 py-4 text-[13px] text-sourdine sm:px-7">
                Le trait plein marque la moyenne de la classe, le trait vertical fin
                la barre des 10. La classe la plus hétérogène est{' '}
                <strong className="font-semibold text-texte">
                    {plusDispersee.libelle_classe}
                </strong>
                , avec un écart-type de {note(plusDispersee.ecart_type)}.
            </p>
        </div>
    );
}
