(function () {
'use strict';

var IC = {
  folder:  '<path d="M4 20h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>',
  task:    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  trash:   '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  flag:    '<path d="M5 21V4h13l-2.5 4.5L18 13H5"/>',
  play:    '<path d="M8 5v14l11-7z"/>'
};
function ic(n, c) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (c ? ' class="' + c + '"' : '') + '>' + (IC[n] || '') + '</svg>'; }
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ini(n) { return String(n || '').split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ''; }).join('').toUpperCase(); }
var MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var HOY = new Date();
function dmas(d) { var x = new Date(HOY); x.setDate(x.getDate() + d); return x; }
function fISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fLegible(iso) { if (!iso) return 'sin fecha'; var p = iso.split('-'); return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1] + ' ' + p[0]; }
function diasA(iso) { var p = iso.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); return Math.round((d - HOY) / 86400000); }

function toast(msg, icono) {
  var t = $('#toast'); if (!t) return;
  t.innerHTML = ic(icono || 'check') + '<span>' + esc(msg) + '</span>';
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2800);
}

var _modalEscHandler = null;
function modal(html, ancho) {
  var m = $('#modal'); if (!m) return null;
  var b = $('.mbox', m);
  b.className = 'mbox' + (ancho ? ' w' : '');
  b.innerHTML = html;
  m.hidden = false;
  $$('[data-x]', b).forEach(function (btn) { btn.onclick = function (e) { e.preventDefault(); cerrarModal(); }; });
  m.onclick = function (e) { if (e.target === m) cerrarModal(); };
  if (_modalEscHandler) document.removeEventListener('keydown', _modalEscHandler);
  _modalEscHandler = function (e) { if (e.key === 'Escape') cerrarModal(); };
  document.addEventListener('keydown', _modalEscHandler);
  var f = b.querySelector('input,textarea,button.p');
  if (f) setTimeout(function () { f.focus(); }, 40);
  return b;
}
function cerrarModal() {
  var m = $('#modal'); if (!m) return;
  m.hidden = true; m.onclick = null;
  var b = $('.mbox', m);
  if (b) { b.innerHTML = ''; b.className = 'mbox'; }
  if (_modalEscHandler) { document.removeEventListener('keydown', _modalEscHandler); _modalEscHandler = null; }
}

async function apiFetch(path, opts = {}) {
  let uid = 'admin@nave.ia';
  try {
    const u1 = localStorage.getItem('naveia_usuario');
    const u2 = localStorage.getItem('usuario_id');
    const u3 = sessionStorage.getItem('usuario_id');
    if (u1) uid = u1; else if (u2) uid = u2; else if (u3) uid = u3;
  } catch (e) {}
  const headers = { 'Content-Type': 'application/json', 'X-Usuario-Id': uid, ...(opts.headers || {}) };
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify({ ...opts.body, usuario_id: uid });
  const method = (opts.method || 'GET').toUpperCase();
  if (method === 'GET') path += (path.includes('?') ? '&' : '?') + 'usuario_id=' + encodeURIComponent(uid);
  try {
    const resp = await fetch('http://127.0.0.1:8000' + path, { ...opts, headers });
    const data = await resp.json();
    return { status: resp.status, ok: resp.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: { error: 'Error de conexión' } };
  }
}

var ESTADO = { proyectos: [], seq: 0 };
var UI = { sel: null };
function proyecto(id) { if (id == null) return null; return ESTADO.proyectos.filter(function (p) { return String(p.id) === String(id); })[0] || null; }

function vistaProyectos() {
  var total = ESTADO.proyectos.length;
  var activos = ESTADO.proyectos.filter(function (p) { return p.pct < 100; }).length;
  var completo = ESTADO.proyectos.filter(function (p) { return p.pct >= 100; }).length;
  var promedio = total ? Math.round(ESTADO.proyectos.reduce(function (a, p) { return a + p.pct; }, 0) / total) : 0;
  var sel = proyecto(UI.sel);

  var html = '<div class="ph">' +
    '<div class="rowb" style="justify-content:flex-start; margin-bottom: 12px;">' +
      '<p class="sub" style="text-align:left;margin:0;">Cada proyecto junta sus tareas, sus hitos y sus archivos. El avance sale del tablero.</p>' +
    '</div>' +
    '<div class="rowb">' +
      '<div class="chips">' +
        '<span class="chip">' + ic('folder') + total + ' en total</span>' +
        '<span class="chip tl">' + ic('play') + activos + ' activos</span>' +
        (completo ? '<span class="chip gr">' + ic('check') + completo + ' completados</span>' : '') +
        (total ? '<span class="chip am">' + ic('target') + promedio + '% avance promedio</span>' : '') +
      '</div>' +
      '<button class="btn p" data-accion="nuevo">' + ic('plus') + 'Nuevo proyecto</button>' +
    '</div>' +
  '</div>' +

  '<div class="split open">' +
    (ESTADO.proyectos.length
      ? '<div class="grid g2" style="align-items:start;">' + ESTADO.proyectos.map(tarjeta).join('') + '</div>'
      : '<div class="empty">' + ic('folder') + 'Todavía no hay proyectos. Creá el primero.</div>') +
    panelProyecto(sel) +
  '</div>';

  return html;
}

function tarjeta(p) {
  var est = estadoProyecto(p);
  var isSel = String(p.id) === String(UI.sel);
  return '<article class="pc' + (isSel ? ' sel' : '') + '" data-p="' + p.id + '">' +
    '<div class="rowb"><span class="chip ' + est.k + '">' + est.n + '</span>' +
    '<span class="pct">' + p.pct + '%</span></div>' +
    '<h3>' + esc(p.n) + '</h3>' +
    '<p class="mp">' + esc(p.obj || 'Sin objetivo escrito todavía.') + '</p>' +
    '<div class="bar"><i style="width:' + p.pct + '%"></i></div>' +
    '<div class="kmeta">' +
      (p.resp ? '<span class="av s">' + esc(ini(p.resp)) + '</span><span>' + esc(p.resp) + '</span>' : '') +
      (p.hitos && p.hitos.length ? '<span class="chip xs">' + ic('flag') + p.hitos.filter(function (h) { return !h.ok; }).length + ' hitos</span>' : '') +
      (p.arch && p.arch.length ? '<span class="chip xs">' + ic('file') + p.arch.length + '</span>' : '') +
    '</div></article>';
}

function estadoProyecto(p) {
  if (p.pct >= 100) return { n: 'Completado', k: 'gr' };
  if (p.vencido) return { n: 'En riesgo', k: 'rd' };
  if (!p.hitos || !p.hitos.length) return { n: 'En curso', k: 'tl' };
  var vencidos = p.hitos.filter(function (h) { return !h.ok && h.f && diasA(h.f) < 0; }).length;
  if (vencidos) return { n: 'En riesgo', k: 'rd' };
  return { n: 'En curso', k: 'tl' };
}

function panelProyecto(p) {
  if (!p) {
    return '<aside class="panel" style="opacity: 0.6; pointer-events: none;">' +
      '<div class="phd"><div><b>Nombre del Proyecto</b><small>Responsable · 0% de avance</small></div></div>' +
      '<div class="pbody">' +
      '<div class="pblock"><div class="rowb" style="margin-bottom:8px"><span class="chip tl xs">En curso</span><span class="mono">0%</span></div><div class="bar"><i style="width:0%"></i></div><p class="lead" style="margin-top:8px">Objetivo o descripción del proyecto seleccionado.</p></div>' +
      '<div class="pblock"><label class="lbl">Hitos</label><p class="mono">Sin hitos todavía.</p></div>' +
      '<div class="pblock"><label class="lbl">Archivos vinculados</label><p class="mono">Sin archivos vinculados.</p></div>' +
      '<div class="pfoot"><button class="btn p full">' + ic('spark') + 'Trabajar con MÍA</button></div>' +
      '</div></aside>';
  }

  var est = estadoProyecto(p);
  var hitos = p.hitos || [], arch = p.arch || [];
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(p.n) + '</b><small>' + esc(p.resp || 'Sin responsable') + ' · ' + p.pct + '% de avance</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    '<div class="pblock">' +
      '<div class="rowb" style="margin-bottom:10px"><span class="chip ' + est.k + ' xs">' + est.n + '</span>' +
      '<span class="mono">' + p.pct + '%</span></div>' +
      '<div class="bar"><i style="width:' + p.pct + '%"></i></div>' +
      (p.obj ? '<p class="lead" style="margin-top:12px">' + esc(p.obj) + '</p>' : '') +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Hitos</label>' +
      (hitos.length
        ? hitos.map(function (h, i) {
            return '<label class="ck' + (h.ok ? ' on' : '') + '"><input type="checkbox" data-h="' + i + '"' + (h.ok ? ' checked' : '') + '><span>' + esc(h.t) + (h.f ? '<i>' + esc(fLegible(h.f)) + '</i>' : '') + '</span></label>';
          }).join('')
        : '<p class="mono">Sin hitos todavía.</p>') +
      '<button class="btn sm full" style="margin-top:8px" data-accion="addh">' + ic('plus') + 'Agregar hito</button>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Archivos vinculados</label>' +
      (arch.length
        ? arch.map(function (a) { return '<div class="actl">' + ic('file') + '<div><b>' + esc(a.n) + '</b><small>' + esc(a.d || '') + '</small></div></div>'; }).join('')
        : '<p class="mono">Sin archivos vinculados.</p>') +
      '<button class="btn sm full" style="margin-top:8px" data-accion="adda">' + ic('plus') + 'Vincular archivo</button>' +
    '</div>' +

    '<div class="pfoot">' +
      '<button class="btn p full" data-accion="chat">' + ic('spark') + 'Trabajar con MÍA en este proyecto</button>' +
      '<button class="btn g full" data-accion="borrar">' + ic('trash') + 'Eliminar proyecto</button>' +
    '</div>' +
    '</div></aside>';
}

async function cargarProyectos() {
  const r = await apiFetch('/api/proyectos');
  if (r.ok && r.data && r.data.ok) {
    ESTADO.proyectos = r.data.proyectos || [];
    ESTADO.seq = r.data.seq || 0;
  } else {
    try {
      var saved = localStorage.getItem('naveia_proyectos');
      if (saved) { var parsed = JSON.parse(saved); ESTADO.proyectos = parsed.proyectos || []; ESTADO.seq = parsed.seq || 0; }
    } catch (e) {}
  }
  if (UI.sel != null && !proyecto(UI.sel)) UI.sel = null;
  render();
}

function bind() {
  $$('.pc').forEach(function (c) {
    c.onclick = function (e) {
      if (e.target.closest('[data-accion],[data-cerrar]')) return;
      e.stopPropagation();
      var id = c.getAttribute('data-p');
      UI.sel = (String(UI.sel) === String(id)) ? null : id;
      render();
    };
  });

  $$('[data-cerrar]').forEach(function (b) {
    b.onclick = function (e) { e.stopPropagation(); UI.sel = null; render(); };
  });

  $$('[data-accion]').forEach(function (b) {
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); accion(b.getAttribute('data-accion')); };
  });

  var p = proyecto(UI.sel);
  if (p) {
    $$('[data-h]').forEach(function (b) {
      b.onchange = async function () {
        var idx = Number(b.getAttribute('data-h'));
        var h = p.hitos[idx];
        if (!h) return;
        var prev = h.ok; h.ok = b.checked;
        var r = await apiFetch('/api/proyectos/actualizar', { method: 'POST', body: { id: p.id, proyecto: { hitos: p.hitos } } });
        if (!(r.ok && r.data && r.data.ok)) { h.ok = prev; toast('No se pudo guardar.', 'alert'); }
        render();
      };
    });
  }
}

async function accion(a) {
  if (a === 'nuevo') return nuevoProyecto();
  if (a === 'borrar') return borrarProyecto();
  if (a === 'addh') return agregarHito();
  if (a === 'adda') return vincularArchivo();
  if (a === 'chat') { toast('Este módulo abriría el chat con el proyecto activo.', 'spark'); return; }
}

function nuevoProyecto() {
  modal('<h2>Nuevo proyecto</h2>' +
    '<div class="form" style="margin-top:12px">' +
      '<label class="lbl">Nombre</label><input class="inp" id="pn">' +
      '<label class="lbl" style="margin-top:10px">Objetivo</label><textarea class="ta" id="po" rows="3"></textarea>' +
      '<label class="lbl" style="margin-top:10px">Responsable</label><input class="inp" id="pr">' +
      '<label class="lbl" style="margin-top:10px">Avance inicial</label><input class="inp" id="pp" type="number" min="0" max="100" value="0">' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okNuevo">Crear proyecto</button></div>');
  $('#modal #okNuevo').onclick = async function () {
    var n = $('#pn').value.trim(); if (!n) { toast('Poné un nombre.', 'alert'); return; }
    var nuevo = { n: n, obj: $('#po').value.trim(), resp: $('#pr').value.trim(), pct: Math.max(0, Math.min(100, Number($('#pp').value) || 0)), hitos: [], arch: [] };
    var r = await apiFetch('/api/proyectos/crear', { method: 'POST', body: { proyecto: nuevo } });
    if (r.ok && r.data && r.data.ok) { UI.sel = null; cerrarModal(); await cargarProyectos(); toast('Proyecto creado.', 'folder'); }
  };
}

function borrarProyecto() {
  var p = proyecto(UI.sel); if (!p) return;
  modal('<h2>¿Eliminar este proyecto?</h2>' +
    '<p class="lead" style="margin:8px 0 0">«' + esc(p.n) + '» se borra. Los hitos y archivos vinculados también.</p>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okBorrar">Eliminar</button></div>');
  $('#modal #okBorrar').onclick = async function () {
    var r = await apiFetch('/api/proyectos/eliminar', { method: 'POST', body: { id: p.id } });
    if (r.ok && r.data && r.data.ok) { UI.sel = null; cerrarModal(); await cargarProyectos(); toast('Proyecto eliminado.', 'trash'); }
  };
}

function agregarHito() {
  var p = proyecto(UI.sel); if (!p) return;
  modal('<h2>Agregar hito</h2>' +
    '<div class="form" style="margin-top:12px">' +
      '<label class="lbl">Qué tiene que pasar</label><input class="inp" id="hn">' +
      '<label class="lbl" style="margin-top:10px">Fecha</label><input class="inp" id="hf" type="date" value="' + fISO(dmas(14)) + '">' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okH">Agregar</button></div>');
  $('#modal #okH').onclick = async function () {
    var t = $('#hn').value.trim(); if (!t) return;
    p.hitos = p.hitos || []; p.hitos.push({ t: t, ok: false, f: $('#hf').value });
    var r = await apiFetch('/api/proyectos/actualizar', { method: 'POST', body: { id: p.id, proyecto: { hitos: p.hitos } } });
    if (r.ok && r.data && r.data.ok) { cerrarModal(); render(); toast('Hito agregado.', 'flag'); }
  };
}

function vincularArchivo() {
  var p = proyecto(UI.sel); if (!p) return;
  modal('<h2>Vincular archivo</h2>' +
    '<div class="form" style="margin-top:12px">' +
      '<label class="lbl">Nombre del archivo</label><input class="inp" id="an">' +
      '<label class="lbl" style="margin-top:10px">Detalle</label><input class="inp" id="ad" placeholder="versión vigente">' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okA">Vincular</button></div>');
  $('#modal #okA').onclick = async function () {
    var n = $('#an').value.trim(); if (!n) return;
    p.arch = p.arch || []; p.arch.push({ n: n, d: $('#ad').value.trim() });
    var r = await apiFetch('/api/proyectos/actualizar', { method: 'POST', body: { id: p.id, proyecto: { arch: p.arch } } });
    if (r.ok && r.data && r.data.ok) { cerrarModal(); render(); toast('Archivo vinculado.', 'file'); }
  };
}

function render() {
  var cont = document.getElementById('view'); if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaProyectos() + '</div>';
  bind();
}

var _initDone = false;
function init() { if (_initDone) return; _initDone = true; cargarProyectos(); }
document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();
try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'MODULE_READY', module: 'proyectos' }, '*'); } catch (e) {}
})();