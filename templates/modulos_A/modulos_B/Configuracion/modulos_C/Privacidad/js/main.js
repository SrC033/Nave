(function () {
'use strict';

var ESTADO = {
  nube: false,
  restringidos: false,
  historial: true,
  analytics: false,
  exportar: true
};

function $(s) { return document.querySelector(s); }

function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600);
}

function render() {
  var html =
    '<div class="ph">' +
      '<h1>Privacidad y datos</h1>' +
      '<p>Controlá qué información puede salir del nodo propio y cómo se guarda tu historial.</p>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Procesamiento y Nube</h3>' +
      '<p class="desc">Controlá si la IA puede usar servidores externos o se mantiene 100% local.</p>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Permitir destinos en la nube</b><small>Cuando está apagado, todo se procesa en el nodo propio. Lo restringido nunca sale.</small></div>' +
        '<button class="sw' + (ESTADO.nube ? ' on' : '') + '" data-k="nube"></button>' +
      '</div>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Incluir documentos restringidos</b><small>Solo si tu perfil tiene habilitado ese acceso.</small></div>' +
        '<button class="sw' + (ESTADO.restringidos ? ' on' : '') + '" data-k="restringidos"></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Historial y Telemetría</h3>' +
      '<p class="desc">Configuración sobre el almacenamiento de tus datos de uso.</p>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Guardar historial de chat</b><small>Permite retomar conversaciones anteriores con MÍA.</small></div>' +
        '<button class="sw' + (ESTADO.historial ? ' on' : '') + '" data-k="historial"></button>' +
      '</div>' +
      
      '<div class="row-set">' +
        '<div class="txt"><b>Compartir métricas de uso</b><small>Solo estadísticas anónimas para mejorar el producto.</small></div>' +
        '<button class="sw' + (ESTADO.analytics ? ' on' : '') + '" data-k="analytics"></button>' +
      '</div>

      '<div class="row-set">' +
        '<div class="txt"><b>Permitir exportar mis datos</b><small>Podés descargar todo lo que generaste en el espacio.</small></div>' +
        '<button class="sw' + (ESTADO.exportar ? ' on' : '') + '" data-k="exportar"></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Acciones sobre tus datos</h3>' +
      '<p class="desc">Gestioná la información que has generado hasta ahora.</p>' +
      '<div class="actions">' +
        '<button class="btn outline" id="btn-export">Exportar mis datos</button>' +
        '<button class="btn danger" id="btn-clear">Limpiar mi historial</button>' +
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

  // Acciones
  $('#btn-export').onclick = function () {
    toast('Generando archivo de exportación...');
  };

  $('#btn-clear').onclick = function () {
    if(confirm('¿Estás seguro de que querés borrar todo tu historial de chat?')) {
      toast('Historial de chat eliminado correctamente.');
    }
  };

  // Guardar
  $('#btn-save').onclick = function () {
    toast('Preferencias de privacidad guardadas.');
  };
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();