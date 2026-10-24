(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  db:      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  hist:    '<path d="M3 12a9 9 0 1 0 3-6.7V9H3"/><path d="M12 8v4.5l3 1.8"/>',
  eye:     '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  chat:    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
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
  documentos: [],
  propuestas: [],
  seq: 0
};

var UI = {};

function doc(cod) { return ESTADO.documentos.filter(function (d) { return d.c === cod; })[0] || null; }
function nuevoId() { return 'D' + (++ESTADO.seq); }

function categorias() {
  var l = [];
  ESTADO.documentos.forEach(function (d) { if (d.cat && l.indexOf(d.cat) === -1) l.push(d.cat); });
  return l;
}

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaConocimiento() {
  var ocultos = ESTADO.documentos.filter(function (d) { return d.res; }).length;
  var cats = categorias();
  var fc = UI.cat || '';
  var q = (UI.q || '').toLowerCase();
  var lista = ESTADO.documentos.filter(function (d) {
    return (!fc || d.cat === fc) && (!q || (d.n + ' ' + d.c + ' ' + (d.area || '')).toLowerCase().indexOf(q) !== -1);
  });
  var sel = doc(UI.sel);

  return '<div class="ph"><div class="rowb">' +
    '<div><h1>Conocimiento empresarial</h1>' +
    '<p class="sub">Los documentos que MÍA trata como verdad oficial de la empresa. Uno solo vigente por tema, con versión, responsable y fecha.</p></div>' +
    '<button class="btn p" data-accion="proponer">' + ic('plus') + 'Proponer documento</button></div>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip">' + ic('db') + ESTADO.documentos.length + ' documentos vigentes</span>' +
      (ESTADO.propuestas.length ? '<span class="chip am">' + ic('clock') + ESTADO.propuestas.length + ' esperando aprobación</span>' : '') +
      (ocultos ? '<span class="chip rd">' + ic('lock') + ocultos + ' restringidos' + '</span>' : '') +
    '</div></div>' +

    '<div class="rowb" style="margin-bottom:14px">' +
      '<div class="search" style="flex:1;min-width:220px"><span>' + ic('search') + '</span>' +
        '<input class="inp" id="dq" placeholder="Buscar documento, código, área…" value="' + esc(UI.q || '') + '"></div>' +
    '</div>' +

    (cats.length
      ? '<div class="chips" style="margin:0 0 18px">' +
          '<button class="chip' + (!fc ? ' on' : '') + '" data-cat="">Todas</button>' +
          cats.map(function (c) { return '<button class="chip' + (fc === c ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') +
        '</div>'
      : '') +

    (ESTADO.propuestas.length
      ? '<div class="card tight props"><div class="sec">Propuestas de publicación</div>' +
        ESTADO.propuestas.map(function (pr, i) {
          return '<div class="prow">' + ic('clock') + '<div class="lt"><b>' + esc(pr.n) + '</b><small>propuesto por ' + esc(pr.por) + ' · categoría ' + esc(pr.cat) + '</small></div>' +
            (esAdmin()
              ? '<div class="pacts"><button class="btn sm p" data-ap="' + i + '">Publicar</button><button class="btn sm g" data-rc="' + i + '">Rechazar</button></div>'
              : '<span class="chip am">En bandeja del responsable</span>') +
          '</div>';
        }).join('') + '</div>'
      : '') +

    '<div class="split' + (sel ? ' open' : '') + '"><div>' +
      (lista.length
        ? '<div class="card tight"><table class="tbl"><thead><tr>' +
            '<th>Documento</th><th>Área</th><th>Versión</th><th>Estado</th><th>Actualizado</th>' +
          '</tr></thead><tbody>' +
          lista.map(function (d) {
            return '<tr class="' + (d.c === UI.sel ? 'sel' : '') + '" data-d="' + d.c + '">' +
              '<td><b>' + esc(d.n) + '</b><span class="tsub">' + esc(d.c) + ' · ' + (d.pag || 0) + ' páginas</span></td>' +
              '<td>' + esc(d.area || '—') + '</td>' +
              '<td>v' + esc(d.v || '1.0') + '</td>' +
              '<td><span class="chip ' + (d.estado === 'Vigente' ? 'gr' : d.estado === 'En revisión' ? 'am' : '') + ' xs">' + esc(d.estado || 'Vigente') + '</span>' +
                (d.res ? '<span class="chip rd xs">' + ic('lock') + 'Restringido</span>' : '') + '</td>' +
              '<td>' + esc(d.act || '—') + '</td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="empty">' + ic('db') + 'Todavía no hay documentos cargados. Proponé el primero.</div>') +
    '</div>' + (sel ? panelDoc(sel) : '') + '</div>';
}

function esAdmin() { return true; }

function panelDoc(d) {
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(d.n) + '</b><small>' + esc(d.c) + ' · v' + esc(d.v || '1.0') + '</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    (d.res
      ? '<div class="pblock"><div class="note am">' + ic('lock') + '<div>Documento restringido: las consultas que lo usan se responden siempre en el nodo propio y nunca salen a un proveedor externo.</div></div></div>'
      : '') +

    '<div class="pblock">' +
      '<div class="kv"><span>Área</span><b>' + esc(d.area || '—') + '</b></div>' +
      '<div class="kv"><span>Público</span><b>' + esc(d.pub || '—') + '</b></div>' +
      '<div class="kv"><span>Responsable</span><b>' + esc(d.resp || '—') + '</b></div>' +
      '<div class="kv"><span>Vigente desde</span><b>' + esc(d.desde || '—') + '</b></div>' +
      '<div class="kv"><span>Categoría</span><b>' + esc(d.cat || '—') + '</b></div>' +
      '<div class="kv"><span>Extensión</span><b>' + (d.pag || 0) + ' páginas</b></div>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Estado</label>' +
      '<div class="segs">' +
        ['Vigente', 'En revisión', 'Histórico'].map(function (e) {
          return '<button class="seg' + (d.estado === e ? ' on' : '') + '" data-est="' + esc(e) + '">' + esc(e) + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Historial de versiones</label>' +
      ((d.hist && d.hist.length)
        ? d.hist.map(function (h) {
            return '<div class="actl">' + ic('hist') + '<div><b>v' + esc(h.v) + ' · ' + esc(h.nota) + '</b><small>' + esc(h.cuando) + '</small></div></div>';
          }).join('')
        : '<p class="mono">Sin cambios registrados.</p>') +
    '</div>' +

    '<div class="pblock pfoot">' +
      '<button class="btn p full" data-accion="preguntar">' + ic('chat') + 'Preguntarle a MÍA sobre este documento</button>' +
      '<button class="btn g full" data-accion="marcar">' + ic('lock') + (d.res ? 'Quitar la marca de restringido' : 'Marcar como restringido') + '</button>' +
    '</div>' +

    '</div></aside>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  var q = $('#dq');
  if (q) q.oninput = function () { UI.q = q.value; var pos = q.selectionStart; render(); var n = $('#dq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };

  $$('[data-cat]').forEach(function (b) { b.onclick = function () { UI.cat = b.getAttribute('data-cat'); render(); }; });
  $$('[data-d]').forEach(function (b) { b.onclick = function () { UI.sel = b.getAttribute('data-d'); render(); }; });
  $$('[data-cerrar]').forEach(function (b) { b.onclick = function () { UI.sel = null; render(); }; });
  $$('[data-accion]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); accion(b.getAttribute('data-accion')); }; });

  $$('[data-ap]').forEach(function (b) {
    b.onclick = function () {
      var pr = ESTADO.propuestas.splice(Number(b.getAttribute('data-ap')), 1)[0];
      ESTADO.documentos.unshift({
        c: pr.c, n: pr.n, area: pr.area, pub: 'Toda la empresa', pag: pr.pag,
        act: 'hace un momento', v: '1.0', cat: pr.cat, estado: 'Vigente',
        resp: 'Yo', desde: 'hoy', res: pr.res,
        hist: [{ v: '1.0', nota: 'Publicado desde una propuesta de ' + pr.por, cuando: 'hace un momento' }]
      });
      render();
      toast('Documento publicado. MÍA ya lo cita como fuente oficial.', 'db');
    };
  });
  $$('[data-rc]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.propuestas.splice(Number(b.getAttribute('data-rc')), 1);
      render();
      toast('Propuesta rechazada.', 'x');
    };
  });

  var d = doc(UI.sel);
  if (!d) return;

  $$('[data-est]').forEach(function (b) {
    b.onclick = function () {
      d.estado = b.getAttribute('data-est');
      d.hist = d.hist || [];
      d.hist.unshift({ v: d.v || '1.0', nota: 'Estado cambiado a ' + d.estado, cuando: 'hace un momento' });
      render();
    };
  });
}

function accion(a) {
  if (a === 'proponer') return proponerDoc();
  var d = doc(UI.sel); if (!d) return;
  if (a === 'preguntar') { toast('Este módulo abriría el chat con este documento como contexto.', 'chat'); return; }
  if (a === 'marcar') {
    d.res = !d.res;
    render();
    toast(d.res ? 'Marcado como restringido: nunca sale del nodo.' : 'Marca de restringido retirada.', 'lock');
  }
}

function proponerDoc() {
  modal('<h2>Proponer un documento</h2>' +
    '<p class="lead" style="margin:8px 0 14px">Cualquiera puede proponer. Publicar queda en la bandeja del responsable, con versión y fecha de vigencia.</p>' +
    '<div class="form">' +
      '<label class="lbl">Nombre del documento</label><input class="inp" id="pn">' +
      '<div class="g2" style="margin-top:10px">' +
        '<div><label class="lbl">Código</label><input class="inp" id="pc" placeholder="Ej.: PRO-XXX-01"></div>' +
        '<div><label class="lbl">Páginas</label><input class="inp" id="pp" type="number" value="10"></div>' +
      '</div>' +
      '<div class="g2" style="margin-top:10px">' +
        '<div><label class="lbl">Área</label><input class="inp" id="pa" placeholder="Ej.: Compras"></div>' +
        '<div><label class="lbl">Categoría</label><select class="sel" id="pcat"><option>Manuales</option><option>Políticas</option><option>Procedimientos</option><option>Contratos</option><option>Tarifarios</option></select></div>' +
      '</div>' +
      '<label class="ck" style="margin-top:10px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="pres" style="accent-color:var(--teal)"><span>Marcar como restringido (nunca sale del nodo propio)</span></label>' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="okProp">Enviar a aprobación</button></div>');
  $('#modal #okProp').onclick = function () {
    var n = $('#pn').value.trim();
    if (!n) { toast('El documento necesita un nombre.', 'alert'); return; }
    ESTADO.propuestas.push({
      n: n,
      c: $('#pc').value.trim() || ('DOC-NUE-' + (ESTADO.propuestas.length + 1)),
      area: $('#pa').value.trim() || 'General',
      pag: Number($('#pp').value) || 0,
      cat: $('#pcat').value,
      res: $('#pres').checked,
      por: 'Yo'
    });
    cerrarModal(); render();
    toast('Propuesta enviada.', 'clock');
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaConocimiento() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'conocimiento' }, '*');
  }
} catch (e) {}

})();