import {
    Chart as ChartJS,
    BarElement, CategoryScale, LinearScale,
    ArcElement, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

// Chart.js est modulaire : seuls les éléments utilisés sont enregistrés.
ChartJS.register(
    BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend
);

export const TEINTES = {
    indigo:  '#4a47d8',
    cyan:    '#0e8fa4',
    ambre:   '#e08a2b',
    menthe:  '#0ea47a',
    violet:  '#7c5ce0',
    rose:    '#d1478f',
    ardoise: '#64748b',
    alerte:  '#d6455c'
};

const POLICE = { family: "'Manrope Variable', system-ui, sans-serif", size: 12 };
const SOURDINE = '#5f6a8a';
const REGLURE  = '#dfe4f2';

const communes = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#131a33',
            padding: 10,
            cornerRadius: 8,
            titleFont: { ...POLICE, weight: '700' },
            bodyFont: POLICE
        }
    }
};

const axes = (max) => ({
    x: {
        grid: { display: false },
        ticks: { color: SOURDINE, font: POLICE }
    },
    y: {
        beginAtZero: true,
        ...(max ? { max } : {}),
        grid: { color: REGLURE },
        border: { display: false },
        ticks: { color: SOURDINE, font: POLICE, precision: 0 }
    }
});

function Cadre({ hauteur = 280, children }) {
    return (
        <div className="px-6 pb-6 sm:px-7" style={{ height: hauteur }}>
            {children}
        </div>
    );
}

/** Effectifs par classe — barres verticales. */
export function ParClasse({ donnees }) {
    return (
        <Cadre>
            <Bar
                data={{
                    labels: donnees.map((c) => c.libelle_classe),
                    datasets: [{
                        label: 'Élèves',
                        data: donnees.map((c) => c.nb_etudiants),
                        backgroundColor: TEINTES.indigo,
                        borderRadius: 6,
                        maxBarThickness: 46
                    }]
                }}
                options={{ ...communes, scales: axes() }}
            />
        </Cadre>
    );
}

/** Répartition par source — anneau. */
export function ParSource({ totalDb, totalJson }) {
    return (
        <Cadre>
            <Doughnut
                data={{
                    labels: ['PostgreSQL', 'Fichier JSON'],
                    datasets: [{
                        data: [totalDb, totalJson],
                        backgroundColor: [TEINTES.cyan, TEINTES.ambre],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                }}
                options={{
                    ...communes,
                    cutout: '62%',
                    plugins: {
                        ...communes.plugins,
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: SOURDINE, font: POLICE,
                                usePointStyle: true, pointStyle: 'circle',
                                padding: 18, boxWidth: 8
                            }
                        }
                    }
                }}
            />
        </Cadre>
    );
}

/** Valides contre invalides — camembert. */
export function ParValidite({ valides, invalides }) {
    return (
        <Cadre>
            <Pie
                data={{
                    labels: ['Valides', 'Invalides'],
                    datasets: [{
                        data: [valides, invalides],
                        backgroundColor: [TEINTES.menthe, TEINTES.alerte],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                }}
                options={{
                    ...communes,
                    plugins: {
                        ...communes.plugins,
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: SOURDINE, font: POLICE,
                                usePointStyle: true, pointStyle: 'circle',
                                padding: 18, boxWidth: 8
                            }
                        }
                    }
                }}
            />
        </Cadre>
    );
}

/** Moyenne générale par classe — barres sur l'échelle 0-20. */
export function MoyenneParClasse({ donnees }) {
    return (
        <Cadre>
            <Bar
                data={{
                    labels: donnees.map((c) => c.libelle_classe),
                    datasets: [{
                        label: 'Moyenne',
                        data: donnees.map((c) => c.moyenne_classe),
                        backgroundColor: donnees.map((c) =>
                            c.moyenne_classe < 10 ? TEINTES.alerte : TEINTES.menthe
                        ),
                        borderRadius: 6,
                        maxBarThickness: 46
                    }]
                }}
                options={{ ...communes, scales: axes(20) }}
            />
        </Cadre>
    );
}

/** Top 10 des meilleures moyennes — barres horizontales. */
export function TopMoyennes({ donnees }) {
    return (
        <Cadre hauteur={Math.max(260, donnees.length * 34 + 60)}>
            <Bar
                data={{
                    labels: donnees.map(
                        (e) => `${e.nom} ${e.prenom} — ${e.libelle_classe}`
                    ),
                    datasets: [{
                        label: 'Moyenne',
                        data: donnees.map((e) => e.moyenne_generale),
                        // Or, argent, bronze pour le podium.
                        backgroundColor: donnees.map((_, i) =>
                            ['#eab308', '#94a3b8', '#c2740c'][i] ?? TEINTES.indigo
                        ),
                        borderRadius: 6,
                        maxBarThickness: 22
                    }]
                }}
                options={{
                    ...communes,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true, max: 20,
                            grid: { color: REGLURE },
                            border: { display: false },
                            ticks: { color: SOURDINE, font: POLICE }
                        },
                        y: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { color: SOURDINE, font: POLICE }
                        }
                    }
                }}
            />
        </Cadre>
    );
}

/**
 * Répartition des moyennes par tranche.
 * Les tranches sous la barre des 10 sont en rouge.
 */
export function RepartitionMoyennes({ tranches }) {
    return (
        <Cadre hauteur={300}>
            <Bar
                data={{
                    labels: tranches.map((t) => t.tranche),
                    datasets: [{
                        label: 'Élèves',
                        data: tranches.map((t) => t.nb_etudiants),
                        backgroundColor: tranches.map((t) =>
                            t.sous_la_barre ? TEINTES.alerte : TEINTES.indigo
                        ),
                        borderRadius: 6,
                        maxBarThickness: 64
                    }]
                }}
                options={{ ...communes, scales: axes() }}
            />
        </Cadre>
    );
}
