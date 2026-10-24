(function () {
'use strict';

var IC = {
  gear:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  build:   '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6"/>',
  bell:    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  plug:    '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  credit:  '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 0-3 2 2 0 0 1 0-4h2a6 6 0 0 0 0-11h-2z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/>',
  bot:     '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M9 18h6"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};
function ic(n, c) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (c ? ' class="' + c + '"' : '') + '>' + (IC[n] || '') + '</svg>';
}
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(t) {
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ⭐ LEER EL ROL DEL USUARIO LOGUEADO
var USUARIO_ACTUAL = null;
try {
  var sesionStr = sessionStorage.getItem('usuario_actual');
  if (sesionStr) USUARIO_ACTUAL = JSON.parse(sesionStr);
} catch (e) {}

var ES_ADMIN = USUARIO_ACTUAL && USUARIO_ACTUAL.rol === 'admin';

var SUBMODULOS = {
  'perfil':           { src: 'modulos_C/Perfil/Perfil.html', title: 'Perfil' },
  'empresa':          { src: 'modulos_C/Empresa/Empresa.html', title: 'Empresa' },
  'temas':            { src: 'modulos_C/Temas_Personalizacion/Temas_Personalizacion.html', title: 'Temas y personalización' },
  'asistente':        { src: 'modulos_C/Asistente/Asistente.html', title: 'Asistente MÍA' },
  'notificaciones':   { src: 'modulos_C/Notificaciones/Notificaciones.html', title: 'Notificaciones' },
  'privacidad':       { src: 'modulos_C/Privacidad/Privacidad.html', title: 'Privacidad y datos' },
  'integraciones':    { src: 'modulos_C/Integraciones/Integraciones.html', title: 'Integraciones' },
  'usuarios':         { src: 'modulos_C/Usuarios/Usuarios.html', title: 'Usuarios y Accesos' },
  'usuarios-recursos':{ src: 'modulos_C/Usuarios_Recursos/Usuarios_Recursos.html', title: 'Usuarios y Recursos' },
  'equipo':           { src: 'modulos_C/Equipo/Equipo.html', title: 'Equipo y accesos' },
  'facturacion':      { src: 'modulos_C/Facturacion/Facturacion.html', title: 'Facturación' },
  'avanzado':         { src: 'modulos_C/Avanzado/Avanzado.html', title: 'Avanzado' }
};

// ⭐ FILTRAR SECCIONES SEGÚN EL ROL
var SECCIONES_BASE = [
  { id: 'perfil',            n: 'Perfil',                    ico: 'user' },
  { id: 'empresa',           n: 'Empresa',                   ico: 'build' },
  { id: 'temas',             n: 'Temas y personalización',   ico: 'palette' },
  { id: 'asistente',         n: 'Asistente',                 ico: 'bot' },
  { id: 'notificaciones',    n: 'Notificaciones',            ico: 'bell' },
  { id: 'privacidad',        n: 'Privacidad y datos',        ico: 'shield' },
  { id: 'integraciones',     n: 'Integraciones',             ico: 'plug' },
  { id: 'usuarios',          n: 'Usuarios y Accesos',        ico: 'lock', solo_admin: true },
  { id: 'usuarios-recursos', n: 'Usuarios y Recursos',       ico: 'users', solo_admin: true },
  { id: 'equipo',            n: 'Equipo y accesos',          ico: 'users' },
  { id: 'facturacion',       n: 'Facturación',               ico: 'credit' },
  { id: 'avanzado',          n: 'Avanzado',                  ico: 'gear', sep: true }
];

var SECCIONES = SECCIONES_BASE.filter(function (s) {
  if (s.solo_admin && !ES_ADMIN) return false;
  return true;
});

var UI = { seccion: SECCIONES.length > 0 ? SECCIONES[0].id : 'perfil' };

function vistaConfig() {
  return '<div class="ph"><h1>Configuración</h1></div>' +
    '<div class="cfg-wrap">' +
      '<nav class="cfg-nav" id="cfgNav">' +
        SECCIONES.map(function (s) {
          return (s.sep ? '<hr>' : '') +
            '<button type="button" data-sec="' + s.id + '"' + (UI.seccion === s.id ? ' class="on"' : '') + '>' +
              ic(s.ico, 'i') +
              '<span>' + esc(s.n) + '</span>' +
            '</button>';
        }).join('') +
      '</nav>' +
      '<div class="cfg-body" id="cfgBody"></div>' +
    '</div>';
}

function renderSeccion() {
  var el = $('#cfgBody'); if (!el) return;
  el.classList.add('solo-frame');
  
  var s = UI.seccion;
  var sub = SUBMODULOS[s];
  
  if (sub) {
    el.innerHTML = '<div class="cfg-frame-wrap">' +
      '<div class="cfg-frame-hd">' + ic('info') + '<span>Submódulo: <b>' + esc(sub.title) + '</b></span></div>' +
      '<div class="cfg-frame-body">' +
        '<iframe src="' + esc(sub.src) + '" title="' + esc(sub.title) + '"></iframe>' +
      '</div>' +
    '</div>';
  } else {
    el.innerHTML = '<div class="note am">Módulo no encontrado.</div>';
  }
}

function bind() {
  $$('#cfgNav [data-sec]').forEach(function (b) {
    b.onclick = function () {
      UI.seccion = b.getAttribute('data-sec');
      $$('#cfgNav [data-sec]').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      renderSeccion();
    };
  });
}

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaConfig() + '</div>';
  renderSeccion();
  bind();
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();
})();