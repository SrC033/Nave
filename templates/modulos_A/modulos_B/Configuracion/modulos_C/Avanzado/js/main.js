(function () {
'use strict';

function $(s) { return document.querySelector(s); }

function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 3000);
}

function render() {
  var html =
    '<div class="ph">' +
      '<h1>Avanzado</h1>' +
      '<p>Exportar/importar configuración, reiniciar datos y otras acciones técnicas.</p>' +
    '</div>' +

    // Configuración técnica
    '<div class="card">' +
      '<h3>Configuración del sistema</h3>' +
      '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
        '<button class="btn" id="btn-export">' +
          '<i class="fa-solid fa-download"></i> Exportar configuración' +
        '</button>' +
        '<button class="btn" id="btn-import">' +
          '<i class="fa-solid fa-upload"></i> Importar configuración' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Zona de peligro
    '<div class="card danger">' +
      '<h3>' +
        '<svg viewBox="0 0 24 24"><path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/></svg>' +
        'Zona de peligro' +
      '</h3>' +
      '<p>Estas acciones no se pueden deshacer.</p>' +

      '<div class="danger-row">' +
        '<div class="txt">' +
          '<b>Reiniciar datos de ejemplo</b>' +
          '<small>Borra todo lo que creaste en esta sesión y vuelve al estado inicial.</small>' +
        '</div>' +
        '<button class="btn" id="btn-reset">Reiniciar</button>' +
      '</div>' +

      '<div class="danger-row">' +
        '<div class="txt">' +
          '<b>Eliminar el espacio</b>' +
          '<small>Borra definitivamente la empresa, los usuarios y todos los documentos.</small>' +
        '</div>' +
        '<button class="btn d" id="btn-delete">Eliminar espacio</button>' +
      '</div>' +
    '</div>';

  $('#view').innerHTML = html;

  // Eventos
  $('#btn-export').onclick = function() {
    toast('Generando archivo de configuración (demo)...');
  };

  $('#btn-import').onclick = function() {
    // Simula la apertura de un explorador de archivos
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      if (e.target.files.length > 0) {
        toast('Importando configuración... (demo)');
      }
    };
    input.click();
  };

  $('#btn-reset').onclick = function() {
    var confirm1 = confirm('¿Estás seguro de que querés reiniciar los datos de ejemplo? Esta acción no se puede deshacer.');
    if (confirm1) {
      toast('Datos de ejemplo restaurados.');
    }
  };

  $('#btn-delete').onclick = function() {
    var text = prompt('Esta acción es PERMANENTE. Si estás seguro, escribí "ELIMINAR" en mayúsculas:');
    if (text === 'ELIMINAR') {
      toast('El espacio ha sido eliminado. Redirigiendo...');
    } else if (text !== null) {
      toast('Cancelado. La palabra de confirmación no coincidió.');
    }
  };
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();