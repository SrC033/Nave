(function () {
'use strict';

/* ---------- Estado de Preferencias ---------- */
// Puedes cargar estas preferencias desde localStorage si lo deseas en el futuro.
var ESTADO = {
  mencion: true,
  asignacion: true,
  email: true,
  resumenDiario: false,
  marketing: false,
  sonido: true
};

function $(s) { return document.querySelector(s); }

function toast(msg) {
  var t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600);
}

/* ---------- Render de la Vista ---------- */
function render() {
  var html =
    '<div class="ph">' +
      '<h1>Notificaciones</h1>' +
      '<p>Elegí qué querés que te avise el espacio y por qué canal.</p>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Alertas en el sistema</h3>' +
      '<p class="desc">Notificaciones que aparecen dentro de la plataforma mientras trabajás.</p>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Menciones</b><small>Cuando alguien te nombra en un comentario o en una tarea.</small></div>' +
        '<button class="sw' + (ESTADO.mencion ? ' on' : '') + '" data-k="mencion"></button>' +
      '</div>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Asignaciones</b><small>Cuando te asignan una tarea o te delegan un correo.</small></div>' +
        '<button class="sw' + (ESTADO.asignacion ? ' on' : '') + '" data-k="asignacion"></button>' +
      '</div>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Sonido</b><small>Un sonido suave cuando llega una notificación.</small></div>' +
        '<button class="sw' + (ESTADO.sonido ? ' on' : '') + '" data-k="sonido"></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Correos y resúmenes</h3>' +
      '<p class="desc">Notificaciones que llegan a tu bandeja de entrada.</p>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Resumen por correo</b><small>Un resumen con lo importante al final del día.</small></div>' +
        '<button class="sw' + (ESTADO.email ? ' on' : '') + '" data-k="email"></button>' +
      '</div>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Recordatorio diario</b><small>A las 8:00, un resumen de lo que tenés pendiente.</small></div>' +
        '<button class="sw' + (ESTADO.resumenDiario ? ' on' : '') + '" data-k="resumenDiario"></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Novedades y marketing</h3>' +
      '<p class="desc">Información sobre nuevas funciones y el producto.</p>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Novedades del producto</b><small>Avisos de nuevas funciones, mejoras y consejos de uso.</small></div>' +
        '<button class="sw' + (ESTADO.marketing ? ' on' : '') + '" data-k="marketing"></button>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">' +
      '<button class="btn" id="btn-save">Guardar preferencias</button>' +
    '</div>';

  $('#view').innerHTML = html;

  // Toggles
  document.querySelectorAll('.sw').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-k');
      ESTADO[k] = !ESTADO[k];
      btn.classList.toggle('on', ESTADO[k]);
    };
  });

  // Guardar
  $('#btn-save').onclick = function () {
    // Opcional: Guardar en localStorage
    try {
      localStorage.setItem('naveia_notif_prefs', JSON.stringify(ESTADO));
    } catch(e) {}
    
    toast('Preferencias de notificaciones guardadas.');
    
    // Notificar al sistema (si es necesario) que las preferencias cambiaron
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'NOTIF_PREFS_UPDATED', prefs: ESTADO }, '*');
      }
    } catch (e) {}
  };
}

/* ---------- Carga Inicial ---------- */
function init() {
  // Intentar cargar preferencias guardadas
  try {
    var saved = localStorage.getItem('naveia_notif_prefs');
    if (saved) {
      var parsed = JSON.parse(saved);
      for (var k in parsed) {
        if (ESTADO.hasOwnProperty(k)) ESTADO[k] = parsed[k];
      }
    }
  } catch (e) {}
  
  render();
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

})();