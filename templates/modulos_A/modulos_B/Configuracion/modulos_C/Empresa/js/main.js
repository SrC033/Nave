(function () {
'use strict';

var ESTADO = {
  razon: 'Constructora Vértice, S.A.',
  ruc: 'J0310000000000',
  giro: 'Construcción · 3 proyectos activos',
  sede: 'Managua, Nicaragua',
  colab: '240 colaboradores',
  admin: 'Marco Ledesma',
  dominio: 'constructoravertice.com'
};

function $(s) { return document.querySelector(s); }
function esc(t) {
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
      '<h1>Datos de la Empresa</h1>' +
      '<p>Los datos de la empresa que se usan en documentos, correos y reportes generados por MÍA.</p>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Información General</h3>' +
      '<div class="grid">' +
        '<div class="fld"><label>Razón social</label><input class="inp" id="f-razon" value="' + esc(ESTADO.razon) + '"></div>' +
        '<div class="fld"><label>RUC / ID fiscal</label><input class="inp" id="f-ruc" value="' + esc(ESTADO.ruc) + '"></div>' +
        '<div class="fld"><label>Giro comercial</label><input class="inp" id="f-giro" value="' + esc(ESTADO.giro) + '"></div>' +
        '<div class="fld"><label>Sede principal</label><input class="inp" id="f-sede" value="' + esc(ESTADO.sede) + '"></div>' +
        '<div class="fld"><label>Colaboradores</label><input class="inp" id="f-colab" value="' + esc(ESTADO.colab) + '"></div>' +
        '<div class="fld"><label>Administrador del sistema</label><input class="inp" id="f-admin" value="' + esc(ESTADO.admin) + '"></div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Dominio de Correo</h3>' +
      '<div class="fld">' +
        '<label>Dominio principal</label>' +
        '<input class="inp" id="f-dominio" value="' + esc(ESTADO.dominio) + '" placeholder="ejemplo.com">' +
      '</div>' +
      '<div class="note">' +
        '<div>El dominio de correo se usa para reconocer correos internos y evitar que se marquen como externos.</div>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">' +
      '<button class="btn gh" id="btn-cancel">Descartar cambios</button>' +
      '<button class="btn" id="btn-save">Guardar cambios</button>' +
    '</div>';

  $('#view').innerHTML = html;

  $('#btn-save').onclick = function () {
    ESTADO.razon = $('#f-razon').value;
    ESTADO.ruc = $('#f-ruc').value;
    ESTADO.giro = $('#f-giro').value;
    ESTADO.sede = $('#f-sede').value;
    ESTADO.colab = $('#f-colab').value;
    ESTADO.admin = $('#f-admin').value;
    ESTADO.dominio = $('#f-dominio').value;
    
    toast('Datos de la empresa guardados correctamente.');
  };

  $('#btn-cancel').onclick = function () {
    render(); // Vuelve a cargar los datos originales
    toast('Cambios descartados.');
  };
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();