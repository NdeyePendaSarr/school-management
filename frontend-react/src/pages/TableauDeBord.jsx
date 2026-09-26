import { useCallback, useEffect, useState } from 'react';
import {
    Users, Database, FileJson, CircleCheck,
    CircleAlert, Archive, UserCheck, Gauge
} from 'lucide-react';
import { api, note } from '../api.js';
import { Chargement, Erreur, Panneau } from '../composants/Ui.jsx';
import Repere from '../composants/Repere.jsx';
import {
    TEINTES, ParClasse, ParSource, ParValidite,
    MoyenneParClasse, TopMoyennes, RepartitionMoyennes
} from '../composants/Graphiques.jsx';
import EcartMatieres from '../composants/EcartMatieres.jsx';
import ASuivre from '../composants/ASuivre.jsx';
import Classes from '../composants/Classes.jsx';
import { IndicateursQualite, JournalRuns } from '../composants/Qualite.jsx';

function Reperes({ globales, distribution }) {
    const cartes = [
        { icone: Users,       valeur: globales.total_general,     libelle: 'Total général',   couleur: TEINTES.indigo },
        { icone: Database,    valeur: globales.total_db,          libelle: 'Base de données', couleur: TEINTES.cyan },
        { icone: FileJson,    valeur: globales.total_json,        libelle: 'Fichier JSON',    couleur: TEINTES.ambre },
        { icone: CircleCheck, valeur: globales.total_valides,     libelle: 'Valides',         couleur: TEINTES.menthe },
        { icone: CircleAlert, valeur: globales.total_invalides,   libelle: 'Invalides',       couleur: TEINTES.alerte },
        { icone: Archive,     valeur: globales.total_archives,    libelle: 'Archivés',        couleur: TEINTES.ardoise },
        { icone: UserCheck,   valeur: distribution.effectif,      libelle: 'Élèves notés',    couleur: TEINTES.rose },
        { icone: Gauge,       valeur: note(distribution.mediane), libelle: 'Médiane',         couleur: TEINTES.violet }
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cartes.map((c) => (
                <Repere key={c.libelle} {...c} />
            ))}
        </div>
    );
}

export default function TableauDeBord() {
    const [donnees, setDonnees] = useState(null);
    const [erreur, setErreur]   = useState(null);

    const charger = useCallback(async () => {
        setErreur(null);
        setDonnees(null);
        try {
            const [globales, distribution, classes, top, matieres,
                   aSuivre, dispersion, qualite, rejets, runs] =
                await Promise.all([
                    api.globales(), api.distribution(), api.classes(),
                    api.topMoyennes(), api.matieres(), api.aSuivre(),
                    api.dispersion(), api.qualite(), api.rejets(), api.runs()
                ]);
            setDonnees({ globales, distribution, classes, top, matieres,
                         aSuivre, dispersion, qualite, rejets, runs });
        } catch (e) {
            setErreur(e.message);
        }
    }, []);

    useEffect(() => { charger(); }, [charger]);

    if (erreur) {
        return (
            <Panneau>
                <Erreur message={erreur} reessayer={charger} />
            </Panneau>
        );
    }

    if (!donnees) return <Chargement hauteur="h-[60vh]" />;

    const { globales, distribution, classes, top, matieres,
            aSuivre, dispersion, qualite, rejets, runs } = donnees;

    // Le référentiel contient des classes sans aucun élève inscrit :
    // les afficher ajouterait des colonnes vides aux deux graphiques.
    const classesPeuplees = classes.filter((c) => c.nb_etudiants > 0);

    const deuxColonnes = 'grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0';

    const sousLaBarre = distribution.tranches
        .filter((t) => t.sous_la_barre)
        .reduce((total, t) => total + t.nb_etudiants, 0);

    const ecartMax = matieres.length
        ? matieres.reduce((a, b) => (Math.abs(b.ecart) > Math.abs(a.ecart) ? b : a))
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[34px] leading-[1.1] sm:text-[40px]">
                    Tableau de bord
                </h1>
                <p className="mt-2.5 max-w-[70ch] text-[15px] text-sourdine">
                    Les données arrivent par le pipeline d'ingestion, qui valide
                    chaque ligne, écarte les non conformes et journalise son
                    exécution. Ce qui suit est calculé sur ce qui a été chargé.
                </p>
            </div>

            <Reperes globales={globales} distribution={distribution} />

            <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.35fr] [&>*]:min-w-0">
                <Panneau
                    titre="Qualité de l'ingestion"
                    constat="Ce que le pipeline a accepté, écarté ou reconnu comme déjà chargé."
                >
                    <IndicateursQualite qualite={qualite} rejets={rejets} />
                </Panneau>

                <Panneau
                    titre="Journal des exécutions"
                    constat="Chaque ingestion laisse une trace, qu'elle vienne de la ligne de commande ou de l'interface."
                >
                    <JournalRuns runs={runs} />
                </Panneau>
            </div>

            <div className={deuxColonnes}>
                <Panneau
                    titre="Répartition des moyennes"
                    constat={
                        sousLaBarre === 0
                            ? `Moyenne de la promotion ${note(distribution.moyenne)}. Aucun élève sous la barre des 10.`
                            : `Moyenne de la promotion ${note(distribution.moyenne)}. ${sousLaBarre} sous la barre des 10.`
                    }
                >
                    <RepartitionMoyennes tranches={distribution.tranches} />
                </Panneau>

                <Panneau
                    titre="Répartition par source"
                    constat="PostgreSQL est la source principale ; le JSON complète l'affichage."
                >
                    <ParSource
                        totalDb={globales.total_db}
                        totalJson={globales.total_json}
                    />
                </Panneau>
            </div>

            <div className={deuxColonnes}>
                <Panneau
                    titre="Étudiants par classe"
                    constat="Effectifs enregistrés en base, archivés exclus."
                >
                    <ParClasse donnees={classesPeuplees} />
                </Panneau>

                <Panneau
                    titre="Valides et invalides"
                    constat="Statut de validation des enregistrements de la base."
                >
                    <ParValidite
                        valides={globales.total_valides}
                        invalides={globales.total_invalides}
                    />
                </Panneau>
            </div>

            <Panneau
                titre="Moyenne générale par classe"
                constat="Une classe sous la barre des 10 apparaît en rouge."
            >
                <MoyenneParClasse donnees={classesPeuplees} />
            </Panneau>

            <Panneau
                titre="Top 10 des meilleures moyennes"
                constat="Les trois premières places sont marquées or, argent et bronze."
            >
                <TopMoyennes donnees={top} />
            </Panneau>

            <div className={deuxColonnes}>
                <Panneau
                    titre="Contrôle continu et examen"
                    constat={
                        ecartMax
                            ? `Écart le plus marqué en ${ecartMax.libelle_matiere}.`
                            : undefined
                    }
                >
                    <EcartMatieres donnees={matieres} />
                </Panneau>

                <Panneau
                    titre="Élèves à suivre"
                    constat="Les huit moyennes les plus basses, avec la matière qui pèse le plus lourd."
                >
                    <ASuivre donnees={aSuivre} />
                </Panneau>
            </div>

            <Panneau
                titre="Dispersion des moyennes par classe"
                constat="Une moyenne seule cache l'écart entre les élèves d'une même classe."
            >
                <Classes donnees={dispersion} />
            </Panneau>
        </div>
    );
}
