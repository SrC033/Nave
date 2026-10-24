(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  book:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  play:    '<path d="M7 4.5 19 12 7 19.5v-15z"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  mark:    '<path d="M6 3h12v18l-6-4.5L6 21V3z"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  left:    '<path d="m15 6-6 6 6 6"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chat:    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'
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
   CATÁLOGO DE CURSOS
   ---------------------------------------------------------------------
   Cada curso tiene: id, nombre, nivel, minutos, color, descripción,
   lecciones y banderas (incluido en el plan o ampliado).
   El progreso (lecciones completadas) y los guardados viven en ESTADO.
   ===================================================================== */

var CURSOS = [
  {
    id: 'c1', n: 'Primeros pasos con MÍA', niv: 'Básico', min: 20, col: 'tl', incl: true,
    d: 'Conocé lo esencial para empezar a usar MÍA en tu día a día y potenciar tu productividad.',
    lec: ['Qué puede y qué no puede hacer MÍA', 'Cómo pedir bien: consultas que devuelven la norma', 'Leer la fuente de cada respuesta', 'Cuándo el modelo corre en tu nodo', 'Guardar y compartir lo que creás']
  },
  {
    id: 'c2', n: 'Smart Email: decidir y delegar', niv: 'Práctico', min: 15, col: 'bl', incl: true,
    d: 'Aprendé a gestionar tus correos con inteligencia, identificar lo importante y convertirlo en acciones.',
    lec: ['Los cuatro tipos de correo que importan', 'Convertir un correo en tarea con responsable', 'Aprobar antes de enviar: por qué nada sale solo', 'Seguimiento sin recordar de memoria']
  },
  {
    id: 'c3', n: 'Organizá tus proyectos y tareas', niv: 'Práctico', min: 25, col: 'vi', incl: true,
    d: 'Usá IA para planificar, priorizar y hacer seguimiento de lo que realmente importa.',
    lec: ['De la lista suelta al tablero', 'Prioridad real: qué bloquea a otros', 'Hitos que sí se revisan', 'Cerrar la semana en 10 minutos']
  },
  {
    id: 'c4', n: 'Conocimiento empresarial sin desorden', niv: 'Básico', min: 18, col: 'cy', incl: false,
    d: 'Qué documento es oficial, quién lo aprueba y cómo evitar que circulen tres versiones del mismo archivo.',
    lec: ['Documento oficial vs. borrador', 'Versiones y vigencias', 'Proponer un documento para publicación', 'Quién puede ver qué']
  },
  {
    id: 'c5', n: 'Memoria empresarial: que no te pregunten dos veces', niv: 'Intermedio', min: 22, col: 'am', incl: false,
    d: 'Cómo la empresa conserva su contexto y sus criterios aunque cambie el modelo de IA.',
    lec: ['Los cuatro tipos de memoria', 'Proponer, aprobar y vencer una memoria', 'Memoria restringida: qué nunca sale', 'Cómo revisar lo que la IA da por cierto']
  },
  {
    id: 'c6', n: 'Agentes por área', niv: 'Intermedio', min: 26, col: 'gr', incl: false,
    d: 'Cómo definir qué puede consultar y qué debe aprobarse antes de ejecutar, área por área.',
    lec: ['Fuentes autorizadas', 'Herramientas permitidas', 'Acciones con aprobación', 'Medir si el agente sirve']
  },
  {
    id: 'c7', n: 'IA privada: qué corre adentro y qué no', niv: 'Avanzado', min: 30, col: 'pk', incl: false,
    d: 'La lógica de enrutamiento: qué modelo del nodo atiende cada tarea y por qué los datos no salen.',
    lec: ['Qué es un router de modelos', 'Reglas por clasificación del dato', 'Costo y latencia de cada decisión', 'Cómo auditar una respuesta']
  }
];

var ESTADO = {
  progreso: {},        // { c1: 3, c2: 0, ... }
  guardados: []        // [ 'c2', ... ]
};

var UI = {};

function curso(id) { return CURSOS.filter(function (c) { return c.id === id; })[0] || null; }
function pct(c) { return c.lec.length ? Math.round((ESTADO.progreso[c.id] || 0) / c.lec.length * 100) : 0; }
function guardado(id) { return ESTADO.guardados.indexOf(id) !== -1; }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaLearning() {
  var incl = CURSOS.filter(function (c) { return c.incl; });
  var cat = CURSOS.filter(function (c) { return !c.incl; });
  var hechas = CURSOS.reduce(function (a, c) { return a + (ESTADO.progreso[c.id] || 0); }, 0);
  var totalLec = CURSOS.reduce(function (a, c) { return a + c.lec.length; }, 0);
  var sel = curso(UI.sel);

  return '<div class="ph"><h1>Learning Center</h1>' +
    '<p class="sub">Capacitación para que la gente de la empresa use el espacio de verdad. Una licencia que nadie sabe usar no cambia nada.</p>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('book') + CURSOS.length + ' cursos</span>' +
      '<span class="chip tl">' + ic('check') + hechas + ' de ' + totalLec + ' lecciones completadas</span>' +
      (ESTADO.guardados.length ? '<span class="chip bl">' + ic('mark') + ESTADO.guardados.length + ' guardados</span>' : '') +
    '</div></div>' +

    '<div class="split' + (sel ? ' open' : '') + '"><div>' +
      '<div class="sec">Incluidos en tu plan</div>' +
      '<div class="grid g3" style="margin-top:14px">' + incl.map(tarjeta).join('') + '</div>' +

      '<div class="sec" style="margin-top:30px">Catálogo ampliado</div>' +
      '<p class="lead" style="margin-bottom:14px">Se suman cuando la empresa habilita el módulo correspondiente.</p>' +
      '<div class="grid g3">' + cat.map(tarjeta).join('') + '</div>' +
    '</div>' +
    (sel ? panelCurso(sel) : '') +
    '</div>';
}

function tarjeta(c) {
  var n = ESTADO.progreso[c.id] || 0;
  var pr = pct(c);
  return '<article class="card cc' + (c.id === UI.sel ? ' sel' : '') + '" data-c="' + c.id + '">' +
    '<div class="rowb">' +
      '<span class="agi ' + c.col + '">' + ic('book') + '</span>' +
      '<span class="chip ' + c.col + ' xs">' + esc(c.niv) + '</span>' +
    '</div>' +
    '<h3>' + esc(c.n) + '</h3>' +
    '<p class="mp">' + esc(c.d) + '</p>' +
    '<div class="bar sm"><i style="width:' + pr + '%"></i></div>' +
    '<div class="rowb" style="margin-top:8px">' +
      '<span class="mono">' + n + '/' + c.lec.length + ' lecciones</span>' +
      (guardado(c.id) ? '<span class="chip bl xs">' + ic('mark') + 'Guardado</span>' : '<span class="mono">' + ic('clock') + ' ' + c.min + ' min</span>') +
    '</div>' +
  '</article>';
}

function panelCurso(c) {
  var n = ESTADO.progreso[c.id] || 0;
  var pr = pct(c);
  var g = guardado(c.id);
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(c.n) + '</b><small>' + esc(c.niv) + ' · ' + c.min + ' min</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    '<div class="pblock">' +
      '<p class="lead">' + esc(c.d) + '</p>' +
      '<div class="bar" style="margin-top:12px"><i style="width:' + pr + '%"></i></div>' +
      '<span class="mono" style="margin-top:6px;display:block">' + pr + '% completado</span>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Lecciones</label>' +
      c.lec.map(function (l, i) {
        var ok = i < n;
        return '<button class="lec' + (ok ? ' ok' : '') + '" data-l="' + i + '">' +
          ic(ok ? 'check' : 'play') +
          '<span class="lt"><b>' + (i + 1) + '. ' + esc(l) + '</b>' +
          '<small>' + (ok ? 'completada' : 'pendiente') + '</small></span>' +
        '</button>';
      }).join('') +
    '</div>' +

    '<div class="pblock pfoot">' +
      '<button class="btn p full" data-accion="empezar">' + ic('play') + (n >= c.lec.length ? 'Repasar el curso' : n ? 'Continuar' : 'Empezar el curso') + '</button>' +
      '<button class="btn b full" data-accion="practica">' + ic('target') + 'Práctica guiada con MÍA</button>' +
      '<button class="btn g full" data-accion="guardar">' + ic('mark') + (g ? 'Quitar de guardados' : 'Guardar para después') + '</button>' +
    '</div>' +

    '</div></aside>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('.cc').forEach(function (b) { b.onclick = function () { UI.sel = b.getAttribute('data-c'); render(); }; });
  $$('[data-cerrar]').forEach(function (b) { b.onclick = function () { UI.sel = null; render(); }; });
  $$('[data-accion]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); accion(b.getAttribute('data-accion')); }; });

  var c = curso(UI.sel);
  if (!c) return;
  $$('[data-l]').forEach(function (b) {
    b.onclick = function () { verLeccion(c, Number(b.getAttribute('data-l'))); };
  });
}

function accion(a) {
  var c = curso(UI.sel); if (!c) return;
  if (a === 'empezar') {
    var n = ESTADO.progreso[c.id] || 0;
    verLeccion(c, Math.min(n, c.lec.length - 1));
    return;
  }
  if (a === 'practica') { toast('Este módulo abriría el chat con la práctica guiada.', 'spark'); return; }
  if (a === 'guardar') {
    var i = ESTADO.guardados.indexOf(c.id);
    if (i === -1) ESTADO.guardados.push(c.id); else ESTADO.guardados.splice(i, 1);
    render();
    toast(guardado(c.id) ? 'Guardado para después.' : 'Quitado de guardados.', 'mark');
  }
}

/* Contenido de las lecciones: por ahora son textos cortos de ejemplo
   por curso. Editar LECCION o agregar contenido propio. */
var LECCION = {
  c1: [
    '<p><b>MÍA no sabe de todo: sabe de lo que tu empresa cargó.</b> Responde sobre procedimientos, políticas, manuales y contratos del espacio, y te dice en qué documento y en qué página está la respuesta.</p><p>Lo importante es lo que <b>no</b> hace: si algo no está cargado, lo dice en vez de inventarlo. Y si el dato está en un documento que tu perfil no puede ver, te avisa que existe pero no te lo muestra.</p><p class="lecq">Probalo: preguntale algo que no esté en ningún documento del espacio y mirá la respuesta.</p>',
    '<p>Una consulta vaga devuelve una respuesta vaga. Pedí como le pedirías a alguien del área: <b>qué necesitás, para qué, y con qué nivel de detalle</b>.</p><p>Mal: «contame del procedimiento». Bien: «¿qué pasos tengo que seguir si el equipo falla en el turno noche?».</p>',
    '<p>Toda respuesta trae la fuente: <b>código de documento, nombre y página</b>. Esa línea es lo que convierte la respuesta en algo verificable. Si no hay fuente, es conversación, no dato.</p>',
    '<p>Debajo de cada respuesta ves <b>dónde corrió el modelo</b>: qué modelo del nodo propio respondió y por qué. Los documentos internos no salen: los destinos externos quedan solo para demos y para textos de marketing sin datos de la empresa.</p>',
    '<p>Lo que MÍA genera queda en <b>Mis archivos</b>, con el acceso que vos definís. Compartir es un acto explícito: nada se publica solo.</p>'
  ],
  c2: [
    '<p>De toda la bandeja, cuatro tipos importan: <b>el que necesita una decisión tuya</b>, el que se delega, el que solo espera seguimiento y el que se archiva. Smart Email los separa y deja arriba el primero.</p>',
    '<p>Delegar no es reenviar. Cuando delegás desde Smart Email se crea una <b>tarea con responsable, fecha y el hilo adjunto</b>, así el que la recibe no tiene que preguntar de qué se trata.</p>',
    '<p>El botón dice «Aprobar y enviar» a propósito: <b>ningún correo sale sin que una persona lo apruebe</b>. No es una preferencia configurable, es cómo está armado el espacio.</p>',
    '<p>El seguimiento no es recordar de memoria: es una tarea con fecha que cae sola al tablero si el remitente no responde en <b>48 horas</b>.</p>'
  ],
  c3: [
    '<p>El tablero tiene cuatro columnas: Pendiente, En curso, En revisión, Completada. Mover una tarjeta de una a otra <b>cambia el estado real de la tarea</b>, no una etiqueta decorativa.</p>',
    '<p>Prioridad real: no la que grita más, sino la que <b>bloquea a otros</b>. Si tenés tres tareas de prioridad alta y una desbloquea a dos personas, esa va primero.</p>',
    '<p>Los hitos son pocos y se revisan. Si tenés doce hitos en un proyecto de un mes, no estás haciendo seguimiento: estás escribiendo.</p>',
    '<p>Cerrar la semana en diez minutos: filtrar por vencidas, mover lo que ya se hizo, escribir qué pasó con lo que quedó. Diez minutos el viernes ahorran dos horas el lunes.</p>'
  ]
};

function verLeccion(c, i) {
  var texto = (LECCION[c.id] && LECCION[c.id][i]) || '<p>Esta lección explica el tema con ejemplos del espacio. En el demo el contenido completo está disponible en las primeras lecciones de cada curso.</p>';
  var n = ESTADO.progreso[c.id] || 0;
  var ya = i < n;
  modal(
    '<div class="rowb" style="gap:12px;align-items:flex-start">' +
      '<span class="agi ' + c.col + '">' + ic('book') + '</span>' +
      '<div style="flex:1;min-width:0"><b style="font-family:var(--disp);font-size:15px;display:block">' + esc(c.lec[i]) + '</b>' +
      '<small class="mono" style="display:block;margin-top:2px">' + esc(c.n) + ' · lección ' + (i + 1) + ' de ' + c.lec.length + '</small></div>' +
    '</div>' +
    '<div class="lecbody" style="margin-top:14px">' + texto + '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cerrar</button>' +
    '<button class="btn p" id="okLec">' + (ya ? 'Ya la completaste' : 'Marcar como completada') + '</button></div>',
    true);

  $('#modal #okLec').onclick = function () {
    ESTADO.progreso[c.id] = Math.max(ESTADO.progreso[c.id] || 0, i + 1);
    cerrarModal(); render();
    toast(ESTADO.progreso[c.id] >= c.lec.length ? 'Curso completado.' : 'Lección completada.', 'check');
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaLearning() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'learning' }, '*');
  }
} catch (e) {}

})();