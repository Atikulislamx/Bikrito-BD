/**
 * components/chart.js
 * Renders the analytics charts in the Overview section.
 * Requires Chart.js to be loaded before this script.
 */

let verdictChartInstance = null;
let arrestChartInstance  = null;

/**
 * Renders (or updates) the verdict distribution pie chart
 * and the arrest status bar chart.
 *
 * @param {Array} newsItems - Array of Firestore news document objects
 */
function renderCharts(newsItems) {
  if (typeof Chart === 'undefined') {
    console.warn('[chart.js] Chart.js not loaded.');
    return;
  }

  // ---- Collect stats ----
  const verdictCounts = { pending: 0, convicted: 0, acquitted: 0 };
  const arrestCounts  = { yes: 0, partial: 0, no: 0, unknown: 0 };

  newsItems.forEach(news => {
    const updates = news.case_updates || [];
    if (updates.length === 0) return;

    // Use the most recent update for aggregate stats
    const latest = updates[updates.length - 1];
    const verdict = latest.verdict || 'pending';
    const arrested = latest.arrested || 'unknown';

    if (verdict  in verdictCounts)  verdictCounts[verdict]++;
    if (arrested in arrestCounts)   arrestCounts[arrested]++;
  });

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  Chart.defaults.color = textColor;

  // ---- Verdict Pie Chart ----
  const verdictCtx = document.getElementById('verdictChart');
  if (verdictCtx) {
    if (verdictChartInstance) verdictChartInstance.destroy();

    verdictChartInstance = new Chart(verdictCtx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Convicted', 'Acquitted'],
        datasets: [{
          data: [verdictCounts.pending, verdictCounts.convicted, verdictCounts.acquitted],
          backgroundColor: ['#f59e0b', '#16a34a', '#dc2626'],
          borderColor: isDark ? '#1a1d2e' : '#ffffff',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 11 }, color: textColor }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} case${ctx.parsed !== 1 ? 's' : ''}`
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  // ---- Arrest Status Bar Chart ----
  const arrestCtx = document.getElementById('arrestChart');
  if (arrestCtx) {
    if (arrestChartInstance) arrestChartInstance.destroy();

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const barColors = ['#16a34a', '#d97706', '#dc2626', '#9ca3af'];

    arrestChartInstance = new Chart(arrestCtx, {
      type: 'bar',
      data: {
        labels: ['Arrested', 'Partial', 'No Arrest', 'Unknown'],
        datasets: [{
          label: 'Cases',
          data: [arrestCounts.yes, arrestCounts.partial, arrestCounts.no, arrestCounts.unknown],
          backgroundColor: barColors.map(c => c + 'bb'),
          borderColor: barColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} case${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: textColor,
              font: { size: 11 }
            },
            grid: {
              color: isDarkMode ? '#2e3347' : '#e2e6ee'
            }
          }
        }
      }
    });
  }
}
