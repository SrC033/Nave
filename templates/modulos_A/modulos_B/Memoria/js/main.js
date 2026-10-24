(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  mem:     '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="M3 18l9 3 9-3"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  hist:    '<path d="M3 12a9 9 0 1 0 3-6.7V9H3"/><path d="M12 8v4.5l3 1.8"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>'
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
   DATOS: esquema vacío. Poblar desde fuera o aquí.
   ===================================================================== */

var ESTADO = {
  memorias: [],       // memorias activas
  propuestas: [],     // propuestas de MÍA esperando aprobación
  registro: [],       // registro de bloqueos (memorias o documentos restringidos)
  seq: 0
};

var GRUPOS = [
  { tp: 'perfil',       n: 'Identidad y contexto',     d: 'Lo que la empresa es. Se escribe una vez y ordena todas las respuestas.' },
  { tp: 'criterio',     n: 'Criterios y decisiones',   d: 'Cómo se decide acá. Es lo que ningún documento dice con esa claridad.' },
  { tp: 'preferencia',  n: 'Preferencias de forma',    d: 'Cómo quiere la empresa que se le entregue el trabajo.' },
  { tp: 'hecho',        n: 'Hechos aprendidos',        d: 'Lo que apareció en el uso y conviene no volver a descubrir.' }
];

var UI = {};

function mem(id) { return ESTADO.memorias.filter(function (m) { return m.id === id; })[0] || null; }
function nuevoId() { return 'M' + (++ESTADO.seq); }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaMemoria() {
  var activas = ESTADO.memorias;
  var prop = ESTADO.propuestas;
  var desactivadas = ESTADO.memorias.filter(function (m) { return !m.viva; });
  var visibles = activas.filter(function (m) { return m.viva; });

  var html = '<div class="ph"><h1>Memoria empresarial</h1>' +
    '<p class="sub">Lo que la empresa sabe de sí misma y no está escrito en ningún manual: cómo se decide, cómo se llaman las cosas, qué nunca se hace. Vive en tu espacio, no dentro del modelo: si mañana cambiás de modelo de IA, esto no se va.</p>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('mem') + visibles.length + ' memorias activas</span>' +
      (prop.length ? '<span class="chip am">' + ic('clock') + prop.length + ' esperando aprobación</span>' : '') +
      (desactivadas.length ? '<span class="chip rd">' + ic('lock') + desactivadas.length + ' desactivadas</span>' : '') +
    '</div></div>';

  if (prop.length) {
    html += '<div class="card tight props"><div class="sec">Propuestas de MÍA</div>' +
      '<p class="lead" style="margin:0 0 12px">MÍA propone, no decide. Hasta que un responsable apruebe, no lo da por cierto.</p>' +
      prop.map(function (pr, i) {
        return '<div class="prow col">' + ic('spark') +
          '<div class="lt"><b>' + esc(pr.t) + '</b><small>' + esc(pr.v) + '</small>' +
          '<small class="mono">' + esc(pr.og) + ' · alcance: ' + esc(pr.alc) + '</small>' +
          '<div class="note am" style="margin-top:8px">' + ic('info') + '<div>' + esc(pr.motivo) + '</div></div></div>' +
          '<div class="pacts">' +
            '<button class="btn sm p" data-ma="' + i + '">Aprobar</button>' +
            '<button class="btn sm g" data-mr="' + i + '">Descartar</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  GRUPOS.forEach(function (g) {
    var items = visibles.filter(function (m) { return m.tp === g.tp; });
    if (!items.length) return;
    html += '<div class="mgrp"><div class="rowb">' +
      '<div><span class="sec">' + esc(g.n) + '</span>' +
      '<p class="lead" style="margin:2px 0 0">' + esc(g.d) + '</p></div>' +
      '<span class="chip">' + items.length + '</span>' +
      '</div>' +
      '<div class="grid g2 cards">' + items.map(tarjeta).join('') + '</div></div>';
  });

  if (!visibles.length) {
    html += '<div class="empty">' + ic('mem') + 'Todavía no hay memorias cargadas. Escribí la primera.</div>';
  }

  if (desactivadas.length) {
    html += '<div class="mgrp"><span class="sec">Desactivadas</span>' +
      '<div class="stack" style="margin-top:12px">' + desactivadas.map(function (m) {
        return '<div class="lrow">' + ic('mem', 'i') +
          '<span class="lt"><b>' + esc(m.t) + '</b><small>' + esc(m.v) + '</small></span>' +
          '<button class="btn xs" data-mon="' + m.id + '">Reactivar</button>' +
        '</div>';
      }).join('') + '</div></div>';
  }

  if (ESTADO.registro.length) {
    html += '<div class="mgrp"><span class="sec">Registro de bloqueos</span>' +
      '<p class="lead" style="margin:2px 0 12px">Cada vez que una memoria o un documento restringido impidió que algo saliera del nodo, queda escrito.</p>' +
      '<div class="card tight">' + ESTADO.registro.map(function (r) {
        return '<div class="actl">' + ic('lock') +
          '<div><b>' + esc(r.d) + '</b><small>' + esc(r.m) + ' · ' + esc(r.u) + ' · ' + esc(r.h) + '</small></div></div>';
      }).join('') + '</div></div>';
  }

  html += '<div class="mgrp"><button class="btn" data-accion="nueva">' + ic('plus') + 'Escribir una memoria a mano</button></div>';

  return html;
}

function tarjeta(m) {
  return '<article class="card mc">' +
    '<div class="rowb"><b>' + esc(m.t) + '</b>' +
      (m.res ? '<span class="chip rd xs">' + ic('lock') + 'Restringida</span>' : '') +
    '</div>' +
    '<p class="mp">' + esc(m.v) + '</p>' +
    '<div class="kv"><span>Origen</span><b>' + esc(m.og || '—') + '</b></div>' +
    '<div class="kv"><span>Alcance</span><b>' + esc(m.alc || '—') + '</b></div>' +
    '<div class="kv"><span>Vigencia</span><b>' + esc(m.ven || 'sin vencimiento') + '</b></div>' +
    '<div class="foot">' +
      '<span class="mono">' + ic('hist') + ' usada ' + (m.us || 0) + ' veces</span>' +
      '<button class="btn xs g" data-mb="' + m.id + '">Desactivar</button>' +
    '</div>' +
  '</article>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('[data-accion]').forEach(function (b) { b.onclick = function () { accion(b.getAttribute('data-accion')); }; });
  $$('[data-ma]').forEach(function (b) {
    b.onclick = function () {
      var pr = ESTADO.propuestas.splice(Number(b.getAttribute('data-ma')), 1)[0];
      ESTADO.memorias.unshift({
        id: nuevoId(), tp: pr.tp || 'criterio', t: pr.t, v: pr.v, og: pr.og, alc: pr.alc,
        res: !!pr.res, ven: 'sin vencimiento', us: 0, viva: true
      });
      render();
      toast('Memoria aprobada. MÍA la aplica desde la próxima respuesta.', 'mem');
    };
  });
  $$('[data-mr]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.propuestas.splice(Number(b.getAttribute('data-mr')), 1);
      render();
      toast('Propuesta descartada.', 'x');
    };
  });
  $$('[data-mb]').forEach(function (b) {
    b.onclick = function () {
      var m = mem(b.getAttribute('data-mb'));
      if (!m) return;
      m.viva = false;
      render();
      toast('Memoria desactivada. MÍA deja de darla por cierta.', 'mem');
    };
  });
  $$('[data-mon]').forEach(function (b) {
    b.onclick = function () {
      var m = mem(b.getAttribute('data-mon'));
      if (!m) return;
      m.viva = true;
      render();
      toast('Memoria reactivada.', 'mem');
    };
  });
}

function accion(a) {
  if (a === 'nueva') return nuevaMemoria();
}

function nuevaMemoria() {
  modal('<h2>Escribir una memoria</h2>' +
    '<p class="lead" style="margin:8px 0 14px">Sirve para lo que ningún documento dice con claridad: un criterio, una preferencia, un nombre propio de la empresa.</p>' +
    '<div class="form">' +
      '<label class="lbl">Título</label><input class="inp" id="mt" placeholder="Ej.: nada se cotiza de memoria">' +
      '<label class="lbl" style="margin-top:10px">Qué debe recordar</label><textarea class="ta" id="mv" rows="3" placeholder="Escribilo como una regla, no como un comentario"></textarea>' +
      '<div class="g2" style="margin-top:10px">' +
        '<div><label class="lbl">Tipo</label><select class="sel" id="mtp">' +
          GRUPOS.map(function (g) { return '<option value="' + g.tp + '">' + esc(g.n) + '</option>'; }).join('') +
        '</select></div>' +
        '<div><label class="lbl">Alcance</label><input class="inp" id="mal" placeholder="Ej.: Toda la empresa"></div>' +
      '</div>' +
      '<label class="ck" style="margin-top:10px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="mres" style="accent-color:var(--teal)"><span>Restringida: nunca sale del nodo propio</span></label>' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okNueva">Guardar memoria</button></div>');
  $('#modal #okNueva').onclick = function () {
    var t = $('#mt').value.trim(), v = $('#mv').value.trim();
    if (!t || !v) { toast('Faltan el título o el contenido.', 'alert'); return; }
    ESTADO.memorias.unshift({
      id: nuevoId(), tp: $('#mtp').value, t: t, v: v,
      og: 'Escrita a mano · hoy', alc: $('#mal').value.trim() || 'Toda la empresa',
      res: $('#mres').checked, ven: 'sin vencimiento', us: 0, viva: true
    });
    cerrarModal(); render();
    toast('Memoria guardada.', 'mem');
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaMemoria() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'memoria' }, '*');
  }
} catch (e) {}

})();