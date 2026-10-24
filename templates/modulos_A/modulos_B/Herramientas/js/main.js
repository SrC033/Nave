(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  grid:    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  play:    '<path d="M7 4.5 19 12 7 19.5v-15z"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  chart:   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  db:      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  chip:    '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
  cloud:   '<path d="M6.5 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5 1.4A3.8 3.8 0 0 1 17.5 18h-11z"/>',
  tool:    '<path d="M14.5 6.5a4 4 0 1 0 3 6.9L20 16v4h-4l-2.6-2.6a4 4 0 0 1-6.9-3L4 12l4-4 2.5 2.5"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  left:    '<path d="m15 6-6 6 6 6"/>',
  down:    '<path d="m6 9 6 6 6-6"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  ext:     '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
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
   CATÁLOGO DE HERRAMIENTAS
   ---------------------------------------------------------------------
   Cada herramienta tiene: id, nombre, tipo, color, descripción, capacidades
   y estado (activa o catálogo). Edita esta lista para cambiar el catálogo.
   ===================================================================== */

var HERRAMIENTAS = [
  {
    id: 'commandteks', n: 'COMMANDTEKS', t: 'Centro de mando 360 directivo', col: 'cy', act: true,
    d: 'Centro de mando 360 para dirección: liquidez, fiscal, comercial, operaciones, alertas predictivas, aprobaciones y consola de comandos. También se abre escribiendo «abrir COMMANDTEKS» en el chat.',
    cap: ['Tablero directivo con escenarios y pronóstico', 'Alertas que se convierten en tareas y firmas de aprobación', 'Bitácora inmutable y consola de comandos']
  },
  {
    id: 'salesteks', n: 'SALESTEKS', t: 'Espacio de trabajo comercial', col: 'tl', act: true,
    d: 'Seguimiento de oportunidades con la propuesta, el historial y la próxima acción en un solo lugar.',
    cap: ['Embudo por etapa', 'Propuestas generadas con la información oficial', 'Próxima acción con responsable y fecha']
  },
  {
    id: 'simuteks', n: 'SIMUTEKS', t: 'Espacio de simulación', col: 'vi', act: true,
    d: 'Probá un escenario antes de decidir: qué pasa con el margen, el plazo o la carga de trabajo si cambiás una variable.',
    cap: ['Escenarios con variables propias', 'Comparación contra el plan actual', 'Supuestos visibles en cada resultado']
  },
  {
    id: 'docteks', n: 'DOCTEKS', t: 'Generación documental', col: 'bl', act: false,
    d: 'Convierte planillas y expedientes en documentos con formato propio de la empresa, citando el origen de cada cifra.',
    cap: ['Plantillas de la empresa', 'Anexo con el origen de cada dato', 'Control de versiones']
  },
  {
    id: 'flowteks', n: 'FLOWTEKS', t: 'Automatización de procesos', col: 'am', act: false,
    d: 'Encadena pasos que hoy se hacen a mano: recibir, clasificar, asignar, recordar y cerrar.',
    cap: ['Reglas por área', 'Disparadores desde correo y tareas', 'Bitácora de cada ejecución']
  },
  {
    id: 'voiceteks', n: 'VOICETEKS', t: 'Atención por voz', col: 'pk', act: false,
    d: 'Atiende llamadas y consultas por voz con la misma información oficial que usa el chat.',
    cap: ['Voz en español neutro y regional', 'Escalamiento a persona', 'Transcripción de cada llamada']
  }
];

var ESTADO = {
  herramientas: HERRAMIENTAS.map(function (h) { return { id: h.id, act: h.act }; })
};

function herr(id) { return HERRAMIENTAS.filter(function (h) { return h.id === id; })[0] || null; }
function herrEstado(id) {
  var h = ESTADO.herramientas.filter(function (x) { return x.id === id; })[0];
  if (!h) { h = { id: id, act: false }; ESTADO.herramientas.push(h); }
  return h;
}
function activas() { return HERRAMIENTAS.filter(function (h) { return herrEstado(h.id).act; }); }
function catalogo() { return HERRAMIENTAS.filter(function (h) { return !herrEstado(h.id).act; }); }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaHerramientas() {
  var act = activas(), cat = catalogo();
  return '<div class="ph"><h1>Herramientas</h1>' +
    '<p class="sub">Los espacios de trabajo que se suman al núcleo. Cada uno se habilita por empresa y por caso de uso, no por persona.</p>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip gr">' + ic('check') + act.length + ' activas en este espacio</span>' +
      '<span class="chip">' + ic('grid') + cat.length + ' en catálogo</span>' +
    '</div></div>' +

    '<div class="sec">Activas</div>' +
    '<div class="hgrid" style="margin-top:14px">' + act.map(tarjeta).join('') + '</div>' +

    '<div class="sec" style="margin-top:34px">Catálogo</div>' +
    '<p class="lead" style="margin-bottom:16px">Se activan cuando el caso de uso lo justifica. En el demo podés habilitarlas para ver cómo aparecen en el espacio.</p>' +
    '<div class="hgrid">' + cat.map(tarjeta).join('') + '</div>';
}

function tarjeta(h) {
  var st = herrEstado(h.id);
  return '<article class="hc' + (st.act ? '' : ' off') + '">' +
    '<div class="rowb"><span class="hlogo ' + h.col + '">' + esc(h.n.slice(0, 2)) + '</span>' +
    '<span class="chip ' + (st.act ? 'gr' : '') + ' xs">' + (st.act ? 'Activa' : 'Catálogo') + '</span></div>' +
    '<h3>' + esc(h.n) + '</h3>' +
    '<small class="hsub">' + esc(h.t) + '</small>' +
    '<p class="mp">' + esc(h.d) + '</p>' +
    '<ul class="caps">' + h.cap.map(function (c) { return '<li>' + ic('check') + esc(c) + '</li>'; }).join('') + '</ul>' +
    (st.act
      ? '<button class="btn p sm full" style="margin-top:14px" data-open="' + h.id + '">' + ic('ext') + 'Abrir</button>'
      : '<button class="btn sm full" style="margin-top:14px" data-on="' + h.id + '">' + ic('plus') + 'Activar en este espacio</button>') +
  '</article>';
}

/* =====================================================================
   MODALES DE LAS HERRAMIENTAS
   ===================================================================== */

function abrirHerramienta(id) {
  if (id === 'commandteks') return abrirCommandteks();
  if (id === 'salesteks')   return abrirSalesteks();
  if (id === 'simuteks')    return abrirSimuteks();
  var h = herr(id);
  modal('<div class="hhd"><span class="hlogo ' + h.col + '">' + esc(h.n.slice(0, 2)) + '</span>' +
    '<div><b>' + esc(h.n) + '</b><small>' + esc(h.t) + '</small></div></div>' +
    '<p class="lead">' + esc(h.d) + '</p>' +
    '<div class="note tl" style="margin-top:14px">' + ic('info') + '<div>En este demo la herramienta queda habilitada en el espacio, pero su pantalla completa todavía no es navegable.</div></div>' +
    '<div class="mact"><button class="btn p" data-x>Entendido</button></div>');
}

function abrirCommandteks() {
  modal('<div class="hhd"><span class="hlogo cy">CO</span><div><b>COMMANDTEKS</b><small>Centro de mando 360 directivo</small></div></div>' +
    '<p class="lead">El centro de mando de dirección con tablero 360, escenarios, alertas predictivas, aprobaciones y consola de comandos.</p>' +
    '<div class="caps" style="margin-top:14px">' +
      '<span>' + ic('check') + 'Liquidez, fiscal, comercial y operaciones en una sola vista</span>' +
      '<span>' + ic('check') + 'Alertas que se convierten en tareas y firmas de aprobación</span>' +
      '<span>' + ic('check') + 'Bitácora inmutable y consola de comandos</span>' +
    '</div>' +
    '<div class="note tl" style="margin-top:14px">' + ic('info') + '<div>En este demo podés ver el panorama y la consola de comandos. La versión completa se abre desde el chat con «abrir COMMANDTEKS».</div></div>' +
    '<div class="mact"><button class="btn gh" data-x>Cerrar</button><button class="btn p" id="okCmd">' + ic('play') + 'Probar la consola</button></div>', true);
  $('#modal #okCmd').onclick = function () { abrirConsola(); };
}

function abrirSalesteks() {
  var embudo = [
    { e: 'Contacto',            n: 6, v: 'referidos y consultas entrantes' },
    { e: 'Propuesta enviada',   n: 4, v: 'con tarifario vigente adjunto' },
    { e: 'Negociación',         n: 2, v: 'ajuste de plazo y volumen' },
    { e: 'Cerrada',             n: 1, v: 'pasa a operaciones' }
  ];
  modal('<div class="hhd"><span class="hlogo tl">SA</span><div><b>SALESTEKS</b><small>Espacio de trabajo comercial</small></div></div>' +
    '<p class="lead">Seguimiento de oportunidades con la propuesta, el historial y la próxima acción en un solo lugar.</p>' +
    '<div class="funnel">' + embudo.map(function (x, i) {
      return '<div class="fstep"><span class="fb">' + x.n + '</span><span class="fl">' + esc(x.e) + '</span><span class="fv">' + esc(x.v) + '</span></div>';
    }).join('') + '</div>' +
    '<div class="note tl" style="margin-top:14px">' + ic('spark') + '<div>Cada propuesta se arma con el documento vigente del Knowledge Hub. Si el precio no está en el tarifario, el agente escala en vez de improvisar.</div></div>' +
    '<div class="mact"><button class="btn gh" data-x>Cerrar</button></div>', true);
}

function abrirSimuteks() {
  var b = modal('<div class="hhd"><span class="hlogo vi">SI</span><div><b>SIMUTEKS</b><small>Espacio de simulación</small></div></div>' +
    '<p class="lead">Movés una variable y ves el efecto antes de decidir.</p>' +
    '<div class="simw" style="margin-top:16px">' +
      '<label class="lbl">Personas dedicadas al proceso<span id="v1">3</span></label><input type="range" id="s1" min="1" max="8" value="3">' +
      '<label class="lbl">Días de plazo comprometido<span id="v2">20 días</span></label><input type="range" id="s2" min="5" max="45" value="20">' +
      '<label class="lbl">Consultas por día<span id="v3">60</span></label><input type="range" id="s3" min="10" max="200" value="60">' +
      '<div class="simout" id="so"></div>' +
    '</div>' +
    '<div class="note am" style="margin-top:16px">' + ic('info') + '<div>Los supuestos quedan a la vista: 1 persona atiende 22 consultas por día, y cada consulta resuelta en el espacio ahorra 9 minutos de ida y vuelta.</div></div>' +
    '<div class="mact"><button class="btn p" data-x>Cerrar</button></div>', true);
  function calc() {
    var p = +$('#s1', b).value, dias = +$('#s2', b).value, c = +$('#s3', b).value;
    var cap = p * 22, cob = Math.min(100, Math.round(cap / c * 100));
    var horas = Math.round(c * 0.9 * 9 / 60);
    var riesgo = cob < 70 ? 'alto' : cob < 95 ? 'medio' : 'bajo';
    $('#v1', b).textContent = p + (p === 1 ? ' persona' : ' personas');
    $('#v2', b).textContent = dias + ' días';
    $('#v3', b).textContent = c + ' consultas';
    $('#so', b).innerHTML =
      '<div class="simc"><small>Cobertura de la demanda</small><b>' + cob + '%</b><em>' + cap + ' de capacidad vs. ' + c + ' de demanda</em></div>' +
      '<div class="simc"><small>Horas liberadas por día</small><b>' + horas + ' h</b><em>si el 90% se resuelve en el espacio</em></div>' +
      '<div class="simc"><small>Riesgo de incumplir</small><b class="' + (riesgo === 'alto' ? 'rd' : riesgo === 'medio' ? 'am' : 'gr') + '">' + riesgo.charAt(0).toUpperCase() + riesgo.slice(1) + '</b><em>plazo: ' + dias + ' días</em></div>';
  }
  ['s1', 's2', 's3'].forEach(function (k) { $('#' + k, b).oninput = calc; });
  calc();
}

function abrirConsola() {
  var b = modal('<div class="hhd"><span class="hlogo cy">CO</span><div><b>Consola de comandos</b><small>COMMANDTEKS</small></div></div>' +
    '<div class="cmdw">' +
      '<div class="cmdinp"><span>' + ic('right') + '</span><input id="cmdi" placeholder="Escribí una orden corta…" autocomplete="off"><button class="btn p sm" id="cmdgo">Ejecutar</button></div>' +
      '<div class="cmdchips">' +
        ['crear tarea', 'estado de la semana', 'abrir COMMANDTEKS'].map(function (c) {
          return '<button data-cmd="' + esc(c) + '">' + esc(c) + '</button>';
        }).join('') +
      '</div>' +
      '<div class="cmdout" id="cmdo"></div>' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cerrar</button></div>', true);
  var salida = $('#cmdo', b);
  function run(txt) {
    txt = (txt || '').trim().toLowerCase();
    if (!txt) return;
    var r = null, k = '';
    if (/crear tarea/.test(txt))          r = 'Listo. Tarea creada y asignada a vos con fecha para dentro de 3 días.';
    else if (/estado|semana|corte/.test(txt)) r = 'Corte al día de hoy: sin tareas abiertas, sin correos pendientes.';
    else if (/abrir command/.test(txt))   r = 'COMMANDTEKS se abre en su pantalla completa desde el chat.';
    else                                  { r = 'Esa orden no está en el catálogo del demo. Probá una de las sugeridas.'; k = 'no'; }
    salida.insertAdjacentHTML('afterbegin', '<div class="cmdl ' + k + '">' + ic(k === 'no' ? 'info' : 'check') + '<div>' + esc(r) + '</div></div>');
    $('#cmdi', b).value = '';
  }
  $('#cmdgo', b).onclick = function () { run($('#cmdi', b).value); };
  $('#cmdi', b).onkeydown = function (e) { if (e.key === 'Enter') run(this.value); };
  $$('[data-cmd]', b).forEach(function (bt) { bt.onclick = function () { run(bt.getAttribute('data-cmd')); }; });
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('[data-on]').forEach(function (b) {
    b.onclick = function () {
      var h = herr(b.getAttribute('data-on'));
      herrEstado(h.id).act = true;
      render();
      toast(h.n + ' quedó activa en el espacio.', 'tool');
    };
  });
  $$('[data-open]').forEach(function (b) {
    b.onclick = function () { abrirHerramienta(b.getAttribute('data-open')); };
  });
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaHerramientas() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'herramientas' }, '*');
  }
} catch (e) {}

})();