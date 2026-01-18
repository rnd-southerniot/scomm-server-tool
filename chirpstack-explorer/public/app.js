const statusEl = document.getElementById("status");
const errEl = document.getElementById("err");
const listEl = document.getElementById("list");
const crumbsEl = document.getElementById("crumbs");
const listTitleEl = document.getElementById("listTitle");
const provisionBtn = document.getElementById("provisionBtn");
const provisionModal = document.getElementById("provisionModal");
const provisionAction = document.getElementById("provisionAction");
const provisionFields = document.getElementById("provisionFields");
const provisionStatus = document.getElementById("provisionStatus");
const provisionResult = document.getElementById("provisionResult");
const closeProvision = document.getElementById("closeProvision");
const submitProvisionBtn = document.getElementById("submitProvision");

const tenantsBtn = document.getElementById("tenantsBtn");
const appsBtn = document.getElementById("appsBtn");
const devicesBtn = document.getElementById("devicesBtn");
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
const kpiTenants = document.getElementById("kpiTenants");
const kpiApps = document.getElementById("kpiApps");
const kpiDevices = document.getElementById("kpiDevices");
const kpiHealth = document.getElementById("kpiHealth");
const kpiHealthText = document.getElementById("kpiHealthText");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSubtitle = document.getElementById("dashboardSubtitle");
const actionTenants = document.getElementById("actionTenants");
const actionApps = document.getElementById("actionApps");
const actionDevices = document.getElementById("actionDevices");
const actionGateways = document.getElementById("actionGateways");

function setStatus(s) { statusEl.textContent = s; }
function showErr(s) { errEl.textContent = s; errEl.style.display = "block"; state.healthOk = false; updateKpis(); }
function clearErr() { errEl.style.display = "none"; errEl.textContent = ""; state.healthOk = true; updateKpis(); }
function esc(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}

async function api(url, options = {}) {
  const init = {};
  if (options.method) init.method = options.method;
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  const r = await fetch(url, init);
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
  total: 0,
  metrics: { tenants: null, apps: null, devices: null, gateways: null },
  healthOk: true
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

function setNavState() {
  appsBtn.disabled = !state.tenant;
  devicesBtn.disabled = !state.app;
  gatewaysBtn.disabled = !state.tenant;

  const buttons = [tenantsBtn, appsBtn, devicesBtn, gatewaysBtn];
  buttons.forEach(btn => btn.classList.remove("active"));
  if (state.view === "tenants") tenantsBtn.classList.add("active");
  if (state.view === "apps") appsBtn.classList.add("active");
  if (state.view === "devices") devicesBtn.classList.add("active");
  if (state.view === "gateways") gatewaysBtn.classList.add("active");
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

function updateKpis() {
  kpiTenants.textContent = state.metrics.tenants ?? "—";
  kpiApps.textContent = state.metrics.apps ?? "—";
  kpiDevices.textContent = state.metrics.devices ?? "—";
  if (state.healthOk) {
    kpiHealth.textContent = "Good";
    kpiHealth.classList.remove("warn");
    kpiHealth.classList.add("good");
    kpiHealthText.textContent = "All services operational";
  } else {
    kpiHealth.textContent = "Attention";
    kpiHealth.classList.remove("good");
    kpiHealth.classList.add("warn");
    kpiHealthText.textContent = "Check the error panel";
  }
}

function setHeader() {
  if (state.view === "tenants") {
    dashboardTitle.textContent = "Admin Dashboard";
    dashboardSubtitle.textContent = "System administration and overview";
    listTitleEl.textContent = "Tenants";
  } else if (state.view === "apps") {
    dashboardTitle.textContent = "Applications";
    dashboardSubtitle.textContent = `Tenant: ${state.tenant?.name || "Unknown"}`;
    listTitleEl.textContent = "Applications";
  } else if (state.view === "devices") {
    dashboardTitle.textContent = "Devices";
    dashboardSubtitle.textContent = `App: ${state.app?.name || "Unknown"}`;
    listTitleEl.textContent = "Devices";
  } else if (state.view === "gateways") {
    dashboardTitle.textContent = "Gateways";
    dashboardSubtitle.textContent = `Tenant: ${state.tenant?.name || "Unknown"}`;
    listTitleEl.textContent = "Gateways";
  }
}

const provisionConfig = {
  tenant: {
    label: "Create Tenant",
    endpoint: "/api/tenants",
    fields: [
      { key: "name", label: "Name", required: true, minLength: 3, placeholder: "SouthernIoT RnD" },
      { key: "description", label: "Description", required: true, minLength: 3, placeholder: "Tenant description" }
    ],
    wrap(values) {
      return {
        tenant: {
          ...values,
          canHaveGateways: true,
          maxDeviceCount: 0,
          maxGatewayCount: 0
        }
      };
    }
  },
  application: {
    label: "Create Application",
    endpoint: "/api/applications",
    fields: [
      { key: "name", label: "Application Name", required: true, minLength: 3, placeholder: "LoRaWAN App" }
    ],
    wrap(values) {
      return { application: { ...values, tenantId: state.tenant?.id || "", description: "" } };
    }
  },
  deviceProfile: {
    label: "Create Device Profile",
    endpoint: "/api/device-profiles",
    fields: [
      { key: "name", label: "Name", required: true, minLength: 3, placeholder: "Generic EU868" },
      {
        key: "region",
        label: "Region",
        required: true,
        type: "select",
        options: ["AS923", "EU868", "US915", "IN865"],
        value: "EU868"
      },
      {
        key: "lorawanVersion",
        label: "LoRaWAN Version",
        required: true,
        type: "select",
        options: ["1.0.3", "1.0.4", "1.1.0"],
        value: "1.0.3"
      }
    ],
    wrap(values) {
      const macVersionMap = {
        "1.0.3": "LORAWAN_1_0_3",
        "1.0.4": "LORAWAN_1_0_4",
        "1.1.0": "LORAWAN_1_1_0"
      };
      const regParamsMap = {
        "1.0.3": "RP002_1_0_3",
        "1.0.4": "RP002_1_0_4",
        "1.1.0": "RP002_1_0_4"
      };
      return {
        deviceProfile: {
          name: values.name,
          tenantId: state.tenant?.id || "",
          region: values.region,
          macVersion: macVersionMap[values.lorawanVersion] || "LORAWAN_1_0_3",
          regParamsRevision: regParamsMap[values.lorawanVersion] || "RP002_1_0_3",
          supportsOtaa: true,
          supportsClassB: false,
          supportsClassC: false,
          adrAlgorithmId: "default"
        }
      };
    }
  },
  gateway: {
    label: "Add Gateway",
    endpoint: "/api/gateways",
    fields: [
      { key: "name", label: "Gateway Name", required: true, minLength: 3, placeholder: "Factory Gateway" },
      { key: "gatewayId", label: "Gateway EUI", required: true, pattern: /^[A-Fa-f0-9]{16}$/, placeholder: "0102030405060708" }
    ],
    wrap(values) {
      return {
        gateway: {
          tenantId: state.tenant?.id || "",
          name: values.name,
          gatewayId: values.gatewayId,
          description: "",
          statsInterval: 30
        }
      };
    }
  },
  device: {
    label: "Add Device",
    endpoint: "/api/devices",
    fields: [
      { key: "name", label: "Device Name", required: true, minLength: 3, placeholder: "Sensor A1" },
      { key: "devEui", label: "DevEUI", required: true, pattern: /^[A-Fa-f0-9]{16}$/, placeholder: "0102030405060708" },
      { key: "deviceProfileId", label: "Device Profile ID", required: true, pattern: /^[A-Fa-f0-9]{32}$|^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/, placeholder: "uuid" },
      { key: "appKey", label: "App Key (optional)", pattern: /^[A-Fa-f0-9]{32}$/, placeholder: "32 hex chars" }
    ],
    wrap(values) {
      const deviceValues = {
        name: values.name,
        devEui: values.devEui,
        applicationId: state.app?.id || "",
        deviceProfileId: values.deviceProfileId,
        isDisabled: false,
        skipFcntCheck: true,
        description: ""
      };
      delete deviceValues.appKey;
      return { device: deviceValues, deviceKeys: values.appKey ? { appKey: values.appKey } : null };
    }
  }
};

function renderProvisionFields(actionKey) {
  provisionFields.innerHTML = "";
  provisionResult.style.display = "none";
  const cfg = provisionConfig[actionKey];
  if (!cfg) return;
  cfg.fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const label = document.createElement("label");
    label.textContent = `${field.label}${field.required ? " *" : ""}`;
    label.setAttribute("for", `field-${field.key}`);
    let input;
    if (field.type === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "checkbox";
      input.checked = Boolean(field.value);
    } else if (field.type === "select") {
      input = document.createElement("select");
      (field.options || []).forEach((opt) => {
        const option = document.createElement("option");
        if (typeof opt === "string") {
          option.value = opt;
          option.textContent = opt;
        } else {
          option.value = opt.value;
          option.textContent = opt.label;
        }
        input.appendChild(option);
      });
      if (field.value) input.value = field.value;
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.value = field.value || "";
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
      input.value = field.value || "";
      input.placeholder = field.placeholder || "";
    }
    input.id = `field-${field.key}`;
    input.dataset.key = field.key;
    input.dataset.type = field.type || "text";
    if (field.pattern) {
      input.dataset.pattern = field.pattern.source;
      input.dataset.patternFlags = field.pattern.flags || "";
    }
    if (field.minLength) input.dataset.minLength = String(field.minLength);
    if (field.options) input.dataset.options = JSON.stringify(field.options);
    input.dataset.required = field.required ? "1" : "0";
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    provisionFields.appendChild(wrapper);
  });
}

function collectProvisionValues() {
  const values = {};
  const missing = [];
  provisionFields.querySelectorAll("[data-key]").forEach((el) => {
    const key = el.dataset.key;
    const type = el.dataset.type;
    let value;
    if (type === "checkbox") {
      value = el.checked;
    } else {
      value = el.value.trim();
    }
    if (el.dataset.required === "1" && !value && value !== false && value !== 0) {
      missing.push(key);
    }
    if (type === "number") {
      value = value === "" ? "" : Number(value);
    }
    values[key] = value;
  });
  return { values, missing };
}

function validateProvision(values, cfg) {
  const errors = [];
  cfg.fields.forEach((field) => {
    const value = values[field.key];
    const label = field.label || field.key;
    if (field.required) {
      const empty = value === "" || value === null || value === undefined;
      if (empty) errors.push(`${label} is required`);
    }
    if (typeof value === "string" && value) {
      if (field.minLength && value.length < field.minLength) {
        errors.push(`${label} must be at least ${field.minLength} chars`);
      }
      if (field.pattern && !field.pattern.test(value)) {
        errors.push(`${label} is invalid`);
      }
      if (field.options) {
        const options = field.options.map((opt) => (typeof opt === "string" ? opt : opt.value));
        if (!options.includes(value)) errors.push(`${label} is invalid`);
      }
    }
  });
  return errors;
}

async function runProvision() {
  const actionKey = provisionAction.value;
  const cfg = provisionConfig[actionKey];
  if (!cfg) return;
  if (actionKey === "application" && !state.tenant?.id) {
    provisionStatus.textContent = "Select a tenant before creating an application.";
    return;
  }
  if ((actionKey === "deviceProfile" || actionKey === "gateway") && !state.tenant?.id) {
    provisionStatus.textContent = "Select a tenant before creating this item.";
    return;
  }
  if (actionKey === "device" && !state.app?.id) {
    provisionStatus.textContent = "Select an application before creating a device.";
    return;
  }
  const { values, missing } = collectProvisionValues();
  if (missing.length) {
    provisionStatus.textContent = `Missing required: ${missing.join(", ")}`;
    return;
  }
  const errors = validateProvision(values, cfg);
  if (errors.length) {
    provisionStatus.textContent = `Invalid: ${errors.join("; ")}`;
    return;
  }
  provisionStatus.textContent = "Submitting…";
  try {
    if (actionKey === "device") {
      const wrapped = cfg.wrap(values);
      const res = await api(cfg.endpoint, { method: "POST", body: { device: wrapped.device } });
      if (wrapped.deviceKeys) {
        const devEui = wrapped.device?.devEui;
        const deviceKeys = {
          devEui,
          nwkKey: wrapped.deviceKeys.appKey,
          appKey: wrapped.deviceKeys.appKey
        };
        await api("/api/devices/keys", { method: "POST", body: { deviceKeys } });
      }
      provisionStatus.textContent = "Created";
      provisionResult.textContent = JSON.stringify(res || { ok: true }, null, 2);
      provisionResult.style.display = "block";
      await refreshAfterCreate(actionKey, values);
      return;
    }
    const body = cfg.wrap(values);
    const res = await api(cfg.endpoint, { method: "POST", body });
    provisionStatus.textContent = "Created";
    provisionResult.textContent = JSON.stringify(res || { ok: true }, null, 2);
    provisionResult.style.display = "block";
    await refreshAfterCreate(actionKey, values);
  } catch (err) {
    provisionStatus.textContent = `Error: ${err.message}`;
  }
}

async function refreshAfterCreate(actionKey, values) {
  if (actionKey === "tenant") {
    state.view = "tenants";
    state.page = 1;
    state.tenant = null;
    state.app = null;
    await loadTenants();
  } else if (actionKey === "application") {
    state.view = "apps";
    state.page = 1;
    await loadApps();
  } else if (actionKey === "device") {
    state.view = "devices";
    state.page = 1;
    await loadDevices();
  } else if (actionKey === "gateway") {
    state.view = "gateways";
    state.page = 1;
    await loadGateways();
  }
}

async function loadTenants() {
  clearErr(); clearDetails();
  setStatus("Loading tenants…");
  crumbsEl.textContent = "Tenants";
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  state.metrics.tenants = data.totalCount ?? 0;
  setPager(); setBack(); setNavState(); setHeader(); updateKpis();
  renderList(data.result || [], "tenant");
  setStatus("Ready");
}

async function loadApps() {
  clearErr(); clearDetails();
  setStatus("Loading applications…");
  const tenantLabel = state.tenant?.name || state.tenant?.id || "Unknown";
  crumbsEl.textContent = `Tenants → ${tenantLabel} → Applications`;
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants/${encodeURIComponent(state.tenant.id)}/applications?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  state.metrics.apps = data.totalCount ?? 0;
  setPager(); setBack(); setNavState(); setHeader(); updateKpis();
  renderList(data.result || [], "app");
  setStatus("Ready");
}

async function loadDevices() {
  clearErr(); clearDetails();
  setStatus("Loading devices…");
  const tenantLabel = state.tenant?.name || state.tenant?.id || "Unknown";
  const appLabel = state.app?.name || state.app?.id || "Unknown";
  crumbsEl.textContent = `Tenants → ${tenantLabel} → ${appLabel} → Devices`;
  const q = searchEl.value.trim();
  const data = await api(`/api/applications/${encodeURIComponent(state.app.id)}/devices?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  state.metrics.devices = data.totalCount ?? 0;
  setPager(); setBack(); setNavState(); setHeader(); updateKpis();
  renderList(data.result || [], "device");
  setStatus("Ready");
}

async function loadGateways() {
  clearErr(); clearDetails();
  setStatus("Loading gateways…");
  const tenantLabel = state.tenant?.name || state.tenant?.id || "Unknown";
  crumbsEl.textContent = `Tenants → ${tenantLabel} → Gateways`;
  const q = searchEl.value.trim();
  const data = await api(`/api/tenants/${encodeURIComponent(state.tenant.id)}/gateways?limit=${state.limit}&offset=${offset()}&search=${encodeURIComponent(q)}`);
  state.total = data.totalCount || 0;
  state.metrics.gateways = data.totalCount ?? 0;
  setPager(); setBack(); setNavState(); setHeader(); updateKpis();
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
      li.innerHTML = `<span class="link" data-tenant="${esc(tenantId)}" data-name="${esc(tenantName)}"><strong>${esc(tenantName)}</strong> <span class="muted">(id: <code>${esc(tenantId)}</code>)</span></span>
        <div class="muted">id: <code>${esc(tenantId)}</code></div>`;
    } else if (type === "app") {
      const appId = it.id || "";
      const appName = it.name || "(no name)";
      li.innerHTML = `<span class="link" data-app="${esc(appId)}" data-name="${esc(appName)}"><strong>${esc(appName)}</strong> <span class="muted">(id: <code>${esc(appId)}</code>)</span></span>
        <div class="muted">id: <code>${esc(appId)}</code></div>`;
    } else if (type === "device") {
      const devEui = it.devEui || it.id || "";
      const devName = it.name || devEui;
      li.innerHTML = `<span class="link" data-device="${esc(devEui)}" data-name="${esc(devName)}"><strong>${esc(devName)}</strong> <span class="muted">(id: <code>${esc(devEui)}</code>)</span></span>
        <div class="muted">devEui: <code>${esc(devEui)}</code></div>`;
    } else if (type === "gateway") {
      const gw = it.gatewayId || it.id || "";
      const gwName = it.name || gw;
      li.innerHTML = `<span class="link" data-gateway="${esc(gw)}" data-name="${esc(gwName)}"><strong>${esc(gwName)}</strong> <span class="muted">(id: <code>${esc(gw)}</code>)</span></span>
        <div class="muted">gatewayId: <code>${esc(gw)}</code></div>`;
    }

    listEl.appendChild(li);
  }

  listEl.querySelectorAll("[data-tenant]").forEach(el => el.onclick = () => {
    state.view = "apps";
    state.tenant = { id: el.dataset.tenant, name: el.dataset.name || el.textContent.trim() };
    state.page = 1;
    loadApps();
  });

  listEl.querySelectorAll("[data-app]").forEach(el => el.onclick = () => {
    state.view = "devices";
    state.app = { id: el.dataset.app, name: el.dataset.name || el.textContent.trim() };
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
appsBtn.onclick = () => {
  if (!state.tenant) return;
  state.view = "apps";
  state.page = 1;
  clearDetails();
  loadApps();
};
devicesBtn.onclick = () => {
  if (!state.app) return;
  state.view = "devices";
  state.page = 1;
  clearDetails();
  loadDevices();
};
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

actionTenants.onclick = () => tenantsBtn.onclick();
actionApps.onclick = () => appsBtn.onclick();
actionDevices.onclick = () => devicesBtn.onclick();
actionGateways.onclick = () => gatewaysBtn.onclick();

prevBtn.onclick = () => { state.page = Math.max(1, state.page - 1); reload(); };
nextBtn.onclick = () => { state.page = state.page + 1; reload(); };

searchEl.oninput = () => { state.page = 1; reload(); };

// Ensure logged in
(async () => {
  const me = await fetch("/auth/me").then(r=>r.json()).catch(()=>({user:null}));
  if (!me.user) location.href = "/login.html";
  Object.entries(provisionConfig).forEach(([key, cfg]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = cfg.label;
    provisionAction.appendChild(opt);
  });
  renderProvisionFields(provisionAction.value);
  setNavState();
  setHeader();
  updateKpis();
  loadTenants();
})();

provisionBtn.onclick = () => {
  provisionModal.classList.add("open");
  provisionStatus.textContent = "Ready";
};
closeProvision.onclick = () => provisionModal.classList.remove("open");
provisionAction.onchange = () => renderProvisionFields(provisionAction.value);
submitProvisionBtn.onclick = () => runProvision();
