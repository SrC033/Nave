(function () {
'use strict';

// --- Utilidades ---
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2800);
}
function cerrarModal() {
  const m = $('#modal');
  if (!m) return;
  m.hidden = true;
  const b = $('#modal .mbox');
  if (b) b.innerHTML = '';
}
function ini(nombre) {
  return String(nombre || '').split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

// --- Config API ---
const API_BASE = 'http://127.0.0.1:8000';

function getUsuarioActual() {
  try { const u = localStorage.getItem('naveia_usuario'); if (u) return u; } catch (_) {}
  try { const s = sessionStorage.getItem('usuario_id'); if (s) return s; } catch (_) {}
  return 'admin@coreteks.com';
}

async function apiFetch(path, opts = {}) {
  const uid = getUsuarioActual();
  const headers = { 'Content-Type': 'application/json', 'X-Usuario-Id': uid, ...(opts.headers || {}) };
  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify({ ...opts.body, usuario_id: uid });
  }
  const method = (opts.method || 'GET').toUpperCase();
  if (method === 'GET') {
    path += (path.includes('?') ? '&' : '?') + 'usuario_id=' + encodeURIComponent(uid);
  }
  try {
    const resp = await fetch(API_BASE + path, { ...opts, headers });
    const data = await resp.json();
    return { status: resp.status, ok: resp.ok, data };
  } catch (e) {
    console.error('API Error:', e);
    return { status: 0, ok: false, data: { error: 'Error de conexión con el servidor' } };
  }
}

// --- Estado ---
const UI = {
  tab: 'buzones',
  vistaBuzon: 'lista',
  corteFil: 'pend',
  correos: [],
  buzones: [],
  correoSeleccionado: null,
  buzonActivo: null,
  autoRefreshInterval: null,
  modoHTML: false
};

// --- Render ---

function renderTabs() {
  const cBz = $('#tab-count-buzones');
  if (cBz) cBz.textContent = UI.buzones.length;

  $$('.setab').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const vBz = $('#view-buzones');
  const vAn = $('#view-analisis');
  if (vBz) vBz.hidden = UI.tab !== 'buzones';
  if (vAn) vAn.hidden = UI.tab !== 'analisis';

  const pLista = $('#bz-pantalla');
  const pCorreos = $('#bz-correos');
  if (pLista) pLista.hidden = UI.vistaBuzon !== 'lista';
  if (pCorreos) pCorreos.hidden = UI.vistaBuzon !== 'correos';
}

function renderBuzones() {
  const wrap = $('#bzwrap');
  if (!wrap) return;

  if (UI.buzones.length === 0) {
    wrap.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      Todavía no conectaste ningún buzón. Tocá el botón superior para conectar uno.
    </div>`;
    return;
  }

  wrap.innerHTML = UI.buzones.map(b => `
    <article class="bzcard" data-id="${esc(b.id)}">
      <div class="bzhd">
        <span class="bzico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </span>
        <div class="bzt">
          <b class="bzdir">${esc(b.dir)}</b>
          <small class="bzprv">${esc(b.prov === 'google' ? 'Gmail / Google Workspace' : b.prov === 'microsoft' ? 'Microsoft 365' : 'IMAP')}</small>
        </div>
        <span class="chip xs gr">Conectado</span>
      </div>
      <dl class="bzmeta">
        <div><dt>Última sincronización</dt><dd>${b.ult ? new Date(b.ult).toLocaleString() : 'Nunca'}</dd></div>
        <div><dt>Correos sincronizados</dt><dd>${b.n || 0}</dd></div>
      </dl>
      <div class="bzacts">
        <button class="btn sm" data-action="sync" data-id="${esc(b.id)}" title="Sincronizar" aria-label="Sincronizar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
        <button class="btn sm gh" data-action="desc" data-id="${esc(b.id)}" title="Desconectar" aria-label="Desconectar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/></svg>
        </button>
      </div>
    </article>
  `).join('');
}

function renderCorte() {
  // 1. Contar para las pestañas
  const countPend = UI.correos.filter(c => c.estado === 'pendiente').length;
  const countRecibidos = UI.correos.filter(c => c.estado === 'pendiente' || c.estado === 'recibido').length;
  const countEnviados = UI.correos.filter(c => c.estado === 'enviado').length;
  
  const sPend = $('#count-pend'); if (sPend) sPend.textContent = countPend;
  const sRecibidos = $('#count-recibidos'); if (sRecibidos) sRecibidos.textContent = countRecibidos;
  const sEnviados = $('#count-enviados'); if (sEnviados) sEnviados.textContent = countEnviados;

  $$('#corte-tabs .tab').forEach(b => b.classList.toggle('on', b.dataset.cf === UI.corteFil));

  // 2. Filtrar según la pestaña activa
  let lista = [];
  if (UI.corteFil === 'pend') {
    lista = UI.correos.filter(c => c.estado === 'pendiente');
  } else if (UI.corteFil === 'recibidos') {
    lista = UI.correos.filter(c => c.estado === 'pendiente' || c.estado === 'recibido');
  } else if (UI.corteFil === 'enviados') {
    lista = UI.correos.filter(c => c.estado === 'enviado');
  }

  // 3. Ordenar: Los más recientes primero
  lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const container = $('#correos-list');
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      No hay correos en esta bandeja.
    </div>`;
    return;
  }

  container.innerHTML = lista.map(c => `
    <article class="card mailc ${UI.correoSeleccionado === c.id ? 'sel' : ''}" data-id="${esc(c.id)}">
      <div class="rowb">
        <div class="mfrom">
          <span class="av s">${esc(ini(c.de))}</span>
          <div><b>${esc(c.de)}</b><small>${esc(c.para || '')}</small></div>
        </div>
        ${c.estado === 'pendiente' ? '<span class="chip am">Requiere tu decisión</span>' : ''}
        ${c.estado === 'recibido' ? '<span class="chip gr">Recibido</span>' : ''}
        ${c.estado === 'enviado' ? '<span class="chip vi">Enviado</span>' : ''}
      </div>
      <h3 class="mt">${esc(c.t)}</h3>
      <p class="mp">${esc(c.p)}</p>
      <div class="macts">
        <button class="btn p sm" data-action="ver" data-id="${esc(c.id)}" title="Ver correo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        ${c.estado !== 'enviado' ? `
        <button class="btn sm" data-action="responder" data-id="${esc(c.id)}" title="Responder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 3 3 10.5l7 3 3 7L21 3z"/></svg>
        </button>
        ` : ''}
        <button class="btn gh sm" data-action="archivar" data-id="${esc(c.id)}" title="Archivar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
        </button>
      </div>
    </article>
  `).join('');
}

function renderPanel() {
  const panel = $('#panel-correo');
  if (!panel) return;
  if (!UI.correoSeleccionado) { panel.hidden = true; return; }
  const c = UI.correos.find(x => x.id === UI.correoSeleccionado);
  if (!c || c.estado === 'enviado') { panel.hidden = true; return; }

  panel.hidden = false;
  
  panel.innerHTML = `
    <div class="phd">
      <div><b>Responder a ${esc(c.de)}</b><small>${esc(c.t)}</small></div>
      <button class="xbtn" id="btn-cerrar-panel" title="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="pbody">
      <div class="pblock">
        <div class="kv"><span>Para</span><b>${esc(c.deMail || c.de)}</b></div>
        <div class="kv"><span>Asunto</span><b>Re: ${esc(c.t)}</b></div>
      </div>
      <div class="pblock" style="border: none; padding: 0; background: transparent;">
        <textarea class="ta" id="textarea-borrador" rows="4" placeholder="Escribe tu respuesta aquí...">${esc(c.borrador || '')}</textarea>
      </div>
      <div class="pfoot">
        <button class="btn p full" id="btn-enviar" title="Enviar respuesta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderAll() {
  renderTabs();
  renderBuzones();
  renderCorte();
  renderPanel();
}

// --- Procesar HTML del correo ---
function procesarHtmlCorreo(correo) {
  if (!correo.cuerpo_html) {
    return '<pre>' + esc(correo.cuerpo_texto || correo.cuerpo || '') + '</pre>';
  }
  let html = correo.cuerpo_html;
  const muestra = html.substring(0, 200).toLowerCase();
  if (muestra.includes('&lt;') && (muestra.includes('&lt;html') || muestra.includes('&lt;div') || muestra.includes('&lt;table'))) {
    try {
      const ta = document.createElement('textarea');
      ta.innerHTML = html;
      html = ta.value;
    } catch (_) {}
  }
  if (html.trim().startsWith('<pre') && html.trim().endsWith('</pre>')) {
    const m = html.match(/<pre[^>]*>([\s\S]*)<\/pre>/i);
    if (m) html = m[1];
  }
  if (correo.imagenes_inline && correo.imagenes_inline.length > 0) {
    correo.imagenes_inline.forEach(img => {
      const cidEsc = img.cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp('cid:' + cidEsc, 'gi'), `data:${img.tipo};base64,${img.base64}`);
    });
  }
  html = html.replace(/<img([^>]*)>/gi, (match, attrs) => {
    if (/style="[^"]*max-width/i.test(attrs)) return match;
    if (/style="[^"]*"/i.test(attrs)) return `<img${attrs.replace(/style="([^"]*)"/, 'style="$1;max-width:100%;height:auto;"')}>`;
    return `<img${attrs} style="max-width:100%;height:auto;display:inline-block;">`;
  });
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '').replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
  return html;
}

// --- Abrir correo (modal) ---
function abrirCorreoCompleto(id) {
  const c = UI.correos.find(x => x.id === id);
  if (!c) return;

  const modal = $('#modal');
  const mbox = modal.querySelector('.mbox');
  mbox.className = 'mbox w';

  let adjuntosHtml = '';
  if (c.adjuntos && c.adjuntos.length > 0) {
    adjuntosHtml = `
      <div class="adjuntos">
        <div class="adjuntos-titulo">
          ${c.adjuntos.length} adjunto${c.adjuntos.length > 1 ? 's' : ''}
        </div>
        <div class="adjuntos-lista">
          ${c.adjuntos.map((a, i) => `
            <button class="btn sm adjunto-btn" onclick="window.descargarAdjunto('${id}', ${i})" title="Descargar ${esc(a.nombre)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <div class="adjunto-info">
                <div class="adjunto-nombre">${esc(a.nombre)}</div>
                <div class="adjunto-tamano">${Math.round(a.tamano/1024)} KB</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  const nombreRem = c.de.split('<')[0].trim().replace(/"/g, '');
  const emailRem = (c.de.match(/<([^>]+)>/) || [])[1] || c.deMail || c.de;

  mbox.innerHTML = `
    <div class="correo-modal">
      <div class="correo-modal-header">
        <div class="correo-modal-top">
          <div>
            <h2 class="correo-modal-titulo">${esc(c.t)}</h2>
            <div class="correo-modal-remitente">
              <span class="av">${esc(ini(nombreRem))}</span>
              <div>
                <div class="correo-modal-nombre">${esc(nombreRem)}</div>
                <div class="correo-modal-email">&lt;${esc(emailRem)}&gt;</div>
              </div>
            </div>
          </div>
          <button class="xbtn" id="btn-cerrar-correo" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="correo-modal-meta">
          Para: <b>${esc(c.para || '')}</b>
          ${c.fecha ? ' · ' + esc(c.fecha) : ''}
        </div>
      </div>
      <div class="correo-modal-body">
        <div class="correo-html">${procesarHtmlCorreo(c)}</div>
        ${adjuntosHtml}
      </div>
      <div class="correo-modal-footer">
        ${c.estado !== 'enviado' ? `
        <button class="btn p" id="btn-responder-correo" title="Responder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 3 3 10.5l7 3 3 7L21 3z"/></svg>
          Responder
        </button>
        ` : ''}
      </div>
    </div>
  `;
  modal.hidden = false;

  const cerrar = () => { modal.hidden = true; mbox.innerHTML = ''; mbox.className = 'mbox'; };
  $('#btn-cerrar-correo').onclick = cerrar;
  
  const btnResp = $('#btn-responder-correo');
  if (btnResp) {
    btnResp.onclick = () => {
      cerrar();
      UI.correoSeleccionado = id;
      renderAll();
      
      const panelRespuesta = $('#panel-correo');
      if (panelRespuesta) {
        panelRespuesta.scrollIntoView({ behavior: 'smooth', block: 'end' });
        const ta = $('#textarea-borrador');
        if (ta) setTimeout(() => ta.focus(), 300);
      }
    };
  }

  setTimeout(() => {
    const dv = mbox.querySelector('.correo-html');
    if (dv) {
      dv.querySelectorAll('img').forEach(i => { i.style.maxWidth = '100%'; i.style.height = 'auto'; });
      dv.querySelectorAll('table').forEach(t => { t.style.maxWidth = '100%'; });
    }
  }, 100);
}

// --- Modal de Nuevo Correo ---
function abrirModalNuevoCorreo() {
  const b = UI.buzones.find(x => x.id === UI.buzonActivo);
  if (!b) return;

  const modal = $('#modal');
  const mbox = modal.querySelector('.mbox');
  mbox.className = 'mbox w';
  
  UI.modoHTML = false;

  mbox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="margin:0">Nuevo Correo</h2>
      <button class="xbtn" id="btn-cerrar-nuevo" title="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    
    <div class="modal-compose">
      <div class="compose-row">
        <div style="flex: 0 0 80px; font-weight: 600; color: var(--dim); font-size: 13px; display: flex; align-items: center;">De:</div>
        <input class="inp" type="text" value="${esc(b.dir)}" readonly style="opacity: 0.7; cursor: not-allowed;">
      </div>
      
      <div class="compose-row">
        <div style="flex: 0 0 80px; font-weight: 600; color: var(--dim); font-size: 13px; display: flex; align-items: center;">Para:</div>
        <input class="inp" type="email" id="nuevo-para" placeholder="destinatario@ejemplo.com">
      </div>

      <div class="compose-row">
        <div style="flex: 0 0 80px; font-weight: 600; color: var(--dim); font-size: 13px; display: flex; align-items: center;">Asunto:</div>
        <input class="inp" type="text" id="nuevo-asunto" placeholder="Asunto del correo">
      </div>

      <div class="compose-row" style="flex-direction: column; gap: 8px;">
        <!-- DIV CONTENTEDITABLE EN LUGAR DE TEXTAREA -->
        <div class="ta compose-body" id="nuevo-cuerpo" contenteditable="true" placeholder="Escribe tu mensaje aquí... (Puedes pegar imágenes)"></div>
      </div>

      <div class="compose-row" style="align-items: center; justify-content: space-between;">
        <label class="btn gh sm" style="cursor: pointer; margin: 0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          Adjuntar archivo
          <input type="file" id="nuevo-adjunto" multiple style="display: none;">
        </label>
        <span id="nuevo-adjuntos-lista" style="font-size: 12px; color: var(--dim);"></span>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px">
        <button class="btn p" id="btn-enviar-nuevo" style="padding: 12px 24px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          Enviar Correo
        </button>
      </div>
    </div>
  `;

  modal.hidden = false;

  const fileInput = $('#nuevo-adjunto');
  fileInput.addEventListener('change', () => {
    const names = Array.from(fileInput.files).map(f => f.name).join(', ');
    $('#nuevo-adjuntos-lista').textContent = names || 'Sin archivos seleccionados';
  });

  $('#btn-cerrar-nuevo').onclick = cerrarModal;
  
  $('#btn-enviar-nuevo').onclick = async () => {
    const para = $('#nuevo-para').value.trim();
    const asunto = $('#nuevo-asunto').value.trim();
    const cuerpoElement = $('#nuevo-cuerpo');
    const cuerpo = cuerpoElement.innerHTML.trim(); 
    
    // Si está vacío, evitar enviar HTML vacío
    if (!para || !asunto || cuerpo === '' || cuerpo === '<br>') {
      toast('Completá destinatario, asunto y cuerpo.');
      return;
    }

    const btn = $('#btn-enviar-nuevo');
    btn.disabled = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/></svg> Enviando...';

    // PROCESAR ARCHIVOS ADJUNTOS
    const adjuntosData = [];
    for (const file of fileInput.files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      adjuntosData.push({
        nombre: file.name,
        tipo: file.type || 'application/octet-stream',
        base64: base64
      });
    }

    const r = await apiFetch('/api/email/enviar', {
      method: 'POST',
      body: {
        para: para,
        asunto: asunto,
        cuerpo: cuerpo,
        adjuntos: adjuntosData, // <-- ENVIAMOS LOS ADJUNTOS
        email_buzon: b.email
      }
    });

    if (r.ok && r.data.ok) {
      toast('Correo enviado correctamente.');
      
      // --- NOTIFICACIÓN AL SISTEMA ---
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'NOTIF',
            notif: {
              t: `Correo enviado a ${para}`,
              d: `Asunto: ${asunto}`,
              tipo: 'sistema',
              modulo: 'Smart Email',
              cuando: 'hace un momento'
            }
          }, '*');
        }
      } catch (e) {}

      cerrarModal();
      UI.corteFil = 'enviados';
      renderAll();
      setTimeout(() => sincronizarBuzon(UI.buzonActivo, true), 1000);
    } else {
      toast('Error al enviar: ' + (r.data.error || 'Desconocido'));
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Enviar Correo';
    }
  };
}

window.descargarAdjunto = function(correoId, adjuntoIndex) {
  const c = UI.correos.find(x => x.id === correoId);
  if (!c || !c.adjuntos || !c.adjuntos[adjuntoIndex]) return;
  const adj = c.adjuntos[adjuntoIndex];
  try {
    const bc = atob(adj.base64);
    const bytes = new Uint8Array(bc.length);
    for (let i = 0; i < bc.length; i++) bytes[i] = bc.charCodeAt(i);
    const blob = new Blob([bytes], { type: adj.tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = adj.nombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Descargando ' + adj.nombre);
  } catch (_) {
    toast('Error al descargar el archivo.');
  }
};

// --- Lógica ---

// Función de carga inicial: Muestra lo que hay en memoria y sincroniza en 2do plano
async function cargarBuzones() {
  // 1. Mostrar datos cacheados inmediatamente
  const sb = localStorage.getItem('naveia_buzones');
  if (sb) { try { UI.buzones = JSON.parse(sb); } catch (_) {} }
  const sc = localStorage.getItem('naveia_correos');
  if (sc) { try { UI.correos = JSON.parse(sc); } catch (_) {} }
  
  renderAll();

  // 2. Consultar estado real al servidor en segundo plano
  const r = await apiFetch('/api/email/estado');

  if (r.ok && r.data.ok && r.data.conectado && r.data.buzones) {
    UI.buzones = r.data.buzones.map((b, i) => ({
      id: b.id || `BZ${i + 1}`,
      dir: b.usuario,
      prov: b.proveedor,
      email: b.usuario,
      ult: b.fecha_conexion ? new Date(b.fecha_conexion * 1000).getTime() : Date.now(),
      n: 0
    }));
    localStorage.setItem('naveia_buzones', JSON.stringify(UI.buzones));

    // Sincronizar la primera cuenta en silencio
    if (UI.buzones.length > 0) {
      await sincronizarBuzon(UI.buzones[0].id, true);
    }
  } else {
    // Si no hay cuentas en el servidor, limpiar
    UI.buzones = [];
    UI.correos = [];
    localStorage.removeItem('naveia_buzones');
    localStorage.removeItem('naveia_correos');
  }

  renderAll();
}

// Función de sincronización
async function sincronizarBuzon(id, silencioso = false) {
  const b = UI.buzones.find(x => x.id === id);
  if (!b) return;

  // Si no es silencioso, mostramos el toast
  if (!silencioso) toast('Sincronizando...');
  
  const r = await apiFetch('/api/email/sincronizar', { method: 'POST', body: { email_buzon: b.email } });

  if (r.ok && r.data.ok) {
    const correos = r.data.correos || [];
    let nuevos = 0;
    const existentes = new Set(UI.correos.map(c => c.id));
    
    correos.forEach(c => {
      if (!existentes.has(c.id)) {
        const nombre = c.de.split('<')[0].trim().replace(/"/g, '');
        const email = (c.de.match(/<([^>]+)>/) || [])[1] || c.de;
        UI.correos.push({
          id: c.id, de: nombre, deMail: email,
          t: c.asunto,
          p: c.cuerpo_texto ? c.cuerpo_texto.substring(0, 150) + (c.cuerpo_texto.length > 150 ? '...' : '') : '',
          cuerpo: c.cuerpo_texto || '',
          cuerpo_html: c.cuerpo_html || '',
          cuerpo_texto: c.cuerpo_texto || '',
          adjuntos: c.adjuntos || [],
          imagenes_inline: c.imagenes_inline || [],
          fecha: c.fecha || new Date().toISOString(),
          estado: c.estado || 'pendiente',
          borrador: `Hola ${nombre.split(' ')[0]},\n\nGracias por tu correo. Estamos revisando tu solicitud y te responderemos a la brevedad.\n\nSaludos,\n${getUsuarioActual().split('@')[0]}`,
          para: c.para || getUsuarioActual()
        });
        nuevos++;
      }
    });
    
    // Guardar ordenados
    UI.correos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    localStorage.setItem('naveia_correos', JSON.stringify(UI.correos));
    b.n = UI.correos.length;
    b.ult = Date.now();
    localStorage.setItem('naveia_buzones', JSON.stringify(UI.buzones));
    
    // Renderizar si hubo cambios o si no es silencioso
    if (nuevos > 0) {
      if (!silencioso) toast(`Sincronizado: ${nuevos} correos nuevos.`);
      renderAll();
      
      // --- NOTIFICACIÓN AL SISTEMA ---
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'NOTIF',
            notif: {
              t: `Tienes ${nuevos} correo(s) nuevo(s)`,
              d: `Revisá tu bandeja de entrada en ${b.dir}`,
              tipo: 'email',
              modulo: 'Smart Email',
              cuando: 'hace un momento'
            }
          }, '*');
        }
      } catch (e) {}
      
    } else if (!silencioso) {
      toast('Sincronizado: sin correos nuevos.');
      renderAll();
    } else {
      renderAll(); // Actualiza la fecha/hora de la última sincronización
    }
  } else if (!silencioso) {
    toast('Error: ' + (r.data.error || 'Desconocido'));
  }
}

async function abrirBuzon(id) {
  const b = UI.buzones.find(x => x.id === id);
  if (!b) return;

  UI.buzonActivo = id;
  UI.vistaBuzon = 'correos';
  UI.corteFil = 'pend';
  UI.correoSeleccionado = null;

  const t = $('#corte-titulo-buzon');
  if (t) t.textContent = b.dir;

  renderAll();

  // Sincronizar la cuenta seleccionada de forma inmediata y silenciosa
  await sincronizarBuzon(id, true);

  // Configurar Auto Refresh (Polling) para esta cuenta
  if (UI.autoRefreshInterval) clearInterval(UI.autoRefreshInterval);
  UI.autoRefreshInterval = setInterval(() => {
    if (UI.vistaBuzon === 'correos' && UI.tab === 'buzones') {
      sincronizarBuzon(id, true);
    }
  }, 60000); // 60 segundos
}

async function enviarCorreo() {
  const c = UI.correos.find(x => x.id === UI.correoSeleccionado);
  if (!c) return;
  const borrador = $('#textarea-borrador').value;
  if (!borrador.trim()) { toast('El borrador no puede estar vacío.'); return; }

  toast('Enviando...');
  const r = await apiFetch('/api/email/enviar', {
    method: 'POST',
    body: { para: c.deMail, asunto: `Re: ${c.t}`, cuerpo: borrador, email_buzon: UI.buzones[0] ? UI.buzones[0].email : null }
  });
  if (r.ok && r.data.ok) {
    c.estado = 'recibido';
    c.borrador = borrador;
    
    localStorage.setItem('naveia_correos', JSON.stringify(UI.correos));
    UI.correoSeleccionado = null;
    toast('Correo enviado correctamente.');
    renderAll();
    setTimeout(() => sincronizarBuzon(UI.buzonActivo, true), 1000);
  } else {
    toast('Error al enviar: ' + (r.data.error || 'Desconocido'));
  }
}

// --- Eventos ---

function bindEvents() {
  $$('.setab').forEach(b => {
    b.addEventListener('click', () => {
      UI.tab = b.dataset.tab;
      if (UI.tab === 'buzones') {
        UI.vistaBuzon = 'lista';
        UI.buzonActivo = null;
        UI.correoSeleccionado = null;
      }
      
      if (UI.autoRefreshInterval) {
        clearInterval(UI.autoRefreshInterval);
        UI.autoRefreshInterval = null;
      }

      const listScroll = $('.correos-scroll');
      if (listScroll) listScroll.scrollTop = 0;
      
      renderAll();
    });
  });

  const corteTabs = $('#corte-tabs');
  if (corteTabs) {
    corteTabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      UI.corteFil = btn.dataset.cf;
      
      const listScroll = $('.correos-scroll');
      if (listScroll) listScroll.scrollTop = 0;

      renderAll();
    });
  }

  const bzwrap = $('#bzwrap');
  if (bzwrap) {
    bzwrap.addEventListener('click', async e => {
      const btnSync = e.target.closest('[data-action="sync"]');
      if (btnSync) {
        e.stopPropagation();
        const id = btnSync.dataset.id;
        btnSync.disabled = true;
        const orig = btnSync.innerHTML;
        btnSync.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/></svg>';
        await sincronizarBuzon(id, false); // Falso para que muestre el toast
        btnSync.disabled = false;
        btnSync.innerHTML = orig;
        return;
      }

      const btnDesc = e.target.closest('[data-action="desc"]');
      if (btnDesc) {
        e.stopPropagation();
        const id = btnDesc.dataset.id;
        const b = UI.buzones.find(x => x.id === id);
        if (confirm(`¿Desconectar el buzón ${b ? b.dir : ''}?`)) {
          const r = await apiFetch('/api/email/desconectar', { method: 'POST', body: { email_buzon: b ? b.email : null } });
          if (r.ok) {
            UI.buzones = UI.buzones.filter(x => x.id !== id);
            UI.correos = [];
            localStorage.setItem('naveia_buzones', JSON.stringify(UI.buzones));
            localStorage.setItem('naveia_correos', JSON.stringify(UI.correos));
            renderAll();
            toast('Buzón desconectado.');
          } else {
            toast('Error al desconectar: ' + (r.data.error || 'Desconocido'));
          }
        }
        return;
      }

      const card = e.target.closest('.bzcard');
      if (card) {
        await abrirBuzon(card.dataset.id);
      }
    });
  }

  const correosList = $('#correos-list');
  if (correosList) {
    correosList.addEventListener('click', e => {
      const card = e.target.closest('.mailc');
      if (!card) return;
      const id = card.dataset.id;
      
      if (e.target.closest('[data-action="ver"]')) {
        abrirCorreoCompleto(id);
      } else if (e.target.closest('[data-action="responder"]')) {
        UI.correoSeleccionado = id;
        renderAll();
        
        const panelRespuesta = $('#panel-correo');
        if (panelRespuesta) {
          panelRespuesta.scrollIntoView({ behavior: 'smooth', block: 'end' });
          const ta = $('#textarea-borrador');
          if (ta) setTimeout(() => ta.focus(), 300);
        }
      } else if (e.target.closest('[data-action="archivar"]')) {
        const c = UI.correos.find(x => x.id === id);
        if (c) {
          c.estado = 'archivado';
          localStorage.setItem('naveia_correos', JSON.stringify(UI.correos));
          renderAll();
          toast('Correo archivado.');
        }
      }
    });
  }

  const panel = $('#panel-correo');
  if (panel) {
    panel.addEventListener('click', e => {
      if (e.target.closest('#btn-cerrar-panel')) {
        UI.correoSeleccionado = null;
        renderAll();
      }
      if (e.target.closest('#btn-enviar')) enviarCorreo();
    });
  }

  const btnNuevo = $('#btn-nuevo-correo');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', abrirModalNuevoCorreo);
  }

  const btnToggleHtml = $('#btn-toggle-html');
  if (btnToggleHtml) {
    btnToggleHtml.addEventListener('click', () => {
      const modal = $('#modal');
      if (!modal.hidden) {
        const textarea = $('#nuevo-cuerpo');
        if (textarea) {
          if (UI.modoHTML) {
            textarea.innerHTML = textarea.innerText; // Convertir HTML a texto plano
            btnToggleHtml.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg> Enviado en HTML`;
            UI.modoHTML = false;
          } else {
            textarea.innerHTML = textarea.innerText.replace(/\n/g, '<br>'); // Convertir texto a HTML
            btnToggleHtml.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg> Enviado en Texto Plano`;
            UI.modoHTML = true;
          }
        }
      }
    });
  }

  const btnConectar = $('#btn-conectar');
  if (btnConectar) {
    btnConectar.addEventListener('click', () => {
      const modal = $('#modal');
      const mbox = modal.querySelector('.mbox');
      mbox.className = 'mbox';
      mbox.innerHTML = `
        <h2>Conectar buzón</h2>
        <div class="form-conectar">
          <label class="lbl">Proveedor</label>
          <select class="sel" id="wiz-prov">
            <option value="google">Google (Gmail)</option>
            <option value="microsoft">Microsoft 365 / Outlook</option>
            <option value="imap">Otro (IMAP/SMTP)</option>
          </select>
          <label class="lbl">Correo electrónico</label>
          <input class="inp" id="wiz-email" type="email" placeholder="tucorreo@gmail.com">
          <label class="lbl">Contraseña de aplicación</label>
          <input class="inp" id="wiz-password" type="password" placeholder="xxxx xxxx xxxx xxxx">
          <p class="nota-conectar">Para Gmail, generá una "Contraseña de aplicación" en tu cuenta de Google.</p>
        </div>
        <div class="mact">
          <button class="btn gh" id="wiz-cancelar" title="Cancelar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button class="btn p" id="wiz-conectar" title="Conectar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 13 4.5 4.5L19 6"/></svg>
          </button>
        </div>
      `;
      modal.hidden = false;
    });
  }

  const modal = $('#modal');
  if (modal) {
    modal.addEventListener('click', async e => {
      if (e.target.closest('#wiz-cancelar')) cerrarModal();

      if (e.target.closest('#wiz-conectar')) {
        const prov = $('#wiz-prov').value;
        const email = $('#wiz-email').value.trim();
        const pass = $('#wiz-password').value;
        if (!email || !pass) { toast('Completá todos los campos.'); return; }
        const btn = e.target.closest('#wiz-conectar');
        btn.disabled = true;
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/></svg>';

        const r = await apiFetch('/api/email/conectar', {
          method: 'POST',
          body: {
            servidor: prov === 'google' ? 'imap.gmail.com' : 'outlook.office365.com',
            puerto: '993', usuario: email, password: pass, proveedor: prov
          }
        });

        if (r.ok && r.data.ok) {
          const estado = await apiFetch('/api/email/estado');
          if (estado.ok && estado.data.ok && estado.data.buzones) {
            UI.buzones = estado.data.buzones.map((b, i) => ({
              id: b.id || `BZ${i + 1}`,
              dir: b.usuario,
              prov: b.proveedor,
              email: b.usuario,
              ult: b.fecha_conexion ? new Date(b.fecha_conexion * 1000).getTime() : Date.now(),
              n: 0
            }));
          }
          if (UI.buzones.length > 0) await sincronizarBuzon(UI.buzones[UI.buzones.length - 1].id, true);
          cerrarModal();
          toast('Buzón conectado exitosamente.');
          renderAll();
        } else {
          toast('Error: ' + (r.data.error || 'No se pudo conectar'));
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    });
  }
}

// --- Init ---
function init() {
  bindEvents();
  cargarBuzones();
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

})();