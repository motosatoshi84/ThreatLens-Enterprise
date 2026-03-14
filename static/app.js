let step = 1;
const state = {
  components: [],
  dataTypes: [],
  connections: []
};

function showStep(s) {
  step = s;
  document.querySelectorAll(".step").forEach(e => e.classList.remove("active"));
  document.querySelector(`.step[data-step="${s}"]`).classList.add("active");
  document.querySelectorAll(".step-tab").forEach(e => e.classList.remove("active"));
  document.querySelector(`.step-tab[data-step="${s}"]`).classList.add("active");
  document.getElementById("prevStep").disabled = s === 1;
  document.getElementById("nextStep").disabled = s === 5;
}

document.querySelectorAll(".step-tab").forEach(btn => {
  btn.addEventListener("click", () => showStep(Number(btn.dataset.step)));
});

document.getElementById("nextStep").onclick = () => { if (step < 5) showStep(step + 1); };
document.getElementById("prevStep").onclick = () => { if (step > 1) showStep(step - 1); };

function renderBoard(id, items, formatter) {
  const el = document.getElementById(id);
  if (!items.length) {
    el.innerHTML = '<div class="empty-state">Nothing added yet.</div>';
    return;
  }
  el.innerHTML = items.map(formatter).join("");
}

function renderAll() {
  renderBoard("componentBoard", state.components, (c, i) =>
    `<div class="board-item"><div><strong>${c.name}</strong><span>${c.type}</span></div><button type="button" class="ghost" onclick="removeComponent(${i})">Remove</button></div>`
  );
  renderBoard("dataBoard", state.dataTypes, (d, i) =>
    `<div class="chip">${d}<button type="button" onclick="removeData(${i})">×</button></div>`
  );
  renderBoard("connectionBoard", state.connections, (c, i) =>
    `<div class="board-item"><div><strong>${c.from}</strong><span>${c.to} · ${c.trust}</span></div><button type="button" class="ghost" onclick="removeConnection(${i})">Remove</button></div>`
  );
}

window.removeComponent = (i) => { state.components.splice(i, 1); renderAll(); };
window.removeData = (i) => { state.dataTypes.splice(i, 1); renderAll(); };
window.removeConnection = (i) => { state.connections.splice(i, 1); renderAll(); };

document.getElementById("addComponent").onclick = () => {
  const name = document.getElementById("componentName").value.trim();
  const type = document.getElementById("componentType").value;
  if (!name) return;
  state.components.push({ name, type });
  document.getElementById("componentName").value = "";
  renderAll();
};

document.getElementById("addData").onclick = () => {
  const value = document.getElementById("dataInput").value.trim();
  if (!value) return;
  state.dataTypes.push(value);
  document.getElementById("dataInput").value = "";
  renderAll();
};

document.getElementById("addConnection").onclick = () => {
  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  const trust = document.getElementById("trust").value;
  if (!from || !to) return;
  state.connections.push({ from, to, trust });
  document.getElementById("from").value = "";
  document.getElementById("to").value = "";
  renderAll();
};

document.getElementById("loadSample").onclick = () => {
  document.getElementById("systemName").value = "ThreatLens Demo Platform";
  document.getElementById("framework").value = "STRIDE";
  document.getElementById("systemDescription").value = "A cloud-hosted SaaS platform with SSO login, a public API, admin console, audit logging, and customer data processing.";
  state.components = [
    { name: "Web App", type: "Frontend" },
    { name: "Public API", type: "API" },
    { name: "Primary Database", type: "Database" },
    { name: "Admin Console", type: "Admin Console" }
  ];
  state.dataTypes = ["PII", "Session Tokens", "Audit Logs"];
  state.connections = [
    { from: "Web App", to: "Public API", trust: "internet" },
    { from: "Public API", to: "Primary Database", trust: "internal" }
  ];
  renderAll();
};

document.getElementById("extractContext").onclick = () => {
  const text = document.getElementById("systemDescription").value.toLowerCase();
  if (text.includes("api") && !state.components.find(x => x.name === "Public API")) state.components.push({ name: "Public API", type: "API" });
  if (text.includes("database") && !state.components.find(x => x.name === "Primary Database")) state.components.push({ name: "Primary Database", type: "Database" });
  if (text.includes("admin") && !state.components.find(x => x.name === "Admin Console")) state.components.push({ name: "Admin Console", type: "Admin Console" });
  if (text.includes("web") && !state.components.find(x => x.name === "Web App")) state.components.push({ name: "Web App", type: "Frontend" });
  if (text.includes("pii") && !state.dataTypes.includes("PII")) state.dataTypes.push("PII");
  if (text.includes("token") && !state.dataTypes.includes("Session Tokens")) state.dataTypes.push("Session Tokens");
  if (text.includes("log") && !state.dataTypes.includes("Audit Logs")) state.dataTypes.push("Audit Logs");
  renderAll();
};

document.getElementById("generateBtn").onclick = async () => {
  const payload = {
    systemName: document.getElementById("systemName").value,
    framework: document.getElementById("framework").value,
    systemDescription: document.getElementById("systemDescription").value,
    dataTypes: state.dataTypes,
    components: state.components,
    connections: state.connections
  };

  const res = await fetch("/api/threat-model", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  document.getElementById("summaryCard").classList.remove("hidden");
  document.getElementById("summaryCard").innerHTML = `
    <div class="summary-grid">
      <div class="summary-item"><span>Framework</span><strong>${data.summary.framework}</strong></div>
      <div class="summary-item"><span>System</span><strong>${data.summary.system_name}</strong></div>
      <div class="summary-item"><span>Threats</span><strong>${data.summary.threat_count}</strong></div>
      <div class="summary-item"><span>Top Risk</span><strong>${data.summary.highest_risk}</strong></div>
    </div>
  `;

  document.getElementById("results").innerHTML = data.threats.map(t => `
    <article class="panel threat-card">
      <div class="threat-head">
        <div>
          <h3>${t.title}</h3>
          <p>${t.framework} · ${t.category}</p>
        </div>
        <div class="pill-row">
          <span class="pill">${t.severity}</span>
          <span class="pill subtle">${t.likelihood}</span>
          <span class="pill subtle">Risk ${t.riskScore}</span>
        </div>
      </div>
      <div class="threat-block"><strong>Impacted assets:</strong> ${t.impacted_assets.join(", ")}</div>
      <div class="threat-block"><strong>Rationale:</strong> ${t.rationale}</div>
      <div class="threat-block"><strong>Mitigations:</strong><ul>${t.mitigations.map(m => `<li>${m}</li>`).join("")}</ul></div>
    </article>
  `).join("");
};

document.getElementById("exportJson").onclick = () => {};
document.getElementById("exportMd").onclick = () => {};

renderAll();
showStep(1);
