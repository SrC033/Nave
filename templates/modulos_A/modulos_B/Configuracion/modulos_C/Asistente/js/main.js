(function () {
  'use strict';

  var API_BASE = "http://127.0.0.1:8000";
  var POLLING_MS = 1500;
  var POLLING_HW_MS = 2000;

  var IC = {
    bot:'<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M9 18h6"/>',
    brain:'<path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/>',
    download:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    check:'<path d="m5 13 4.5 4.5L19 6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    trash:'<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>',
    play:'<path d="M6 4v16l14-8L6 4z"/>',
    power:'<path d="M12 3v9"/><path d="M6.5 7.5a8 8 0 1 0 11 0"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert:'<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
    hard:'<path d="M3 6h18v5H3zM3 13h18v5H3z"/><path d="M7 9h.01M7 16h.01"/>',
    cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    star:'<path d="m12 3 2.7 5.9 6.3.7-4.7 4.4 1.3 6.3L12 17.8 6.4 20.3l1.3-6.3L3 9.6l6.3-.7L12 3z"/>',
    link:'<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    shop:'<path d="M3 9 4 4h16l1 5"/><path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 13h6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    box:'<path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
    monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    ram:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v4M10 10v4M14 10v4M18 10v4"/>',
    key:'<circle cx="7.5" cy="15.5" r="3.5"/><path d="m21 2-9.6 9.6M15 7l2 2M18 4l2 2"/>',
    plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5"/>',
    external:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    cloud:'<path d="M18 18a4 4 0 0 0 0-8 6 6 0 0 0-11.6-1.5A4.5 4.5 0 0 0 7 18h11z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  function ic(n, c) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (c ? ' class="' + c + '"' : '') + '>' + (IC[n] || '') + '</svg>';
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(msg, icono) {
    var t = $('#toast'); if (!t) return;
    t.innerHTML = ic(icono || 'check') + '<span>' + esc(msg) + '</span>';
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 2800);
  }
  function modal(html) {
    var m = $('#modal'); if (!m) return null;
    var b = $('.mbox', m);
    b.className = 'mbox';
    b.innerHTML = html; m.hidden = false;
    var f = b.querySelector('input,button.p');
    if (f) setTimeout(function () { f.focus(); }, 40);
    return b;
  }
  function cerrarModal() {
    var m = $('#modal'); if (!m) return;
    m.hidden = true;
    var b = $('.mbox', m);
    if (b) b.innerHTML = '';
  }

  function getUsuarioActual() {
    try {
      var u = localStorage.getItem('coreteks_usuario');
      if (u) return u;
    } catch (_) {}
    try {
      var s = sessionStorage.getItem('usuario_id');
      if (s) return s;
    } catch (_) {}
    return 'admin@coreteks.com';
  }

  var ESTADO = {
    modelos: [],
    hardware: null,
    modo: 'auto',
    temperatura: 0.3,
    maxTokens: 512,
    maxInputTokens: 0,
    topP: 0.9
  };

  var UI = {
    tab: 'catalogo',
    tiendaTab: 'modelos',
    descargas: {},
    pollings: {},
    modeloActivoInfo: null,
    hfQuery: '',
    hfResultados: [],
    hfCargando: false,
    hfError: null,
    hfDisponible: true,
    hfFiltro: 'todos',
    hfAutoCargado: false,
    factorRAM: 2.0,
    proveedores: [],
    apiKeys: {},
    apiKeysTemp: {},
    apiAutoCargado: false,
    apiVerificando: {},
    apiQuery: '',
    apiFiltro: 'todos',
    apiActiva: null,
    limites: { contexto_tokens: 0, max_output_tokens: 0, max_input_tokens: 0 },
    metricas: { turnos: 0 },
    hardwareVivo: null,
    _hwPoll: null
  };

  var METRICAS_MODELO = {};
  var PARAMS_MODELO = {};

  async function apiFetch(path, opts) {
    opts = opts || {};
    var uid = getUsuarioActual();

    opts.headers = Object.assign({
      'Content-Type': 'application/json',
      'X-Usuario-Id': uid
    }, opts.headers || {});

    if (opts.body && typeof opts.body === 'string') {
      try {
        var b = JSON.parse(opts.body);
        if (!b.usuario_id) b.usuario_id = uid;
        opts.body = JSON.stringify(b);
      } catch (_) {}
    }

    var method = (opts.method || 'GET').toUpperCase();
    if (method === 'GET') {
      path += (path.indexOf('?') === -1 ? '?' : '&')
            + 'usuario_id=' + encodeURIComponent(uid);
    }

    const resp = await fetch(API_BASE + path, opts);
    let data = null;
    try { data = await resp.json(); } catch (e) { data = {}; }
    return { status: resp.status, ok: resp.ok, data: data };
  }

  async function apiEstado() { try { return (await apiFetch('/api/estado')).data; } catch (e) { return null; } }
  async function apiModelos() {
    try {
      const r = await apiFetch('/api/modelos');
      return { modelos: r.data.modelos || [], hardware: r.data.hardware || null };
    } catch (e) { return { modelos: [], hardware: null }; }
  }
  async function apiActivarModelo(id, params) {
    try {
      return await apiFetch('/api/modelo/activar', {
        method: 'POST',
        body: JSON.stringify({ id: id, params: params || paramsActuales() })
      });
    }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiVolverAlPrincipal() {
    try {
      return await apiFetch('/api/modelo/principal', { method: 'POST', body: JSON.stringify({}) });
    }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiProgreso(id) {
    try { return (await apiFetch('/api/modelo/progreso?id=' + encodeURIComponent(id))).data; }
    catch (e) { return null; }
  }
  async function apiCancelarDescarga(id) {
    try {
      return await apiFetch('/api/modelo/cancelar', {
        method: 'POST',
        body: JSON.stringify({ id: id })
      });
    } catch (e) {
      return { status: 0, ok: false, data: { ok: false, error: e.message } };
    }
  }
  async function apiSincronizarParams() {
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];
    var payload = paramsActuales();
    if (activo) payload.modelo_id = activo.id;
    try {
      return await apiFetch('/api/modelo/parametros', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) { return null; }
  }
  async function apiChat(mensaje, datos_frontend, modeloId, imagenBase64) {
    try {
      return await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          mensaje: mensaje,
          datos_frontend: datos_frontend || '',
          modelo_id: modeloId,
          imagen_base64: imagenBase64 || ''
        })
      });
    }
    catch (e) { return { status: 0, ok: false, data: { success: false, error: e.message } }; }
  }
  async function apiTiendaDisponible() {
    try { return (await apiFetch('/api/tienda/disponible')).data; }
    catch (e) { return { ok: false }; }
  }
  async function apiTiendaBuscar(query, limite) {
    try { return (await apiFetch('/api/tienda/buscar', { method: 'POST', body: JSON.stringify({ query: query, limite: limite || 40 }) })).data; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  async function apiTiendaArchivos(repo_id) {
    try { return (await apiFetch('/api/tienda/archivos', { method: 'POST', body: JSON.stringify({ repo_id: repo_id }) })).data; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  async function apiTiendaInstalar(payload) {
    try { return await apiFetch('/api/tienda/instalar', { method: 'POST', body: JSON.stringify(payload) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiEliminarModeloDescargado(id) {
    try {
      return await apiFetch('/api/modelo/eliminar_descargado', {
        method: 'POST',
        body: JSON.stringify({ id: id })
      });
    } catch (e) {
      return { status: 0, ok: false, data: { ok: false, error: e.message } };
    }
  }
  async function apiCargarProveedores() {
    try {
      var r = await apiFetch('/api/api/proveedores/lista');
      if (r.data && r.data.ok && Array.isArray(r.data.proveedores)) {
        UI.proveedores = r.data.proveedores;
      } else {
        UI.proveedores = [];
      }
    } catch (e) { UI.proveedores = []; }
  }
  async function apiListarKeys() {
    try { return (await apiFetch('/api/api/proveedores')).data; }
    catch (e) { return { ok: false, proveedores: {} }; }
  }
  async function apiGuardarKey(proveedor, key) {
    try { return await apiFetch('/api/api/guardar', { method: 'POST', body: JSON.stringify({ proveedor: proveedor, api_key: key }) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiValidarKey(proveedor, key) {
    try { return await apiFetch('/api/api/validar', { method: 'POST', body: JSON.stringify({ proveedor: proveedor, api_key: key }) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiEliminarKey(proveedor) {
    try { return await apiFetch('/api/api/eliminar', { method: 'POST', body: JSON.stringify({ proveedor: proveedor }) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiListarModelos(proveedor) {
    try { return (await apiFetch('/api/api/modelos?proveedor=' + encodeURIComponent(proveedor))).data; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  async function apiActivarApi(proveedor, modelo) {
    try { return await apiFetch('/api/api/activar', { method: 'POST', body: JSON.stringify({ proveedor: proveedor, modelo: modelo }) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiDesactivarApi() {
    try { return await apiFetch('/api/api/desactivar', { method: 'POST', body: JSON.stringify({}) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiEliminarModeloApi(id) {
    try { return await apiFetch('/api/api/modelo/eliminar', { method: 'POST', body: JSON.stringify({ id: id }) }); }
    catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiHardwareVivo() {
    try { return (await apiFetch('/api/hardware/vivo')).data; }
    catch (e) { return null; }
  }
  async function apiMetricas() {
    try { return (await apiFetch('/api/metricas')).data; }
    catch (e) { return null; }
  }
  async function apiParamsModelo(id) {
    try { return (await apiFetch('/api/modelo/params?id=' + encodeURIComponent(id))).data; }
    catch (e) { return { ok: false }; }
  }
  async function apiGuardarParamsModelo(id, params) {
    try {
      return await apiFetch('/api/modelo/guardar_params', {
        method: 'POST',
        body: JSON.stringify({ id: id, params: params })
      });
    } catch (e) { return { ok: false }; }
  }

  async function apiObtenerPrompt(id, esApi) {
    try {
      var url = '/api/prompt?id=' + encodeURIComponent(id) + '&es_api=' + (esApi ? '1' : '0');
      return (await apiFetch(url)).data;
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function apiGuardarPrompt(id, prompt, esApi) {
    try {
      return await apiFetch('/api/prompt/guardar', {
        method: 'POST',
        body: JSON.stringify({ id: id, prompt: prompt, es_api: !!esApi })
      });
    } catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }
  async function apiEliminarPrompt(id, esApi) {
    try {
      return await apiFetch('/api/prompt/eliminar', {
        method: 'POST',
        body: JSON.stringify({ id: id, es_api: !!esApi })
      });
    } catch (e) { return { status: 0, ok: false, data: { ok: false, error: e.message } }; }
  }

  function paramsActuales() {
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];
    var pm = activo ? (PARAMS_MODELO[activo.id] || {}) : {};
    var ctx = UI.limites.contexto_tokens || 1024;
    var out = Math.min(pm.max_tokens || ESTADO.maxTokens || 512, UI.limites.max_output_tokens || 512);
    return {
      temperature: pm.temperature != null ? pm.temperature : ESTADO.temperatura,
      top_p: pm.top_p != null ? pm.top_p : ESTADO.topP,
      top_k: pm.top_k != null ? pm.top_k : 40,
      max_tokens: out,
      n_threads: (ESTADO.hardware && ESTADO.hardware.cpu_nucleos_fisicos) || 6,
      n_ctx: pm.n_ctx || ctx,
      n_gpu_layers: pm.n_gpu_layers != null ? pm.n_gpu_layers : (ESTADO.modo === 'gpu' ? 99 : 0),
      modo: ESTADO.modo
    };
  }

  function calcularCompatibilidad(modelo) {
    if (modelo.es_api) return { apto: true, nivel: 'ok', motivo: 'No consume RAM local', presupuesto: 0, consumo: 0 };
    var hw = ESTADO.hardware;
    if (!hw || !hw.ram_total_gb) {
      return { apto: true, nivel: 'ok', motivo: 'Sin datos de RAM', presupuesto: 0, consumo: 0 };
    }
    var presupuesto = hw.ram_total_gb / UI.factorRAM;
    var tamano = parseFloat(modelo.tamano_gb) || 0;
    var consumo = tamano * 1.2;

    if (modelo.ram_min_gb && parseFloat(modelo.ram_min_gb) > presupuesto) {
      return { apto: false, nivel: 'no', motivo: 'Requiere ' + modelo.ram_min_gb + ' GB RAM', presupuesto: presupuesto, consumo: consumo };
    }
    if (consumo > presupuesto) {
      return { apto: false, nivel: 'no', motivo: 'Consumo ~' + consumo.toFixed(1) + ' GB > presupuesto ' + presupuesto.toFixed(1) + ' GB', presupuesto: presupuesto, consumo: consumo };
    }
    if (consumo > presupuesto * 0.8) {
      return { apto: true, nivel: 'ajustado', motivo: 'Consumo ~' + consumo.toFixed(1) + ' GB cerca del límite', presupuesto: presupuesto, consumo: consumo };
    }
    return { apto: true, nivel: 'ok', motivo: 'Consumo ~' + consumo.toFixed(1) + ' GB de ' + presupuesto.toFixed(1) + ' GB', presupuesto: presupuesto, consumo: consumo };
  }

  function formatearNumero(n) {
    if (!n && n !== 0) return '0';
    return Number(n).toLocaleString('es-NI');
  }

  function vistaAsistente() {
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0] || null;
    return '<div class="ph"><h1>Asistente MÍA</h1>' +
      '<p class="sub">Administrá tus modelos locales, configurá APIs externas y gestioná los recursos del sistema.</p>' +
      '</div>' +
      cardActivo(activo) +
      '<div class="tabs">' +
        '<button class="tab' + (UI.tab === 'catalogo' ? ' on' : '') + '" data-tab="catalogo">' + ic('box') + 'Mi catálogo</button>' +
        '<button class="tab' + (UI.tab === 'tienda' ? ' on' : '') + '" data-tab="tienda">' + ic('shop') + 'Tienda</button>' +
        '<button class="tab' + (UI.tab === 'hardware' ? ' on' : '') + '" data-tab="hardware">' + ic('monitor') + 'Hardware</button>' +
        '<button class="tab' + (UI.tab === 'prompt' ? ' on' : '') + '" data-tab="prompt">' + ic('chat') + 'Prompt</button>' +
      '</div>' +
      '<div class="tab-panel">' +
        (UI.tab === 'tienda'   ? vistaTienda()   :
         UI.tab === 'hardware' ? vistaHardware() :
         UI.tab === 'prompt'   ? vistaPrompt()   :
                                 vistaCatalogo()) +
      '</div>';
  }

  function vistaCatalogo() {
    var instalados = ESTADO.modelos.filter(function (m) { return m.es_api || m.descargado || m._descargando; });
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];

    return '<div class="ast-top">' +
      '<div>' +
        '<div class="ast-toolbar">' +
          '<div>' +
            '<span class="sec">Mis modelos</span>' +
            '<p class="lead" style="margin-top:2px">' + instalados.length +
              ' disponibles · ' + (activo ? 'activo: ' + (activo.nombre || activo.id) : 'sin modelo activo') + '</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<button class="btn sm" data-accion="volver-principal">' + ic('home') + 'Usar principal</button>' +
            '<button class="btn sm" data-accion="refrescar">' + ic('refresh') + 'Refrescar</button>' +
          '</div>' +
        '</div>' +
        '<div class="mlist" id="mLista">' +
          (instalados.length === 0
            ? '<div class="note tl">' + ic('info') + '<div>No tenés modelos todavía. Descargá uno desde la <b>Tienda</b> o conectá una <b>API</b>.</div></div>'
            : instalados.map(mcard).join('')) +
        '</div>' +
      '</div>' +
      panelLateral() +
    '</div>';
  }

  function vistaTienda() {
    var sub = UI.tiendaTab;
    return '<div class="ast-top ast-top--full">' +
      '<div>' +
        '<div class="ast-toolbar">' +
          '<div>' +
            '<span class="sec">Tienda</span>' +
            '<p class="lead" style="margin-top:2px">' +
              (sub === 'modelos'
                ? 'Modelos GGUF locales · compatibilidad estimada según tu RAM.'
                : 'Proveedores de API (gratis y de pago) · se guardan cifradas en tu equipo.') +
            '</p>' +
          '</div>' +
        '</div>' +
        '<div class="subtabs">' +
          '<button class="subtab' + (sub === 'modelos' ? ' on' : '') + '" data-subtab="modelos">' + ic('box') + 'Modelos</button>' +
          '<button class="subtab' + (sub === 'api' ? ' on' : '') + '" data-subtab="api">' + ic('cloud') + 'API</button>' +
        '</div>' +
        (sub === 'modelos' ? vistaTiendaModelos() : vistaTiendaAPI()) +
      '</div>' +
    '</div>';
  }

  function vistaTiendaModelos() {
    return '' +
      '<div class="card tight" style="margin-bottom:14px">' +
        '<div class="tienda-search">' +
          '<input class="inp" id="hfQuery" placeholder="Buscar: qwen, llama, mistral, phi, gemma…" value="' + esc(UI.hfQuery) + '">' +
          '<button class="btn p" data-accion="hf-buscar">' + ic('search') + 'Buscar</button>' +
          '<button class="btn" data-accion="hf-populares">' + ic('bolt') + 'Populares</button>' +
        '</div>' +
        '<div class="tienda-filtros">' +
          ['todos','compatibles','no-compatibles'].map(function (f) {
            var n = f === 'todos' ? 'Todos' : f === 'compatibles' ? 'Solo compatibles' : 'No compatibles';
            return '<button class="chip xs' + (UI.hfFiltro === f ? ' on' : '') + '" data-hf-filtro="' + f + '">' + n + '</button>';
          }).join('') +
        '</div>' +
        (!UI.hfDisponible
          ? '<div class="note am" style="margin-top:8px">' + ic('alert') +
            '<div><b>huggingface_hub</b> no está instalado. Ejecutá: <code>pip install huggingface_hub</code></div></div>'
          : '') +
      '</div>' +
      (UI.hfCargando
        ? '<div class="hf-loading"><div class="spinner"></div><span>Cargando modelos…</span></div>'
        : UI.hfError
          ? '<div class="note rd">' + ic('alert') + '<div>' + esc(UI.hfError) + '</div></div>'
          : (UI.hfResultados.length === 0
              ? '<div class="note tl">' + ic('info') + '<div>Escribí algo en el buscador o hacé clic en <b>Populares</b>.</div></div>'
              : '<div class="tienda-grid">' + hfFiltrados().map(hfCard).join('') + '</div>')
      );
  }

  function hfFiltrados() {
    return UI.hfResultados.filter(function (m) {
      if (UI.hfFiltro === 'todos') return true;
      var est = estimarModeloHF(m);
      if (UI.hfFiltro === 'compatibles') return est.nivel === 'ok' || est.nivel === 'ajustado';
      if (UI.hfFiltro === 'no-compatibles') return est.nivel === 'no';
      return true;
    });
  }

  function estimarModeloHF(repo) {
    var nombre = ((repo.id || '') + ' ' + (repo.nombre || '') + ' ' + (repo.tags || []).join(' ')).toLowerCase();
    var cuant = 'desconocida';
    var mC = nombre.match(/(i?q\d+(?:_[a-z0-9]+)*)/i);
    if (mC) cuant = mC[1].toUpperCase();
    var params = 0;
    var mP = nombre.match(/(\d+(?:\.\d+)?)\s*b(?![a-z])/i);
    if (mP) params = parseFloat(mP[1]);
    var factorCuant = 0.55;
    if (/IQ1/i.test(cuant)) factorCuant = 0.22;
    else if (/Q2/i.test(cuant)) factorCuant = 0.35;
    else if (/Q3/i.test(cuant)) factorCuant = 0.42;
    else if (/IQ4/i.test(cuant)) factorCuant = 0.50;
    else if (/Q4/i.test(cuant)) factorCuant = 0.55;
    else if (/Q5/i.test(cuant)) factorCuant = 0.68;
    else if (/Q6/i.test(cuant)) factorCuant = 0.78;
    else if (/Q8/i.test(cuant)) factorCuant = 1.00;
    var sizeGB = params > 0 ? params * factorCuant : 0;
    var ramGB = sizeGB > 0 ? sizeGB * 1.2 : 0;
    var nivel = 'desconocido';
    if (ramGB > 0 && ESTADO.hardware && ESTADO.hardware.ram_total_gb) {
      var presupuesto = ESTADO.hardware.ram_total_gb / UI.factorRAM;
      if (ramGB > presupuesto) nivel = 'no';
      else if (ramGB > presupuesto * 0.8) nivel = 'ajustado';
      else nivel = 'ok';
    }
    return { params: params, cuant: cuant, sizeGB: sizeGB, ramGB: ramGB, nivel: nivel };
  }

  function hfCard(m) {
    var est = estimarModeloHF(m);
    var d = m.descargas || 0;
    var dlTxt = d > 1000000 ? (d/1000000).toFixed(1)+'M' : d > 1000 ? (d/1000).toFixed(1)+'k' : String(d);
    var nivelCls = est.nivel === 'ok' ? 'ok' : est.nivel === 'ajustado' ? 'warn' : est.nivel === 'no' ? 'crit' : '';
    var chipCompat = est.nivel === 'ok'
          ? '<span class="chip gr xs">' + ic('check') + 'Compatible</span>'
          : est.nivel === 'ajustado'
            ? '<span class="chip am xs">' + ic('alert') + 'Ajustado</span>'
            : est.nivel === 'no'
              ? '<span class="chip rd xs">' + ic('x') + 'No compatible</span>'
              : '';
    return '<div class="hf-card' + (est.nivel === 'no' ? ' incompatible' : '') + '" data-repo="' + esc(m.id) + '">' +
      '<div class="hd"><div style="min-width:0">' +
        '<b>' + esc(m.nombre || m.id) + '</b>' +
        '<span class="autor">' + ic('link') + ' ' + esc(m.autor || '') + (m.autor && m.nombre ? '/' : '') + esc(m.nombre || '') + '</span>' +
      '</div></div>' +
      '<div class="hf-specs">' +
        '<div class="hf-spec"><span class="lbl-s">' + ic('brain') + 'Parámetros</span><span class="val-s">' + (est.params > 0 ? est.params + ' B' : '—') + '</span></div>' +
        '<div class="hf-spec"><span class="lbl-s">' + ic('shield') + 'Cuantización</span><span class="val-s">' + esc(est.cuant) + '</span></div>' +
        '<div class="hf-spec"><span class="lbl-s">' + ic('hard') + 'Tamaño</span><span class="val-s">' + (est.sizeGB > 0 ? est.sizeGB.toFixed(2) + ' GB' : '—') + '</span></div>' +
        '<div class="hf-spec"><span class="lbl-s">' + ic('ram') + 'RAM estimada</span><span class="val-s ' + nivelCls + '">' + (est.ramGB > 0 ? est.ramGB.toFixed(2) + ' GB' : '—') + '</span></div>' +
      '</div>' +
      '<div class="stats">' +
        '<span>' + ic('download') + dlTxt + ' descargas</span>' +
        '<span>' + ic('star') + (m.likes || 0) + '</span>' +
      '</div>' +
      (chipCompat ? '<div class="chips">' + chipCompat + '</div>' : '') +
      (m.tags && m.tags.length ? '<div class="tags">' +
        m.tags.slice(0, 4).map(function (t) { return '<span class="chip xs">' + esc(t) + '</span>'; }).join('') +
      '</div>' : '') +
      '<div class="acciones">' +
        '<button class="btn sm p" data-accion="hf-instalar" data-repo="' + esc(m.id) + '" data-nombre="' + esc(m.nombre || '') + '">' +
          ic('download') + 'Ver archivos' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function vistaTiendaAPI() {
    var conectados = 0;
    UI.proveedores.forEach(function (p) {
      if (UI.apiKeys[p.id] && UI.apiKeys[p.id].conectado) conectados++;
    });

    if (UI.proveedores.length === 0) {
      return '<div class="api-vacio">' +
        ic('cloud') +
        '<div>No se pudieron cargar los proveedores.<br>Verificá que exista <b>modelos/apis/proveedores.json</b>.</div>' +
        '<button class="btn sm" data-accion="api-refrescar">' + ic('refresh') + 'Reintentar</button>' +
      '</div>';
    }

    return '' +
      '<div class="card tight" style="margin-bottom:14px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
          '<div>' +
            '<b style="font-family:var(--disp);font-size:14px;color:var(--white)">' +
              conectados + ' de ' + UI.proveedores.length + ' proveedores conectados' +
              (UI.apiActiva ? ' · <span style="color:#C4B5FD">Activo: ' + esc(UI.apiActiva.modelo) + '</span>' : '') +
            '</b>' +
            '<p class="lead" style="margin-top:2px">Las API keys se guardan cifradas en tu equipo.</p>' +
          '</div>' +
          '<button class="btn sm" data-accion="api-refrescar">' + ic('refresh') + 'Refrescar</button>' +
        '</div>' +
        '<div class="api-search-wrap" style="margin-top:14px;margin-bottom:0">' +
          '<div class="api-search">' +
            ic('search', 'ico-buscar') +
            '<input class="inp" id="apiQuery" type="text" placeholder="Buscar proveedor: groq, gemini, openai, anthropic…" value="' + esc(UI.apiQuery) + '" autocomplete="off" spellcheck="false">' +
            (UI.apiQuery ? '<button class="limpiar" data-accion="api-limpiar">' + ic('x') + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="api-filtros" style="margin-top:10px">' +
          ['todos','conectados','sin-tarjeta','pago'].map(function (f) {
            var n = f === 'todos' ? 'Todos' : f === 'conectados' ? 'Conectados' : f === 'sin-tarjeta' ? 'Sin tarjeta' : 'De pago';
            return '<button class="chip xs' + (UI.apiFiltro === f ? ' on' : '') + '" data-api-filtro="' + f + '">' + n + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      apiResultadosHTML();
  }

  function apiResultadosHTML() {
    var lista = apiFiltrados();
    if (lista.length === 0) {
      return '<div class="api-vacio">' + ic('search') +
        '<div>No se encontraron proveedores para <b>' + esc(UI.apiQuery) + '</b>.</div>' +
        '<button class="btn sm" data-accion="api-limpiar">Limpiar búsqueda</button>' +
      '</div>';
    }
    return '<div class="api-resultado-info">' +
      lista.length + ' de ' + UI.proveedores.length + ' proveedores' +
      (UI.apiQuery ? ' para «<b>' + esc(UI.apiQuery) + '</b>»' : '') +
    '</div>' +
    '<div class="api-grid">' + lista.map(apiCard).join('') + '</div>';
  }

  function apiFiltrados() {
    var q = UI.apiQuery.trim().toLowerCase();
    return UI.proveedores.filter(function (p) {
      if (q) {
        var blob = ((p.n||'') + ' ' + (p.d||'') + ' ' + (p.modelos||'') + ' ' + (p.tier||'') + ' ' + (p.base||'') + ' ' + (p.id||'')).toLowerCase();
        if (blob.indexOf(q) === -1) return false;
      }
      if (UI.apiFiltro === 'conectados') return UI.apiKeys[p.id] && UI.apiKeys[p.id].conectado;
      if (UI.apiFiltro === 'sin-tarjeta') return !p.tarjeta;
      if (UI.apiFiltro === 'pago') return p.tarjeta === true;
      return true;
    });
  }

  function apiCard(p) {
    var estado = UI.apiKeys[p.id] || {};
    var conectado = estado.conectado === true;
    var verif = UI.apiVerificando[p.id] === true;
    var esActiva = UI.apiActiva && UI.apiActiva.proveedor === p.id;
    var nGuardados = estado.modelos_guardados || 0;

    return '<div class="api-card' + (conectado ? ' conectado' : '') + (esActiva ? ' activo' : '') + '" data-prov="' + esc(p.id) + '">' +
      '<div class="hd">' +
        '<span class="logo ' + esc(p.cls || '') + '">' + esc(p.logo || p.n.substring(0,2).toUpperCase()) + '</span>' +
        '<div class="info">' +
          '<b>' + esc(p.n) + '</b>' +
          '<small>' + esc(p.tier || '') + (p.tarjeta ? ' · requiere tarjeta' : ' · sin tarjeta') + '</small>' +
        '</div>' +
        (esActiva
          ? '<span class="chip vi xs">' + ic('star') + 'En uso</span>'
          : conectado
            ? '<span class="chip gr xs">' + ic('check') + 'Conectado' + (nGuardados ? ' · ' + nGuardados + ' modelos' : '') + '</span>'
            : '<span class="chip xs">' + ic('x') + 'Sin conectar</span>') +
      '</div>' +
      '<div class="desc">' + esc(p.d || '') + '</div>' +
      (p.modelos ? '<div class="meta"><span>' + ic('brain') + esc(p.modelos) + '</span></div>' : '') +
      (p.url ? '<a class="link-out" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + ic('external') + 'Obtener API key</a>' : '') +
      '<div class="key-row">' +
        '<input class="inp" type="password" data-key-input="' + esc(p.id) + '" placeholder="Pegá tu API key…" autocomplete="off" spellcheck="false" value="' + esc(UI.apiKeysTemp[p.id] || '') + '">' +
      '</div>' +
      '<div class="acciones">' +
        (conectado
          ? '<button class="btn xs d" data-accion="api-desconectar" data-prov="' + esc(p.id) + '">' + ic('trash') + 'Quitar</button>' +
            '<button class="btn sm p" data-accion="api-ver-modelos" data-prov="' + esc(p.id) + '" data-nombre="' + esc(p.n) + '">' + ic('plug') + 'Ver modelos</button>'
          : '<button class="btn sm p" data-accion="api-conectar" data-prov="' + esc(p.id) + '"' + (verif ? ' disabled' : '') + '>' +
              (verif ? ic('refresh') + 'Validando…' : ic('plug') + 'Conectar') + '</button>') +
      '</div>' +
    '</div>';
  }

  function vistaHardware() {
    var hw = UI.hardwareVivo && UI.hardwareVivo.hardware ? UI.hardwareVivo.hardware : ESTADO.hardware;
    if (!hw) {
      return '<div class="note am" style="margin-top:18px">' + ic('alert') +
        '<div>Cargando información del hardware…</div></div>';
    }

    var presupuesto = (hw.ram_total_gb / UI.factorRAM).toFixed(2);
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];
    var limites = UI.limites;
    var metricas = UI.metricas;

    return '<div class="ast-top">' +
      '<div>' +

        '<div class="ast-toolbar">' +
          '<div>' +
            '<span class="sec">Recursos del equipo</span>' +
            '<p class="lead" style="margin-top:2px">Monitoreo en vivo · se actualiza cada 2 segundos.</p>' +
          '</div>' +
          '<button class="btn sm" data-accion="refrescar">' + ic('refresh') + 'Refrescar</button>' +
        '</div>' +

        '<div class="hw-panel">' +

          '<div class="hw-card">' +
            '<div class="ico">' + ic('cpu') + '</div>' +
            '<h3>Procesador</h3>' +
            '<div class="val" style="font-size:15px">' + esc(hw.cpu_modelo || 'CPU') + '</div>' +
            '<div class="sub">' + hw.cpu_nucleos_fisicos + ' núcleos · ' + hw.cpu_nucleos_logicos + ' hilos' +
              (hw.cpu_freq_mhz ? ' · ' + hw.cpu_freq_mhz + ' MHz' : '') + '</div>' +
            '<div class="bar' + (hw.cpu_uso_pct > 85 ? ' crit' : hw.cpu_uso_pct > 70 ? ' warn' : '') + '">' +
              '<i id="hw-cpu-bar" style="width:' + Math.min(100, hw.cpu_uso_pct || 0) + '%"></i>' +
            '</div>' +
            '<div class="sub" style="display:flex;justify-content:space-between">' +
              '<span>Uso CPU</span><b id="hw-cpu-val">' + (hw.cpu_uso_pct || 0) + '%</b>' +
            '</div>' +
          '</div>' +

          '<div class="hw-card">' +
            '<div class="ico">' + ic('ram') + '</div>' +
            '<h3>Memoria RAM</h3>' +
            '<div class="val" id="hw-ram-val">' + hw.ram_total_gb + ' GB</div>' +
            '<div class="sub" id="hw-ram-sub">' + hw.ram_disponible_gb + ' GB disponibles · ' + presupuesto + ' GB por modelo</div>' +
            '<div class="bar' + ((hw.ram_uso_pct || 0) > 85 ? ' crit' : (hw.ram_uso_pct || 0) > 70 ? ' warn' : '') + '">' +
              '<i id="hw-ram-bar" style="width:' + Math.min(100, hw.ram_uso_pct || 0) + '%"></i>' +
            '</div>' +
            '<div class="sub" style="display:flex;justify-content:space-between">' +
              '<span>Uso RAM</span><b id="hw-ram-pct">' + (hw.ram_uso_pct || 0) + '%</b>' +
            '</div>' +
          '</div>' +

          '<div class="hw-card">' +
            '<div class="ico">' + ic('bolt') + '</div>' +
            '<h3>Gráficos</h3>' +
            '<div class="val" style="font-size:15px">' + esc(hw.gpu || 'Integrada') + '</div>' +
            '<div class="sub">' + (hw.gpu ? 'GPU dedicada detectada' : 'Sin GPU dedicada · solo CPU') + '</div>' +
          '</div>' +

          '<div class="hw-card">' +
            '<div class="ico">' + ic('hard') + '</div>' +
            '<h3>Disco</h3>' +
            '<div class="val" id="hw-disco-val">' + hw.disco_libre_gb + ' GB libres</div>' +
            '<div class="sub" id="hw-disco-sub">de ' + (hw.disco_total_gb || '?') + ' GB totales</div>' +
            '<div class="bar' + ((hw.disco_uso_pct || 0) > 90 ? ' crit' : (hw.disco_uso_pct || 0) > 75 ? ' warn' : '') + '">' +
              '<i id="hw-disco-bar" style="width:' + Math.min(100, hw.disco_uso_pct || 0) + '%"></i>' +
            '</div>' +
            '<div class="sub" style="display:flex;justify-content:space-between">' +
              '<span>Uso disco</span><b id="hw-disco-pct">' + (hw.disco_uso_pct || 0) + '%</b>' +
            '</div>' +
          '</div>' +

        '</div>' +

        (activo
          ? '<div class="card" style="margin-top:18px">' +
              '<label class="lbl">Comportamiento del modelo activo</label>' +
              '<div class="comportamiento-grid">' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Modelo</span>' +
                  '<b class="comp-val" style="font-size:13px">' + esc(activo.nombre || activo.id) + '</b>' +
                '</div>' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Contexto total</span>' +
                  '<b class="comp-val">' + formatearNumero(limites.contexto_tokens) + ' tok</b>' +
                '</div>' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Máx. tokens salida</span>' +
                  '<b class="comp-val">' + formatearNumero(limites.max_output_tokens) + ' tok</b>' +
                '</div>' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Tokens entrada disp.</span>' +
                  '<b class="comp-val">' + formatearNumero(limites.max_input_tokens) + ' tok</b>' +
                '</div>' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Velocidad</span>' +
                  '<b class="comp-val">' + (metricas.velocidad_tok_s || 0).toFixed(1) + ' tok/s</b>' +
                '</div>' +
                '<div class="comp-item">' +
                  '<span class="comp-lbl">Turnos</span>' +
                  '<b class="comp-val">' + formatearNumero(metricas.turnos) + '</b>' +
                '</div>' +
              '</div>' +
            '</div>'
          : '<div class="note am" style="margin-top:18px">' + ic('info') + '<div>Activá un modelo para ver su comportamiento en tiempo real.</div></div>'
        ) +

      '</div>' +
      panelLateral() +
    '</div>';
  }

  function vistaPrompt() {
    var modelos = ESTADO.modelos || [];
    var locales = modelos.filter(function (m) { return !m.es_api; });
    var apis = modelos.filter(function (m) { return m.es_api; });
    var conPrompt = modelos.filter(function (m) { return m.tiene_prompt; }).length;

    return '<div class="ast-top ast-top--full">' +
      '<div>' +
        '<div class="ast-toolbar">' +
          '<div>' +
            '<span class="sec">Prompt específico por IA</span>' +
            '<p class="lead" style="margin-top:2px">' +
              'Cada modelo (local o API) tiene su propio prompt de sistema. Se guarda en ' +
              '<code style="color:var(--teal)">modelos/prom/</code>. ' +
              '<b>' + conPrompt + '</b> de <b>' + modelos.length + '</b> tienen prompt personalizado.' +
            '</p>' +
          '</div>' +
          '<button class="btn sm" data-accion="refrescar">' + ic('refresh') + 'Refrescar</button>' +
        '</div>' +

        (modelos.length === 0
          ? '<div class="note am">' + ic('alert') + '<div>No tenés modelos todavía. Descargá uno desde la <b>Tienda</b> o conectá una <b>API</b>.</div></div>'
          : (locales.length
              ? '<div class="card" style="margin-bottom:16px">' +
                  '<label class="lbl">' + ic('brain') + ' Modelos locales (' + locales.length + ')</label>' +
                  '<div class="mlist">' + locales.map(promptCard).join('') + '</div>' +
                '</div>'
              : '') +
            (apis.length
              ? '<div class="card">' +
                  '<label class="lbl">' + ic('cloud') + ' Modelos API (' + apis.length + ')</label>' +
                  '<div class="mlist">' + apis.map(promptCard).join('') + '</div>' +
                '</div>'
              : '')
        ) +
      '</div>' +
    '</div>';
  }

  function promptCard(m) {
    var esApi = m.es_api === true;
    var tiene = !!m.tiene_prompt;
    var preview = tiene ? (m.prompt_guardado || '').substring(0, 140) : '';

    return '<article class="mitem' +
        (m.activo ? ' on' : '') +
        (esApi ? ' es-api' : '') +
        '">' +
      '<span class="mico">' + ic(esApi ? 'cloud' : 'brain') + '</span>' +
      '<div class="mbody">' +
        '<div class="top">' +
          '<b>' + esc(m.nombre || m.id) + '</b>' +
          (esApi ? '<span class="chip vi xs">' + ic('cloud') + 'API</span>' : '') +
          (m.activo ? '<span class="chip tl xs">' + ic('check') + 'Activo</span>' : '') +
          (tiene
            ? '<span class="chip gr xs">' + ic('check') + 'Con prompt</span>'
            : '<span class="chip xs">' + ic('info') + 'Sin prompt</span>') +
        '</div>' +
        (m.descripcion ? '<p>' + esc(m.descripcion) + '</p>' : '') +
        (tiene
          ? '<div class="prompt-list-preview">' + esc(preview) + ((m.prompt_guardado || '').length > 140 ? '…' : '') + '</div>'
          : '<p class="lead" style="margin-top:6px;font-size:11.5px;color:var(--dim)">' +
              'Todavía no le asignaste un prompt específico. Se usará el general del sistema.' +
            '</p>'
        ) +
      '</div>' +
      '<div class="mact">' +
        '<button class="btn sm p" data-accion="prompt-abrir" ' +
          'data-id="' + esc(m.id) + '" ' +
          'data-es-api="' + (esApi ? '1' : '0') + '" ' +
          'data-nombre="' + esc(m.nombre || m.id) + '">' +
          ic('chat') + (tiene ? 'Editar prompt' : 'Crear prompt') +
        '</button>' +
        (tiene
          ? '<button class="btn xs d" data-accion="prompt-eliminar" ' +
              'data-id="' + esc(m.id) + '" ' +
              'data-es-api="' + (esApi ? '1' : '0') + '">' +
              ic('trash') + 'Eliminar' +
            '</button>'
          : '') +
      '</div>' +
    '</article>';
  }

  async function abrirModalPrompt(id, esApi, nombre) {
    var r = await apiObtenerPrompt(id, esApi);
    var texto = (r && r.ok) ? (r.prompt || '') : '';

    var m = ESTADO.modelos.filter(function (x) {
      return x.id === id && (x.es_api === true) === esApi;
    })[0];
    if (m) {
      m.prompt_guardado = texto;
      m.tiene_prompt = !!texto.trim();
    }

    var tiene = !!texto.trim();

    modal(
      '<h2>' + ic('chat') + ' Prompt · ' + esc(nombre) + '</h2>' +
      '<p class="lead" style="margin:8px 0 0">' +
        (esApi ? 'API · se guarda en <code>modelos/prom/api/' + esc(id) + '.txt</code>'
               : 'Local · se guarda en <code>modelos/prom/locales/' + esc(id) + '.txt</code>') +
      '</p>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        (tiene
          ? '<span class="chip gr xs">' + ic('check') + 'Prompt personalizado activo</span>'
          : '<span class="chip xs">' + ic('info') + 'Sin prompt · se usará el general</span>') +
        (m && m.activo ? '<span class="chip tl xs">' + ic('star') + 'Es el modelo activo</span>' : '') +
      '</div>' +
      '<textarea class="ta mono" id="promptTexto" rows="14" style="margin-top:14px" ' +
        'placeholder="Escribí el prompt de sistema para esta IA...&#10;&#10;Ejemplo:&#10;Eres ALFA, asistente del sistema logístico Alfa Logistics.&#10;Responde en español, breve y natural.">' +
        esc(texto) +
      '</textarea>' +
      '<div class="prompt-meta">' +
        '<span class="lead" id="promptInfo" style="font-size:11.5px">' +
          (texto.length ? formatearNumero(texto.length) + ' caracteres' : 'Vacío · se usará el prompt por defecto') +
        '</span>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn gh" data-accion="prompt-vaciar">' + ic('x') + 'Vaciar</button>' +
          (tiene
            ? '<button class="btn d" data-accion="prompt-eliminar-modal" ' +
                'data-id="' + esc(id) + '" data-es-api="' + (esApi ? '1' : '0') + '">' +
                ic('trash') + 'Eliminar' +
              '</button>'
            : '') +
          '<button class="btn gh" data-x>Cancelar</button>' +
          '<button class="btn p" data-accion="prompt-guardar" ' +
            'data-id="' + esc(id) + '" data-es-api="' + (esApi ? '1' : '0') + '">' +
            ic('check') + 'Guardar' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="note tl" style="margin-top:14px">' + ic('info') +
        '<div>Este prompt se inyecta como <b>system prompt</b> antes de cada mensaje. ' +
        'Si lo dejás vacío, se usa el prompt por defecto del sistema.</div>' +
      '</div>'
    );

    setTimeout(function () {
      var ta = document.getElementById('promptTexto');
      if (ta) {
        ta.focus();
        try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
      }
    }, 60);

    var ta = document.getElementById('promptTexto');
    if (ta) ta.addEventListener('input', actualizarInfoPrompt);
  }

  function actualizarInfoPrompt() {
    var ta = document.getElementById('promptTexto');
    var info = document.getElementById('promptInfo');
    if (!ta || !info) return;
    var n = ta.value.length;
    info.textContent = n ? formatearNumero(n) + ' caracteres' : 'Vacío · se usará el prompt por defecto';
  }

  async function guardarPromptActivo(id, esApi) {
    var ta = document.getElementById('promptTexto');
    if (!ta) return;
    var texto = ta.value || '';
    var btn = document.querySelector('[data-accion="prompt-guardar"]');
    if (btn) { btn.disabled = true; btn.innerHTML = ic('refresh') + 'Guardando…'; }

    var r = await apiGuardarPrompt(id, texto, esApi);
    if (r.data && r.data.ok) {
      toast('Prompt guardado.', 'check');
      cerrarModal();
      await refrescarModelos();
      render();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'no se pudo guardar'), 'alert');
      if (btn) { btn.disabled = false; btn.innerHTML = ic('check') + 'Guardar'; }
    }
  }

  function eliminarPromptActivo(id, esApi, msgOk) {
    modal(
      '<h2>¿Eliminar prompt de esta IA?</h2>' +
      '<p class="lead" style="margin:8px 0 0">El archivo .txt se borrará del disco.</p>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cancelar</button>' +
        '<button class="btn d" id="okEliminarProm">' + ic('trash') + 'Eliminar</button>' +
      '</div>'
    );
    var ok = document.getElementById('okEliminarProm');
    if (ok) ok.onclick = async function () {
      cerrarModal();
      var r = await apiEliminarPrompt(id, esApi);
      if (r.data && r.data.ok) {
        toast(msgOk || 'Prompt eliminado.', 'trash');
        await refrescarModelos();
        render();
      } else {
        toast('Error eliminando prompt.', 'alert');
      }
    };
  }

  function cardActivo(m) {
    if (!m) {
      return '<div class="note am" style="margin-top:18px">' + ic('alert') +
        '<div><b>No hay un modelo activo.</b> Instalá uno desde la Tienda o conectá una API.</div></div>';
    }
    var esApi = m.es_api === true;
    var esPrincipal = m.es_principal || (UI.modeloActivoInfo && UI.modeloActivoInfo.es_modelo_principal);
    return '<div class="ast-active' + (esApi ? ' es-api' : '') + '">' +
      '<div class="hd">' +
        '<span class="avatar">' + ic(esApi ? 'cloud' : 'brain') + '</span>' +
        '<div class="info">' +
          '<b>' + esc(m.nombre || m.id) + '</b>' +
          (m.descripcion ? '<small>' + esc(m.descripcion) + '</small>' : '') +
          '<div class="tags">' +
            '<span class="chip tl">' + ic('star') + 'Activo ahora</span>' +
            (esApi ? '<span class="chip vi xs">' + ic('cloud') + 'API</span>' : '') +
            (esPrincipal ? '<span class="chip gr">' + ic('home') + 'Modelo principal</span>' : '') +
            (m.familia ? '<span class="chip xs">' + esc(m.familia) + '</span>' : '') +
            (m.licencia ? '<span class="chip xs">' + esc(m.licencia) + '</span>' : '') +
            (UI.limites.contexto_tokens ? '<span class="chip xs">' + formatearNumero(UI.limites.contexto_tokens) + ' ctx</span>' : '') +
          '</div>' +
        '</div>' +
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn sm p" data-accion="probar">' + ic('chat') + 'Probar</button>' +
          '<button class="btn sm" data-accion="configurar" data-id="' + esc(m.id) + '">' + ic('settings') + 'Configurar</button>' +
          (esApi
            ? '<button class="btn sm d" data-accion="desactivar-api">' + ic('power') + 'Volver a local</button>'
            : '<button class="btn sm d" data-accion="detener-activo">' + ic('power') + 'Detener</button>') +
        '</div>' +
      '</div>' +
      '<div class="stats">' +
        '<div><span>Tamaño</span><b>' + (esApi ? 'Nube' : (m.tamano_gb ? parseFloat(m.tamano_gb).toFixed(2) + ' GB' : '—')) + '</b></div>' +
        '<div><span>Contexto</span><b>' + formatearNumero(UI.limites.contexto_tokens) + '</b></div>' +
        '<div><span>Max salida</span><b>' + formatearNumero(UI.limites.max_output_tokens) + '</b></div>' +
        '<div><span>Fuente</span><b>' + (esApi ? 'API remota' : (esPrincipal ? 'Principal' : 'Alternativo')) + '</b></div>' +
      '</div>' +
    '</div>';
  }

  function mcard(m) {
    var esApi = m.es_api === true;
    var descargado = m.descargado === true;
    var descargando = m._descargando === true;
    var activo = m.activo === true;
    var pct = m._progreso || 0;
    var cargando = m._cargando === true;

    var compat = calcularCompatibilidad(m);
    var apto = m.es_principal ? true : compat.apto;
    var nivel = m.es_principal ? 'ok' : compat.nivel;
    var motivo = m.es_principal ? 'Modelo principal del sistema' : compat.motivo;

    var chipApi = esApi ? '<span class="chip vi xs">' + ic('cloud') + 'API</span>' : '';
    var chipCompat = '';
    if (!esApi) {
      if (nivel === 'ok') chipCompat = '<span class="chip gr xs">' + ic('check') + 'Compatible</span>';
      else if (nivel === 'ajustado') chipCompat = '<span class="chip am xs">' + ic('alert') + 'Ajustado</span>';
      else if (nivel === 'no') chipCompat = '<span class="chip rd xs">' + ic('x') + 'No compatible</span>';
    }

    var met = METRICAS_MODELO[m.id];
    var statsHTML = '';
    if (met && (met.turnos > 0)) {
      statsHTML =
        '<div class="mstats">' +
          '<span title="Tokens de entrada (último turno)">' + ic('bolt') + ' In ' + formatearNumero(met.tokens_entrada) + '</span>' +
          '<span title="Tokens de salida (último turno)">' + ic('send') + ' Out ' + formatearNumero(met.tokens_salida) + '</span>' +
          '<span title="Velocidad">' + ic('cpu') + ' ' + (met.velocidad_tok_s || 0).toFixed(1) + ' tok/s</span>' +
          '<span title="Tiempo de respuesta">' + ic('refresh') + ' ' + (met.tiempo_respuesta_s || 0).toFixed(2) + ' s</span>' +
          '<span title="Turnos totales">' + ic('chat') + ' ' + formatearNumero(met.turnos) + ' turnos</span>' +
        '</div>';
    }

    var configHTML = '';
    var p = PARAMS_MODELO[m.id];
    if (p) {
      configHTML =
        '<div class="mconfig">' +
          '<span title="Temperatura">' + ic('bolt') + ' ' + (p.temperature != null ? p.temperature : '—') + '</span>' +
          '<span title="Top-P">' + ic('star') + ' ' + (p.top_p != null ? p.top_p : '—') + '</span>' +
          '<span title="Max tokens">' + ic('send') + ' ' + (p.max_tokens != null ? formatearNumero(p.max_tokens) : '—') + '</span>' +
          (p.n_threads ? '<span title="Hilos">' + ic('cpu') + ' ' + p.n_threads + ' hilos</span>' : '') +
        '</div>';
    }

    return '<article class="mitem' +
        (activo ? ' on' : '') +
        (esApi ? ' es-api' : '') +
        (descargando ? ' installing' : '') +
        (cargando ? ' cargando' : '') +
        (!apto ? ' incompatible' : '') +
        '" data-id="' + esc(m.id) + '">' +
      '<span class="mico">' + ic(esApi ? 'cloud' : (m.es_principal ? 'star' : 'brain')) + '</span>' +
      '<div class="mbody">' +
        '<div class="top">' +
          '<b>' + esc(m.nombre || m.id) + '</b>' +
          chipApi +
          (activo ? '<span class="chip tl xs">' + ic('check') + 'Activo</span>' : '') +
          (descargado && !activo && !esApi ? '<span class="chip gr xs">' + ic('hard') + 'Instalado</span>' : '') +
          (descargando ? '<span class="chip am xs">' + ic('download') + 'Descargando</span>' : '') +
          (cargando ? '<span class="chip tl xs">' + ic('refresh') + 'Cargando…</span>' : '') +
          chipCompat +
        '</div>' +
        (m.descripcion ? '<p>' + esc(m.descripcion) + '</p>' : '') +
        '<div class="meta">' +
          (m.tamano_gb ? '<span>' + ic('hard') + parseFloat(m.tamano_gb).toFixed(2) + ' GB</span>' : '') +
          (m.contexto_tokens ? '<span>' + ic('brain') + formatearNumero(m.contexto_tokens) + ' ctx</span>' : '') +
          (m.max_output_tokens ? '<span>' + ic('bolt') + formatearNumero(m.max_output_tokens) + ' max out</span>' : '') +
          (!esApi && compat.consumo > 0 ? '<span>' + ic('cpu') + 'Consumo ~' + compat.consumo.toFixed(2) + ' GB</span>' : '') +
        '</div>' +
        (motivo ? '<p class="lead" style="margin-top:6px;font-size:11.5px;color:var(--dim)">' + esc(motivo) + '</p>' : '') +
        configHTML +
        statsHTML +
        (descargando ?
          '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="pinfo"><span id="pt-' + esc(m.id) + '">' + esc((UI.descargas[m.id] && UI.descargas[m.id].mensaje) || 'Descargando…') + '</span><b id="pv-' + esc(m.id) + '">' + pct + '%</b></div>'
          : '') +
      '</div>' +
      '<div class="mact">' +
        (cargando ?
          '<span class="chip tl xs">' + ic('refresh') + 'Cargando…</span>'
          : activo ?
          '<span class="chip tl xs">' + ic('power') + 'En uso</span>' +
          '<div class="row">' +
            '<button class="btn xs p" data-accion="probar">' + ic('chat') + 'Probar</button>' +
            '<button class="btn xs" data-accion="configurar" data-id="' + esc(m.id) + '">' + ic('settings') + 'Config</button>' +
            (esApi
              ? '<button class="btn xs" data-accion="desactivar-api">Volver a local</button>'
              : '<button class="btn xs" data-accion="detener-activo">Detener</button>') +
          '</div>'
          : esApi ?
          '<button class="btn sm p" data-accion="activar-api-directo" data-id="' + esc(m.id) + '"' +
            ' data-prov="' + esc(m._api ? m._api.proveedor : '') + '"' +
            ' data-modelo="' + esc(m._api ? m._api.modelo : '') + '">' + ic('play') + 'Usar este modelo</button>' +
          '<div class="row">' +
            '<button class="btn xs" data-accion="configurar" data-id="' + esc(m.id) + '">' + ic('settings') + 'Configurar</button>' +
            '<button class="btn xs d" data-accion="eliminar-api" data-id="' + esc(m.id) + '">' + ic('trash') + 'Quitar</button>' +
          '</div>'
          : descargado ?
          '<button class="btn sm p" data-accion="activar" data-id="' + esc(m.id) + '">' + ic('play') + 'Usar este modelo</button>' +
          '<div class="row">' +
            '<button class="btn xs" data-accion="configurar" data-id="' + esc(m.id) + '">' + ic('settings') + 'Config</button>' +
            '<button class="btn xs" data-accion="detalles" data-id="' + esc(m.id) + '">Detalles</button>' +
            (!m.es_principal ? '<button class="btn xs d" data-accion="eliminar-descargado" data-id="' + esc(m.id) + '">' + ic('trash') + 'Eliminar</button>' : '') +
          '</div>'
          : descargando ?
          '<button class="btn xs" data-accion="cancelar" data-id="' + esc(m.id) + '">' + ic('x') + 'Cancelar</button>'
          : '<button class="btn sm p" data-accion="descargar" data-id="' + esc(m.id) + '"' + (!apto ? ' disabled' : '') + '>' + ic('download') + 'Descargar</button>' +
            '<button class="btn xs" data-accion="detalles" data-id="' + esc(m.id) + '">Detalles</button>'
        ) +
      '</div>' +
    '</article>';
  }

  function panelLateral() {
    var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];
    var limites = UI.limites;
    var metricas = UI.metricas;
    var maxOutMax = limites.max_output_tokens || 2048;
    var ctxMax = limites.contexto_tokens || 4096;

    var pm = activo ? (PARAMS_MODELO[activo.id] || {}) : {};
    var tempVal = pm.temperature != null ? pm.temperature : ESTADO.temperatura;
    var topPVal = pm.top_p != null ? pm.top_p : ESTADO.topP;
    var maxTokVal = pm.max_tokens != null ? Math.min(pm.max_tokens, maxOutMax) : Math.min(ESTADO.maxTokens || 512, maxOutMax);

    return '<aside class="ast-side">' +
      '<div class="card tight">' +
        '<label class="lbl">Ventana de contexto</label>' +
        (activo
          ? '<div class="ctx-info">' +
              '<div class="ctx-row">' +
                '<span>Modelo</span>' +
                '<b>' + esc((activo.nombre || activo.id).substring(0, 30)) + '</b>' +
              '</div>' +
              '<div class="ctx-row">' +
                '<span>Contexto total</span>' +
                '<b>' + formatearNumero(ctxMax) + ' tok</b>' +
              '</div>' +
              '<div class="ctx-row">' +
                '<span>Max. entrada</span>' +
                '<b>' + formatearNumero(limites.max_input_tokens) + ' tok</b>' +
              '</div>' +
              '<div class="ctx-row">' +
                '<span>Max. salida</span>' +
                '<b style="color:var(--teal)">' + formatearNumero(maxOutMax) + ' tok</b>' +
              '</div>' +
              '<div class="ctx-row">' +
                '<span>Turnos usados</span>' +
                '<b>' + formatearNumero(metricas.turnos) + '</b>' +
              '</div>' +
            '</div>'
          : '<div class="note tl" style="margin-top:6px">' + ic('info') + '<div>Sin modelo activo</div></div>'
        ) +
      '</div>' +
      '<div class="card tight">' +
        '<label class="lbl">Parámetros de inferencia' +
          (activo ? ' · ' + esc((activo.nombre || activo.id).substring(0, 20)) : '') +
        '</label>' +
        '<div class="param">' +
          '<label>Temperatura</label>' +
          '<input class="inp" type="number" data-param="temperatura" min="0" max="2" step="0.05" value="' + tempVal + '">' +
        '</div>' +
        '<div class="param">' +
          '<label>Top-P</label>' +
          '<input class="inp" type="number" data-param="topP" min="0.1" max="1" step="0.05" value="' + topPVal + '">' +
        '</div>' +
        '<div class="param">' +
          '<label>Máx. tokens salida</label>' +
          '<input class="inp" type="number" data-param="maxTokens" min="1" max="' + maxOutMax + '" step="1" value="' + maxTokVal + '">' +
        '</div>' +
        '<div class="ctx-hint">' +
          '<span>' + ic('info') + 'Cada modelo guarda sus propios parámetros.</span>' +
        '</div>' +
        (activo ?
          '<button class="btn full" style="margin-top:10px" data-accion="configurar" data-id="' + esc(activo.id) + '">' +
            ic('settings') + 'Configuración avanzada' +
          '</button>'
          : '') +
      '</div>' +
      '<div class="card tight">' +
        '<label class="lbl">Modo de ejecución</label>' +
        '<div class="mode-row">' +
          modoCard('auto', 'Automático', 'Elige lo mejor') +
          modoCard('gpu',  'GPU',         'Máxima velocidad') +
          modoCard('cpu',  'CPU',         'Sin GPU dedicada') +
          modoCard('mixto','Mixto',       'GPU + CPU') +
        '</div>' +
      '</div>' +
    '</aside>';
  }

  function modoCard(id, n, d) {
    var on = ESTADO.modo === id;
    return '<button type="button" class="modecard' + (on ? ' on' : '') + '" data-modo="' + id + '"><b>' + esc(n) + '</b><small>' + esc(d) + '</small></button>';
  }

  async function abrirConfigModelo(id) {
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (!m) return;

    var r = await apiParamsModelo(id);
    var p = (r && r.ok && r.params) ? r.params : {
      temperature: 0.3, top_p: 0.9, top_k: 40, max_tokens: 512,
      n_threads: 6, n_ctx: m.contexto_tokens || 1024, n_gpu_layers: 0
    };

    var ctxTeorico = m.contexto_tokens || 4096;
    var outTeorico = m.max_output_tokens || 2048;
    
    var ramTotal = (ESTADO.hardware && ESTADO.hardware.ram_total_gb) || 8;
    var ramParaContexto = Math.max(2, ramTotal - 4); 
    var maxCtxPorRam = Math.floor((ramParaContexto / 0.5) * 1024);
    
    var ctxMax = Math.min(ctxTeorico, maxCtxPorRam);
    var outMax = Math.min(outTeorico, 8192);
    
    var maxOutUso = Math.min(p.max_tokens || 512, outMax);
    var ctxUso = Math.min(p.n_ctx || ctxMax, ctxMax);

    var notaRam = '';
    if (ctxTeorico > ctxMax) {
      notaRam = '<div class="note am" style="margin-bottom:14px;font-size:12px">' + ic('alert') + 
                '<div><b>Límite de seguridad:</b> El modelo soporta ' + formatearNumero(ctxTeorico) + 
                ' de contexto, pero tu RAM (' + ramTotal + ' GB) solo permite hasta ' + 
                formatearNumero(ctxMax) + '. Se ha ajustado automáticamente.</div></div>';
    }

    modal(
      '<h2>' + ic('settings') + ' Configurar: ' + esc(m.nombre || m.id) + '</h2>' +
      '<p class="lead" style="margin:8px 0 16px">Parámetros específicos de este modelo. Se guardan por separado y se aplican al activarlo.</p>' +
      notaRam +
      '<div class="cfg-grid">' +
        '<div class="cfg-item">' +
          '<label>Temperatura</label>' +
          '<input class="inp" type="number" id="cfg-temp" min="0" max="2" step="0.05" value="' + (p.temperature != null ? p.temperature : 0.3) + '">' +
          '<small>Creatividad: 0 = exacto, 2 = caótico</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>Top-P</label>' +
          '<input class="inp" type="number" id="cfg-topp" min="0.1" max="1" step="0.05" value="' + (p.top_p != null ? p.top_p : 0.9) + '">' +
          '<small>Nucleus sampling</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>Top-K</label>' +
          '<input class="inp" type="number" id="cfg-topk" min="1" max="200" step="1" value="' + (p.top_k != null ? p.top_k : 40) + '">' +
          '<small>Tokens candidatos por paso</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>Máx. tokens salida</label>' +
          '<input class="inp" type="number" id="cfg-maxtok" min="16" max="' + outMax + '" step="16" value="' + maxOutUso + '">' +
          '<small>Hasta ' + formatearNumero(outMax) + ' tokens</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>Contexto (n_ctx)</label>' +
          '<input class="inp" type="number" id="cfg-nctx" min="512" max="' + ctxMax + '" step="512" value="' + ctxUso + '">' +
          '<small>Hasta ' + formatearNumero(ctxMax) + ' tokens</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>Hilos (n_threads)</label>' +
          '<input class="inp" type="number" id="cfg-threads" min="1" max="16" step="1" value="' + (p.n_threads || 6) + '">' +
          '<small>Núcleos a usar</small>' +
        '</div>' +
        '<div class="cfg-item">' +
          '<label>GPU layers</label>' +
          '<input class="inp" type="number" id="cfg-gpu" min="0" max="99" step="1" value="' + (p.n_gpu_layers || 0) + '">' +
          '<small>0 = solo CPU</small>' +
        '</div>' +
      '</div>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cancelar</button>' +
        '<button class="btn p" id="cfgGuardar">' + ic('check') + 'Guardar</button>' +
      '</div>'
    );

    var btnG = $('#modal #cfgGuardar');
    if (btnG) btnG.onclick = async function () {
      var nuevos = {
        temperature: parseFloat($('#modal #cfg-temp').value) || 0.3,
        top_p: parseFloat($('#modal #cfg-topp').value) || 0.9,
        top_k: parseInt($('#modal #cfg-topk').value) || 40,
        max_tokens: parseInt($('#modal #cfg-maxtok').value) || 512,
        n_ctx: parseInt($('#modal #cfg-nctx').value) || 1024,
        n_threads: parseInt($('#modal #cfg-threads').value) || 6,
        n_gpu_layers: parseInt($('#modal #cfg-gpu').value) || 0,
      };
      nuevos.max_input_tokens = Math.max(1, nuevos.n_ctx - nuevos.max_tokens);
      PARAMS_MODELO[id] = nuevos;

      var resp = await apiGuardarParamsModelo(id, nuevos);
      if (resp.data && resp.data.ok) {
        toast('Configuración guardada.', 'check');
        cerrarModal();
        if (m.activo) {
          await refrescarModelos();
        } else {
          render();
        }
      } else {
        toast('Error al guardar config.', 'alert');
      }
    };
  }

  function iniciarPollingDescarga(id) {
    if (UI.pollings[id]) return;
    
    // Forzar render inmediato para que aparezca la barra al 1%
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (m) {
      m._descargando = true;
      m._progreso = 1;
      render();
    }
    
    UI.pollings[id] = setInterval(async function () {
      var prog = await apiProgreso(id);
      
      if (!prog || prog.estado === 'desconocido') return;
      
      var mm = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
      if (!mm) return;
      
      mm._progreso = prog.progreso || 0;
      mm._descargando = (prog.estado === 'descargando' || prog.estado === 'iniciando');
      
      UI.descargas[id] = { estado: prog.estado, progreso: prog.progreso || 0, mensaje: prog.mensaje || '' };
      
      // Actualizar solo el DOM de la barra (sin re-renderizar toda la lista)
      var item = document.querySelector('#mLista [data-id="' + id + '"]');
      if (item) {
        var bar = item.querySelector('.pbar > i');
        var pv = document.getElementById('pv-' + id);
        var pt = document.getElementById('pt-' + id);
        
        if (bar) bar.style.width = (prog.progreso || 0) + '%';
        if (pv) pv.textContent = (prog.progreso || 0) + '%';
        if (pt) pt.textContent = prog.mensaje || 'Descargando…';
      }
      
      if (prog.estado === 'completado' || prog.estado === 'error' || prog.estado === 'cancelado') {
        clearInterval(UI.pollings[id]);
        delete UI.pollings[id];
        
        if (prog.estado === 'completado') {
          toast('Descarga completada.', 'check');
        } else if (prog.estado === 'cancelado') {
          toast('Descarga cancelada.', 'x');
        } else {
          toast('Error en la descarga: ' + (prog.mensaje || ''), 'alert');
        }
        
        await refrescarModelos();
      }
    }, POLLING_MS);
  }

  async function descargarModelo(id) {
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    
    // Forzamos el estado visual inmediatamente
    m._descargando = true; 
    m._progreso = 1; 
    render();
    
    var r = await apiActivarModelo(id, null);
    
    // El backend devuelve {ok: true, estado: 'descargando'} con status 202
    var inicioDescarga = (r.status === 202) || (r.data && r.data.ok && r.data.estado === 'descargando');
    
    if (inicioDescarga) {
      toast('Descarga iniciada.', 'download');
      iniciarPollingDescarga(id);
    } 
    else if (r.data && r.data.ok && r.data.estado === 'activo') { 
      toast('Modelo activado.', 'check'); 
      await refrescarModelos(); 
    } 
    else { 
      toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert'); 
      m._descargando = false; 
      render(); 
    }
  }

  async function activarModelo(id) {
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    m._cargando = true; render();

    var paramsModelo = PARAMS_MODELO[id] || paramsActuales();
    var r = await apiActivarModelo(id, paramsModelo);

    m._cargando = false;
    if (r.status === 202) {
      toast('El modelo se está descargando.', 'download');
      m._descargando = true;
      iniciarPollingDescarga(id);
      render();
      return;
    }
    if (r.data && r.data.ok) {
      if (r.data.limites) UI.limites = r.data.limites;
      if (r.data.params) PARAMS_MODELO[id] = r.data.params;
      toast('Modelo activo: ' + (r.data.modelo || id), 'power');
      await refrescarModelos();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
      render();
    }
  }

  async function activarApiYRefrescar(prov, modelo) {
    if (!prov || !modelo) { toast('Faltan datos', 'alert'); return; }
    toast('Activando ' + modelo + '…', 'cloud');
    var r = await apiActivarApi(prov, modelo);
    if (r.data && r.data.ok) {
      if (r.data.limites) UI.limites = r.data.limites;
      if (r.data.params && r.data.info && r.data.info.id) {
        PARAMS_MODELO[r.data.info.id] = r.data.params;
      }
      toast('Modelo activo: ' + modelo, 'check');
      await refrescarModelos();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
    }
  }

  async function desactivarApi() {
    var r = await apiDesactivarApi();
    if (r.data && r.data.ok) {
      toast('Volviendo a modo local.', 'refresh');
      await refrescarModelos();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
    }
  }

  async function eliminarModeloApi(id) {
    var r = await apiEliminarModeloApi(id);
    if (r.data && r.data.ok) {
      toast('Modelo quitado del catálogo.', 'trash');
      await refrescarModelos();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
    }
  }

  async function volverAlPrincipal() {
    var r = await apiVolverAlPrincipal();
    if (r.data && r.data.ok) {
      if (r.data.limites) UI.limites = r.data.limites;
      if (r.data.params) PARAMS_MODELO['__principal__'] = r.data.params;
      toast('Modelo principal cargado.', 'home');
      await refrescarModelos();
    } else {
      toast('Error: ' + ((r.data && r.data.error) || 'No se pudo'), 'alert');
      render();
    }
  }

  async function cancelarDescarga(id) {
    // Detener el polling primero
    if (UI.pollings[id]) { 
      clearInterval(UI.pollings[id]); 
      delete UI.pollings[id]; 
    }
    
    // Actualizar estado visual inmediatamente
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (m) { 
      m._descargando = false; 
      m._progreso = 0; 
    }
    render();
    
    // Enviar cancelación al backend
    toast('Cancelando descarga…', 'x');
    try {
      var r = await apiCancelarDescarga(id);
      if (r.data && r.data.ok) {
        toast('Descarga cancelada.', 'x');
      } else {
        toast('No se pudo cancelar: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
      }
    } catch (e) {
      toast('Error cancelando descarga.', 'alert');
    }
    
    // Refrescar para reflejar el estado real del backend
    await refrescarModelos();
  }

  function verDetalles(id) {
    var m = ESTADO.modelos.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    if (m.es_api) {
      modal(
        '<h2>' + esc(m.nombre || m.id) + '</h2>' +
        '<p class="lead" style="margin:8px 0 14px">' + esc(m.descripcion || '') + '</p>' +
        '<div class="mfields">' +
          filaDetalle('Proveedor', m._api ? m._api.proveedor : '—') +
          filaDetalle('Modelo', m._api ? m._api.modelo : '—') +
          filaDetalle('Familia', m.familia || '—') +
          filaDetalle('Licencia', m.licencia || '—') +
          filaDetalle('Contexto', formatearNumero(m.contexto_tokens) + ' tok') +
          filaDetalle('Max salida', formatearNumero(m.max_output_tokens) + ' tok') +
          filaDetalle('Consumo RAM', 'Ninguno (remoto)') +
        '</div>' +
        '<div class="mact"><button class="btn gh" data-x>Cerrar</button></div>'
      );
      return;
    }
    var compat = calcularCompatibilidad(m);
    modal(
      '<h2>' + esc(m.nombre || m.id) + '</h2>' +
      (m.descripcion ? '<p class="lead" style="margin:8px 0 14px">' + esc(m.descripcion) + '</p>' : '') +
      '<div class="mfields">' +
        filaDetalle('ID', m.id) +
        (m.familia ? filaDetalle('Familia', m.familia) : '') +
        (m.licencia ? filaDetalle('Licencia', m.licencia) : '') +
        (m.tamano_gb ? filaDetalle('Tamaño', parseFloat(m.tamano_gb).toFixed(2) + ' GB') : '') +
        (m.contexto_tokens ? filaDetalle('Contexto', formatearNumero(m.contexto_tokens) + ' tok') : '') +
        (m.max_output_tokens ? filaDetalle('Max salida', formatearNumero(m.max_output_tokens) + ' tok') : '') +
        (compat.consumo > 0 ? filaDetalle('Consumo estimado', compat.consumo.toFixed(2) + ' GB') : '') +
        (compat.presupuesto > 0 ? filaDetalle('Presupuesto (RAM/' + UI.factorRAM + ')', compat.presupuesto.toFixed(2) + ' GB') : '') +
        (m.hf_repo ? filaDetalle('Hugging Face', m.hf_repo + ' / ' + (m.hf_file || '')) : '') +
        filaDetalle('Estado', m.descargado ? 'Instalado' : 'No instalado') +
        (m.ruta_modelo ? filaDetalle('Ruta', m.ruta_modelo) : '') +
      '</div>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cerrar</button>' +
        (!m.descargado && compat.apto ? '<button class="btn p" id="okDl">' + ic('download') + 'Descargar</button>' :
          (!m.activo && m.descargado ? '<button class="btn p" id="okAc">' + ic('play') + 'Usar este modelo</button>' :
            (m.activo ? '<button class="btn p" id="okPr">' + ic('chat') + 'Probar</button>' : ''))) +
      '</div>'
    );
    var dl = $('#modal #okDl'); if (dl) dl.onclick = function () { cerrarModal(); descargarModelo(id); };
    var ac = $('#modal #okAc'); if (ac) ac.onclick = function () { 
      cerrarModal(); 
      abrirChatPrueba(id); 
    };
    var pr = $('#modal #okPr'); if (pr) pr.onclick = function () { cerrarModal(); abrirChatPrueba(id); };
  }

  function filaDetalle(k, v) {
    return '<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px">' +
      '<span style="color:var(--dim)">' + esc(k) + '</span>' +
      '<b style="color:var(--white);font-weight:500;text-align:right;word-break:break-all">' + esc(v) + '</b>' +
    '</div>';
  }

  async function abrirModalInstalarHF(repo_id, nombre) {
    modal(
      '<h2>Instalar ' + esc(nombre || repo_id) + '</h2>' +
      '<p class="lead" style="margin:8px 0 0">Elegí el archivo <b>.gguf</b>. Se filtran los compatibles con tu RAM.</p>' +
      '<div id="hfFilesWrap"><div class="hf-loading"><div class="spinner"></div><span>Cargando archivos…</span></div></div>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cancelar</button>' +
        '<button class="btn p" id="hfInstalar" disabled>' + ic('download') + 'Instalar</button>' +
      '</div>'
    );
    var archivoSeleccionado = null;
    var r = await apiTiendaArchivos(repo_id);
    var wrap = $('#modal #hfFilesWrap');
    var btn  = $('#modal #hfInstalar');
    if (!wrap || !btn) return;
    if (!r.ok || !r.archivos || r.archivos.length === 0) {
      wrap.innerHTML = '<div class="note am">' + ic('info') + '<div>No se encontraron archivos .gguf.</div></div>';
      return;
    }
    var ramTotal = (ESTADO.hardware && ESTADO.hardware.ram_total_gb) || 0;
    var presupuesto = ramTotal / UI.factorRAM;
    r.archivos.sort(function (a, b) {
      var pa = /q4_k_m/i.test(a) ? 0 : /q4_k/i.test(a) ? 1 : 2;
      var pb = /q4_k_m/i.test(b) ? 0 : /q4_k/i.test(b) ? 1 : 2;
      return pa - pb || a.localeCompare(b);
    });
    var items = r.archivos.map(function (a, i) {
      var cuant = 'desconocida';
      var m = a.match(/(i?q\d+(?:_[a-z0-9]+)*)/i);
      if (m) cuant = m[1].toUpperCase();
      var factorCuant = 0.55;
      if (/IQ1/i.test(cuant)) factorCuant = 0.22;
      else if (/Q2/i.test(cuant)) factorCuant = 0.35;
      else if (/Q3/i.test(cuant)) factorCuant = 0.42;
      else if (/IQ4/i.test(cuant)) factorCuant = 0.50;
      else if (/Q4/i.test(cuant)) factorCuant = 0.55;
      else if (/Q5/i.test(cuant)) factorCuant = 0.68;
      else if (/Q6/i.test(cuant)) factorCuant = 0.78;
      else if (/Q8/i.test(cuant)) factorCuant = 1.00;
      var bMatch = a.match(/(\d+(?:\.\d+)?)B/i);
      var params = bMatch ? parseFloat(bMatch[1]) : 0;
      var tamanoEstimado = params > 0 ? params * factorCuant : 0;
      var apto = true, aviso = '';
      if (tamanoEstimado > 0 && presupuesto > 0) {
        var consumo = tamanoEstimado * 1.2;
        if (consumo > presupuesto) { apto = false; aviso = 'No compatible (~' + consumo.toFixed(1) + ' GB)'; }
        else if (consumo > presupuesto * 0.8) { aviso = 'Ajustado (~' + consumo.toFixed(1) + ' GB)'; }
        else { aviso = '~' + consumo.toFixed(1) + ' GB'; }
      }
      return '<div class="hf-file-item' + (i === 0 && apto ? ' on' : '') + (apto ? '' : ' incompatible') + '" data-file="' + esc(a) + '" data-apto="' + apto + '">' +
        '<code>' + esc(a) + '</code>' +
        '<div class="info">' +
          '<span class="chip xs">' + esc(cuant) + '</span>' +
          (aviso ? '<small>' + esc(aviso) + '</small>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    wrap.innerHTML = '<div class="hf-file-list">' + items + '</div>';
    var primerApto = $$('#modal .hf-file-item[data-apto="true"]')[0];
    if (primerApto) { archivoSeleccionado = primerApto.getAttribute('data-file'); btn.disabled = false; }
    $$('#modal .hf-file-item').forEach(function (el) {
      el.onclick = function () {
        if (el.getAttribute('data-apto') !== 'true') { toast('No compatible con tu RAM.', 'alert'); return; }
        $$('#modal .hf-file-item').forEach(function (x) { x.classList.remove('on'); });
        el.classList.add('on');
        archivoSeleccionado = el.getAttribute('data-file');
      };
    });
    btn.onclick = async function () {
      if (!archivoSeleccionado) return;
      btn.disabled = true; btn.innerHTML = ic('refresh') + 'Instalando…';
      var resp = await apiTiendaInstalar({ repo_id: repo_id, archivo: archivoSeleccionado, nombre: nombre || repo_id.split('/').pop() });
      if (resp.data && resp.data.ok) {
        cerrarModal(); toast('Instalación iniciada.', 'check');
        UI.tab = 'catalogo';
        await refrescarModelos();
        if (resp.data.modelo && resp.data.modelo.id) iniciarPollingDescarga(resp.data.modelo.id);
      } else {
        btn.disabled = false; btn.innerHTML = ic('download') + 'Instalar';
        toast('Error: ' + ((resp.data && resp.data.error) || 'desconocido'), 'alert');
      }
    };
  }

  async function abrirModalModelosApi(proveedor, nombreProv) {
    var guardados = {};
    ESTADO.modelos.forEach(function (m) {
      if (m.es_api && m._api && m._api.proveedor === proveedor) {
        guardados[m._api.modelo] = true;
      }
    });

    modal(
      '<h2>' + esc(nombreProv) + ' - Modelos disponibles</h2>' +
      '<p class="lead" style="margin:8px 0 0">Elegí uno o varios. Se marcan los que NO son de chat.</p>' +
      '<div id="apiModelosWrap"><div class="hf-loading"><div class="spinner"></div><span>Cargando modelos...</span></div></div>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cerrar</button>' +
        '<button class="btn p" id="apiModeloActivar" disabled>' + ic('plus') + 'Añadir al catálogo</button>' +
      '</div>'
    );

    var seleccionado = null;
    var r = await apiListarModelos(proveedor);
    var wrap = $('#modal #apiModelosWrap');
    var btn  = $('#modal #apiModeloActivar');
    if (!wrap || !btn) return;

    if (!r.ok || !r.modelos || r.modelos.length === 0) {
      wrap.innerHTML = '<div class="note am">' + ic('info') + '<div>No se pudieron listar modelos del proveedor.</div></div>';
      return;
    }

    function renderItems() {
      var html = r.modelos.map(function (m) {
        var ya = guardados[m.id];
        var esChat = m.es_chat !== false;
        return '<div class="api-modelo-item' +
            (ya ? ' guardado' : '') +
            (!esChat ? ' no-chat' : '') +
            '" data-modelo="' + esc(m.id) + '" data-chat="' + esChat + '">' +
          '<code>' + esc(m.id) + '</code>' +
          '<div class="acc">' +
            (ya
              ? '<span class="chip gr xs">' + ic('check') + 'En catálogo</span>'
              : (!esChat
                  ? '<span class="chip am xs">' + ic('alert') + 'No es de chat</span>'
                  : '<small>' + formatearNumero(m.contexto_tokens) + ' ctx · ' + formatearNumero(m.max_output_tokens) + ' max</small>')) +
          '</div>' +
        '</div>';
      }).join('');
      wrap.innerHTML = '<div class="api-modelos-list">' + html + '</div>';

      var items = $$('#modal .api-modelo-item');
      items.forEach(function (el) {
        var idModelo = el.getAttribute('data-modelo');
        var esChat = el.getAttribute('data-chat') === 'true';
        el.onclick = function () {
          if (guardados[idModelo]) {
            toast('Este modelo ya está en tu catálogo.', 'info');
            return;
          }
          if (!esChat) {
            toast('Este modelo no es de chat. Elegí otro.', 'alert');
            return;
          }
          items.forEach(function (x) { x.classList.remove('on'); });
          el.classList.add('on');
          seleccionado = idModelo;
          btn.disabled = false;
        };
      });
    }

    renderItems();

    btn.onclick = async function () {
      if (!seleccionado) return;
      var modeloAAnadir = seleccionado;
      btn.disabled = true;
      btn.innerHTML = ic('refresh') + 'Añadiendo...';

      var resp = await apiActivarApi(proveedor, modeloAAnadir);
      if (resp.data && resp.data.ok) {
        guardados[modeloAAnadir] = true;
        toast('Modelo añadido: ' + modeloAAnadir, 'check');
        seleccionado = null;
        btn.innerHTML = ic('plus') + 'Añadir al catálogo';
        await refrescarModelos();
        var m2 = $('#modal');
        if (m2 && !m2.hidden) {
          var btnNuevo = $('#modal #apiModeloActivar');
          var wrapNuevo = $('#modal #apiModelosWrap');
          if (btnNuevo && wrapNuevo) {
            btn = btnNuevo;
            wrap = wrapNuevo;
            btn.disabled = true;
            btn.innerHTML = ic('plus') + 'Añadir al catálogo';
            btn.onclick = arguments.callee;
            renderItems();
          }
        }
      } else {
        btn.disabled = false;
        btn.innerHTML = ic('plus') + 'Añadir al catálogo';
        toast('Error: ' + ((resp.data && resp.data.error) || 'desconocido'), 'alert');
      }
    };
  }

  function abrirChatPrueba(modeloIdFijo) {
    var nombreModelo = modeloIdFijo || 'activo';
    if (modeloIdFijo) {
      var m = ESTADO.modelos.filter(function (x) { return x.id === modeloIdFijo; })[0];
      if (m) nombreModelo = m.nombre || m.id;
    }

    var html =
      '<div class="chat-header">' +
        '<span class="avatar">' + ic('brain') + '</span>' +
        '<div class="info">' +
          '<b>MÍA · ' + (modeloIdFijo ? 'Prueba: ' + esc(nombreModelo) : 'Asistente') + '</b>' +
          '<small><span class="dot"></span>' + (modeloIdFijo ? 'Modo prueba (no cambia el principal)' : 'En línea') + '</small>' +
        '</div>' +
        '<div class="acciones">' +
          '<button class="icon-btn" id="chatLimpiar" title="Limpiar historial">' + ic('refresh') + '</button>' +
          '<button class="icon-btn" data-x title="Cerrar">' + ic('x') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="chat-body" id="chatBody">' +
        '<div class="chat-sys">' + (modeloIdFijo ? 'Probando modelo: ' + esc(nombreModelo) : 'Modelo cargado. Escribí tu primer mensaje') + '</div>' +
      '</div>' +
      '<div id="chatImagePreview" style="display:none;padding:8px 16px;background:var(--card);border-top:1px solid var(--line);align-items:center;gap:10px">' +
        '<img id="chatImageThumb" alt="Vista previa de imagen" style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">' +
        '<span id="chatImageName" style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1"></span>' +
        '<button type="button" class="icon-btn" id="chatImageRemove" title="Quitar imagen">' + ic('x') + '</button>' +
      '</div>' +
      '<div class="chat-composer">' +
        '<input id="chatImageFile" type="file" accept="image/*" style="display:none">' +
        '<button type="button" class="icon-btn" id="chatImageAttach" title="Adjuntar imagen" aria-label="Adjuntar imagen">' + ic('image') + '</button>' +
        '<textarea class="inp" id="chatInput" rows="1" placeholder="Escribí un mensaje…" autocomplete="off"></textarea>' +
        '<button class="send-btn" id="chatSend" title="Enviar">' + ic('send') + '</button>' +
      '</div>';

    var m = $('#modal'); if (!m) return;
    var b = $('.mbox', m);
    b.className = 'mbox chat-modal';
    b.innerHTML = html;
    m.hidden = false;

    var input   = $('#chatInput');
    var send    = $('#chatSend');
    var body    = $('#chatBody');
    var limpiar = $('#chatLimpiar');
    var imageFile = $('#chatImageFile');
    var imageAttach = $('#chatImageAttach');
    var imagePreview = $('#chatImagePreview');
    var imageThumb = $('#chatImageThumb');
    var imageName = $('#chatImageName');
    var imageRemove = $('#chatImageRemove');
    var imagenAdjunta = '';
    var nombreImagen = '';

    function limpiarImagenAdjunta() {
      imagenAdjunta = '';
      nombreImagen = '';
      if (imageFile) imageFile.value = '';
      if (imagePreview) imagePreview.style.display = 'none';
      if (imageThumb) imageThumb.removeAttribute('src');
      if (imageName) imageName.textContent = '';
    }

    if (imageAttach && imageFile) imageAttach.onclick = function () { imageFile.click(); };
    if (imageFile) imageFile.onchange = function () {
      var file = imageFile.files && imageFile.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        limpiarImagenAdjunta();
        toast('Seleccioná un archivo de imagen válido.', 'alert');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        limpiarImagenAdjunta();
        toast('La imagen supera el límite de 10 MB.', 'alert');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        if (typeof reader.result !== 'string') {
          toast('No se pudo leer la imagen.', 'alert');
          return;
        }
        imagenAdjunta = reader.result;
        nombreImagen = file.name || 'imagen';
        if (imageThumb) imageThumb.src = imagenAdjunta;
        if (imageName) imageName.textContent = nombreImagen;
        if (imagePreview) imagePreview.style.display = 'flex';
      };
      reader.onerror = function () { toast('Error al leer la imagen.', 'alert'); };
      reader.readAsDataURL(file);
    };
    if (imageRemove) imageRemove.onclick = limpiarImagenAdjunta;

    if (input) {
      setTimeout(function () { input.focus(); }, 60);
      input.addEventListener('input', function () {
        input.style.height = 'auto';
        input.style.height = Math.min(140, input.scrollHeight) + 'px';
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          enviarChat();
        }
      });
    }

    if (send) send.onclick = enviarChat;
    if (limpiar) limpiar.onclick = function () {
      if (body) body.innerHTML = '<div class="chat-sys">Historial limpiado.</div>';
      apiFetch('/api/reiniciar', { method: 'POST', body: JSON.stringify({}) });
    };

    function horaActual() {
      var d = new Date();
      var h = d.getHours();
      var m2 = d.getMinutes();
      var am = h < 12 ? 'AM' : 'PM';
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + (m2 < 10 ? '0' : '') + m2 + ' ' + am;
    }

    function scrollAbajo() {
      if (body) body.scrollTop = body.scrollHeight;
    }

    function agregarMensaje(rol, texto) {
      if (!body) return;
      var row = document.createElement('div');
      row.className = 'chat-row ' + (rol === 'user' ? 'user' : 'bot');

      var av = document.createElement('div');
      av.className = 'mini-av';
      if (rol === 'bot') av.innerHTML = ic('brain');
      else av.textContent = 'TÚ';

      var wrap = document.createElement('div');
      wrap.className = 'bubble-wrap';

      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = texto;

      var time = document.createElement('div');
      time.className = 'chat-time';
      time.textContent = horaActual();

      wrap.appendChild(bubble);
      wrap.appendChild(time);
      row.appendChild(av);
      row.appendChild(wrap);
      body.appendChild(row);
      scrollAbajo();
    }

    function agregarEscribiendo() {
      if (!body) return null;
      var row = document.createElement('div');
      row.className = 'chat-row bot';
      row.id = 'typingRow';

      var av = document.createElement('div');
      av.className = 'mini-av';
      av.innerHTML = ic('brain');

      var wrap = document.createElement('div');
      wrap.className = 'bubble-wrap';

      var typing = document.createElement('div');
      typing.className = 'chat-typing';
      typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

      wrap.appendChild(typing);
      row.appendChild(av);
      row.appendChild(wrap);
      body.appendChild(row);
      scrollAbajo();
      return row;
    }

    async function enviarChat() {
      if (!input) return;
      var texto = (input.value || '').trim();
      if (!texto && !imagenAdjunta) return;
      var textoVisible = texto || ('Analizá esta imagen: ' + (nombreImagen || 'imagen adjunta'));
      var imagenParaEnviar = imagenAdjunta;

      var modeloIdActual = modeloIdFijo || (ESTADO.modelos.filter(function (x) { return x.activo; })[0] || {}).id || '__principal__';

      input.value = '';
      input.style.height = 'auto';
      if (send) send.disabled = true;
      if (imageAttach) imageAttach.disabled = true;

      agregarMensaje('user', textoVisible);
      var typingRow = agregarEscribiendo();
      limpiarImagenAdjunta();

      var r = await apiChat(texto || 'Describe y analiza la imagen adjunta.', '', modeloIdActual, imagenParaEnviar);

      var reply = (r.data && r.data.reply)
        ? r.data.reply
        : ('Error: ' + ((r.data && r.data.error) || 'sin respuesta'));

      if (typingRow && body) body.removeChild(typingRow);
      agregarMensaje('bot', reply);

      if (send) send.disabled = false;
      if (imageAttach) imageAttach.disabled = false;
      if (input) input.focus();

      setTimeout(function () {
        cargarHardwareVivo();
        cargarMetricasPorModelo().then(function () {
          if (UI.tab === 'catalogo' || UI.tab === 'hardware') render();
        });
      }, 400);
    }
  }

  async function refrescarModelos() {
    var data = await apiModelos();
    var modelos = data.modelos;
    ESTADO.hardware = data.hardware;

    modelos.forEach(function (m) {
      var local = ESTADO.modelos.filter(function (x) { return x.id === m.id; })[0];
      if (local) {
        // Preservar estado de descarga local si el polling está activo
        if (UI.pollings[m.id]) {
          m._descargando = local._descargando;
          m._progreso = local._progreso;
        }
        m._cargando = local._cargando;
      }
      if (m.params_guardados) {
        PARAMS_MODELO[m.id] = m.params_guardados;
      }
    });
    ESTADO.modelos = modelos;

    var est = await apiEstado();
    if (est) {
      UI.modeloActivoInfo = est.info && est.info.modelo ? est.info.modelo : null;
      UI.apiActiva = est.api || null;
      if (est.limites) UI.limites = est.limites;
      if (est.metricas) UI.metricas = est.metricas;
    }

    var activo = modelos.filter(function (m) { return m.activo; })[0];
    if (activo) {
      var p = PARAMS_MODELO[activo.id];
      if (p) {
        if (p.temperature != null) ESTADO.temperatura = p.temperature;
        if (p.top_p != null) ESTADO.topP = p.top_p;
        if (p.max_tokens != null) ESTADO.maxTokens = p.max_tokens;
      }
    }

    await cargarMetricasPorModelo();
    render();
  }

  async function buscarTiendaHF(query) {
    UI.hfQuery = query || '';
    UI.hfCargando = true;
    UI.hfError = null;
    render();
    var r = await apiTiendaBuscar(UI.hfQuery, 40);
    UI.hfCargando = false;
    if (r.ok) UI.hfResultados = r.modelos || [];
    else { UI.hfError = r.error || 'Error buscando modelos.'; UI.hfResultados = []; }
    render();
  }

  async function cargarEstadoAPIs() {
    if (UI.proveedores.length === 0) await apiCargarProveedores();
    var r = await apiListarKeys();
    if (r && r.ok) {
      UI.apiKeys = r.proveedores || {};
      UI.apiActiva = r.api_activa || null;
    } else {
      UI.apiKeys = {};
      UI.apiActiva = null;
    }
  }

  async function cargarMetricasPorModelo() {
    try {
      var data = await apiMetricas();
      if (data && data.ok) {
        METRICAS_MODELO = data.por_modelo || {};
        if (data.metricas) UI.metricas = data.metricas;
      }
    } catch (e) {}
  }

  function iniciarPollingHardware() {
    detenerPollingHardware();
    cargarHardwareVivo();
    UI._hwPoll = setInterval(cargarHardwareVivo, POLLING_HW_MS);
  }
  function detenerPollingHardware() {
    if (UI._hwPoll) { clearInterval(UI._hwPoll); UI._hwPoll = null; }
  }

  async function cargarHardwareVivo() {
    try {
      var data = await apiHardwareVivo();
      if (!data || !data.ok) return;
      UI.hardwareVivo = data;
      if (data.hardware) ESTADO.hardware = data.hardware;
      if (data.metricas) UI.metricas = data.metricas;
      if (data.params) {
        ESTADO.temperatura = data.params.temperature || ESTADO.temperatura;
        ESTADO.topP = data.params.top_p || ESTADO.topP;
        if (data.params.max_tokens) ESTADO.maxTokens = data.params.max_tokens;
      }
      if (UI.tab === 'hardware') {
        actualizarValoresVivos(data);
      }
    } catch (e) {}
  }

  function actualizarValoresVivos(data) {
    var hw = data.hardware;
    if (!hw) return;
    actualizarBarra('hw-cpu-bar', 'hw-cpu-val', hw.cpu_uso_pct, 100, true);
    actualizarBarra('hw-ram-bar', 'hw-ram-pct', hw.ram_uso_pct, 100, true);

    var ramVal = document.getElementById('hw-ram-val');
    var ramSub = document.getElementById('hw-ram-sub');
    if (ramVal) ramVal.textContent = hw.ram_total_gb + ' GB';
    if (ramSub) ramSub.textContent = hw.ram_disponible_gb + ' GB disponibles';

    actualizarBarra('hw-disco-bar', 'hw-disco-pct', hw.disco_uso_pct, 100, true);
    var discoVal = document.getElementById('hw-disco-val');
    if (discoVal) discoVal.textContent = hw.disco_libre_gb + ' GB libres';
  }

  function actualizarBarra(barId, valId, valor, max, cambiarColor) {
    var bar = document.getElementById(barId);
    var val = document.getElementById(valId);
    var v = (typeof valor === 'number') ? valor : 0;
    var pct = Math.min(100, Math.max(0, (v / max) * 100));
    if (bar) {
      bar.style.width = pct.toFixed(1) + '%';
      if (cambiarColor) {
        var parent = bar.parentElement;
        if (parent) {
          var cls = 'bar';
          if (pct > 85) cls += ' crit';
          else if (pct > 70) cls += ' warn';
          parent.className = cls;
        }
      }
    }
    if (val) {
      val.textContent = (typeof valor === 'number' ? valor.toFixed(1) : valor) + '%';
    }
  }

  async function conectarProveedor(provId) {
    var input = document.querySelector('[data-key-input="' + provId + '"]');
    if (!input) return;
    var key = (input.value || '').trim();
    if (!key) { toast('Pegá tu API key primero.', 'alert'); return; }

    UI.apiVerificando[provId] = true;
    render();

    var valid = await apiValidarKey(provId, key);
    if (!valid.data || !valid.data.ok) {
      UI.apiVerificando[provId] = false;
      UI.apiKeysTemp[provId] = key;
      render();
      toast('API key inválida: ' + ((valid.data && valid.data.error) || 'no se pudo validar'), 'alert');
      return;
    }
    var guardar = await apiGuardarKey(provId, key);
    UI.apiVerificando[provId] = false;
    if (guardar.data && guardar.data.ok) {
      UI.apiKeys[provId] = { conectado: true, validado: true };
      delete UI.apiKeysTemp[provId];
      toast('Proveedor conectado.', 'check');
      await cargarEstadoAPIs();
      await refrescarModelos();
    } else {
      toast('Error al guardar: ' + ((guardar.data && guardar.data.error) || 'desconocido'), 'alert');
    }
    render();
  }

  var _eliminando = {};

  function confirmarDesconectar(provId) {
    if (_eliminando[provId]) return;
    var prov = UI.proveedores.filter(function (p) { return p.id === provId; })[0];
    var nombre = prov ? prov.n : provId;
    modal(
      '<h2>¿Desconectar ' + esc(nombre) + '?</h2>' +
      '<p class="lead" style="margin:8px 0 0">Se eliminará la API key guardada. Los modelos añadidos al catálogo se mantienen.</p>' +
      '<div class="mact">' +
        '<button class="btn gh" data-x>Cancelar</button>' +
        '<button class="btn d" id="okDesc">' + ic('trash') + 'Desconectar</button>' +
      '</div>'
    );
    var ok = $('#modal #okDesc');
    if (ok) ok.onclick = function () {
      cerrarModal();
      desconectarProveedor(provId);
    };
  }

  async function desconectarProveedor(provId) {
    if (_eliminando[provId]) return;
    _eliminando[provId] = true;
    try {
      var r = await apiEliminarKey(provId);
      if (r.data && r.data.ok) {
        UI.apiKeys[provId] = { conectado: false, validado: false, modelos_guardados: 0 };
        delete UI.apiKeysTemp[provId];
        if (UI.apiActiva && UI.apiActiva.proveedor === provId) UI.apiActiva = null;
        toast('Proveedor desconectado.', 'trash');
        await cargarEstadoAPIs();
        await refrescarModelos();
      } else {
        toast('Error: ' + ((r.data && r.data.error) || 'desconocido'), 'alert');
      }
    } finally {
      delete _eliminando[provId];
    }
    render();
  }

  async function verificarProveedor(provId) {
    UI.apiVerificando[provId] = true;
    render();
    var r = await apiValidarKey(provId, '');
    UI.apiVerificando[provId] = false;
    if (r.data && r.data.ok) toast('API key válida.', 'check');
    else toast('Error: ' + ((r.data && r.data.error) || 'no válida'), 'alert');
    render();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-x]')) { cerrarModal(); return; }
    var m = $('#modal');
    if (m && !m.hidden && e.target === m) { cerrarModal(); return; }

    var tab = e.target.closest('[data-tab]');
    if (tab) {
      UI.tab = tab.getAttribute('data-tab');
      render();
      if (UI.tab === 'tienda' && UI.tiendaTab === 'modelos' && !UI.hfAutoCargado && UI.hfResultados.length === 0) {
        UI.hfAutoCargado = true;
        buscarTiendaHF('');
      }
      if (UI.tab === 'tienda' && UI.tiendaTab === 'api' && !UI.apiAutoCargado) {
        UI.apiAutoCargado = true;
        cargarEstadoAPIs().then(render);
      }
      if (UI.tab === 'hardware') {
        cargarHardwareVivo();
      }
      return;
    }

    var sub = e.target.closest('[data-subtab]');
    if (sub) {
      UI.tiendaTab = sub.getAttribute('data-subtab');
      render();
      if (UI.tiendaTab === 'modelos' && !UI.hfAutoCargado && UI.hfResultados.length === 0) {
        UI.hfAutoCargado = true;
        buscarTiendaHF('');
      }
      if (UI.tiendaTab === 'api' && !UI.apiAutoCargado) {
        UI.apiAutoCargado = true;
        cargarEstadoAPIs().then(render);
      }
      return;
    }

    var hfFiltro = e.target.closest('[data-hf-filtro]');
    if (hfFiltro) { UI.hfFiltro = hfFiltro.getAttribute('data-hf-filtro'); render(); return; }

    var apiFiltro = e.target.closest('[data-api-filtro]');
    if (apiFiltro) { UI.apiFiltro = apiFiltro.getAttribute('data-api-filtro'); render(); return; }

    var modo = e.target.closest('[data-modo]');
    if (modo) {
      ESTADO.modo = modo.getAttribute('data-modo');
      render(); apiSincronizarParams();
      toast('Modo ' + ESTADO.modo + ' activado.', 'cpu');
      return;
    }

    var b = e.target.closest('[data-accion]');
    if (!b) return;

    var a = b.getAttribute('data-accion');
    var id = b.getAttribute('data-id');
    var repo = b.getAttribute('data-repo');
    var nombre = b.getAttribute('data-nombre');
    var prov = b.getAttribute('data-prov');
    var modelo = b.getAttribute('data-modelo');

    if (a === 'descargar')       descargarModelo(id);
    else if (a === 'activar')    abrirChatPrueba(id);
    else if (a === 'detalles')   verDetalles(id);
    else if (a === 'configurar') abrirConfigModelo(id);
    else if (a === 'cancelar')   cancelarDescarga(id);
    else if (a === 'probar')     abrirChatPrueba();
    else if (a === 'volver-principal') volverAlPrincipal();
    else if (a === 'refrescar')  { toast('Refrescando…', 'refresh'); refrescarModelos(); }
    else if (a === 'detener-activo') toast('Modelo detenido.', 'power');
    else if (a === 'hf-buscar')   buscarTiendaHF($('#hfQuery') ? $('#hfQuery').value : '');
    else if (a === 'hf-populares') buscarTiendaHF('');
    else if (a === 'hf-instalar') abrirModalInstalarHF(repo, nombre);
    else if (a === 'api-refrescar')  { cargarEstadoAPIs().then(render); toast('Estado refrescado.', 'refresh'); }
    else if (a === 'api-conectar')   conectarProveedor(prov);
    else if (a === 'api-desconectar') confirmarDesconectar(prov);
    else if (a === 'api-verificar')  verificarProveedor(prov);
    else if (a === 'api-limpiar')    { UI.apiQuery = ''; render(); }
    else if (a === 'api-ver-modelos') abrirModalModelosApi(prov, nombre);
    else if (a === 'activar-api-directo') activarApiYRefrescar(prov, modelo);
    else if (a === 'desactivar-api') desactivarApi();
    else if (a === 'eliminar-api') eliminarModeloApi(id);
    else if (a === 'eliminar-descargado') {
      modal(
        '<h2>¿Eliminar modelo descargado?</h2>' +
        '<p class="lead" style="margin:8px 0 0">Se borrarán los archivos del modelo de tu disco duro y se quitará del catálogo.</p>' +
        '<div class="mact">' +
          '<button class="btn gh" data-x>Cancelar</button>' +
          '<button class="btn d" id="okDelModel">' + ic('trash') + 'Eliminar completamente</button>' +
        '</div>'
      );
      var okBtn = document.getElementById('okDelModel');
      if (okBtn) {
        okBtn.onclick = async function () {
          cerrarModal();
          toast('Eliminando modelo del disco...', 'refresh');
          var resp = await apiEliminarModeloDescargado(id);
          if (resp.data && resp.data.ok) {
            toast('Modelo eliminado completamente.', 'trash');
            await refrescarModelos();
          } else {
            toast('Error al eliminar: ' + ((resp.data && resp.data.error) || 'desconocido'), 'alert');
          }
        };
      }
    }
    else if (a === 'prompt-abrir') {
      abrirModalPrompt(id, b.getAttribute('data-es-api') === '1', b.getAttribute('data-nombre') || id);
    }
    else if (a === 'prompt-guardar') {
      guardarPromptActivo(id, b.getAttribute('data-es-api') === '1');
    }
    else if (a === 'prompt-eliminar') {
      eliminarPromptActivo(id, b.getAttribute('data-es-api') === '1');
    }
    else if (a === 'prompt-eliminar-modal') {
      var idDel = id;
      var esApiDel = b.getAttribute('data-es-api') === '1';
      cerrarModal();
      setTimeout(function () {
        eliminarPromptActivo(idDel, esApiDel);
      }, 120);
    }
    else if (a === 'prompt-vaciar') {
      var ta2 = document.getElementById('promptTexto');
      if (ta2) { ta2.value = ''; actualizarInfoPrompt(); ta2.focus(); }
    }
  });

  function bind() {
    $$('[data-key-input]').forEach(function (input) {
      var provId = input.getAttribute('data-key-input');
      input.addEventListener('input', function (e) {
        UI.apiKeysTemp[provId] = e.target.value;
      });
    });

    var apiQ = $('#apiQuery');
    if (apiQ) {
      apiQ.addEventListener('input', function (e) {
        UI.apiQuery = e.target.value;
        render();
        var nuevo = $('#apiQuery');
        if (nuevo) {
          nuevo.focus();
          try { nuevo.setSelectionRange(nuevo.value.length, nuevo.value.length); } catch (err) {}
        }
      });
    }

    var hfq = $('#hfQuery');
    if (hfq) {
      hfq.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); buscarTiendaHF(hfq.value); }
      });
    }

    $$('[data-param]').forEach(function (i) {
      i.oninput = i.onchange = function () {
        var k = i.getAttribute('data-param');
        var v = parseFloat(i.value);
        if (isNaN(v)) return;
        var activo = ESTADO.modelos.filter(function (m) { return m.activo; })[0];
        if (!activo) return;

        var p = PARAMS_MODELO[activo.id] || {};
        if (k === 'temperatura') { ESTADO.temperatura = v; p.temperature = v; }
        else if (k === 'topP') { ESTADO.topP = v; p.top_p = v; }
        else if (k === 'maxTokens') {
          var maxOut = UI.limites.max_output_tokens || 2048;
          var vv = Math.min(v, maxOut);
          ESTADO.maxTokens = vv;
          p.max_tokens = vv;
        }
        PARAMS_MODELO[activo.id] = p;
        apiSincronizarParams();
      };
    });
  }

  function render() {
    var cont = document.getElementById('view');
    if (!cont) return;
    try {
      cont.innerHTML = '<div class="fade">' + vistaAsistente() + '</div>';
    } catch (e) {
      console.error('Error render:', e);
      cont.innerHTML = '<div class="note rd" style="margin:20px">' + ic('alert') +
        '<div>Error renderizando la vista: <b>' + esc(e.message) + '</b></div></div>';
    }
    bind();

    if (UI.tab === 'hardware') {
      iniciarPollingHardware();
    } else {
      detenerPollingHardware();
    }
  }

  async function init() {
    render();
    await refrescarModelos();
    try {
      var disp = await apiTiendaDisponible();
      UI.hfDisponible = !(disp && disp.hf_api === false);
    } catch (e) { UI.hfDisponible = true; }
    try { await apiCargarProveedores(); } catch (e) {}
    try { await cargarEstadoAPIs(); } catch (e) {}
    try { await cargarHardwareVivo(); } catch (e) {}
    try { await cargarMetricasPorModelo(); } catch (e) {}

    if (!UI.hfAutoCargado && UI.hfDisponible) {
      UI.hfAutoCargado = true;
      buscarTiendaHF('');
    } else {
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'MODULE_READY', module: 'asistente' }, []);
    }
  } catch (e) {}

})();