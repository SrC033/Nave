(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  chart:   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  chip:    '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
  cloud:   '<path d="M6.5 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5 1.4A3.8 3.8 0 0 1 17.5 18h-11z"/>',
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
   DATOS: esquema vacío. Poblar desde fuera o aquí.
   ---------------------------------------------------------------------
   EDITA las siguientes estructuras con los datos reales:
     KPIS        → tarjetas de indicadores arriba
     GRAFICO     → gráfico de barras (labels + datos)
     DONA        → gráfico de dona con sus partes
     PROYECTOS   → barras de avance por proyecto
     USO         → tabla de niveles de enrutamiento
   ===================================================================== */

var KPIS = [
  { t: 'Indicador 1', v: '—', d: 'Descripción del indicador' },
  { t: 'Indicador 2', v: '—', d: 'Descripción del indicador' },
  { t: 'Indicador 3', v: '—', d: 'Descripción del indicador' }
];

var KPIS_VIVOS = [
  { t: 'Tareas completadas',     v: '—', d: 'de tareas en el tablero' },
  { t: 'Correos resueltos',      v: '—', d: 'respondidos o delegados' },
  { t: 'Avance de proyectos',    v: '—', d: 'promedio de los proyectos' }
];

var GRAFICO = {
  titulo: 'Consultas por área',
  lectura: 'De dónde vienen las consultas al espacio. Sirve para decidir dónde conviene el próximo agente.',
  labels: ['Área 1', 'Área 2', 'Área 3', 'Área 4', 'Área 5'],
  datos:  [0, 0, 0, 0, 0]
};

var DONA = [
  { n: 'Pendiente',   v: 0, c: '#FBBF24' },
  { n: 'En curso',    v: 0, c: '#22D3EE' },
  { n: 'En revisión', v: 0, c: '#8B5CF6' },
  { n: 'Completada',  v: 0, c: '#34D399' }
];

var PROYECTOS = [];

var USO = [
  { k: 'local_s', n: 'Modelo local · consulta simple',        d: 'DGX Spark',                  loc: 1, c: 0 },
  { k: 'local_m', n: 'Modelo local · contexto extenso',       d: 'DGX Spark',                  loc: 1, c: 0 },
  { k: 'local_f', n: 'Modelo local · dato restringido',       d: 'DGX Spark',                  loc: 1, c: 0 },
  { k: 'nube_r',  n: 'Modelo local · razonamiento',           d: 'DGX Spark · modelo grande',  loc: 1, c: 0 },
  { k: 'nube_g',  n: 'Modelo local · conocimiento general',   d: 'DGX Spark · sin contexto',   loc: 1, c: 0 },
  { k: 'charla',  n: 'Modelo local · conversación',           d: 'DGX Spark',                  loc: 1, c: 0 }
];

/* =====================================================================
   GRÁFICOS SVG
   ===================================================================== */

function barrasV(labels, datos, unidad) {
  var max = Math.max.apply(null, datos.concat([1])) * 1.15;
  var W = 700, H = 240, ml = 120, mr = 20, mt = 6, mb = 6;
  var alto = (H - mt - mb) / labels.length;
  var an = Math.min(26, alto * 0.52);
  var out = '';
  labels.forEach(function (l, i) {
    var y = mt + alto * i + (alto - an) / 2;
    var w = Math.max(2, (datos[i] / max) * (W - ml - mr));
    out += '<text x="' + (ml - 12) + '" y="' + (y + an / 2 + 4) + '" text-anchor="end" font-size="12.5" fill="var(--mist)">' + esc(l) + '</text>' +
      '<rect x="' + ml + '" y="' + y + '" width="' + w + '" height="' + an + '" rx="4" fill="url(#gb)"/>' +
      '<text x="' + (ml + w + 8) + '" y="' + (y + an / 2 + 4) + '" font-size="12.5" font-weight="600" fill="var(--white)">' + datos[i] + (unidad || '') + '</text>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" class="chart">' +
    '<defs><linearGradient id="gb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2DD4BF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs>' +
    out + '</svg>';
}

function donaV(partes) {
  var tot = partes.reduce(function (a, b) { return a + b.v; }, 0) || 1;
  var R = 54, C = 2 * Math.PI * R, off = 0;
  var seg = partes.map(function (p) {
    var len = p.v / tot * C;
    var s = '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + p.c + '" stroke-width="16" ' +
      'stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"/>';
    off += len;
    return s;
  }).join('');
  return '<div class="dona"><svg viewBox="0 0 140 140" width="140" height="140">' + seg +
    '<text x="70" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="var(--white)">' + tot + '</text>' +
    '<text x="70" y="84" text-anchor="middle" font-size="9.5" fill="var(--dim)">TAREAS</text></svg>' +
    '<div class="dleg">' + partes.map(function (p) {
      return '<span><i style="background:' + p.c + '"></i>' + esc(p.n) + '<b>' + p.v + '</b></span>';
    }).join('') + '</div></div>';
}

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaIndicadores() {
  return '<div class="ph"><h1>Indicadores</h1>' +
    '<p class="sub">No son métricas de la herramienta: son métricas de la operación de la empresa. Lo de arriba viene del espacio; lo de abajo se mueve con lo que hacés en el demo.</p></div>' +

    '<div class="grid g3">' + KPIS.map(kpi).join('') + '</div>' +

    '<div class="grid g3" style="margin-top:16px">' + KPIS_VIVOS.map(kpi).join('') + '</div>' +

    '<div class="grid g2" style="margin-top:22px">' +
      '<article class="card"><div class="rowb"><b>' + esc(GRAFICO.titulo) + '</b><span class="chip xs">últimos 30 días</span></div>' +
        barrasV(GRAFICO.labels, GRAFICO.datos, '') +
        (GRAFICO.lectura ? '<div class="note tl" style="margin-top:10px">' + ic('chip') + '<div>' + esc(GRAFICO.lectura) + '</div></div>' : '') +
      '</article>' +
      '<article class="card"><div class="rowb"><b>Estado del tablero</b><span class="chip xs">en vivo</span></div>' +
        donaV(DONA) +
        '<div class="note vi" style="margin-top:10px">' + ic('info') + '<div>Este gráfico se mueve cuando movés una tarjeta en Tareas. Es el mismo dato, no una copia.</div></div>' +
      '</article>' +
    '</div>' +

    (PROYECTOS.length
      ? '<div class="card" style="margin-top:16px"><div class="rowb"><b>Avance por proyecto</b>' +
          '<a class="btn xs gh" href="#" data-ir="proyectos">Ver proyectos' + ic('right') + '</a></div>' +
          PROYECTOS.map(function (p) {
            return '<div class="prg"><div class="rowb"><span>' + esc(p.n) + '</span><b>' + p.pct + '%</b></div>' +
              '<div class="bar"><i style="width:' + p.pct + '%"></i></div></div>';
          }).join('') + '</div>'
      : '') +

    '<div class="card" style="margin-top:16px"><div class="rowb"><b>Dónde corrió cada consulta</b>' +
      '<a class="btn xs gh" href="#" data-ir="ayuda">Ver la política' + ic('right') + '</a></div>' +
      '<p class="lead">Cada respuesta del chat deja registrado en qué nivel se resolvió. Eso es lo que hace auditable la promesa de privacidad.</p>' +
      (USO.some(function (u) { return u.c > 0; })
        ? '<table class="tbl"><thead><tr><th>Nivel</th><th>Dónde</th><th>Consultas</th></tr></thead><tbody>' +
          USO.map(function (u) {
            return '<tr><td><b>' + esc(u.n) + '</b></td>' +
              '<td><span class="chip ' + (u.loc ? 'tl' : 'am') + ' xs">' + ic(u.loc ? 'chip' : 'cloud') + esc(u.d) + '</span></td>' +
              '<td>' + u.c + '</td></tr>';
          }).join('') + '</tbody></table>'
        : '<div class="empty">' + ic('chat') + 'Todavía no hay consultas en esta sesión. Preguntale algo a MÍA y volvé.</div>') +
    '</div>';
}

function kpi(k) {
  return '<article class="card kpi"><small>' + esc(k.t) + '</small><b>' + esc(k.v) + '</b><em>' + esc(k.d) + '</em></article>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  $$('[data-ir]').forEach(function (b) {
    b.onclick = function (e) {
      e.preventDefault();
      var v = b.getAttribute('data-ir');
      toast('Este módulo navegaría a «' + v + '».', 'info');
    };
  });
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaIndicadores() + '</div>';
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'indicadores' }, '*');
  }
} catch (e) {}

})();