import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, FileInput, Archive, ListChecks } from 'lucide-react';
import { api } from '../api.js';
import {
    Bouton, Champ, Chargement, Erreur, Liste, Panneau, Vide
} from '../composants/Ui.jsx';
import LigneEleve from '../composants/LigneEleve.jsx';
import { useEtudiants } from '../composants/useEtudiants.js';
import FormulaireEleve from '../composants/FormulaireEleve.jsx';
import Confirmation from '../composants/Confirmation.jsx';

const FILTRES_INITIAUX = {
    page: 1, limite: 5, recherche: '', classe: '',
    source: 'tous', validite: '', archive: false
};

function Pagination({ page, totalPages, total, limite, onChanger }) {
    if (!total) return null;
    const debut = (page - 1) * limite + 1;
    const fin   = Math.min(page * limite, total);

    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
        if (p <= 2 || p > totalPages - 2 || Math.abs(p - page) <= 1) pages.push(p);
        else if (pages.at(-1) !== '…') pages.push('…');
    }

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3
                       border-t border-bordure px-6 py-4 sm:px-7"
        >
            <p className="chiffres text-[13px] text-sourdine">
                {debut} à {fin} sur {total} élèves
            </p>
            <div className="flex flex-wrap items-center gap-1">
                <Bouton onClick={() => onChanger(page - 1)} disabled={page === 1}>
                    Précédent
                </Bouton>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`e${i}`} className="px-1.5 text-sourdine">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onChanger(p)}
                            aria-current={p === page ? 'page' : undefined}
                            className={`chiffres min-w-9 rounded-xl px-2.5 py-2 text-[13.5px]
                                        ${
                                            p === page
                                                ? 'bg-primaire font-semibold text-white'
                                                : 'border border-bordure hover:border-sourdine'
                                        }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <Bouton
                    onClick={() => onChanger(page + 1)}
                    disabled={page >= totalPages}
                >
                    Suivant
                </Bouton>
            </div>
        </div>
    );
}

export default function Eleves({ notifier }) {
    const [filtres, setFiltres]       = useState(FILTRES_INITIAUX);
    const [saisie, setSaisie]         = useState('');
    const [classes, setClasses]       = useState([]);
    const [selection, setSelection]   = useState(() => new Set());
    const [formulaire, setFormulaire] = useState(false);
    const [aArchiver, setAArchiver]   = useState(null);
    const [archivage, setArchivage]   = useState(false);

    const { etudiants, total, totalPages, chargement, erreur, recharger } =
        useEtudiants(filtres);

    // La recherche attend une pause de frappe avant d'interroger l'API.
    useEffect(() => {
        const minuteur = setTimeout(
            () => setFiltres((f) => ({ ...f, recherche: saisie, page: 1 })),
            350
        );
        return () => clearTimeout(minuteur);
    }, [saisie]);

    useEffect(() => {
        api.classes()
            .then((liste) =>
                setClasses(liste.map((c) => c.libelle_classe).filter(Boolean))
            )
            .catch(() => setClasses([]));
    }, []);

    const majFiltre = (cle, valeur) =>
        setFiltres((f) => ({ ...f, [cle]: valeur, page: 1 }));

    const outilsSelection = useMemo(
        () => ({
            contient: (numero) => selection.has(numero),
            basculer: (numero) =>
                setSelection((s) => {
                    const copie = new Set(s);
                    copie.has(numero) ? copie.delete(numero) : copie.add(numero);
                    return copie;
                })
        }),
        [selection]
    );

    const agir = useCallback(
        async (action, succes) => {
            try {
                await action();
                notifier(succes);
                recharger();
            } catch (e) {
                notifier(e.message, 'erreur');
            }
        },
        [notifier, recharger]
    );

    async function importer() {
        const numeros = [...selection];
        try {
            const resultat = await api.importer(numeros);
            notifier(
                `${resultat.total_importes} élève${
                    resultat.total_importes > 1 ? 's' : ''
                } importé${resultat.total_importes > 1 ? 's' : ''} en base`
            );
            setSelection(new Set());
            recharger();
        } catch (e) {
            notifier(e.message, 'erreur');
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[34px] leading-[1.1] sm:text-[40px]">Élèves</h1>
                    <p className="mt-2.5 max-w-[70ch] text-[15px] text-sourdine">
                        La base et le fichier JSON sont présentés ensemble. Les lignes
                        venues du JSON restent en lecture seule jusqu'à leur import.
                    </p>
                </div>
                <Bouton variante="principal" onClick={() => setFormulaire(true)}>
                    <Plus size={16} strokeWidth={2.4} /> Ajouter un élève
                </Bouton>
            </div>

            <Panneau className="px-6 py-5 sm:px-7">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Champ
                        etiquette="Rechercher"
                        placeholder="Nom, prénom, numéro ou code"
                        value={saisie}
                        onChange={(e) => setSaisie(e.target.value)}
                        className="lg:col-span-2"
                    />
                    <Liste
                        etiquette="Classe"
                        value={filtres.classe}
                        onChange={(e) => majFiltre('classe', e.target.value)}
                        options={[
                            { valeur: '', texte: 'Toutes' },
                            ...classes.map((c) => ({ valeur: c, texte: c }))
                        ]}
                    />
                    <Liste
                        etiquette="Source"
                        value={filtres.source}
                        onChange={(e) => majFiltre('source', e.target.value)}
                        options={[
                            { valeur: 'tous', texte: 'Base et JSON' },
                            { valeur: 'db',   texte: 'Base seulement' },
                            { valeur: 'json', texte: 'JSON seulement' }
                        ]}
                    />
                    <Liste
                        etiquette="Validité"
                        value={filtres.validite}
                        onChange={(e) => majFiltre('validite', e.target.value)}
                        options={[
                            { valeur: '',      texte: 'Toutes' },
                            { valeur: 'true',  texte: 'Valides' },
                            { valeur: 'false', texte: 'Invalides' }
                        ]}
                    />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-bordure pt-5">
                    <Bouton
                        onClick={() => majFiltre('archive', !filtres.archive)}
                        className={filtres.archive ? 'border-primaire text-primaire' : ''}
                    >
                        {filtres.archive ? (
                            <>
                                <ListChecks size={15} strokeWidth={2.2} /> Voir les
                                élèves actifs
                            </>
                        ) : (
                            <>
                                <Archive size={15} strokeWidth={2.2} /> Voir les archives
                            </>
                        )}
                    </Bouton>
                    <Liste
                        value={filtres.limite}
                        onChange={(e) => majFiltre('limite', Number(e.target.value))}
                        options={[5, 10, 25, 50].map((n) => ({
                            valeur: n,
                            texte: `${n} par page`
                        }))}
                        className="w-36"
                    />
                    <span className="flex-1" />
                    <Bouton
                        variante="principal"
                        onClick={importer}
                        disabled={selection.size === 0}
                    >
                        <FileInput size={15} strokeWidth={2.2} />
                        {selection.size === 0
                            ? 'Importer la sélection'
                            : `Importer ${selection.size} élève${
                                  selection.size > 1 ? 's' : ''
                              }`}
                    </Bouton>
                </div>
            </Panneau>

            <Panneau>
                {erreur ? (
                    <Erreur message={erreur} reessayer={recharger} />
                ) : chargement ? (
                    <Chargement hauteur="h-64" />
                ) : etudiants.length === 0 ? (
                    <Vide
                        titre="Aucun élève ne correspond"
                        aide="Modifiez la recherche ou les filtres pour élargir la liste."
                        action={
                            <Bouton
                                onClick={() => {
                                    setSaisie('');
                                    setFiltres(FILTRES_INITIAUX);
                                }}
                            >
                                Réinitialiser les filtres
                            </Bouton>
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1020px] border-collapse">
                                <thead>
                                    <tr className="border-b border-bordure text-[12.5px] text-sourdine">
                                        <th className="w-12 px-5 py-3 sm:pl-7" />
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Numéro
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Nom
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Prénom
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Naissance
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Classe
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Moyenne
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">
                                            Source
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold sm:pr-7">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bordure">
                                    {etudiants.map((e) => (
                                        <LigneEleve
                                            key={e.id_etudiant ?? `json-${e.numero}`}
                                            eleve={e}
                                            classes={classes}
                                            selection={outilsSelection}
                                            onArchiver={() => setAArchiver(e)}
                                            onRestaurer={(id) =>
                                                agir(
                                                    () => api.restaurer(id),
                                                    'Élève restauré'
                                                )
                                            }
                                            onModifier={(id, corps) =>
                                                agir(
                                                    () => api.modifier(id, corps),
                                                    'Modifications enregistrées'
                                                )
                                            }
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={filtres.page}
                            totalPages={totalPages}
                            total={total}
                            limite={filtres.limite}
                            onChanger={(p) =>
                                setFiltres((f) => ({
                                    ...f,
                                    page: Math.min(Math.max(1, p), totalPages)
                                }))
                            }
                        />
                    </>
                )}
            </Panneau>

            {aArchiver && (
                <Confirmation
                    titre="Archiver cet élève ?"
                    message={`${aArchiver.nom} ${aArchiver.prenom} (${
                        aArchiver.libelle_classe ?? aArchiver.classe
                    }) sortira de la liste active. Ses résultats sont conservés et vous pourrez le restaurer depuis les archives.`}
                    libelleAction="Archiver"
                    occupe={archivage}
                    onAnnuler={() => setAArchiver(null)}
                    onConfirmer={async () => {
                        setArchivage(true);
                        try {
                            await agir(
                                () => api.archiver(aArchiver.id_etudiant),
                                'Élève archivé'
                            );
                            setAArchiver(null);
                        } finally {
                            setArchivage(false);
                        }
                    }}
                />
            )}

            {formulaire && (
                <FormulaireEleve
                    classes={classes}
                    onFermer={() => setFormulaire(false)}
                    onEnregistrer={async (corps) => {
                        try {
                            await api.creer(corps);
                            notifier('Élève ajouté');
                            setFormulaire(false);
                            recharger();
                        } catch (e) {
                            notifier(e.message, 'erreur');
                        }
                    }}
                />
            )}
        </div>
    );
}
