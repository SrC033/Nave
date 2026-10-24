(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  palette: '<path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 0-3 2 2 0 0 1 0-4h2a6 6 0 0 0 0-11h-2z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/>',
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:    '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  monitor: '<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 22h8M12 18v4"/>',
  type:    '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  layout:  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  reset:   '<path d="M3 12a9 9 0 1 0 3-6.7V9H3"/><path d="M3 3v6h6"/>',
  eye:     '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  save:    '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  rain:    '<path d="M20 16.6A4.5 4.5 0 0 0 18 8h-1.3A7 7 0 1 0 5 15"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>'
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
   CATÁLOGO
   ===================================================================== */

var PALETAS = [
  { id: 'coreteks', n: 'Coreteks',      d: 'Cian y violeta sobre azul profundo',
    sw: ['#22D3EE', '#8B5CF6', '#2DD4BF', '#07101F'],
    vars: { '--bg':'#07101F', '--side':'#0A1526', '--card':'#0E1A2C', '--card2':'#132338',
            '--line':'rgba(125,150,195,.16)', '--line2':'rgba(125,150,195,.30)',
            '--white':'#EAF0FA', '--mist':'#A3B3CD', '--dim':'#71859F',
            '--teal':'#2DD4BF', '--cyan':'#22D3EE', '--violet':'#8B5CF6', '--amber':'#FBBF24',
            '--green':'#34D399', '--red':'#F87171', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#22D3EE,#8B5CF6)' } },
  { id: 'medianoche', n: 'Medianoche',  d: 'Azul cobalto con acentos plata',
    sw: ['#3B82F6', '#93C5FD', '#E0E7FF', '#050914'],
    vars: { '--bg':'#050914', '--side':'#0A1122', '--card':'#0D1730', '--card2':'#111F40',
            '--line':'rgba(140,165,220,.16)', '--line2':'rgba(140,165,220,.32)',
            '--white':'#E8EEFB', '--mist':'#A5B4D4', '--dim':'#6C7A9B',
            '--teal':'#60A5FA', '--cyan':'#93C5FD', '--violet':'#8B5CF6', '--amber':'#FBBF24',
            '--green':'#34D399', '--red':'#F87171', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#3B82F6,#8B5CF6)' } },
  { id: 'esmeralda', n: 'Esmeralda',    d: 'Verde profundo y acento lima',
    sw: ['#10B981', '#84CC16', '#A7F3D0', '#04140F'],
    vars: { '--bg':'#04140F', '--side':'#081F18', '--card':'#0B2A20', '--card2':'#0F3527',
            '--line':'rgba(130,195,165,.16)', '--line2':'rgba(130,195,165,.30)',
            '--white':'#E8FAF1', '--mist':'#A5C8B8', '--dim':'#6C8F82',
            '--teal':'#34D399', '--cyan':'#22D3EE', '--violet':'#8B5CF6', '--amber':'#FBBF24',
            '--green':'#84CC16', '--red':'#F87171', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#34D399,#84CC16)' } },
  { id: 'ambar', n: 'Ámbar',            d: 'Marrón cálido con dorados',
    sw: ['#FBBF24', '#F59E0B', '#FDE68A', '#1A1204'],
    vars: { '--bg':'#160F05', '--side':'#221708', '--card':'#2A1D0B', '--card2':'#382712',
            '--line':'rgba(220,180,120,.16)', '--line2':'rgba(220,180,120,.30)',
            '--white':'#FDF4DC', '--mist':'#D8C4A0', '--dim':'#9A855F',
            '--teal':'#FBBF24', '--cyan':'#F59E0B', '--violet':'#8B5CF6', '--amber':'#FDE68A',
            '--green':'#34D399', '--red':'#F87171', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#FBBF24,#F59E0B)' } },
  { id: 'carmesi', n: 'Carmesí',        d: 'Rojo profundo y rosado',
    sw: ['#F87171', '#EC4899', '#FECDD3', '#1A0509'],
    vars: { '--bg':'#140508', '--side':'#20080D', '--card':'#280B11', '--card2':'#371018',
            '--line':'rgba(220,150,160,.16)', '--line2':'rgba(220,150,160,.30)',
            '--white':'#FDF0F0', '--mist':'#D8B5BB', '--dim':'#9A6E75',
            '--teal':'#F87171', '--cyan':'#EC4899', '--violet':'#8B5CF6', '--amber':'#FBBF24',
            '--green':'#34D399', '--red':'#FECACA', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#F87171,#EC4899)' } },
  { id: 'grafito', n: 'Grafito',        d: 'Gris neutro para largas jornadas',
    sw: ['#94A3B8', '#64748B', '#E2E8F0', '#0B0F14'],
    vars: { '--bg':'#0B0F14', '--side':'#141A22', '--card':'#1A222C', '--card2':'#232D3A',
            '--line':'rgba(150,165,185,.16)', '--line2':'rgba(150,165,185,.30)',
            '--white':'#EDF1F6', '--mist':'#A8B2C0', '--dim':'#6C7A88',
            '--teal':'#94A3B8', '--cyan':'#60A5FA', '--violet':'#8B5CF6', '--amber':'#FBBF24',
            '--green':'#34D399', '--red':'#F87171', '--blue':'#3B82F6',
            '--grad':'linear-gradient(135deg,#94A3B8,#64748B)' } }
];

var TIPOGRAFIAS = [
  { id: 'sora',    n: 'Sora',        d: 'Moderna, geométrica',       disp: "'Sora',system-ui,sans-serif" },
  { id: 'inter',   n: 'Inter',       d: 'Neutra, muy legible',       disp: "'Inter',system-ui,sans-serif" },
  { id: 'system',  n: 'Sistema',     d: 'La del sistema operativo',  disp: "system-ui,-apple-system,'Segoe UI',sans-serif" },
  { id: 'serif',   n: 'Serif',       d: 'Clásica, editorial',        disp: "Georgia,'Times New Roman',serif" },
  { id: 'mono',    n: 'Mono',        d: 'Técnica, tipo código',      disp: "ui-monospace,SFMono-Regular,Menlo,monospace" }
];

var MODOS = [
  { id: 'oscuro',  n: 'Oscuro',   d: 'Interfaz oscura',   ico: 'moon' },
  { id: 'claro',   n: 'Claro',    d: 'Interfaz clara',    ico: 'sun' },
  { id: 'auto',    n: 'Auto',     d: 'Según el sistema',  ico: 'monitor' }
];

var ACENTOS = [
  { id: 'teal',   c: '#2DD4BF', n: 'Teal' },
  { id: 'cyan',   c: '#22D3EE', n: 'Cian' },
  { id: 'violet', c: '#8B5CF6', n: 'Violeta' },
  { id: 'blue',   c: '#3B82F6', n: 'Azul' },
  { id: 'green',  c: '#34D399', n: 'Verde' },
  { id: 'amber',  c: '#FBBF24', n: 'Ámbar' },
  { id: 'pink',   c: '#EC4899', n: 'Rosa' },
  { id: 'red',    c: '#F87171', n: 'Rojo' }
];

/* =====================================================================
   ESTADO
   ===================================================================== */
var DEFAULTS = {
  paleta: 'coreteks',
  modo: 'oscuro',
  acento: 'teal',
  tipografia: 'sora',
  densidad: 'confort',
  radio: 14,
  animaciones: true,
  sidebarCompacto: false,
  reducirTransparencia: false,
  fontSize: 14.5
};

var ESTADO = Object.assign({}, DEFAULTS);

/* =====================================================================
   APLICACIÓN DEL TEMA
   ---------------------------------------------------------------------
   Aplica los tokens al documento del módulo Y avisa al shell para que
   los aplique al documento principal (por postMessage).
   ===================================================================== */
function aplicarTema() {
  var pal = PALETAS.filter(function (p) { return p.id === ESTADO.paleta; })[0] || PALETAS[0];
  var tip = TIPOGRAFIAS.filter(function (t) { return t.id === ESTADO.tipografia; })[0] || TIPOGRAFIAS[0];

  /* Aplica en el documento del módulo */
  var root = document.documentElement;
  Object.keys(pal.vars).forEach(function (k) { root.style.setProperty(k, pal.vars[k]); });
  root.style.setProperty('--disp', tip.disp);
  root.style.setProperty('--r', (ESTADO.radio) + 'px');
  root.style.setProperty('--r2', Math.max(6, ESTADO.radio - 4) + 'px');
  root.style.setProperty('font-size', ESTADO.fontSize + 'px');
  root.style.setProperty('--accent', colorAcento());
  root.style.setProperty('--accent-soft', colorAcentoSuave());

  var d = document.documentElement;
  d.dataset.densidad = ESTADO.densidad;
  d.dataset.animaciones = ESTADO.animaciones ? 'on' : 'off';
  d.dataset.sidebar = ESTADO.sidebarCompacto ? 'compacto' : 'normal';
  d.dataset.transparencia = ESTADO.reducirTransparencia ? 'reducida' : 'normal';
  d.dataset.modo = ESTADO.modo;

  /* Envía al shell para que aplique el mismo tema */
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'THEME_APPLY',
        theme: ESTADO,
        vars: pal.vars,
        tipografia: tip.disp
      }, '*');
    }
  } catch (e) {}
}

function colorAcento() {
  var a = ACENTOS.filter(function (x) { return x.id === ESTADO.acento; })[0];
  return a ? a.c : '#2DD4BF';
}
function colorAcentoSuave() {
  var c = colorAcento();
  /* Convertimos #RRGGBB a rgba con alfa .15 */
  var r = parseInt(c.slice(1, 3), 16);
  var g = parseInt(c.slice(3, 5), 16);
  var b = parseInt(c.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',.15)';
}

/* =====================================================================
   VISTA
   ===================================================================== */
function vistaTemas() {
  return '<div class="ph"><h1>Temas y personalización</h1>' +
    '<p class="sub">Ajustá el aspecto del espacio a tu manera. Los cambios se aplican al instante y quedan guardados para tu perfil.</p>' +
    '<div class="chips" style="margin-top:14px">' +
      '<span class="chip tl">' + ic('spark') + 'Se aplica en vivo' +
      '</span>' +
      '<span class="chip">' + ic('save') + 'Se guarda en tu perfil</span>' +
    '</div></div>' +

    '<div class="split" style="grid-template-columns:minmax(0,1fr) 360px">' +

      '<div>' +

        /* ---------- Paleta ---------- */
        '<section class="tgroup">' +
          '<header>' + ic('palette') +
            '<div><h2>Paleta de colores</h2>' +
            '<p>Elegí un conjunto de colores predefinido. Cada paleta ajusta el fondo, las tarjetas, los textos y los acentos.</p></div>' +
          '</header>' +
          '<div class="paletas">' + PALETAS.map(pcard).join('') + '</div>' +
        '</section>' +

        /* ---------- Modo ---------- */
        '<section class="tgroup">' +
          '<header>' + ic('sun') +
            '<div><h2>Modo de la interfaz</h2>' +
            '<p>Oscuro para trabajar de noche, claro para ambientes luminosos, auto para seguir el sistema.</p></div>' +
          '</header>' +
          '<div class="mode-row">' + MODOS.map(mcard).join('') + '</div>' +
        '</section>' +

        /* ---------- Acento ---------- */
        '<section class="tgroup">' +
          '<header>' + ic('spark') +
            '<div><h2>Color de acento</h2>' +
            '<p>El color que marca lo activo, los botones principales y los indicadores.</p></div>' +
          '</header>' +
          '<div class="acentos">' + ACENTOS.map(acard).join('') + '</div>' +
        '</section>' +

        /* ---------- Tipografía ---------- */
        '<section class="tgroup">' +
          '<header>' + ic('type') +
            '<div><h2>Tipografía</h2>' +
            '<p>La fuente que se usa para los títulos y las tarjetas.</p></div>' +
          '</header>' +
          '<div class="fonts">' + TIPOGRAFIAS.map(fcard).join('') + '</div>' +
        '</section>' +

        /* ---------- Ajustes visuales ---------- */
        '<section class="tgroup">' +
          '<header>' + ic('layout') +
            '<div><h2>Ajustes visuales</h2>' +
            '<p>Densidad, tamaño de letra, radio de bordes y efectos.</p></div>' +
          '</header>' +

          '<div class="card tight" style="display:flex;flex-direction:column;gap:16px">' +

            '<div class="slider-row">' +
              '<label>Radio de bordes</label>' +
              '<input type="range" min="4" max="24" step="1" id="slRadio" value="' + ESTADO.radio + '">' +
              '<span class="val" id="slRadioV">' + ESTADO.radio + 'px</span>' +
            '</div>' +

            '<div class="slider-row">' +
              '<label>Tamaño de letra</label>' +
              '<input type="range" min="12" max="18" step="0.5" id="slFont" value="' + ESTADO.fontSize + '">' +
              '<span class="val" id="slFontV">' + ESTADO.fontSize + 'px</span>' +
            '</div>' +

            '<div>' +
              '<label class="lbl">Densidad</label>' +
              '<div class="chips">' +
                ['compacta','confort','amplia'].map(function (x) {
                  return '<button class="chip' + (ESTADO.densidad === x ? ' on' : '') + '" data-densidad="' + x + '">' + x.charAt(0).toUpperCase() + x.slice(1) + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +

          '</div>' +

          '<div class="switch-list" style="margin-top:14px">' +
            switchRow('animaciones', 'Animaciones de la interfaz', 'Transiciones suaves al abrir y cerrar paneles.') +
            switchRow('sidebarCompacto', 'Sidebar ultra compacto', 'Reduce aún más el ancho de la barra lateral.') +
            switchRow('reducirTransparencia', 'Reducir transparencias', 'Quita los efectos de blur para ahorrar recursos.') +
          '</div>' +

        '</section>' +

      '</div>' +

      /* ---------- Panel lateral: preview en vivo + acciones ---------- */
      '<aside>' +
        '<div class="tprev">' +
          '<div class="tprev-hd">' +
            '<span>Vista previa</span>' +
            '<span class="dot"><i></i><i></i><i></i></span>' +
          '</div>' +
          '<div class="tprev-body">' +
            '<div class="tprev-card">' +
              '<div class="row">' +
                '<span class="ic">' + ic('spark') + '</span>' +
                '<div><h4>MÍA · asistente</h4><p>¿Qué necesitás resolver hoy?</p></div>' +
              '</div>' +
              '<div class="tprev-btn">' + ic('right') + 'Abrir chat</div>' +
            '</div>' +
            '<div class="tprev-card">' +
              '<h4>Paleta activa</h4>' +
              '<div class="tprev-swatches">' +
                '<i style="background:' + colorAcento() + '"></i>' +
                '<i style="background:' + (PALETAS.filter(function (p) { return p.id === ESTADO.paleta; })[0] || PALETAS[0]).sw[1] + '"></i>' +
                '<i style="background:' + (PALETAS.filter(function (p) { return p.id === ESTADO.paleta; })[0] || PALETAS[0]).sw[2] + '"></i>' +
              '</div>' +
            '</div>' +
            '<div class="tprev-card">' +
              '<h4>Configuración actual</h4>' +
              '<p><b style="color:var(--white)">Paleta:</b> ' + esc((PALETAS.filter(function (p) { return p.id === ESTADO.paleta; })[0] || PALETAS[0]).n) + '<br>' +
              '<b style="color:var(--white)">Modo:</b> ' + esc((MODOS.filter(function (m) { return m.id === ESTADO.modo; })[0] || MODOS[0]).n) + '<br>' +
              '<b style="color:var(--white)">Acento:</b> ' + esc((ACENTOS.filter(function (a) { return a.id === ESTADO.acento; })[0] || ACENTOS[0]).n) + '<br>' +
              '<b style="color:var(--white)">Tipografía:</b> ' + esc((TIPOGRAFIAS.filter(function (t) { return t.id === ESTADO.tipografia; })[0] || TIPOGRAFIAS[0]).n) + '<br>' +
              '<b style="color:var(--white)">Radio:</b> ' + ESTADO.radio + 'px<br>' +
              '<b style="color:var(--white)">Densidad:</b> ' + esc(ESTADO.densidad) + '</p>' +
            '</div>' +
          '</div>' +
          '<div style="padding:14px;border-top:1px solid var(--line);display:flex;gap:8px">' +
            '<button class="btn full" data-accion="reset">' + ic('reset') + 'Restaurar predeterminado</button>' +
          '</div>' +
        '</div>' +

        '<div class="note tl" style="margin-top:16px">' + ic('info') +
          '<div>Tu configuración se guarda en el navegador y no afecta a los demás usuarios del espacio. Al aplicar un tema, el shell también lo refleja.</div>' +
        '</div>' +
      '</aside>' +

    '</div>';
}

function pcard(p) {
  var on = ESTADO.paleta === p.id;
  return '<article class="pcard' + (on ? ' on' : '') + '" data-paleta="' + p.id + '">' +
    '<span class="check">' + ic('check') + '</span>' +
    '<div class="pcard-top">' +
      '<span class="pcard-swatch">' + p.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
    '</div>' +
    '<div>' +
      '<b>' + esc(p.n) + '</b>' +
      '<small>' + esc(p.d) + '</small>' +
    '</div>' +
    '<div class="pprev" style="background:' + p.vars['--bg'] + '">' +
      '<div class="p-side" style="background:' + p.vars['--side'] + '"></div>' +
      '<div class="p-main" style="background:' + p.vars['--card'] + '">' +
        '<div class="p-bar s" style="background:' + p.vars['--teal'] + '"></div>' +
        '<div class="p-bar t" style="background:' + p.vars['--line2'] + '"></div>' +
        '<div class="p-dot" style="background:' + p.vars['--teal'] + '"></div>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function mcard(m) {
  var on = ESTADO.modo === m.id;
  return '<article class="modecard' + (on ? ' on' : '') + '" data-modo="' + m.id + '">' +
    '<span class="moico ' + m.id + '" style="background:' + (m.id === 'claro' ? 'rgba(251,191,36,.16)' : m.id === 'oscuro' ? 'rgba(139,92,246,.18)' : 'rgba(45,212,191,.16)') + ';color:' + (m.id === 'claro' ? '#FBBF24' : m.id === 'oscuro' ? '#C4B5FD' : '#2DD4BF') + '">' + ic(m.ico) + '</span>' +
    '<b>' + esc(m.n) + '</b>' +
    '<small>' + esc(m.d) + '</small>' +
  '</article>';
}

function acard(a) {
  var on = ESTADO.acento === a.id;
  return '<button class="acbtn' + (on ? ' on' : '') + '" data-acento="' + a.id + '" title="' + esc(a.n) + '" style="background:' + a.c + '"></button>';
}

function fcard(t) {
  var on = ESTADO.tipografia === t.id;
  return '<button class="fontcard' + (on ? ' on' : '') + '" data-tipo="' + t.id + '">' +
    '<div class="fname">' + esc(t.n) + '</div>' +
    '<div class="fprev" style="font-family:' + t.disp + '">Aa Bb Cc 123</div>' +
    '<div class="fsub">' + esc(t.d) + '</div>' +
  '</button>';
}

function switchRow(k, t, d) {
  var on = ESTADO[k] ? ' on' : '';
  return '<div class="switch-row">' +
    '<div class="txt"><b>' + esc(t) + '</b><small>' + esc(d) + '</small></div>' +
    '<button class="sw' + on + '" type="button" data-sw="' + k + '" aria-label="' + esc(t) + '"></button>' +
  '</div>';
}

/* =====================================================================
   EVENTOS
   ===================================================================== */

function bind() {
  /* Paletas */
  $$('[data-paleta]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.paleta = b.getAttribute('data-paleta');
      aplicarTema(); guardar(); render();
      toast('Paleta «' + (PALETAS.filter(function (p) { return p.id === ESTADO.paleta; })[0] || {}).n + '» aplicada.', 'palette');
    };
  });

  /* Modos */
  $$('[data-modo]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.modo = b.getAttribute('data-modo');
      aplicarTema(); guardar(); render();
      toast('Modo ' + ESTADO.modo + '.', 'sun');
    };
  });

  /* Acento */
  $$('[data-acento]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.acento = b.getAttribute('data-acento');
      aplicarTema(); guardar(); render();
      toast('Acento actualizado.', 'spark');
    };
  });

  /* Tipografía */
  $$('[data-tipo]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.tipografia = b.getAttribute('data-tipo');
      aplicarTema(); guardar(); render();
      toast('Tipografía actualizada.', 'type');
    };
  });

  /* Densidad */
  $$('[data-densidad]').forEach(function (b) {
    b.onclick = function () {
      ESTADO.densidad = b.getAttribute('data-densidad');
      aplicarTema(); guardar(); render();
    };
  });

  /* Sliders */
  var slR = $('#slRadio');
  if (slR) slR.oninput = function () {
    ESTADO.radio = Number(slR.value);
    var v = $('#slRadioV'); if (v) v.textContent = ESTADO.radio + 'px';
    aplicarTema();
  };
  if (slR) slR.onchange = function () { guardar(); };

  var slF = $('#slFont');
  if (slF) slF.oninput = function () {
    ESTADO.fontSize = Number(slF.value);
    var v = $('#slFontV'); if (v) v.textContent = ESTADO.fontSize + 'px';
    aplicarTema();
  };
  if (slF) slF.onchange = function () { guardar(); };

  /* Switches */
  $$('[data-sw]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-sw');
      ESTADO[k] = !ESTADO[k];
      b.classList.toggle('on', ESTADO[k]);
      aplicarTema(); guardar();
      toast((ESTADO[k] ? 'Activado: ' : 'Desactivado: ') + k, 'check');
    };
  });

  /* Reset */
  $$('[data-accion="reset"]').forEach(function (b) {
    b.onclick = function () {
      ESTADO = Object.assign({}, DEFAULTS);
      aplicarTema(); guardar(); render();
      toast('Configuración restaurada.', 'reset');
    };
  });
}

/* =====================================================================
   PERSISTENCIA (en memoria de la pestaña)
   ===================================================================== */
var CLAVE = 'coreteks.tema.v1';
var MEM = {};
function guardar() {
  try { MEM[CLAVE] = JSON.stringify(ESTADO); } catch (e) {}
}
function cargar() {
  try {
    var raw = MEM[CLAVE];
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object') ESTADO = Object.assign({}, DEFAULTS, p);
    }
  } catch (e) {}
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaTemas() + '</div>';
  bind();
}
function init() {
  cargar();
  aplicarTema();
  render();
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'temas' }, '*');
  }
} catch (e) {}

})();