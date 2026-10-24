(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  bell:    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  mail:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  task:    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  right:   '<path d="m9 6 6 6-6 6"/>'
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

/* =====================================================================
   TIPOS DE NOTIFICACIÓN
   ===================================================================== */
var TIPOS = {
  email:    { n: 'Correo',         ico: 'mail',    col: 'am' },
  tarea:    { n: 'Tarea',          ico: 'task',    col: 'cy' },
  agente:   { n: 'Agente',         ico: 'users',   col: 'vi' },
  documento:{ n: 'Documento',      ico: 'file',    col: 'bl' },
  sistema:  { n: 'Sistema',        ico: 'info',    col: 'gr' },
  alerta:   { n: 'Alerta',         ico: 'alert',   col: 'rd' },
  ia:       { n: 'MÍA',            ico: 'spark',   col: 'tl' },
  aprobacion:{ n: 'Aprobación',    ico: 'lock',    col: 'am' },
  recordatorio:{ n: 'Recordatorio',ico: 'clock',   col: 'bl' }
};

var FILTROS = [
  { id: 'todas',      n: 'Todas' },
  { id: 'no-leidas',  n: 'No leídas' },
  { id: 'menciones',  n: 'Menciones' },
  { id: 'sistema',    n: 'Sistema' }
];

/* =====================================================================
   ESTADO
   ===================================================================== */
var ESTADO = {
  notificaciones: [],
  seq: 0
};

var UI = { filtro: 'todas' };

function nuevaId() { return 'N' + (++ESTADO.seq); }

function filtradas() {
  var f = UI.filtro || 'todas';
  var l = ESTADO.notificaciones.slice();
  if (f === 'no-leidas') l = l.filter(function (n) { return !n.leida; });
  if (f === 'menciones') l = l.filter(function (n) { return n.mencion; });
  if (f === 'sistema')   l = l.filter(function (n) { return n.tipo === 'sistema' || n.tipo === 'alerta'; });
  return l;
}

function noLeidas() { return ESTADO.notificaciones.filter(function (n) { return !n.leida; }).length; }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaNotificaciones() {
  var todas = ESTADO.notificaciones;
  var sin = noLeidas();
  var criticas = todas.filter(function (n) { return n.tipo === 'alerta' && !n.leida; }).length;
  var menciones = todas.filter(function (n) { return n.mencion; }).length;
  var f = UI.filtro || 'todas';
  var lista = filtradas();

  var html = '<div class="ph"><h1>Notificaciones</h1>' +
    '<p class="sub">Todo lo que pasó en el espacio, ordenado por prioridad. Lo que está sin leer aparece primero.</p>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('bell') + todas.length + ' en total</span>' +
      (sin ? '<span class="chip tl">' + ic('info') + sin + ' sin leer</span>' : '<span class="chip gr">' + ic('check') + 'Todo leído</span>') +
      (criticas ? '<span class="chip rd">' + ic('alert') + criticas + ' críticas</span>' : '') +
      (menciones ? '<span class="chip bl">' + ic('users') + menciones + ' menciones</span>' : '') +
    '</div>' +
    '<div class="rowb" style="margin-top:14px">' +
      '<div class="chips">' +
        FILTROS.map(function (x) {
          var cnt = x.id === 'no-leidas' ? sin : (x.id === 'menciones' ? menciones : null);
          return '<button class="chip' + (f === x.id ? ' on' : '') + '" data-filtro="' + x.id + '">' +
            esc(x.n) + (cnt != null ? ' · ' + cnt : '') + '</button>';
        }).join('') +
      '</div>' +
      '<div class="chips">' +
        (sin ? '<button class="btn xs" data-accion="marcar-todas">' + ic('check') + 'Marcar todas como leídas</button>' : '') +
        (todas.length ? '<button class="btn xs gh" data-accion="limpiar">' + ic('x') + 'Limpiar leídas</button>' : '') +
      '</div>' +
    '</div></div>' +

    '<div class="nkpis">' +
      kpi('todas',      'Todas',       todas.length, '',   'en total') +
      kpi('no-leidas',  'Sin leer',    sin,          'tl', 'pendientes') +
      kpi('menciones',  'Menciones',   menciones,    'bl', 'donde te nombran') +
      kpi('sistema',    'Sistema',     todas.filter(function (n) { return n.tipo === 'sistema' || n.tipo === 'alerta'; }).length, 'gr', 'avisos del sistema') +
    '</div>' +

    (lista.length
      ? '<div class="nlist" id="nlist">' + lista.map(fila).join('') + '</div>'
      : '<div class="empty">' + ic('bell') + (f === 'todas' ? 'No hay notificaciones todavía.' : 'Sin notificaciones con este filtro.') + '</div>');

  return html;
}

function kpi(id, et, n, k, sub) {
  var on = (UI.filtro || 'todas') === id;
  return '<button class="nkpi ' + k + (on ? ' on' : '') + '" data-filtro="' + id + '">' +
    '<small>' + esc(et) + '</small><b>' + n + '</b><em>' + esc(sub) + '</em></button>';
}

function fila(n) {
  var t = TIPOS[n.tipo] || TIPOS.sistema;
  return '<article class="nrow' + (n.leida ? ' leida' : '') + '" data-n="' + n.id + '">' +
    '<span class="nico ' + t.col + '">' + ic(t.ico) + '</span>' +
    '<div class="ntx">' +
      '<b>' + esc(n.t) + '</b>' +
      (n.d ? '<p>' + esc(n.d) + '</p>' : '') +
      '<div class="nmeta">' +
        '<span>' + ic('clock') + esc(n.cuando || 'hace un momento') + '</span>' +
        (n.modulo ? '<span>' + ic('right') + esc(n.modulo) + '</span>' : '') +
        '<span>' + esc(t.n) + '</span>' +
        (n.mencion ? '<span class="chip xs bl">' + ic('users') + 'Mención</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="nact">' +
      (!n.leida ? '<span class="ndot" title="Sin leer"></span>' : '') +
      '<button class="xbtn" data-accion="cerrar" data-n="' + n.id + '" title="Descartar">' + ic('x') + '</button>' +
    '</div>' +
  '</article>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('[data-filtro]').forEach(function (b) {
    b.onclick = function () { UI.filtro = b.getAttribute('data-filtro'); render(); };
  });

  $$('.nrow').forEach(function (r) {
    r.addEventListener('click', function (e) {
      if (e.target.closest('[data-accion]')) return;
      marcarLeida(r.getAttribute('data-n'));
    });
  });

  $$('[data-accion]').forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var a = b.getAttribute('data-accion');
      if (a === 'marcar-todas') marcarTodas();
      if (a === 'limpiar')      limpiarLeidas();
      if (a === 'cerrar')       cerrar(b.getAttribute('data-n'));
    };
  });
}

function marcarLeida(id) {
  var n = ESTADO.notificaciones.filter(function (x) { return x.id === id; })[0];
  if (!n || n.leida) return;
  n.leida = true;
  render();
  actualizarBadge();
}

function marcarTodas() {
  ESTADO.notificaciones.forEach(function (n) { n.leida = true; });
  render();
  actualizarBadge();
  toast('Todas marcadas como leídas.', 'check');
}

function limpiarLeidas() {
  ESTADO.notificaciones = ESTADO.notificaciones.filter(function (n) { return !n.leida; });
  render();
  actualizarBadge();
  toast('Notificaciones leídas eliminadas.', 'x');
}

function cerrar(id) {
  ESTADO.notificaciones = ESTADO.notificaciones.filter(function (n) { return n.id !== id; });
  render();
  actualizarBadge();
  toast('Notificación descartada.', 'x');
}

/* =====================================================================
   AÑADIR NOTIFICACIONES (API pública del módulo)
   ===================================================================== */
function añadirNotificacion(n) {
  if (!n || !n.t) return;
  var notif = {
    id: nuevaId(),
    t: n.t,
    d: n.d || '',
    tipo: n.tipo || 'sistema',
    cuando: n.cuando || 'hace un momento',
    modulo: n.modulo || '',
    leida: false,
    mencion: !!n.mencion
  };
  ESTADO.notificaciones.unshift(notif);
  if (ESTADO.notificaciones.length > 200) ESTADO.notificaciones.length = 200;
  render();
  actualizarBadge();
  return notif;
}

/* Notifica al shell para que actualice el puntito ámbar */
function actualizarBadge() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'NOTIF_COUNT',
        count: noLeidas()
      }, '*');
    }
  } catch (e) {}
}

/* Recibe notificaciones desde el shell */
window.addEventListener('message', function (e) {
  var d = e.data || {};
  if (!d.type) return;
  if (d.type === 'NOTIF' && d.notif) añadirNotificacion(d.notif);
  if (d.type === 'NOTIF_CLEAR') {
    ESTADO.notificaciones = [];
    render();
    actualizarBadge();
  }
});

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaNotificaciones() + '</div>';
  bind();
}
function init() {
  render();
  actualizarBadge();
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'notificaciones' }, '*');
  }
} catch (e) {}

})();