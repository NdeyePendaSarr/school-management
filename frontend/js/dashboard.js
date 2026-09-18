const API = 'http://localhost:8000/api/v1';

Chart.defaults.color       = '#a8a29e';
Chart.defaults.borderColor = '#f0ede8';
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size   = 12;

const PALETTE = [
    '#2563eb','#0891b2','#059669','#7c3aed',
    '#db2777','#d97706','#dc2626','#16a34a',
    '#9333ea','#0284c7','#65a30d','#ca8a04'
];

document.addEventListener('DOMContentLoaded', chargerTout);

async function chargerTout() {
    try {
        const [globales, classes, top10] = await Promise.all([
            fetch(`${API}/stats/globales`).then(r => r.json()),
            fetch(`${API}/stats/classes`).then(r => r.json()),
            fetch(`${API}/stats/top-moyennes`).then(r => r.json())
        ]);

        afficherKPI(globales);
        afficherChartClasses(classes);
        afficherChartSources(globales);
        afficherChartValidite(globales);
        afficherChartMoyennes(classes);
        afficherChartTop10(top10);

    } catch (err) {
        console.error('Erreur dashboard', err);
    }
}

function afficherKPI(data) {
    const kpis = [
        {
            label:  'Total général',
            valeur: data.total_general,
            icone:  '👥',
            color:  '#2563eb'
        },
        {
            label:  'Base de données',
            valeur: data.total_db,
            icone:  '🗄',
            color:  '#0891b2'
        },
        {
            label:  'Fichier JSON',
            valeur: data.total_json,
            icone:  '📄',
            color:  '#d97706'
        },
        {
            label:  'Actifs',
            valeur: data.total_actifs,
            icone:  '✓',
            color:  '#059669'
        },
        {
            label:  'Archivés',
            valeur: data.total_archives,
            icone:  '📦',
            color:  '#7c3aed'
        },
        {
            label:  'Valides',
            valeur: data.total_valides,
            icone:  '✔',
            color:  '#16a34a'
        },
        {
            label:  'Invalides',
            valeur: data.total_invalides,
            icone:  '✗',
            color:  '#dc2626'
        }
    ];

    document.getElementById('kpi-container').innerHTML =
        kpis.map(k => `
            <div class="kpi-card"
                 style="--kpi-color:${k.color}">
                <span class="kpi-icon">${k.icone}</span>
                <div class="kpi-value"
                     style="color:${k.color}">${k.valeur}</div>
                <div class="kpi-label">${k.label}</div>
            </div>
        `).join('');
}

function tooltipOpts() {
    return {
        backgroundColor: 'white',
        borderColor:     '#e8e4dc',
        borderWidth:     1,
        titleColor:      '#1c1917',
        bodyColor:       '#78716c',
        padding:         10,
        cornerRadius:    8,
        boxShadow:       '0 4px 16px rgba(0,0,0,0.08)'
    };
}

function scaleOpts() {
    return {
        grid:  { color: '#f5f3f0' },
        ticks: { color: '#a8a29e', font: { size: 11 } }
    };
}

function afficherChartClasses(classes) {
    const data = classes.filter(c => c.nb_etudiants > 0);
    new Chart(document.getElementById('chartClasses'), {
        type: 'bar',
        data: {
            labels:   data.map(c => c.libelle_classe),
            datasets: [{
                data:            data.map(c => c.nb_etudiants),
                backgroundColor: PALETTE.map(c => c + '22'),
                borderColor:     PALETTE,
                borderWidth:     1.5,
                borderRadius:    6,
                borderSkipped:   false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend:  { display: false },
                tooltip: tooltipOpts()
            },
            scales: {
                x: scaleOpts(),
                y: { ...scaleOpts(), beginAtZero: true,
                     ticks: { ...scaleOpts().ticks, stepSize: 1 } }
            }
        }
    });
}

function afficherChartSources(data) {
    new Chart(document.getElementById('chartSources'), {
        type: 'doughnut',
        data: {
            labels: ['PostgreSQL', 'JSON'],
            datasets: [{
                data:            [data.total_db, data.total_json],
                backgroundColor: ['#2563eb', '#d97706'],
                borderColor:     ['#fff', '#fff'],
                borderWidth:     3,
                hoverOffset:     6
            }]
        },
        options: {
            responsive: true,
            cutout: '68%',
            plugins: {
                legend: {
                    display:  true,
                    position: 'bottom',
                    labels: {
                        color:           '#78716c',
                        padding:         16,
                        font:            { size: 12 },
                        usePointStyle:   true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: tooltipOpts()
            }
        }
    });
}

function afficherChartValidite(data) {
    new Chart(document.getElementById('chartValidite'), {
        type: 'pie',
        data: {
            labels: ['Valides', 'Invalides'],
            datasets: [{
                data:            [data.total_valides, data.total_invalides],
                backgroundColor: ['#059669', '#dc2626'],
                borderColor:     ['#fff', '#fff'],
                borderWidth:     3,
                hoverOffset:     6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display:  true,
                    position: 'bottom',
                    labels: {
                        color:           '#78716c',
                        padding:         16,
                        font:            { size: 12 },
                        usePointStyle:   true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: tooltipOpts()
            }
        }
    });
}

function afficherChartMoyennes(classes) {
    const data = classes.filter(c => c.moyenne_classe > 0);
    new Chart(document.getElementById('chartMoyennes'), {
        type: 'bar',
        data: {
            labels:   data.map(c => c.libelle_classe),
            datasets: [{
                data:            data.map(c => c.moyenne_classe),
                backgroundColor: data.map(c =>
                    c.moyenne_classe >= 10
                        ? '#05966922' : '#dc262622'
                ),
                borderColor: data.map(c =>
                    c.moyenne_classe >= 10 ? '#059669' : '#dc2626'
                ),
                borderWidth:   1.5,
                borderRadius:  6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend:  { display: false },
                tooltip: tooltipOpts()
            },
            scales: {
                x: scaleOpts(),
                y: {
                    ...scaleOpts(),
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
}

function afficherChartTop10(top10) {
    const podium = ['#d97706','#78716c','#b45309'];
    new Chart(document.getElementById('chartTop10'), {
        type: 'bar',
        data: {
            labels: top10.map(e =>
                `${e.nom_complet}  ·  ${e.libelle_classe}`
            ),
            datasets: [{
                data: top10.map(e => e.moyenne_generale),
                backgroundColor: top10.map((_, i) =>
                    (podium[i] || '#2563eb') + '22'
                ),
                borderColor: top10.map((_, i) =>
                    podium[i] || '#2563eb'
                ),
                borderWidth:   1.5,
                borderRadius:  6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend:  { display: false },
                tooltip: {
                    ...tooltipOpts(),
                    callbacks: {
                        label: ctx => ` Moyenne : ${ctx.raw} / 20`
                    }
                }
            },
            scales: {
                x: {
                    ...scaleOpts(),
                    beginAtZero: true,
                    max: 20
                },
                y: {
                    grid:  { display: false },
                    ticks: { color: '#78716c', font: { size: 12 } }
                }
            }
        }
    });
}