(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  chip:    '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
  db:      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  tool:    '<path d="M14.5 6.5a4 4 0 1 0 3 6.9L20 16v4h-4l-2.6-2.6a4 4 0 0 1-6.9-3L4 12l4-4 2.5 2.5"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  play:    '<path d="M7 4.5 19 12 7 19.5v-15z"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  left:    '<path d="m15 6-6 6 6 6"/>',
  down:    '<path d="m6 9 6 6 6-6"/>',
  chat:    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  mail:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  trash:   '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>'
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
   CATÁLOGO DE AGENTES
   ---------------------------------------------------------------------
   Cada agente tiene: id, nombre, área, icono (iniciales), color, descripción,
   herramientas permitidas, acciones con aprobación y fuentes autorizadas.
   Edita esta lista para cambiar el catálogo.
   ===================================================================== */

var AGENTES = [
  {
    id: 'mia', n: 'MÍA', area: 'Asistente general', ini: 'MÍA', col: 'tl',
    d: 'Asistente general del espacio. Responde sobre cualquier tema, redacta, resume y arma entregables con la información oficial de la empresa.',
    tools: ['Leer conocimiento empresarial', 'Crear documentos', 'Consultar mis archivos', 'Investigar en la web'],
    aprob: ['Publicar en conocimiento empresarial'],
    fuentes: [], todo: true
  },
  {
    id: 'compras', n: 'Agente de compras', area: 'Compras', ini: 'ACO', col: 'am',
    d: 'Revisa que toda compra cumpla el procedimiento antes de avanzar: cotizaciones, comparativo y autorizaciones.',
    tools: ['Leer política de compras', 'Leer catálogo de proveedores', 'Armar cuadro comparativo'],
    aprob: ['Enviar respuestas a proveedores', 'Crear solicitudes de compra'],
    fuentes: ['PRO-COM-04', 'REG-INT-02']
  },
  {
    id: 'finanzas', n: 'Agente de finanzas', area: 'Finanzas', ini: 'AF', col: 'gr',
    d: 'Lee planillas, arma informes con hallazgos y detecta desvíos contra lo presupuestado.',
    tools: ['Leer planillas del espacio', 'Generar informes PDF', 'Comparar contra presupuesto'],
    aprob: ['Compartir informes fuera de la empresa'],
    fuentes: ['XLS-VTA-09', 'XLS-CXC-09']
  },
  {
    id: 'operaciones', n: 'Agente de operaciones', area: 'Operaciones', ini: 'AO', col: 'bl',
    d: 'Ubica el paso exacto de un procedimiento y cita la página, para resolver en el turno sin llamar a jefatura.',
    tools: ['Leer manuales y procedimientos', 'Crear tareas', 'Registrar incidencias'],
    aprob: ['Modificar un procedimiento vigente'],
    fuentes: ['PRO-URG-03', 'MAN-MTO-06']
  },
  {
    id: 'atencion', n: 'Agente de atención al cliente', area: 'Atención al cliente', ini: 'AA', col: 'vi',
    d: 'Responde reclamos con la política vigente, sin prometer lo que la política no permite.',
    tools: ['Leer políticas de servicio', 'Redactar respuestas', 'Escalar casos'],
    aprob: ['Enviar respuestas a clientes', 'Autorizar excepciones a la política'],
    fuentes: ['POL-DEV-05']
  },
  {
    id: 'marketing', n: 'Agente de marketing', area: 'Marketing', ini: 'AM', col: 'pk',
    d: 'Crea promociones y anuncios para redes sociales siguiendo el Manual de marca publicado en Conocimiento empresarial.',
    tools: ['Leer manual de marca y logotipos', 'Leer promociones vigentes', 'Generar imágenes con modelo externo', 'Redactar anuncios por red social'],
    aprob: ['Publicar en redes sociales', 'Invertir presupuesto en anuncios'],
    fuentes: ['MKT-MAN-02', 'MKT-LOG-01', 'MKT-PRO-01']
  }
];

var ESTADO = {
  agentes: AGENTES.map(function (a) { return { id: a.id, act: true, canal: a.id !== 'marketing' }; })
};

var UI = {};

function agente(id) { return AGENTES.filter(function (a) { return a.id === id; })[0] || null; }
function agEstado(id) {
  var a = ESTADO.agentes.filter(function (x) { return x.id === id; })[0];
  if (!a) { a = { id: id, act: true, canal: false }; ESTADO.agentes.push(a); }
  return a;
}
function activos() { return AGENTES.filter(function (a) { return agEstado(a.id).act; }); }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaAgentes() {
  var sel = agente(UI.sel);
  var act = activos().length;
  return '<div class="ph"><div class="rowb">' +
    '<div><h1>Mis agentes</h1>' +
    '<p class="sub">MÍA general ve todo lo que vos ves. Los agentes de área, no: cada uno trabaja con las fuentes y las herramientas que se le habilitaron, y las acciones que salen hacia afuera piden aprobación.</p></div>' +
    '<button class="btn p" data-accion="crear">' + ic('plus') + 'Crear agente</button></div>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('users') + AGENTES.length + ' configurados</span>' +
      '<span class="chip gr">' + ic('check') + act + ' activos</span>' +
      '<span class="chip tl">' + ic('lock') + 'Fuentes acotadas por agente</span>' +
    '</div></div>' +

    '<div class="split' + (sel ? ' open' : '') + '">' +
      '<div class="grid g3">' + AGENTES.map(tarjeta).join('') + '</div>' +
      (sel ? panelAgente(sel) : '') +
    '</div>';
}

function tarjeta(a) {
  var st = agEstado(a.id);
  return '<article class="card ac' + (a.id === UI.sel ? ' sel' : '') + '" data-a="' + a.id + '">' +
    '<div class="rowb">' +
      '<span class="agi ' + a.col + '">' + ic(a.id === 'mia' ? 'spark' : 'users') + '</span>' +
      '<span class="chip ' + (st.act ? 'gr' : '') + ' xs">' + (st.act ? 'Activo' : 'Pausado') + '</span>' +
    '</div>' +
    '<h3>' + esc(a.n) + '</h3>' +
    '<p class="mp">' + esc(a.d) + '</p>' +
    '<div class="chips">' +
      '<span class="chip xs">' + ic('db') + (a.todo ? 'Todo el conocimiento' : a.fuentes.length + (a.fuentes.length === 1 ? ' fuente' : ' fuentes')) + '</span>' +
      '<span class="chip xs">' + ic('tool') + a.tools.length + ' herramientas</span>' +
      (a.aprob && a.aprob.length ? '<span class="chip am xs">' + ic('lock') + a.aprob.length + ' con aprobación</span>' : '') +
    '</div></article>';
}

function panelAgente(a) {
  var st = agEstado(a.id);
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(a.n) + '</b><small>' + esc(a.area) + ' · ' + (st.act ? 'Activo' : 'Pausado') + '</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    '<div class="pblock"><p class="lead">' + esc(a.d) + '</p></div>' +

    '<div class="pblock">' +
      '<label class="lbl">Fuentes autorizadas</label>' +
      (a.todo
        ? '<div class="note tl">' + ic('db') + '<div>MÍA general consulta todo el conocimiento de la empresa que tu perfil tenga habilitado, incluidos los documentos marcados como restringidos si te corresponden.</div></div>'
        : (a.fuentes.length
            ? a.fuentes.map(function (c) { return '<div class="actl">' + ic('file') + '<div><b>' + esc(c) + '</b><small>Conocimiento empresarial</small></div></div>'; }).join('')
            : '<p class="mono">Sin fuentes asignadas.</p>') +
          '<button class="btn sm full" style="margin-top:8px" data-accion="addfuente">' + ic('plus') + 'Ampliar fuentes</button>') +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Herramientas permitidas</label>' +
      '<div class="chips">' + a.tools.map(function (t) { return '<span class="chip bl">' + ic('tool') + esc(t) + '</span>'; }).join('') + '</div>' +
    '</div>' +

    (a.id !== 'marketing'
      ? '<div class="pblock">' +
          '<label class="lbl">Canal Smart Email</label>' +
          '<p class="lead" style="overflow-wrap:anywhere">' + (st.canal ? 'Activo · recibe correos y prepara acciones que una persona confirma.' : 'Desactivado.') + '</p>' +
          '<button class="btn sm full" style="margin-top:8px" data-accion="canal">' + ic('mail') + (st.canal ? 'Desactivar canal' : 'Activar canal') + '</button>' +
        '</div>'
      : '') +

    '<div class="pblock">' +
      '<label class="lbl">Acciones hacia afuera</label>' +
      (a.aprob && a.aprob.length
        ? a.aprob.map(function (x) { return '<div class="actl">' + ic('lock') + '<div><b>' + esc(x) + '</b><small>queda en borrador hasta que una persona lo apruebe</small></div></div>'; }).join('')
        : '<div class="note tl">' + ic('info') + '<div>Este agente solo lee y redacta: no dispara acciones hacia afuera.</div></div>') +
    '</div>' +

    '<div class="pblock pfoot">' +
      '<button class="btn p full" data-accion="conversar">' + ic('chat') + 'Iniciar conversación</button>' +
      '<button class="btn g full" data-accion="toggle">' + ic(st.act ? 'clock' : 'play') + (st.act ? 'Pausar el agente' : 'Reactivar el agente') + '</button>' +
    '</div>' +

    '</div></aside>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('.ac').forEach(function (c) { c.onclick = function () { UI.sel = c.getAttribute('data-a'); render(); }; });
  $$('[data-cerrar]').forEach(function (b) { b.onclick = function () { UI.sel = null; render(); }; });
  $$('[data-accion]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); accion(b.getAttribute('data-accion')); }; });
}

function accion(a) {
  var ag = agente(UI.sel);
  if (a === 'crear')    return crearAgente();
  if (a === 'conversar') { toast('Este módulo abriría el chat con ' + ag.n + ' activo.', 'chat'); return; }
  if (a === 'toggle')   {
    var st = agEstado(ag.id);
    st.act = !st.act;
    render();
    toast(st.act ? ag.n + ' reactivado.' : ag.n + ' pausado.', st.act ? 'play' : 'clock');
    return;
  }
  if (a === 'canal') {
    var st2 = agEstado(ag.id);
    st2.canal = !st2.canal;
    render();
    toast(st2.canal ? 'Canal Smart Email activado.' : 'Canal Smart Email desactivado.', 'mail');
    return;
  }
  if (a === 'addfuente') {
    var yaTengo = ag.fuentes.slice();
    modal('<h2>Ampliar fuentes del ' + esc(ag.n.toLowerCase()) + '</h2>' +
      '<p class="lead" style="margin:8px 0 14px">Sumar una fuente cambia lo que el agente puede contestar. Queda registrado quién la habilitó.</p>' +
      '<label class="lbl">Código del documento</label><input class="inp" id="fcod" placeholder="Ej.: PRO-COM-04">' +
      '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okFuente">Agregar</button></div>');
    $('#modal #okFuente').onclick = function () {
      var v = $('#fcod').value.trim().toUpperCase();
      if (!v) { toast('Escribí un código.', 'alert'); return; }
      if (yaTengo.indexOf(v) !== -1) { toast('Ya está asignada.', 'info'); return; }
      ag.fuentes.push(v);
      cerrarModal(); render();
      toast('Fuente ' + v + ' habilitada.', 'db');
    };
  }
}

function crearAgente() {
  modal('<h2>Crear agente</h2>' +
    '<p class="lead" style="margin:8px 0 14px">Definí nombre, área y misión. El resto de la configuración se puede ajustar después.</p>' +
    '<div class="form">' +
      '<label class="lbl">Nombre</label><input class="inp" id="an" placeholder="Ej.: Agente de mantenimiento">' +
      '<label class="lbl" style="margin-top:10px">Área</label><input class="inp" id="aa" placeholder="Ej.: Operaciones">' +
      '<label class="lbl" style="margin-top:10px">Misión</label><textarea class="ta" id="ad" rows="3" placeholder="Qué recibe, qué revisa y hasta dónde llega"></textarea>' +
      '<label class="lbl" style="margin-top:10px">Color</label>' +
      '<div class="chips">' + ['tl','cy','vi','am','gr','bl','pk'].map(function (c, i) {
        return '<button class="chip' + (i === 0 ? ' on' : '') + '" data-col="' + c + '" type="button">' + c + '</button>';
      }).join('') + '</div>' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okCrear">Crear agente</button></div>');

  var col = 'tl';
  $$('#modal [data-col]').forEach(function (b) {
    b.onclick = function () {
      col = b.getAttribute('data-col');
      $$('#modal [data-col]').forEach(function (x) { x.classList.toggle('on', x === b); });
    };
  });

  $('#modal #okCrear').onclick = function () {
    var n = $('#an').value.trim(), a = $('#aa').value.trim() || 'General';
    if (!n) { toast('Poné un nombre al agente.', 'alert'); return; }
    var ini = n.split(/\s+/).slice(0, 3).map(function (w) { return (w[0] || '').toUpperCase(); }).join('');
    var id = 'ag' + (AGENTES.length + 1) + '_' + Date.now();
    AGENTES.push({
      id: id, n: n, area: a, ini: ini.slice(0, 3) || 'AG', col: col,
      d: $('#ad').value.trim() || 'Agente creado por el usuario.',
      tools: ['Leer conocimiento empresarial'],
      aprob: [],
      fuentes: []
    });
    ESTADO.agentes.push({ id: id, act: true, canal: false });
    UI.sel = id;
    cerrarModal(); render();
    toast(n + ' creado. Nada sale sin confirmación.', 'users');
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaAgentes() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'agentes' }, '*');
  }
} catch (e) {}

})();