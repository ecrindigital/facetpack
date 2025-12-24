import { runBenchmarks } from './lib/runner'
import { getAllBenchmarkRuns, getBenchmarkRun, deleteBenchmarkRun } from './lib/storage'
import type { RunnerConfig, BenchmarkRun, BenchmarkCategory } from './lib/types'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facetpack Benchmarks</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #0a0a0b;
      --surface: #141416;
      --surface-hover: #1a1a1d;
      --border: #27272a;
      --text: #fafafa;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --success: #22c55e;
      --success-bg: rgba(34, 197, 94, 0.1);
      --warning: #f59e0b;
      --danger: #ef4444;
      --gradient-start: #3b82f6;
      --gradient-end: #8b5cf6;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    /* Layout */
    .app { display: flex; min-height: 100vh; }

    .sidebar {
      width: 280px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .main {
      flex: 1;
      margin-left: 280px;
      padding: 32px;
      max-width: calc(100vw - 280px);
    }

    /* Sidebar */
    .logo {
      padding: 24px;
      border-bottom: 1px solid var(--border);
    }

    .logo h1 {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .logo span {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .run-button {
      margin: 16px;
      padding: 12px 20px;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .run-button:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3); }
    .run-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .history-header {
      padding: 16px 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .run-list { list-style: none; padding: 0 8px 16px; flex: 1; overflow-y: auto; }

    .run-item {
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .run-item:hover { background: var(--surface-hover); }
    .run-item.active { background: var(--surface-hover); border-color: var(--accent); }

    .run-item .date { font-size: 13px; font-weight: 500; color: var(--text); }
    .run-item .meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 8px; align-items: center; }
    .run-item .speedup-badge {
      background: var(--success-bg);
      color: var(--success);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    /* Main content */
    .header {
      margin-bottom: 32px;
    }

    .header h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header p {
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }

    .summary-card .label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .summary-card .value {
      font-size: 32px;
      font-weight: 700;
    }

    .summary-card .value.highlight {
      background: linear-gradient(135deg, var(--success), #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .summary-card .subtitle {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Environment info */
    .env-bar {
      display: flex;
      gap: 24px;
      padding: 16px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 32px;
      font-size: 13px;
    }

    .env-bar .env-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .env-bar .env-label {
      color: var(--text-muted);
    }

    .env-bar .env-value {
      color: var(--text);
      font-weight: 500;
    }

    /* Category sections */
    .category {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }

    .category-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .category-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .category-title h3 {
      font-size: 18px;
      font-weight: 600;
    }

    .category-title p {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .category-stats {
      display: flex;
      gap: 24px;
    }

    .category-stat {
      text-align: right;
    }

    .category-stat .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--success);
    }

    .category-stat .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .category-body {
      padding: 24px;
    }

    /* Chart container */
    .chart-section {
      margin-bottom: 24px;
    }

    .chart-container {
      height: 300px;
      position: relative;
      background: var(--bg);
      border-radius: 12px;
      padding: 16px;
    }

    /* Results table */
    .results-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .results-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
    }

    .results-table td {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .results-table tr:last-child td {
      border-bottom: none;
    }

    .results-table tr:hover td {
      background: var(--surface-hover);
    }

    .test-name {
      font-weight: 600;
      color: var(--text);
    }

    .test-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .project-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .project-badge.basic { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .project-badge.complex { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .project-badge.real-world { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }

    .time-cell {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      font-size: 13px;
    }

    .time-primary {
      font-weight: 600;
      color: var(--text);
    }

    .time-secondary {
      color: var(--text-muted);
      font-size: 11px;
    }

    .speedup-cell {
      font-weight: 700;
      color: var(--success);
      font-size: 16px;
    }

    .winner-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--success-bg);
      color: var(--success);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Metrics detail */
    .metrics-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .metrics-toggle:hover {
      background: var(--surface-hover);
      color: var(--text);
    }

    .metrics-detail {
      display: none;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px;
      background: var(--bg);
      border-radius: 8px;
      margin-top: 12px;
    }

    .metrics-detail.show {
      display: grid;
    }

    .metric-item {
      text-align: center;
    }

    .metric-item .metric-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .metric-item .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-top: 2px;
      font-family: 'SF Mono', monospace;
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 80px 40px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty h3 {
      font-size: 18px;
      color: var(--text);
      margin-bottom: 8px;
    }

    /* Loading */
    .loading { display: flex; align-items: center; gap: 8px; }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive */
    @media (max-width: 1200px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 900px) {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 20px; max-width: 100vw; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="logo">
        <h1>Facetpack</h1>
        <span>Benchmark Dashboard</span>
      </div>

      <button class="run-button" id="run-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Run Benchmarks
      </button>

      <div class="history-header">History</div>
      <ul class="run-list" id="run-list"></ul>
    </aside>

    <main class="main" id="main">
      <div class="empty">
        <div class="empty-icon">📊</div>
        <h3>No benchmark selected</h3>
        <p>Select a run from the history or click "Run Benchmarks" to start</p>
      </div>
    </main>
  </div>

  <script>
    let runs = [];
    let selectedRunId = null;
    let isRunning = false;
    const charts = {};

    async function fetchRuns() {
      const res = await fetch('/api/benchmarks');
      runs = await res.json();
      renderRunList();
      if (runs.length > 0 && !selectedRunId) {
        selectRun(runs[0].id);
      }
    }

    function renderRunList() {
      const list = document.getElementById('run-list');
      list.innerHTML = runs.map(run => \`
        <li class="run-item \${run.id === selectedRunId ? 'active' : ''}" onclick="selectRun('\${run.id}')">
          <div class="date">\${formatDate(run.timestamp)}</div>
          <div class="meta">
            <span>\${run.git.branch}@\${run.git.commit}</span>
            \${run.summary ? \`<span class="speedup-badge">\${run.summary.avgSpeedup.toFixed(1)}x avg</span>\` : ''}
          </div>
        </li>
      \`).join('');
    }

    function formatDate(ts) {
      const d = new Date(ts);
      const now = new Date();
      const diff = now - d;

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return \`\${Math.floor(diff/60000)}m ago\`;
      if (diff < 86400000) return \`\${Math.floor(diff/3600000)}h ago\`;

      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    async function selectRun(id) {
      selectedRunId = id;
      renderRunList();

      const res = await fetch('/api/benchmarks/' + id);
      const run = await res.json();
      renderResults(run);
    }

    function formatTime(ms) {
      if (ms < 0.001) return (ms * 1000000).toFixed(1) + ' ns';
      if (ms < 1) return (ms * 1000).toFixed(2) + ' us';
      if (ms < 1000) return ms.toFixed(2) + ' ms';
      return (ms / 1000).toFixed(2) + ' s';
    }

    function formatOps(ops) {
      if (ops >= 1000000) return (ops / 1000000).toFixed(1) + 'M';
      if (ops >= 1000) return (ops / 1000).toFixed(1) + 'K';
      return ops.toFixed(0);
    }

    function renderResults(run) {
      const main = document.getElementById('main');

      Object.values(charts).forEach(c => c.destroy());

      const summary = run.summary || { totalTests: 0, avgSpeedup: 1, maxSpeedup: 1, totalTimeSaved: 0 };
      const categories = run.categories || [];

      main.innerHTML = \`
        <div class="header">
          <h2>Benchmark Results</h2>
          <p>\${new Date(run.timestamp).toLocaleString()} • \${run.git.branch}@\${run.git.commit}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Tests</div>
            <div class="value">\${summary.totalTests}</div>
            <div class="subtitle">\${categories.length} categories</div>
          </div>
          <div class="summary-card">
            <div class="label">Average Speedup</div>
            <div class="value highlight">\${summary.avgSpeedup.toFixed(1)}x</div>
            <div class="subtitle">vs traditional tools</div>
          </div>
          <div class="summary-card">
            <div class="label">Maximum Speedup</div>
            <div class="value highlight">\${summary.maxSpeedup.toFixed(1)}x</div>
            <div class="subtitle">peak performance</div>
          </div>
          <div class="summary-card">
            <div class="label">Platform</div>
            <div class="value" style="font-size: 18px;">\${run.environment.platform}</div>
            <div class="subtitle">\${run.environment.cpu}</div>
          </div>
        </div>

        <div class="env-bar">
          <div class="env-item">
            <span class="env-label">Bun</span>
            <span class="env-value">\${run.environment.bun}</span>
          </div>
          <div class="env-item">
            <span class="env-label">Node</span>
            <span class="env-value">\${run.environment.node}</span>
          </div>
          <div class="env-item">
            <span class="env-label">CPU</span>
            <span class="env-value">\${run.environment.cores} cores</span>
          </div>
          <div class="env-item">
            <span class="env-label">Memory</span>
            <span class="env-value">\${run.environment.memory}</span>
          </div>
        </div>

        \${categories.map(cat => renderCategory(cat)).join('')}
      \`;

      setTimeout(() => {
        categories.forEach(cat => {
          initCategoryChart(cat);
        });
      }, 0);
    }

    function renderCategory(category) {
      const results = category.results || [];
      const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
      const maxSpeedup = Math.max(...results.map(r => r.speedup));

      return \`
        <div class="category">
          <div class="category-header">
            <div class="category-title">
              <div class="category-icon">\${category.icon}</div>
              <div>
                <h3>\${category.name}</h3>
                <p>\${category.description}</p>
              </div>
            </div>
            <div class="category-stats">
              <div class="category-stat">
                <div class="stat-value">\${avgSpeedup.toFixed(1)}x</div>
                <div class="stat-label">Avg Speedup</div>
              </div>
              <div class="category-stat">
                <div class="stat-value">\${maxSpeedup.toFixed(1)}x</div>
                <div class="stat-label">Max Speedup</div>
              </div>
            </div>
          </div>

          <div class="category-body">
            <div class="chart-section">
              <div class="chart-container">
                <canvas id="chart-\${category.id}"></canvas>
              </div>
            </div>

            <table class="results-table">
              <thead>
                <tr>
                  <th style="width: 25%">Test</th>
                  <th style="width: 12%">Project</th>
                  <th style="width: 18%">Baseline</th>
                  <th style="width: 18%">Facetpack</th>
                  <th style="width: 12%">Speedup</th>
                  <th style="width: 15%">Winner</th>
                </tr>
              </thead>
              <tbody>
                \${results.map(r => renderResultRow(r)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }

    function renderResultRow(result) {
      const baseline = result.variants.find(v =>
        v.tool === 'babel' || v.tool === 'terser' || v.tool === 'enhanced-resolve' || v.name.includes('Loop')
      );
      const facetpack = result.variants.find(v =>
        v.tool === 'facetpack' || v.tool === 'oxc' || v.name.includes('Batch')
      ) || result.variants[0];

      const baselineDisplay = baseline || result.variants[0];
      const facetpackDisplay = result.variants.length > 1 ? (facetpack || result.variants[1]) : result.variants[0];

      const typeClass = result.projectType === 'basic' ? 'basic' :
                        result.projectType === 'complex' ? 'complex' : 'real-world';

      return \`
        <tr>
          <td>
            <div class="test-name">\${result.name}</div>
            <div class="test-desc">\${result.description}</div>
          </td>
          <td>
            <span class="project-badge \${typeClass}">\${result.projectSize}</span>
          </td>
          <td class="time-cell">
            <div class="time-primary">\${formatTime(baselineDisplay.metrics.mean)}</div>
            <div class="time-secondary">p95: \${formatTime(baselineDisplay.metrics.p95)} • \${formatOps(baselineDisplay.metrics.ops)} ops/s</div>
          </td>
          <td class="time-cell">
            <div class="time-primary">\${formatTime(facetpackDisplay.metrics.mean)}</div>
            <div class="time-secondary">p95: \${formatTime(facetpackDisplay.metrics.p95)} • \${formatOps(facetpackDisplay.metrics.ops)} ops/s</div>
          </td>
          <td class="speedup-cell">\${result.speedup.toFixed(1)}x</td>
          <td>
            <span class="winner-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              \${result.winner}
            </span>
          </td>
        </tr>
      \`;
    }

    function initCategoryChart(category) {
      const ctx = document.getElementById('chart-' + category.id);
      if (!ctx) return;

      const results = category.results || [];

      const tools = [...new Set(results.flatMap(r => r.variants.map(v => v.name)))];
      const toolColors = {
        'Babel': '#f5da55',
        'Terser': '#dd6b20',
        'enhanced-resolve': '#10b981',
        'Facetpack/OXC': '#3b82f6',
        'Loop (N calls)': '#f59e0b',
        'Batch (1 call)': '#3b82f6',
        'Loop': '#f59e0b',
        'Batch': '#3b82f6',
      };

      const datasets = tools.map(tool => ({
        label: tool,
        data: results.map(r => {
          const variant = r.variants.find(v => v.name === tool);
          return variant ? variant.metrics.mean : null;
        }),
        backgroundColor: toolColors[tool] || '#71717a',
        borderRadius: 6,
        barPercentage: 0.7,
      }));

      charts[category.id] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: results.map(r => r.name),
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#a1a1aa',
                padding: 16,
                font: { size: 12, weight: '500' },
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              backgroundColor: '#1a1a1d',
              titleColor: '#fafafa',
              bodyColor: '#a1a1aa',
              borderColor: '#27272a',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (ctx) => \`\${ctx.dataset.label}: \${formatTime(ctx.raw)}\`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#71717a', font: { size: 11 } },
              grid: { display: false },
            },
            y: {
              ticks: {
                color: '#71717a',
                font: { size: 11 },
                callback: v => formatTime(v),
              },
              grid: { color: '#27272a' },
            },
          },
        },
      });
    }

    async function runBenchmark() {
      if (isRunning) return;
      isRunning = true;

      const btn = document.getElementById('run-btn');
      btn.innerHTML = '<span class="loading"><span class="spinner"></span>Running...</span>';
      btn.disabled = true;

      try {
        const res = await fetch('/api/benchmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: ['transform', 'minify', 'resolve', 'analyze'] }),
        });
        const run = await res.json();
        await fetchRuns();
        selectRun(run.id);
      } catch (err) {
        console.error(err);
        alert('Benchmark failed: ' + err.message);
      } finally {
        isRunning = false;
        btn.innerHTML = \`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Run Benchmarks
        \`;
        btn.disabled = false;
      }
    }

    document.getElementById('run-btn').addEventListener('click', runBenchmark);
    fetchRuns();
  </script>
</body>
</html>`

const PORT = 3456
const CURRENT_PID = process.pid

async function ensurePortAvailable(port: number): Promise<void> {
  try {
    const result = await Bun.$`lsof -ti:${port}`.text()
    const pids = result.trim().split('\n').filter(Boolean).filter(pid => pid !== String(CURRENT_PID))

    if (pids.length > 0) {
      console.log(`⚠️  Port ${port} in use, killing existing process(es): ${pids.join(', ')}`)
      for (const pid of pids) {
        try {
          await Bun.$`kill -9 ${pid}`.quiet()
        } catch {
        }
      }
      await Bun.sleep(300)
    }
  } catch {
  }
}

await ensurePortAvailable(PORT)

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    if (path === '/') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (path === '/api/benchmarks' && req.method === 'GET') {
      const runs = await getAllBenchmarkRuns()
      return Response.json(runs)
    }

    if (path === '/api/benchmarks' && req.method === 'POST') {
      try {
        const config = await req.json() as RunnerConfig
        const run = await runBenchmarks(config)
        return Response.json(run)
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 })
      }
    }

    const runMatch = path.match(/^\/api\/benchmarks\/([^/]+)$/)
    if (runMatch && req.method === 'GET') {
      const run = await getBenchmarkRun(runMatch[1])
      if (!run) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      return Response.json(run)
    }

    if (runMatch && req.method === 'DELETE') {
      const deleted = await deleteBenchmarkRun(runMatch[1])
      if (!deleted) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      return Response.json({ success: true })
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`
🚀 Facetpack Benchmark Dashboard

   Dashboard: http://localhost:${server.port}

   API Endpoints:
   - GET  /api/benchmarks      - List all runs
   - POST /api/benchmarks      - Run new benchmark
   - GET  /api/benchmarks/:id  - Get specific run
   - DELETE /api/benchmarks/:id - Delete run
`)
