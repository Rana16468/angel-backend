const systemArtc = () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Platform — Telemetry & Diagnostics</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f0f2f7;
            --surface: #ffffff;
            --surface-raised: #ffffff;
            --surface-tinted: #f7f8fc;
            --accent: #4f6ef7;
            --accent-light: #eef0fe;
            --accent-mid: #c5ccfb;
            --accent-dark: #2d45c8;
            --success: #22c55e;
            --success-bg: #f0fdf4;
            --success-dark: #15803d;
            --danger: #ef4444;
            --danger-bg: #fef2f2;
            --warn: #f59e0b;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --text-tertiary: #9ca3af;
            --border: rgba(0, 0, 0, 0.07);
            --border-strong: rgba(0, 0, 0, 0.12);
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
            --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
            --shadow-accent: 0 4px 20px rgba(79, 110, 247, 0.18);
            --radius: 14px;
            --radius-sm: 8px;
            --radius-pill: 100px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg);
            color: var(--text-primary);
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            padding: 0;
        }

        /* ── Top Nav Bar ── */
        .topbar {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 0 2.5rem;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: var(--shadow-sm);
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-mark {
            width: 32px;
            height: 32px;
            background: var(--accent);
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-accent);
        }

        .logo-mark svg { color: white; }

        .brand-name {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            color: var(--text-primary);
            letter-spacing: -0.01em;
        }

        .brand-divider {
            width: 1px;
            height: 18px;
            background: var(--border-strong);
        }

        .brand-section {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .live-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: var(--success-bg);
            border: 1px solid rgba(34, 197, 94, 0.2);
            padding: 0.3rem 0.75rem;
            border-radius: var(--radius-pill);
        }

        .live-dot {
            width: 6px; height: 6px;
            background: var(--success);
            border-radius: 50%;
            animation: livepulse 2s infinite;
        }

        .live-text {
            font-size: 0.72rem;
            font-weight: 600;
            color: var(--success-dark);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        /* ── Page Layout ── */
        .page {
            max-width: 1280px;
            margin: 0 auto;
            padding: 2rem 2.5rem 4rem;
        }

        /* ── Page Header ── */
        .page-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-bottom: 2rem;
        }

        .page-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.65rem;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.03em;
            margin-bottom: 0.3rem;
        }

        .page-subtitle {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        .refresh-tag {
            font-size: 0.75rem;
            color: var(--text-tertiary);
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .refresh-tag::before {
            content: '';
            width: 8px; height: 8px;
            border: 1.5px solid var(--text-tertiary);
            border-top-color: transparent;
            border-radius: 50%;
            display: inline-block;
            animation: spin 1.5s linear infinite;
        }

        /* ── Stat row (top KPIs) ── */
        .stat-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 1.25rem;
        }

        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.25rem 1.4rem;
            box-shadow: var(--shadow-sm);
            transition: box-shadow 0.2s, transform 0.2s;
        }

        .stat-card:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }

        .stat-icon-wrap {
            width: 36px; height: 36px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.9rem;
        }

        .stat-icon-wrap.blue  { background: var(--accent-light); color: var(--accent); }
        .stat-icon-wrap.green { background: var(--success-bg);   color: var(--success-dark); }
        .stat-icon-wrap.red   { background: var(--danger-bg);    color: var(--danger); }
        .stat-icon-wrap.amber { background: #fffbeb;             color: #92400e; }

        .stat-label {
            font-size: 0.74rem;
            font-weight: 600;
            color: var(--text-secondary);
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 0.35rem;
        }

        .stat-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.7rem;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.04em;
            line-height: 1;
        }

        .stat-meta {
            font-size: 0.78rem;
            color: var(--text-tertiary);
            margin-top: 0.3rem;
        }

        /* ── Progress bar ── */
        .prog-track {
            width: 100%;
            height: 4px;
            background: var(--border);
            border-radius: 2px;
            margin-top: 0.9rem;
            overflow: hidden;
        }

        .prog-fill {
            height: 100%;
            border-radius: 2px;
            background: var(--accent);
            width: 0%;
            transition: width 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Main grid ── */
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1.25rem;
        }

        /* ── Card ── */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.4rem 1.5rem;
            box-shadow: var(--shadow-sm);
            transition: box-shadow 0.2s, transform 0.2s;
        }

        .card:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.1rem;
        }

        .card-title {
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-secondary);
        }

        .card-icon {
            width: 32px; height: 32px;
            background: var(--surface-tinted);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
        }

        /* ── Row list ── */
        .row-list { display: flex; flex-direction: column; gap: 0; }

        .row-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.65rem 0;
            border-bottom: 1px solid var(--border);
            font-size: 0.87rem;
        }

        .row-item:last-child { border-bottom: none; padding-bottom: 0; }
        .row-item:first-child { padding-top: 0; }

        .row-label { color: var(--text-secondary); }

        .row-val {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600;
            color: var(--text-primary);
        }

        .row-val.accent { color: var(--accent); }
        .row-val.success { color: var(--success-dark); }

        /* ── Health matrix (full width) ── */
        .full-width { grid-column: 1 / -1; }

        .health-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-top: 0.25rem;
        }

        .health-cell {
            background: var(--surface-tinted);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 1.25rem;
            text-align: center;
        }

        .health-cell-label {
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            margin-bottom: 0.55rem;
        }

        .health-cell-val {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.04em;
            line-height: 1;
        }

        .health-cell-val.accent  { color: var(--accent); }
        .health-cell-val.success { color: var(--success-dark); }
        .health-cell-val.danger  { color: var(--danger); }

        /* ── Accent card (CPU) ── */
        .card-accent {
            background: var(--accent);
            border: none;
            color: white;
        }

        .card-accent .card-title { color: rgba(255,255,255,0.7); }
        .card-accent .card-icon { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: white; }
        .card-accent .stat-value { color: white; font-size: 2.2rem; }
        .card-accent .stat-meta { color: rgba(255,255,255,0.6); }

        /* ── Footer ── */
        footer {
            text-align: center;
            margin-top: 3rem;
            font-size: 0.76rem;
            color: var(--text-tertiary);
            letter-spacing: 0.04em;
        }

        /* ── Animations ── */
        @keyframes livepulse {
            0%   { opacity: 1;   transform: scale(1);    }
            50%  { opacity: 0.5; transform: scale(1.3);  }
            100% { opacity: 1;   transform: scale(1);    }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
            .main-grid { grid-template-columns: 1fr 1fr; }
            .full-width { grid-column: 1 / -1; }
            .page { padding: 1.5rem 1.25rem 3rem; }
        }

        @media (max-width: 600px) {
            .main-grid { grid-template-columns: 1fr; }
            .topbar { padding: 0 1.25rem; }
            .page-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
            .health-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <!-- Nav Bar -->
    <nav class="topbar">
        <div class="topbar-left">
            <div class="logo-mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
            </div>
            <span class="brand-name">Event Platform</span>
            <div class="brand-divider"></div>
            <span class="brand-section">System Telemetry</span>
        </div>
        <div class="topbar-right">
            <div class="live-badge">
                <div class="live-dot"></div>
                <span class="live-text">Live</span>
            </div>
        </div>
    </nav>

    <!-- Page -->
    <div class="page">

        <div class="page-header">
            <div>
                <div class="page-title">Real-Time Diagnostics</div>
                <div class="page-subtitle">System health and performance — auto-refreshing every 3 seconds</div>
            </div>
            <div class="refresh-tag">Syncing metrics...</div>
        </div>

        <!-- Top KPI row -->
        <div class="stat-row">

            <div class="stat-card">
                <div class="stat-icon-wrap blue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                </div>
                <div class="stat-label">RAM Used</div>
                <div class="stat-value" id="ram-val">—</div>
                <div class="stat-meta" id="ram-sub">Loading…</div>
                <div class="prog-track"><div class="prog-fill" id="ram-bar"></div></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrap amber">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
                </div>
                <div class="stat-label">Disk Used</div>
                <div class="stat-value" id="storage-val">—</div>
                <div class="stat-meta" id="storage-sub">Loading…</div>
                <div class="prog-track"><div class="prog-fill" id="storage-bar" style="background: var(--warn);"></div></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrap green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="stat-label">Total Users</div>
                <div class="stat-value" id="users-total">—</div>
                <div class="stat-meta" id="users-active-meta">— verified active</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrap red">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <div class="stat-label">Requests / min</div>
                <div class="stat-value" id="hits-min">—</div>
                <div class="stat-meta" id="hits-hour-meta">— total this hour</div>
            </div>

        </div>

        <!-- Main grid -->
        <div class="main-grid">

            <!-- CPU — accent card -->
            <div class="card card-accent">
                <div class="card-header">
                    <div class="card-title">Processor Load</div>
                    <div class="card-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
                    </div>
                </div>
                <div class="stat-value" id="cpu-val" style="font-family:'Space Grotesk',sans-serif;font-size:2.8rem;font-weight:700;letter-spacing:-0.05em;margin-bottom:0.4rem;color:white;">—</div>
                <div class="stat-meta" id="cpu-sub" style="font-size:0.82rem;color:rgba(255,255,255,0.6);">Loading…</div>
            </div>

            <!-- Server Specs -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Server Specs</div>
                    <div class="card-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="22" y2="7"></line><line x1="2" y1="17" x2="22" y2="17"></line></svg>
                    </div>
                </div>
                <div class="row-list">
                    <div class="row-item">
                        <span class="row-label">OS Platform</span>
                        <span class="row-val" id="os-platform">—</span>
                    </div>
                    <div class="row-item">
                        <span class="row-label">Uptime</span>
                        <span class="row-val accent" id="uptime">—</span>
                    </div>
                </div>
            </div>

            <!-- Users -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">User Accounts</div>
                    <div class="card-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                </div>
                <div class="row-list">
                    <div class="row-item">
                        <span class="row-label">Registered</span>
                        <span class="row-val" id="users-total-card">—</span>
                    </div>
                    <div class="row-item">
                        <span class="row-label">Verified Active</span>
                        <span class="row-val success" id="users-active">—</span>
                    </div>
                </div>
            </div>

            <!-- API Traffic -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">API Traffic</div>
                    <div class="card-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    </div>
                </div>
                <div class="row-list">
                    <div class="row-item">
                        <span class="row-label">Hits / Minute</span>
                        <span class="row-val accent" id="hits-min-card">—</span>
                    </div>
                    <div class="row-item">
                        <span class="row-label">Hits / Hour</span>
                        <span class="row-val accent" id="hits-hour">—</span>
                    </div>
                </div>
            </div>

            <!-- Health Matrix -->
            <div class="card full-width">
                <div class="card-header">
                    <div class="card-title">API Health Matrix</div>
                    <div class="card-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                </div>
                <div class="health-grid">
                    <div class="health-cell">
                        <div class="health-cell-label">Avg Latency</div>
                        <div class="health-cell-val accent" id="health-latency">— ms</div>
                    </div>
                    <div class="health-cell">
                        <div class="health-cell-label">Success Rate</div>
                        <div class="health-cell-val success" id="health-success">—%</div>
                    </div>
                    <div class="health-cell">
                        <div class="health-cell-label">Error Count</div>
                        <div class="health-cell-val danger" id="health-errors">—</div>
                    </div>
                </div>
            </div>

        </div>

        <footer>Event Platform &mdash; Telemetry &amp; Diagnostics Dashboard</footer>
    </div>

    <script>
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/v1/monitor/metrics');
                if (!res.ok) return;
                const d = await res.json();

                document.getElementById('ram-val').innerText        = d.ram.usedGB + ' GB';
                document.getElementById('ram-sub').innerText        = d.ram.usedGB + ' of ' + d.ram.totalGB + ' GB';
                document.getElementById('ram-bar').style.width      = d.ram.percent + '%';

                document.getElementById('storage-val').innerText    = d.storage.usedGB + ' GB';
                document.getElementById('storage-sub').innerText    = d.storage.usedGB + ' of ' + d.storage.totalGB + ' GB';
                document.getElementById('storage-bar').style.width  = d.storage.percent + '%';

                document.getElementById('users-total').innerText    = d.users.total;
                document.getElementById('users-active-meta').innerText = d.users.active + ' verified active';
                document.getElementById('users-total-card').innerText  = d.users.total;
                document.getElementById('users-active').innerText   = d.users.active;

                document.getElementById('hits-min').innerText       = d.traffic.hitsMin;
                document.getElementById('hits-hour-meta').innerText = d.traffic.hitsHour + ' total this hour';
                document.getElementById('hits-min-card').innerText  = d.traffic.hitsMin;
                document.getElementById('hits-hour').innerText      = d.traffic.hitsHour;

                document.getElementById('cpu-val').innerText        = d.cpu.load1m.toFixed(2);
                document.getElementById('cpu-sub').innerText        = d.cpu.model;

                document.getElementById('os-platform').innerText    = d.osPlatform;
                document.getElementById('uptime').innerText         = d.uptimeHours + ' hrs';

                document.getElementById('health-latency').innerText = d.health.avgLatencyMs + ' ms';
                document.getElementById('health-success').innerText = d.health.successRatePercent + '%';
                document.getElementById('health-errors').innerText  = d.health.errorCount;

            } catch (err) {
                console.error('Failed to fetch diagnostics:', err);
            }
        }

        fetchMetrics();
        setInterval(fetchMetrics, 3000);
    </script>
</body>
</html>`
}

export default systemArtc