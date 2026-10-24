(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  task:    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  list:    '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  board:   '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="14" rx="1.5"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  flag:    '<path d="M5 21V4h13l-2.5 4.5L18 13H5"/>',
  trash:   '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>',
  edit:    '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m14.5 5.5 4 4"/>',
  send:    '<path d="M21 3 3 10.5l7 3 3 7L21 3z"/>',
  hist:    '<path d="M3 12a9 9 0 1 0 3-6.7V9H3"/><path d="M12 8v4.5l3 1.8"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  left:    '<path d="m15 6-6 6 6 6"/>',
  down:    '<path d="m6 9 6 6 6-6"/>',
  up:      '<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M4 4h16"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>'
};
function ic(n, c) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (c ? ' class="' + c + '"' : '') + '>' + (IC[n] || '') + '</svg>';
}
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(t) {
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ini(n) { return String(n || '').split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ''; }).join('').toUpperCase(); }
var MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var HOY = new Date();
function dmas(d) { var x = new Date(HOY); x.setDate(x.getDate() + d); return x; }
function fISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fLegible(iso) { if (!iso) return 'sin fecha'; var p = iso.split('-'); return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1] + ' ' + p[0]; }
function diasA(iso) { var p = iso.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); return Math.round((d - HOY) / 86400000); }
function vence(iso) {
  var n = diasA(iso);
  if (n < 0) return { txt: 'Vencida (hace ' + Math.abs(n) + (Math.abs(n) === 1 ? ' día' : ' días') + ')', k: 'rd' };
  if (n === 0) return { txt: 'Vence hoy', k: 'am' };
  if (n === 1) return { txt: 'Vence mañana', k: 'am' };
  return { txt: 'En ' + n + ' días', k: '' };
}
function toast(msg, icono) {
  var t = $('#toast'); if (!t) return;
  t.innerHTML = ic(icono || 'check') + '<span>' + esc(msg) + '</span>';
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2800);
}
function modal(html, ancho) {
  var m = $('#modal'); if (!m) return null;
  var b = $('.mbox', m);
  b.className = 'mbox' + (ancho ? ' w' : '');
  b.innerHTML = html; m.hidden = false;
  var f = b.querySelector('input,textarea,button.p');
  if (f) setTimeout(function () { f.focus(); }, 40);
  return b;
}
function cerrarModal() {
  var m = $('#modal'); if (!m) return;
  m.hidden = true;
  var b = $('.mbox', m);
  if (b) { b.innerHTML = ''; b.className = 'mbox'; }
}

/* =====================================================================
   CONEXIÓN API
   ===================================================================== */
async function apiFetch(path, opts = {}) {
  // Intentar obtener el usuario de múltiples fuentes
  let uid = 'admin@coreteks.com';
  try {
    const u1 = localStorage.getItem('naveia_usuario');
    const u2 = localStorage.getItem('usuario_id');
    const u3 = sessionStorage.getItem('usuario_id');
    
    if (u1) uid = u1;
    else if (u2) uid = u2;
    else if (u3) uid = u3;
  } catch (e) {}

  const headers = { 'Content-Type': 'application/json', 'X-Usuario-Id': uid, ...(opts.headers || {}) };
  
  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify({ ...opts.body, usuario_id: uid });
  }
  
  const method = (opts.method || 'GET').toUpperCase();
  if (method === 'GET') {
    path += (path.includes('?') ? '&' : '?') + 'usuario_id=' + encodeURIComponent(uid);
  }
  
  try {
    const resp = await fetch('http://127.0.0.1:8000' + path, { ...opts, headers });
    const data = await resp.json();
    return { status: resp.status, ok: resp.ok, data };
  } catch (e) {
    console.error('API Error:', e);
    return { status: 0, ok: false, data: { error: 'Error de conexión' } };
  }
}

/* =====================================================================
   DATOS
   ===================================================================== */

var ESTADO = {
  tareas: [],
  seq: 0
};

var COLS = [
  { id: 'pend',  n: 'Pendiente',    k: 'am' },
  { id: 'curso', n: 'En curso',     k: 'cy' },
  { id: 'rev',   n: 'En revisión',  k: 'vi' },
  { id: 'listo', n: 'Completada',   k: 'gr' }
];
var PRIS = {
  alta:  { n: 'Alta',  k: 'rd' },
  media: { n: 'Media', k: 'am' },
  baja:  { n: 'Baja',  k: 'bl' }
};
var UI = {};

function colInfo(id) { return COLS.filter(function (c) { return c.id === id; })[0] || COLS[0]; }
function tarea(id) { return ESTADO.tareas.filter(function (t) { return t.id === id; })[0] || null; }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaTareas() {
  var lista = filtradas();
  var vencidas = ESTADO.tareas.filter(function (t) { return t.col !== 'listo' && diasA(t.fecha) < 0; }).length;
  var abiertas = ESTADO.tareas.filter(function (t) { return t.col !== 'listo'; }).length;
  var mias = ESTADO.tareas.filter(function (t) { return t.col !== 'listo' && t.resp === 'Yo'; }).length;
  var vista = UI.vista || 'board';
  var sel = tarea(UI.sel);

  var html = '<div class="ph"><div class="rowb">' +
    '<div><h1>Tareas</h1>' +
    '<p class="sub">El tablero del espacio. Lo que MÍA delega desde el correo o el chat cae acá, con el contexto pegado.</p></div>' +
    '<button class="btn p" data-accion="nueva">' + ic('plus') + 'Nueva tarea</button></div>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('list') + ESTADO.tareas.length + ' en el tablero</span>' +
      '<span class="chip bl">' + ic('user') + mias + ' asignadas a vos</span>' +
      (vencidas ? '<span class="chip rd">' + ic('alert') + vencidas + ' vencidas</span>' : '<span class="chip gr">' + ic('check') + 'Ninguna vencida</span>') +
    '</div></div>' +

    '<div class="tkpis">' +
      kpi('todas', 'Todas', ESTADO.tareas.length, '', 'en el tablero') +
      kpi('abiertas', 'Abiertas', abiertas, 'bl', 'sin completar') +
      kpi('vencidas', 'Vencidas', vencidas, 'rd', 'fecha pasada') +
      kpi('completadas', 'Completadas', ESTADO.tareas.filter(function (t) { return t.col === 'listo'; }).length, 'gr', 'hechas') +
    '</div>' +

    '<div class="tbar">' +
      '<div class="search"><span>' + ic('search') + '</span><input class="inp" id="tq" placeholder="Buscar tarea, responsable…" value="' + esc(UI.q || '') + '"></div>' +
      '<select class="sel" id="tresp"><option value="">Todos los responsables</option>' +
        responsables().map(function (r) { return '<option' + (UI.resp === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') +
      '</select>' +
      '<select class="sel" id="tpri"><option value="">Toda prioridad</option>' +
        Object.keys(PRIS).map(function (k) { return '<option value="' + k + '"' + (UI.pri === k ? ' selected' : '') + '>' + PRIS[k].n + '</option>'; }).join('') +
      '</select>' +
      '<span class="cspacer"></span>' +
      '<div class="tabs" style="border:0;margin:0">' +
        '<button class="tab' + (vista === 'board' ? ' on' : '') + '" data-vista="board">' + ic('board') + 'Tablero</button>' +
        '<button class="tab' + (vista === 'lista' ? ' on' : '') + '" data-vista="lista">' + ic('list') + 'Lista</button>' +
      '</div>' +
    '</div>' +

    '<div class="split' + (sel ? ' open' : '') + '">' +
      (vista === 'board' ? tablero(lista) : listaTareas(lista)) +
      (sel ? panelTarea(sel) : '') +
    '</div>';

  return html;
}

function kpi(id, et, n, k, sub) {
  var on = (UI.filtro || 'todas') === id;
  return '<button class="tkpi ' + k + (on ? ' on' : '') + '" data-filtro="' + id + '">' +
    '<small>' + esc(et) + '</small><b>' + n + '</b><em>' + esc(sub) + '</em></button>';
}

function responsables() {
  var l = [];
  ESTADO.tareas.forEach(function (t) { if (t.resp && l.indexOf(t.resp) === -1) l.push(t.resp); });
  return l;
}
function filtradas() {
  var f = UI.filtro || 'todas';
  return ESTADO.tareas.filter(function (t) {
    if (f === 'abiertas'    && t.col === 'listo') return false;
    if (f === 'vencidas'    && (t.col === 'listo' || diasA(t.fecha) >= 0)) return false;
    if (f === 'completadas' && t.col !== 'listo') return false;
    if (UI.q && (t.t + ' ' + (t.desc || '') + ' ' + (t.resp || '')).toLowerCase().indexOf(UI.q.toLowerCase()) === -1) return false;
    if (UI.resp && t.resp !== UI.resp) return false;
    if (UI.pri && t.pri !== UI.pri) return false;
    return true;
  });
}

function tablero(lista) {
  return '<div class="kb">' + COLS.map(function (c) {
    var ts = lista.filter(function (t) { return t.col === c.id; });
    return '<section class="kcol" data-col="' + c.id + '">' +
      '<header><b>' + c.n + '</b><span>' + ts.length + '</span></header>' +
      '<div class="kbody" data-drop="' + c.id + '">' +
      (ts.length ? ts.map(tarjeta).join('') : '<div class="kempty">Arrastrá una tarea acá</div>') +
      '</div></section>';
  }).join('') + '</div>';
}

function tarjeta(t) {
  var v = vence(t.fecha), p = PRIS[t.pri] || PRIS.media;
  var hechos = (t.check || []).filter(function (c) { return c.ok; }).length;
  return '<article class="kc ' + (t.id === UI.sel ? 'sel ' : '') + (t.col === 'listo' ? 'listo' : '') + '" draggable="true" data-t="' + t.id + '">' +
    '<div class="krow">' +
      '<span class="chip ' + p.k + ' xs">' + p.n + '</span>' +
      (t.origen ? '<span class="chip xs">' + ic('spark') + esc(t.origen) + '</span>' : '') +
    '</div>' +
    '<b class="kt">' + esc(t.t) + '</b>' +
    '<div class="kmeta">' +
      (t.resp ? '<span class="av s">' + esc(ini(t.resp)) + '</span><span class="kr">' + esc(t.resp.split(' ')[0]) + '</span>' : '') +
      (t.check && t.check.length ? '<span class="cspacer"></span><span class="kck">' + ic('check') + hechos + '/' + t.check.length + '</span>' : '') +
      (t.col !== 'listo' && t.fecha ? '<span class="chip ' + v.k + ' xs">' + v.txt + '</span>' : '') +
    '</div>' +
    (t.col === 'listo' ? '<div class="kdone">' + ic('check') + 'Completada</div>' : '') +
  '</article>';
}

function listaTareas(lista) {
  if (!lista.length) return '<div class="empty">' + ic('search') + 'Ninguna tarea coincide con el filtro.</div>';
  return '<div class="card tight"><table class="tl"><thead><tr>' +
    '<th>Tarea</th><th>Responsable</th><th>Estado</th><th>Prioridad</th><th>Vence</th>' +
    '</tr></thead><tbody>' +
    lista.map(function (t) {
      var v = vence(t.fecha), p = PRIS[t.pri] || PRIS.media, c = colInfo(t.col);
      return '<tr class="' + (t.id === UI.sel ? 'on' : '') + '" data-t="' + t.id + '">' +
        '<td><b>' + esc(t.t) + '</b>' + (t.origen ? '<small class="sm2">' + esc(t.origen) + '</small>' : '') + '</td>' +
        '<td>' + esc(t.resp || '—') + '</td>' +
        '<td><span class="chip ' + c.k + ' xs">' + c.n + '</span></td>' +
        '<td><span class="chip ' + p.k + ' xs">' + p.n + '</span></td>' +
        '<td><span class="chip ' + v.k + ' xs">' + (t.col === 'listo' ? '—' : v.txt) + '</span></td>' +
      '</tr>';
    }).join('') + '</tbody></table></div>';
}

function panelTarea(t) {
  var v = vence(t.fecha), hechos = (t.check || []).filter(function (c) { return c.ok; }).length;
  var pct = t.check && t.check.length ? Math.round(hechos / t.check.length * 100) : (t.col === 'listo' ? 100 : 0);
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(t.t) + '</b><small>' + esc(t.proy || 'Sin proyecto') + '</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    (t.desc ? '<div class="pblock"><p class="lead">' + esc(t.desc) + '</p></div>' : '') +

    '<div class="pblock">' +
      '<div class="kv"><span>Responsable</span><b>' + esc(t.resp || '—') + '</b></div>' +
      '<div class="kv"><span>Vence</span><b>' + (t.col === 'listo' ? '—' : fLegible(t.fecha) + ' · <span class="chip ' + v.k + ' xs">' + v.txt + '</span>') + '</b></div>' +
      '<div class="kv"><span>Prioridad</span><b>' + (PRIS[t.pri] || PRIS.media).n + '</b></div>' +
      '<div class="kv"><span>Proyecto</span><b>' + esc(t.proy || '—') + '</b></div>' +
      (t.origen ? '<div class="kv"><span>Origen</span><b>' + esc(t.origen) + '</b></div>' : '') +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Avance</label>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<span class="mono">' + pct + '% · ' + hechos + ' de ' + ((t.check || []).length || 0) + ' pasos</span>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Checklist</label>' +
      ((t.check && t.check.length)
        ? t.check.map(function (c, i) {
            return '<label class="ck' + (c.ok ? ' on' : '') + '"><input type="checkbox" data-ck="' + i + '"' + (c.ok ? ' checked' : '') + '><span>' + esc(c.t) + '</span></label>';
          }).join('')
        : '<p class="mono">Sin pasos todavía.</p>') +
      '<div class="addrow"><input class="inp" id="nck" placeholder="Agregar un paso…"><button class="btn sm" data-accion="addck">' + ic('plus') + '</button></div>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Mover a</label>' +
      '<div class="chips">' + COLS.map(function (c) {
        return '<button class="chip' + (t.col === c.id ? ' on' : '') + '" data-mv="' + c.id + '">' + c.n + '</button>';
      }).join('') + '</div>' +
    '</div>' +

    ((t.adj && t.adj.length)
      ? '<div class="pblock"><label class="lbl">Adjuntos</label>' + t.adj.map(function (a) {
          return '<div class="actl">' + ic('file') + '<div><b>' + esc(a.n) + '</b><small>' + esc(a.d || '') + '</small></div></div>';
        }).join('') + '</div>'
      : '') +

    '<div class="pblock">' +
      '<label class="lbl">Comentarios</label>' +
      ((t.coment && t.coment.length)
        ? t.coment.map(function (c) {
            return '<div class="cmt"><span class="av s">' + esc(ini(c.a)) + '</span><div><b>' + esc(c.a) + '<i>' + esc(c.cuando) + '</i></b><p>' + esc(c.txt) + '</p></div></div>';
          }).join('')
        : '<p class="mono">Sin comentarios.</p>') +
      '<div class="addrow"><input class="inp" id="ncm" placeholder="Escribir un comentario…"><button class="btn sm" data-accion="addcm">' + ic('send') + '</button></div>' +
    '</div>' +

    '<div class="pblock pfoot">' +
      '<button class="btn g full" data-accion="borrar">' + ic('trash') + 'Eliminar tarea</button>' +
    '</div>' +
    '</div></aside>';
}

/* =====================================================================
   LÓGICA DE API Y EVENTOS
   ===================================================================== */

async function cargarTareas() {
  const r = await apiFetch('/api/tareas');
  if (r.ok && r.data.ok) {
    ESTADO.tareas = r.data.tareas || [];
    ESTADO.seq = r.data.seq || 0;
  } else {
    console.warn("Error cargando tareas del servidor, usando cache local.");
    var saved = localStorage.getItem('naveia_tareas');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        ESTADO.tareas = parsed.tareas || [];
        ESTADO.seq = parsed.seq || 0;
      } catch(e){}
    }
  }
  render();
}

async function mover(id, col) {
  var t = tarea(id);
  if (!t || t.col === col) { render(); return; }
  
  t.col = col;
  if (col === 'listo') (t.check || []).forEach(function (c) { c.ok = true; });
  
  // Actualizar en el backend
  await apiFetch('/api/tareas/actualizar', {
    method: 'POST',
    body: { id: id, tarea: { col: col, check: t.check } }
  });
  
  render();
  toast('«' + t.t + '» → ' + colInfo(col).n, 'task');
}

function bind() {
  var q = $('#tq');
  if (q) q.oninput = function () { UI.q = q.value; var pos = q.selectionStart; render(); var n = $('#tq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
  if ($('#tresp')) $('#tresp').onchange = function () { UI.resp = this.value; render(); };
  if ($('#tpri')) $('#tpri').onchange = function () { UI.pri = this.value; render(); };

  $$('[data-vista]').forEach(function (b) { b.onclick = function () { UI.vista = b.getAttribute('data-vista'); render(); }; });
  $$('[data-filtro]').forEach(function (b) { b.onclick = function () { UI.filtro = b.getAttribute('data-filtro'); render(); }; });
  $$('[data-cerrar]').forEach(function (b) { b.onclick = function () { UI.sel = null; render(); }; });

  $$('.kc, .tl tbody tr').forEach(function (c) {
    c.onclick = function () { UI.sel = c.getAttribute('data-t'); render(); };
  });

  $$('[data-mv]').forEach(function (b) {
    b.onclick = function () { mover(UI.sel, b.getAttribute('data-mv')); };
  });

  $$('[data-ck]').forEach(function (b) {
    b.onchange = async function () {
      var t = tarea(UI.sel); if (!t) return;
      t.check[Number(b.getAttribute('data-ck'))].ok = b.checked;
      
      await apiFetch('/api/tareas/actualizar', {
        method: 'POST',
        body: { id: t.id, tarea: { check: t.check } }
      });
      
      render();
    };
  });

  $$('[data-accion]').forEach(function (b) {
    b.onclick = function () { accion(b.getAttribute('data-accion')); };
  });

  /* drag & drop */
  var arr = null;
  $$('.kc').forEach(function (c) {
    c.ondragstart = function (e) { arr = c.getAttribute('data-t'); c.classList.add('drag'); try { e.dataTransfer.setData('text/plain', arr); } catch (x) {} };
    c.ondragend = function () { c.classList.remove('drag'); $$('.kbody').forEach(function (z) { z.classList.remove('over'); }); };
  });
  $$('.kbody').forEach(function (z) {
    z.ondragover = function (e) { e.preventDefault(); z.classList.add('over'); };
    z.ondragleave = function () { z.classList.remove('over'); };
    z.ondrop = function (e) {
      e.preventDefault(); z.classList.remove('over');
      var id = arr || e.dataTransfer.getData('text/plain'); if (!id) return;
      mover(id, z.getAttribute('data-drop'));
    };
  });
}

async function accion(a) {
  if (a === 'nueva')       return nuevaTarea();
  if (a === 'borrar')      return borrarTarea();
  if (a === 'addck')       { 
    var t = tarea(UI.sel); if (!t) return; 
    var v = $('#nck').value.trim(); if (!v) return; 
    t.check = t.check || []; 
    t.check.push({ t: v, ok: false }); 
    
    await apiFetch('/api/tareas/actualizar', {
      method: 'POST',
      body: { id: t.id, tarea: { check: t.check } }
    });
    
    render(); 
    return; 
  }
  if (a === 'addcm')       { 
    var t2 = tarea(UI.sel); if (!t2) return; 
    var v2 = $('#ncm').value.trim(); if (!v2) return; 
    t2.coment = t2.coment || []; 
    t2.coment.unshift({ a: 'Yo', txt: v2, cuando: 'hace un momento' }); 
    
    await apiFetch('/api/tareas/actualizar', {
      method: 'POST',
      body: { id: t2.id, tarea: { coment: t2.coment } }
    });
    
    render(); 
    return; 
  }
}

function nuevaTarea() {
  modal('<h2>Nueva tarea</h2>' +
    '<div class="form" style="margin-top:12px">' +
      '<label class="lbl">Qué hay que hacer</label><input class="inp" id="nt">' +
      '<label class="lbl" style="margin-top:10px">Detalle</label><textarea class="ta" id="nd" rows="3"></textarea>' +
      '<div class="g2" style="margin-top:10px"><div><label class="lbl">Responsable</label><input class="inp" id="nr"></div>' +
      '<div><label class="lbl">Prioridad</label><select class="sel" id="np">' +
        Object.keys(PRIS).map(function (k) { return '<option value="' + k + '"' + (k === 'media' ? ' selected' : '') + '>' + PRIS[k].n + '</option>'; }).join('') +
      '</select></div></div>' +
      '<label class="lbl" style="margin-top:10px">Vence</label><input class="inp" id="nf" type="date" value="' + fISO(dmas(5)) + '">' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okNueva">Crear tarea</button></div>');
    
  $('#modal #okNueva').onclick = async function () {
    var t = $('#nt').value.trim();
    if (!t) { toast('Poné un título.', 'alert'); return; }
    
    var nueva = {
      t: t, desc: $('#nd').value.trim(), col: 'pend', pri: $('#np').value,
      resp: $('#nr').value.trim(), proy: '', fecha: $('#nf').value, origen: 'Manual',
      check: [], adj: [], coment: []
    };
    
    var r = await apiFetch('/api/tareas/crear', {
      method: 'POST',
      body: { tarea: nueva }
    });
    
    if (r.ok && r.data.ok) {
      await cargarTareas(); // Recargar desde el servidor
      UI.filtro = 'todas'; UI.sel = null;
      cerrarModal(); 
      toast('Tarea creada.', 'task');
    } else {
      toast('Error al crear: ' + (r.data.error || 'Desconocido'), 'alert');
    }
  };
}

function borrarTarea() {
  var t = tarea(UI.sel); if (!t) return;
  modal('<h2>¿Eliminar esta tarea?</h2>' +
    '<p class="lead" style="margin:8px 0 0">«' + esc(t.t) + '» se borra del tablero.</p>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okBorrar">Eliminar</button></div>');
    
  $('#modal #okBorrar').onclick = async function () {
    var r = await apiFetch('/api/tareas/eliminar', {
      method: 'POST',
      body: { id: t.id }
    });
    
    if (r.ok && r.data.ok) {
      await cargarTareas();
      UI.sel = null;
      cerrarModal(); 
      toast('Tarea eliminada.', 'trash');
    } else {
      toast('Error al eliminar', 'alert');
    }
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaTareas() + '</div>';
  bind();
}

function init() { 
  cargarTareas(); 
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'tareas' }, '*');
  }
} catch (e) {}

})();