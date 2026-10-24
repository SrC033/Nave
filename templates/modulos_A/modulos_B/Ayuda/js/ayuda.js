(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  help:    '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.5a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.5-2.8 4"/><path d="M12 17.5h.01"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  chip:    '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
  cloud:   '<path d="M6.5 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5 1.4A3.8 3.8 0 0 1 17.5 18h-11z"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.2-6.5L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16"/><path d="M3 21v-5h5"/>',
  up:      '<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M4 4h16"/>',
  down:    '<path d="m6 9 6 6 6-6"/>',
  build:   '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6"/>',
  db:      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  play:    '<path d="M7 4.5 19 12 7 19.5v-15z"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  mail:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
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
   DATOS: esquema vacío. Poblar desde fuera o aquí.
   ===================================================================== */

var FAQ = [
  { p: '¿MÍA envía correos sin que yo lo apruebe?',
    r: 'No. Todo lo que MÍA redacta queda como borrador. El envío es una acción con aprobación.' },
  { p: '¿Quién puede publicar un documento oficial?',
    r: 'Solo un responsable autorizado. Cualquier persona puede proponer un documento; la publicación queda en la bandeja del responsable del área.' },
  { p: '¿Qué información sale de la empresa?',
    r: 'Lo que la política de enrutamiento permita. Todo lo clasificado como restringido se responde con el modelo del nodo propio y nunca se envía a un proveedor externo.' },
  { p: '¿Se cobra por usuario?',
    r: 'No. El espacio se licencia por empresa y por caso de uso. Sumar personas no aumenta el costo.' },
  { p: '¿Qué pasa si cambio de modelo de IA?',
    r: 'La memoria empresarial y el conocimiento no se mueven: viven en tu espacio, no dentro del modelo.' },
  { p: '¿Cómo reinicio este demo?',
    r: 'Con «Reiniciar datos de ejemplo». Se borra todo lo que hayas creado en la sesión y vuelve al estado inicial.' }
];

var USUARIOS = [
  { nombre: 'Administrador', ini: 'AD', rol: 'Administrador', cargo: 'Director', depto: '—', mods: 9,
    restr: { restringidos: true, nube: true, enviar: true, deptoOnly: false } }
];

var ENRUTAMIENTO = [
  { k: 'local_s', n: 'Modelo local · consulta simple',      d: 'DGX Spark',                 loc: 1, lat: '0,9 s (ref.)', costo: 'sin costo marginal', cuando: 'dato puntual de un solo documento' },
  { k: 'local_m', n: 'Modelo local · contexto extenso',     d: 'DGX Spark',                 loc: 1, lat: '1,7 s (ref.)', costo: 'sin costo marginal', cuando: 'hay que ubicar un pasaje en un documento largo' },
  { k: 'local_f', n: 'Modelo local · dato restringido',     d: 'DGX Spark',                 loc: 1, lat: '1,1 s (ref.)', costo: 'sin costo marginal', cuando: 'la fuente está clasificada como restringida' },
  { k: 'nube_r',  n: 'Modelo local · razonamiento',         d: 'DGX Spark · modelo grande', loc: 1, lat: '2,4 s (ref.)', costo: 'sin costo marginal', cuando: 'cruza documentos o pide una decisión' },
  { k: 'nube_g',  n: 'Modelo local · conocimiento general', d: 'DGX Spark · sin contexto',  loc: 1, lat: '1,4 s (ref.)', costo: 'sin costo marginal', cuando: 'pregunta general, sin contexto interno' },
  { k: 'charla',  n: 'Modelo local · conversación',         d: 'DGX Spark',                 loc: 1, lat: '0,3 s (ref.)', costo: 'sin costo marginal', cuando: 'conversación, saludo o cortesía' },
  { k: 'bloqueo', n: 'Consulta bloqueada',                  d: 'No se procesó',             loc: 1, lat: '0,1 s',        costo: 'sin costo',          cuando: 'el perfil no tiene acceso a la fuente: no se procesa' }
];

var EMPRESA = {
  datos: {
    razon: '—', giro: '—', sede: '—', colab: '—',
    nodo: '—', red: '—', plan: '—', alta: '—',
    admin: '—', respaldo: '—'
  },
  deptos: []
};

var UI = { tab: 'faq', faq: null };

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaAyuda() {
  var tab = UI.tab || 'faq';
  return '<div class="ph"><h1>Ayuda</h1>' +
    '<p class="sub">Cómo funciona el espacio, quién ve qué y dónde corre cada consulta. Sin letra chica.</p></div>' +

    '<div class="tabs">' +
      ['faq', 'Preguntas frecuentes', 'help'],
      ['usuarios', 'Usuarios y permisos', 'users'],
      ['router', 'Política de enrutamiento', 'chip'],
      ['empresa', 'Mi empresa', 'build']
    .reduce(function (acc, x, i, arr) {
      if (i % 3 === 0) acc.push([x, arr[i + 1], arr[i + 2]]);
      return acc;
    }, []).map(function (t) {
      return '<button class="tab' + (tab === t[0] ? ' on' : '') + '" data-ay="' + t[0] + '">' + ic(t[2]) + esc(t[1]) + '</button>';
    }).join('') +
    '</div>' +

    (tab === 'faq' ? vFaq() : tab === 'usuarios' ? vUsuarios() : tab === 'router' ? vRouter() : vEmpresa()) +

    '<div class="card" style="margin-top:22px"><div class="rowb">' +
      '<div><b>Reiniciar los datos de ejemplo</b>' +
      '<p class="lead" style="margin:4px 0 0">Borra todo lo que creaste en esta sesión y vuelve al estado inicial. Lo que hacés en el demo vive solo en esta pestaña: nada se guarda ni sale del dispositivo.</p></div>' +
      '<button class="btn g" data-accion="reiniciar">' + ic('refresh') + 'Reiniciar datos</button>' +
    '</div></div>';
}

function vFaq() {
  if (!FAQ.length) return '<div class="empty">' + ic('help') + 'Sin preguntas cargadas todavía.</div>';
  return '<div class="stack">' + FAQ.map(function (a, i) {
    var open = UI.faq === i;
    return '<div class="card faq' + (open ? ' open' : '') + '" data-q="' + i + '">' +
      '<div class="rowb"><b>' + esc(a.p) + '</b>' + ic(open ? 'up' : 'down', 'fch') + '</div>' +
      (open ? '<p class="lead" style="margin:10px 0 0">' + esc(a.r) + '</p>' : '') +
    '</div>';
  }).join('') + '</div>';
}

function vUsuarios() {
  var etq = [['restringidos', 'Documentos restringidos'], ['nube', 'Destinos en la nube'], ['enviar', 'Envío hacia afuera'], ['deptoOnly', 'Limitado a su área']];
  if (!USUARIOS.length) return '<div class="empty">' + ic('users') + 'Sin usuarios cargados.</div>';
  return '<p class="lead" style="margin-bottom:16px">El espacio no se cobra por usuario: todos entran. Lo que cambia es qué ve cada uno.</p>' +
    '<div class="card tight"><table class="tbl"><thead><tr>' +
      '<th>Persona</th><th>Rol</th><th>Área</th><th>Módulos</th><th>Permisos sensibles</th>' +
    '</tr></thead><tbody>' +
    USUARIOS.map(function (u) {
      var r = u.restr || {};
      return '<tr><td><span class="av s">' + esc(u.ini) + '</span><b>' + esc(u.nombre) + '</b>' +
        '<span class="tsub">' + esc(u.cargo) + '</span></td>' +
        '<td>' + esc(u.rol) + '</td>' +
        '<td>' + esc(u.depto) + '</td>' +
        '<td>' + (u.mods || 0) + '</td>' +
        '<td><div class="chips">' + etq.map(function (e) {
          var on = !!r[e[0]];
          if (e[0] === 'deptoOnly') return on ? '<span class="chip am xs">' + ic('lock') + e[1] + '</span>' : '';
          return '<span class="chip ' + (on ? 'gr' : 'rd') + ' xs">' + ic(on ? 'check' : 'x') + e[1] + '</span>';
        }).join('') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="note tl" style="margin-top:16px">' + ic('info') + '<div>Los permisos de este demo son de lectura: muestran la lógica, no la editan. En el espacio real se cambian desde acá y aplican en la siguiente consulta.</div></div>';
}

function vRouter() {
  return '<p class="lead" style="margin-bottom:16px">No desarrollamos un router: seleccionamos uno maduro y le cargamos <b>nuestras reglas</b>. La primera regla es la que importa: si el dato está clasificado como restringido, los destinos en la nube se eliminan <b>antes</b> de enrutar.</p>' +
    '<div class="card tight"><table class="tbl"><thead><tr>' +
      '<th>Nivel</th><th>Dónde corre</th><th>Latencia</th><th>Costo</th><th>Cuándo se elige</th>' +
    '</tr></thead><tbody>' +
    ENRUTAMIENTO.map(function (n) {
      return '<tr><td><b>' + esc(n.n) + '</b></td>' +
        '<td><span class="chip ' + (n.loc ? 'tl' : 'am') + ' xs">' + ic(n.loc ? 'chip' : 'cloud') + esc(n.d) + '</span></td>' +
        '<td>' + esc(n.lat) + '</td>' +
        '<td>' + esc(n.costo) + '</td>' +
        '<td>' + esc(n.cuando) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +

    '<div class="rt-grid">' +
      '<div class="rt-note">' + ic('chip') + '<b>Qué nunca sale del nodo</b>Contratos, tarifas, convenios, expedientes, penalidades, adendas, nómina y datos de proveedores. En producción la regla sale de la clasificación de cada documento en el servidor, no solo de palabras clave.</div>' +
      '<div class="rt-note">' + ic('cloud') + '<b>Qué puede salir y cómo</b>Solo el brief de marca para marketing (nombre, tono, colores y la promoción) y las pruebas del equipo de demos. Nunca documentos, clientes ni la base de conocimiento.</div>' +
    '</div>' +
    '<div class="note vi" style="margin-top:16px">' + ic('spark') + '<div><b>Qué modelo responde</b> El navegador decide el nivel, filtra lo que la persona no puede ver y nunca manda lo restringido a un destino en la nube. En producción los niveles locales corren en la DGX Spark a través de LiteLLM.</div></div>';
}

function vEmpresa() {
  var dd = EMPRESA.datos, et = {
    razon: 'Razón social', giro: 'Giro', sede: 'Sede', colab: 'Personas',
    nodo: 'Dónde corre', red: 'Red y datos', plan: 'Plan', alta: 'Alta',
    admin: 'Administrador', respaldo: 'Respaldo'
  };
  return '<div class="grid g2">' +
    '<article class="card"><b>Datos del espacio</b>' +
      Object.keys(et).map(function (k) {
        return '<div class="kv" style="display:grid;grid-template-columns:110px 1fr;gap:8px 12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);align-items:start">' +
          '<span style="color:var(--dim);font-size:12px">' + esc(et[k]) + '</span>' +
          '<b style="font-weight:500;font-size:13px;color:var(--white)">' + esc(dd[k] || '—') + '</b></div>';
      }).join('') +
    '</article>' +
    '<article class="card"><b>Áreas y qué usan</b>' +
      (EMPRESA.deptos.length
        ? EMPRESA.deptos.map(function (x) {
            return '<div class="dep"><div class="rowb"><b>' + esc(x.n) + '</b>' +
              (x.p ? '<span class="chip xs">' + x.p + ' personas</span>' : '') + '</div>' +
              '<small>' + esc(x.jefe || '—') + (x.usa ? ' · ' + esc(x.usa) : '') + '</small>' +
              (x.docs && x.docs.length
                ? '<div class="chips">' + x.docs.slice(0, 4).map(function (c) { return '<span class="chip xs">' + esc(c) + '</span>'; }).join('') +
                  (x.docs.length > 4 ? '<span class="chip xs">+' + (x.docs.length - 4) + '</span>' : '') + '</div>'
                : '') +
            '</div>';
          }).join('')
        : '<div class="empty">' + ic('build') + 'Sin áreas cargadas.</div>') +
    '</article>' +
  '</div>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('[data-ay]').forEach(function (b) { b.onclick = function () { UI.tab = b.getAttribute('data-ay'); render(); }; });
  $$('[data-q]').forEach(function (c) {
    c.onclick = function () {
      var i = Number(c.getAttribute('data-q'));
      UI.faq = UI.faq === i ? null : i;
      render();
    };
  });
  $$('[data-accion]').forEach(function (b) { b.onclick = function () { accion(b.getAttribute('data-accion')); }; });
}

function accion(a) {
  if (a === 'reiniciar') {
    modal('<h2>¿Reiniciar los datos de ejemplo?</h2>' +
      '<p class="lead" style="margin:8px 0 0">Se borra todo lo que creaste en esta sesión y el espacio vuelve al estado inicial.</p>' +
      '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="ok">Sí, reiniciar</button></div>');
    $('#modal #ok').onclick = function () {
      cerrarModal();
      toast('Datos de ejemplo restaurados.', 'refresh');
    };
  }
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaAyuda() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'ayuda' }, '*');
  }
} catch (e) {}

})();