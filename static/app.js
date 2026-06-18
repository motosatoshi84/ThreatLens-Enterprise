'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  step: 1,
  components: [],
  dataTypes: [],
  connections: [],
  actors: [],
  lastResult: null,
};

const FRAMEWORK_HINTS = {
  STRIDE:  'Best for general application and infrastructure threat modelling.',
  LINDDUN: 'Best for privacy-sensitive systems handling personal data (GDPR, HIPAA).',
  NIST:    'Best for compliance-focused analysis mapped to NIST 800-53 controls.',
  OWASP:   'Best for web applications and APIs.',
  MITRE:   'Best for adversarial/red-team style analysis using real attacker TTPs.',
  PASTA:   'Best for business-risk-centric analysis tied to organisational impact.',
};

// ── Step navigation ────────────────────────────────────────────────────────
function showStep(n) {
  state.step = n;
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.step[data-step="${n}"]`).classList.add('active');
  document.querySelectorAll('.step-tab').forEach(t => {
    t.classList.remove('active');
    if (Number(t.dataset.step) < n) t.classList.add('done');
    else t.classList.remove('done');
  });
  const active = document.querySelector(`.step-tab[data-step="${n}"]`);
  if (active) { active.classList.add('active'); active.classList.remove('done'); }
  document.getElementById('prevStep').disabled = n === 1;
  document.getElementById('nextStep').disabled = n === 5;
  if (n === 5) renderPreflight();
}

document.querySelectorAll('.step-tab').forEach(btn =>
  btn.addEventListener('click', () => showStep(Number(btn.dataset.step)))
);
document.getElementById('nextStep').onclick = () => { if (state.step < 5) showStep(state.step + 1); };
document.getElementById('prevStep').onclick = () => { if (state.step > 1) showStep(state.step - 1); };

// ── Framework hint ─────────────────────────────────────────────────────────
document.getElementById('framework').addEventListener('change', function () {
  document.getElementById('frameworkHint').textContent = FRAMEWORK_HINTS[this.value] || '';
});
document.getElementById('frameworkHint').textContent = FRAMEWORK_HINTS['STRIDE'];

// ── Render boards ──────────────────────────────────────────────────────────
function renderAll() {
  renderComponents();
  renderData();
  renderConnections();
  renderActors();
}

function renderComponents() {
  const el = document.getElementById('componentBoard');
  if (!state.components.length) {
    el.innerHTML = '<div class="empty-state">No components added yet.</div>'; return;
  }
  el.innerHTML = state.components.map((c, i) => `
    <div class="board-item">
      <div><strong>${c.name}</strong><span>${c.type}</span></div>
      <button type="button" class="ghost" onclick="removeComponent(${i})">Remove</button>
    </div>`).join('');
}

function renderData() {
  const el = document.getElementById('dataBoard');
  if (!state.dataTypes.length) {
    el.innerHTML = '<div class="empty-state">No data types added yet.</div>'; return;
  }
  el.innerHTML = state.dataTypes.map((d, i) => `
    <div class="chip">${d}
      <button type="button" onclick="removeData(${i})">×</button>
    </div>`).join('');
}

function renderConnections() {
  const el = document.getElementById('connectionBoard');
  if (!state.connections.length) {
    el.innerHTML = '<div class="empty-state">No connections added yet.</div>'; return;
  }
  el.innerHTML = state.connections.map((c, i) => `
    <div class="board-item">
      <div><strong>${c.from} → ${c.to}</strong><span>${c.trust}</span></div>
      <button type="button" class="ghost" onclick="removeConnection(${i})">Remove</button>
    </div>`).join('');
}

function renderActors() {
  const el = document.getElementById('actorBoard');
  if (!state.actors.length) {
    el.innerHTML = '<div class="empty-state">No actors added yet.</div>'; return;
  }
  el.innerHTML = state.actors.map((a, i) => `
    <div class="chip">${a}
      <button type="button" onclick="removeActor(${i})">×</button>
    </div>`).join('');
}

// ── Remove handlers ────────────────────────────────────────────────────────
window.removeComponent  = i => { state.components.splice(i,1); renderAll(); };
window.removeData       = i => { state.dataTypes.splice(i,1);  renderAll(); };
window.removeConnection = i => { state.connections.splice(i,1); renderAll(); };
window.removeActor      = i => { state.actors.splice(i,1);      renderAll(); };

// ── Add handlers ───────────────────────────────────────────────────────────
document.getElementById('addComponent').onclick = () => {
  const name = document.getElementById('componentName').value.trim();
  const type = document.getElementById('componentType').value;
  if (!name) return;
  state.components.push({ name, type });
  document.getElementById('componentName').value = '';
  renderAll();
};

document.getElementById('addData').onclick = () => addDataValue();
document.getElementById('dataInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addDataValue(); } });

function addDataValue() {
  const value = document.getElementById('dataInput').value.trim();
  if (!value || state.dataTypes.includes(value)) return;
  state.dataTypes.push(value);
  document.getElementById('dataInput').value = '';
  renderAll();
}

document.querySelectorAll('.chip-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.value;
    if (!state.dataTypes.includes(v)) { state.dataTypes.push(v); renderAll(); }
  });
});

document.getElementById('addConnection').onclick = () => {
  const from  = document.getElementById('from').value.trim();
  const to    = document.getElementById('to').value.trim();
  const trust = document.getElementById('trust').value;
  if (!from || !to) return;
  state.connections.push({ from, to, trust });
  document.getElementById('from').value = '';
  document.getElementById('to').value = '';
  renderAll();
};

document.getElementById('addActor').onclick = () => {
  const value = document.getElementById('actorInput').value.trim();
  if (!value || state.actors.includes(value)) return;
  state.actors.push(value);
  document.getElementById('actorInput').value = '';
  renderAll();
};

// ── Auto extract ───────────────────────────────────────────────────────────
document.getElementById('extractContext').onclick = () => {
  const text = document.getElementById('systemDescription').value.toLowerCase();
  const add = (name, type) => { if (!state.components.find(c => c.name === name)) state.components.push({ name, type }); };
  const addData = v => { if (!state.dataTypes.includes(v)) state.dataTypes.push(v); };

  if (text.includes('api'))       add('API Gateway', 'API Gateway');
  if (text.includes('database') || text.includes('db')) add('Primary Database', 'Database');
  if (text.includes('admin'))     add('Admin Console', 'Admin Console');
  if (text.includes('web') || text.includes('frontend')) add('Web App', 'Frontend / Web App');
  if (text.includes('mobile'))    add('Mobile App', 'Mobile App');
  if (text.includes('redis') || text.includes('cache')) add('Cache', 'Cache (Redis/Memcached)');
  if (text.includes('queue') || text.includes('kafka') || text.includes('sqs')) add('Message Queue', 'Message Queue');
  if (text.includes('sso') || text.includes('auth') || text.includes('oauth')) add('Auth Service', 'Auth / SSO Service');
  if (text.includes('cdn'))       add('CDN', 'CDN');

  if (text.includes('pii') || text.includes('personal')) addData('PII');
  if (text.includes('payment') || text.includes('card')) addData('Payment Card Data');
  if (text.includes('token') || text.includes('session')) addData('Session Tokens');
  if (text.includes('health') || text.includes('medical')) addData('Health Records');
  if (text.includes('log') || text.includes('audit')) addData('Audit Logs');
  if (text.includes('credential') || text.includes('password')) addData('Credentials');

  renderAll();
  showStep(2);
};

// ── Load sample ────────────────────────────────────────────────────────────
document.getElementById('loadSample').onclick = () => {
  document.getElementById('systemName').value = 'FinPay — Payment Processing Platform';
  document.getElementById('framework').value  = 'STRIDE';
  document.getElementById('frameworkHint').textContent = FRAMEWORK_HINTS['STRIDE'];
  document.getElementById('deployment').value = 'Cloud (AWS/Azure/GCP)';
  document.getElementById('compliance').value = 'PCI-DSS, SOC 2 Type II';
  document.getElementById('systemDescription').value =
    'A cloud-hosted payment processing SaaS with a React frontend, Node.js API gateway, ' +
    'PostgreSQL database, Redis session cache, and Stripe integration. Supports end-user ' +
    'checkout flows, merchant admin dashboards, and a partner API. Handles PII and payment ' +
    'card data. Uses OAuth 2.0/SSO for authentication with audit logging via CloudWatch.';

  state.components = [
    { name: 'React Frontend',    type: 'Frontend / Web App' },
    { name: 'API Gateway',       type: 'API Gateway' },
    { name: 'Payment Service',   type: 'Microservice' },
    { name: 'PostgreSQL DB',     type: 'Database' },
    { name: 'Redis Cache',       type: 'Cache (Redis/Memcached)' },
    { name: 'Auth / SSO',        type: 'Auth / SSO Service' },
    { name: 'Admin Dashboard',   type: 'Admin Console' },
    { name: 'Stripe Integration',type: 'Third-party Integration' },
  ];
  state.dataTypes  = ['PII', 'Payment Card Data', 'Session Tokens', 'API Keys', 'Audit Logs'];
  state.connections = [
    { from: 'React Frontend',  to: 'API Gateway',      trust: 'Internet-facing' },
    { from: 'API Gateway',     to: 'Payment Service',  trust: 'Internal' },
    { from: 'Payment Service', to: 'PostgreSQL DB',    trust: 'Internal' },
    { from: 'Payment Service', to: 'Stripe Integration', trust: 'Third-party / Partner' },
    { from: 'API Gateway',     to: 'Redis Cache',      trust: 'Internal' },
  ];
  state.actors = ['End User', 'Merchant Admin', 'API Partner', 'Internal Engineer'];
  renderAll();
};

// ── Preflight summary ──────────────────────────────────────────────────────
function renderPreflight() {
  const name    = document.getElementById('systemName').value || '—';
  const fw      = document.getElementById('framework').value || '—';
  const deploy  = document.getElementById('deployment').value || '—';
  const el = document.getElementById('preflight');
  el.innerHTML = `
    <div class="preflight-row"><span>System</span><strong>${name}</strong></div>
    <div class="preflight-row"><span>Framework</span><span class="badge">${fw}</span></div>
    <div class="preflight-row"><span>Deployment</span><strong>${deploy}</strong></div>
    <div class="preflight-row"><span>Components</span><span class="badge">${state.components.length}</span></div>
    <div class="preflight-row"><span>Data types</span><span class="badge">${state.dataTypes.length}</span></div>
    <div class="preflight-row"><span>Connections</span><span class="badge">${state.connections.length}</span></div>
    <div class="preflight-row"><span>Actors</span><span class="badge">${state.actors.length}</span></div>
  `;
}

// ── Generate ───────────────────────────────────────────────────────────────
document.getElementById('generateBtn').onclick = async () => {
  const payload = {
    systemName:        document.getElementById('systemName').value,
    framework:         document.getElementById('framework').value,
    systemDescription: document.getElementById('systemDescription').value,
    deployment:        document.getElementById('deployment').value,
    compliance:        document.getElementById('compliance').value,
    dataTypes:         state.dataTypes,
    components:        state.components,
    connections:       state.connections,
    actors:            state.actors,
  };

  setLoading(true);

  try {
    const res  = await fetch('/api/threat-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.error) { showError(data.error); return; }

    state.lastResult = data;
    hideError();
    renderSummary(data.summary);
    renderThreats(data.threats || []);
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showError('Network error — is the server running?');
  } finally {
    setLoading(false);
  }
};

// ── Render summary ─────────────────────────────────────────────────────────
function renderSummary(s) {
  const card = document.getElementById('summaryCard');
  card.classList.remove('hidden');
  card.innerHTML = `
    <div class="summary-grid">
      <div class="summary-item"><span>Threats found</span><strong>${s.threat_count}</strong></div>
      <div class="summary-item critical"><span>🚨 Critical</span><strong>${s.critical_count || 0}</strong></div>
      <div class="summary-item high"><span>⚠️ High</span><strong>${s.high_count || 0}</strong></div>
      <div class="summary-item medium"><span>📋 Medium</span><strong>${s.medium_count || 0}</strong></div>
    </div>
    <div class="executive-summary">${s.executive_summary || ''}</div>
  `;
}

// ── Render threats ─────────────────────────────────────────────────────────
function severityClass(sev) {
  return { Critical: 'sev-critical', High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' }[sev] || '';
}

function riskBar(score) {
  const pct  = Math.min(score * 10, 100);
  const color = score >= 9 ? '#ef4444' : score >= 7 ? '#f97316' : score >= 4 ? '#eab308' : '#22c55e';
  return `<div class="risk-meter">
    <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <span>Risk ${score}/10</span>
  </div>`;
}

function priorityClass(p) {
  if (!p) return '';
  if (p.toLowerCase().includes('immediate')) return 'priority-immediate';
  if (p.toLowerCase().includes('short'))     return 'priority-short';
  return 'priority-long';
}

function renderThreats(threats) {
  const el = document.getElementById('results');
  if (!threats.length) {
    el.innerHTML = '<div class="empty-state large"><p>No threats returned.</p></div>'; return;
  }

  el.innerHTML = threats.map(t => {
    const sc = severityClass(t.severity);
    const mitigations = (t.mitigations || []).map(m => `
      <div class="mitigation-item">
        <div class="mitigation-action">${m.action || m}</div>
        <div class="mitigation-meta">
          ${m.nist_control ? `<span class="nist-tag">${m.nist_control}</span>` : ''}
          ${m.priority ? `<span class="priority-tag ${priorityClass(m.priority)}">${m.priority}</span>` : ''}
        </div>
      </div>`).join('');

    const assets = (t.impacted_assets || []).map(a => `<span class="pill subtle">${a}</span>`).join('');

    return `
    <div class="threat-card ${sc}">
      <div class="threat-header">
        <div class="threat-title-row">
          <div class="threat-id">${t.id || ''}</div>
          <div class="threat-title">${t.title}</div>
          <div class="threat-category">${t.framework_category || ''}</div>
        </div>
        <div class="pill-stack">
          <span class="pill ${sc}">${t.severity}</span>
          <span class="pill subtle">Likelihood: ${t.likelihood}</span>
          ${riskBar(t.risk_score)}
        </div>
      </div>

      <div class="threat-body">
        <div class="threat-section">
          <label>Description</label>
          <p>${t.description}</p>
        </div>

        <div class="attack-scenario threat-section">
          <label>⚡ Attack Scenario</label>
          <p>${t.attack_scenario}</p>
        </div>

        ${assets ? `<div class="threat-section"><label>Impacted Assets</label><div class="pill-row">${assets}</div></div>` : ''}

        ${mitigations ? `<div class="threat-section"><label>✅ Mitigations</label><div class="mitigations-list">${mitigations}</div></div>` : ''}

        ${t.detection ? `<div class="detection-box threat-section"><label>🔍 Detection</label><p>${t.detection}</p></div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── Export ─────────────────────────────────────────────────────────────────
document.getElementById('exportJson').onclick = () => {
  if (!state.lastResult) { alert('Generate a threat model first.'); return; }
  download(JSON.stringify(state.lastResult, null, 2), 'threat-model.json', 'application/json');
};

document.getElementById('exportMd').onclick = () => {
  if (!state.lastResult) { alert('Generate a threat model first.'); return; }
  const d   = state.lastResult;
  const s   = d.summary;
  const now = new Date().toISOString().split('T')[0];
  let md = `# Threat Model — ${s.system_name}\n\n`;
  md += `**Date:** ${now}  \n**Framework:** ${s.framework}  \n**Overall Risk:** ${s.overall_risk}\n\n`;
  md += `## Executive Summary\n${s.executive_summary}\n\n`;
  md += `## Findings Summary\n| Severity | Count |\n|---|---|\n`;
  md += `| 🚨 Critical | ${s.critical_count || 0} |\n| ⚠️ High | ${s.high_count || 0} |\n| 📋 Medium | ${s.medium_count || 0} |\n\n`;
  md += `## Threats\n\n`;
  (d.threats || []).forEach(t => {
    md += `### ${t.id} — ${t.title}\n`;
    md += `**Severity:** ${t.severity} | **Likelihood:** ${t.likelihood} | **Risk Score:** ${t.risk_score}/10  \n`;
    md += `**Category:** ${t.framework_category}\n\n`;
    md += `**Description:** ${t.description}\n\n`;
    md += `**Attack Scenario:** ${t.attack_scenario}\n\n`;
    if (t.impacted_assets?.length) md += `**Impacted Assets:** ${t.impacted_assets.join(', ')}\n\n`;
    if (t.mitigations?.length) {
      md += `**Mitigations:**\n`;
      t.mitigations.forEach(m => {
        md += `- ${m.action || m}`;
        if (m.nist_control) md += ` *(${m.nist_control})*`;
        if (m.priority) md += ` — ${m.priority}`;
        md += '\n';
      });
      md += '\n';
    }
    if (t.detection) md += `**Detection:** ${t.detection}\n\n`;
    md += '---\n\n';
  });
  download(md, 'threat-model.md', 'text/markdown');
};

function download(content, filename, type) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: filename,
  });
  a.click();
}

// ── UI helpers ─────────────────────────────────────────────────────────────
function setLoading(on) {
  document.getElementById('loadingState').classList.toggle('hidden', !on);
  document.getElementById('generateBtn').disabled = on;
  document.getElementById('generateBtn').textContent = on ? 'Analysing…' : '🔍 Generate Threat Model';
  if (on) {
    document.getElementById('summaryCard').classList.add('hidden');
    document.getElementById('results').innerHTML = '';
  }
}

function showError(msg) {
  const el = document.getElementById('errorState');
  el.classList.remove('hidden');
  el.textContent = '⚠️ ' + msg;
}

function hideError() {
  document.getElementById('errorState').classList.add('hidden');
}

// ── Init ───────────────────────────────────────────────────────────────────
renderAll();
showStep(1);
