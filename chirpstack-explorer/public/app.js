const statusEl = document.getElementById("status");
const errEl = document.getElementById("err");
const listEl = document.getElementById("list");
const crumbsEl = document.getElementById("crumbs");

const tenantsBtn = document.getElementById("tenantsBtn");
const gatewaysBtn = document.getElementById("gatewaysBtn");
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchEl = document.getElementById("search");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumEl = document.getElementById("pageNum");
const totalEl = document.getElementById("total");

const details = document.getElementById("details");
const detailsTitle = document.getElementById("detailsTitle");
const kpis = document.getElementById("kpis");
const samples = document.getElementById("samples");
const jsonEl = document.getElementById("json");

function setStatus(s) { statusEl.textContent = s; }
function showErr(s) { errEl.textContent = s; errEl.style.display = "block"; }
function clearErr() { errEl.style.display = "none"; errEl.textContent = ""; }
function esc(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}

async function api(url) {
  const r = await fetch(url);
  if (r.status === 401) { location.href = "/login.html"; return; }
  const t = await r.text();
  let j; try { j = JSON.parse(t);} catch { j = t; }
  if (!r.ok) throw new Error(typeof j === "string" ? j : JSON.stringify(j, null, 2));
  return j;
}

let state = {
  view: "tenants", // tenants | apps | devices | gateways | deviceDetail | gatewayDetail
  tenant: null,
  app: null,
  page: 1,
  limit: 25,
  total: 0
};

function offset() { return (state.page - 1) * state.limit; }

function setPager() {
  pageNumEl.textContent = String(state.page);
  totalEl.textContent = String(state.total || 0);
  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = (offset() + state.limit) >= (state.total || 0);
}

function setBack() {
  backBtn.disabled = (state.view === "tenants");
}

function setGateways() {
  gatewaysBtn.disabled = !state.tenant;
}

function showDetails(title, obj) {
  details.style.display = "block";
  detailsTitle.textContent = title;
  jsonEl.textContent = JSON.stringify(obj, null, 2);
}

function clearDetails() {
  details.style.display = "none";
  kpis.innerHTML = "";
  samples.textContent = "";
  jsonEl.textContent = "";
}

async function loadTenants() {
  clearErr(); clearDetails();
  setStatus("Loading tenants…");
  crumbsEl.textContent = "Tenants";
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  setPager(); setBack(); setGateways();
  renderList(data.result || [], "tenant");
  setStatus("Ready");
}

async function loadApps() {
  clearErr(); clearDetails();
  setStatus("Loading applications…");
  crumbsEl.textContent = `Tenants → ${state.tenant.name} → Applications`;
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants/${encodeURIComponent(state.tenant.id)}/applications?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  setPager(); setBack(); setGateways();
  renderList(data.result || [], "app");
  setStatus("Ready");
}

async function loadDevices() {
  clearErr(); clearDetails();
  setStatus("Loading devices…");
  crumbsEl.textContent = `Tenants → ${state.tenant.name} → ${state.app.name} → Devices`;
  const q = searchEl.value.trim();
  const data = await api(`/api/applications/${encodeURIComponent(state.app.id)}/devices?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  setPager(); setBack(); setGateways();
  renderList(data.result || [], "device");
  setStatus("Ready");
}

async function loadGateways() {
  clearErr(); clearDetails();
  setStatus("Loading gateways…");
  crumbsEl.textContent = `Tenants → ${state.tenant.name} → Gateways`;
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants/${encodeURIComponent(state.tenant.id)}/gateways?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  setPager(); setBack(); setGateways();
  renderList(data.result || [], "gateway");
  setStatus("Ready");
}

async function loadDeviceDetail(devEui) {
  clearErr();
  setStatus("Loading device detail…");
  const data = await api(`/api/devices/${encodeURIComponent(devEui)}`);
  showDetails(`Device ${devEui}`, data);
  setStatus("Ready");
}

async function loadGatewayDetail(gatewayId) {
  clearErr();
  setStatus("Loading gateway detail…");
  const data = await api(`/api/gateways/${encodeURIComponent(gatewayId)}`);
  showDetails(`Gateway ${gatewayId}`, data);
  setStatus("Ready");
}

function renderList(items, type) {
  listEl.innerHTML = "";
  for (const it of items) {
    const li = document.createElement("li");

    if (type === "tenant") {
      const tenantId = it.id || "";
      const tenantName = it.name || "(no name)";
      li.innerHTML = `<span class="link" data-tenant="${esc(tenantId)}"><strong>${esc(tenantName)}</strong> <span class="muted">(id: <code>${esc(tenantId)}</code>)</span></span>
        <div class="muted">id: <code>${esc(tenantId)}</code></div>`;
    } else if (type === "app") {
      const appId = it.id || "";
      const appName = it.name || "(no name)";
      li.innerHTML = `<span class="link" data-app="${esc(appId)}"><strong>${esc(appName)}</strong> <span class="muted">(id: <code>${esc(appId)}</code>)</span></span>
        <div class="muted">id: <code>${esc(appId)}</code></div>`;
    } else if (type === "device") {
      const devEui = it.devEui || it.id || "";
      const devName = it.name || devEui;
      li.innerHTML = `<span class="link" data-device="${esc(devEui)}"><strong>${esc(devName)}</strong> <span class="muted">(id: <code>${esc(devEui)}</code>)</span></span>
        <div class="muted">devEui: <code>${esc(devEui)}</code></div>`;
    } else if (type === "gateway") {
      const gw = it.gatewayId || it.id || "";
      const gwName = it.name || gw;
      li.innerHTML = `<span class="link" data-gateway="${esc(gw)}"><strong>${esc(gwName)}</strong> <span class="muted">(id: <code>${esc(gw)}</code>)</span></span>
        <div class="muted">gatewayId: <code>${esc(gw)}</code></div>`;
    }

    listEl.appendChild(li);
  }

  listEl.querySelectorAll("[data-tenant]").forEach(el => el.onclick = () => {
    state.view = "apps";
    state.tenant = { id: el.dataset.tenant, name: el.textContent.trim() };
    state.page = 1;
    loadApps();
  });

  listEl.querySelectorAll("[data-app]").forEach(el => el.onclick = () => {
    state.view = "devices";
    state.app = { id: el.dataset.app, name: el.textContent.trim() };
    state.page = 1;
    loadDevices();
  });

  listEl.querySelectorAll("[data-device]").forEach(el => el.onclick = () => {
    loadDeviceDetail(el.dataset.device);
  });

  listEl.querySelectorAll("[data-gateway]").forEach(el => el.onclick = () => {
    loadGatewayDetail(el.dataset.gateway);
  });
}

function reload() {
  if (state.view === "tenants") return loadTenants();
  if (state.view === "apps") return loadApps();
  if (state.view === "devices") return loadDevices();
  if (state.view === "gateways") return loadGateways();
  return loadTenants();
}

// Buttons
tenantsBtn.onclick = () => { state = { ...state, view: "tenants", page: 1, tenant: null, app: null }; loadTenants(); };
gatewaysBtn.onclick = () => {
  if (!state.tenant) return;
  state.view = "gateways";
  state.page = 1;
  clearDetails();
  loadGateways();
};
backBtn.onclick = () => {
  clearDetails();
  if (state.view === "devices") { state.view = "apps"; state.page = 1; return loadApps(); }
  if (state.view === "apps") { state.view = "tenants"; state.page = 1; state.tenant=null; state.app=null; return loadTenants(); }
  if (state.view === "gateways") { state.view = "tenants"; state.page = 1; state.tenant=null; return loadTenants(); }
};
logoutBtn.onclick = async () => { await fetch("/auth/logout", { method:"POST" }); location.href="/login.html"; };

prevBtn.onclick = () => { state.page = Math.max(1, state.page - 1); reload(); };
nextBtn.onclick = () => { state.page = state.page + 1; reload(); };

searchEl.oninput = () => { state.page = 1; reload(); };

// Ensure logged in
(async () => {
  const me = await fetch("/auth/me").then(r=>r.json()).catch(()=>({user:null}));
  if (!me.user) location.href = "/login.html";
  loadTenants();
})();
