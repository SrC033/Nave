(function () {
'use strict';

var INTEGRACIONES = [
  { id: 'mail', n: 'Correo (IMAP/SMTP)', d: 'Conectá tu buzón para que Smart Email lo lea.', ico: 'fa-envelope', cls: 'mail', act: true, est: 'Conectado' },
  { id: 'google', n: 'Google Workspace', d: 'Calendario, Drive y Gmail con tu cuenta.', ico: 'fa-brands fa-google', cls: 'google', act: true, est: 'Conectado' },
  { id: 'microsoft', n: 'Microsoft 365', d: 'Outlook, Teams y OneDrive.', ico: 'fa-brands fa-microsoft', cls: 'microsoft', act: false, est: 'Desconectado' },
  { id: 'erp', n: 'ERP contable', d: 'Sincronización con tu sistema de facturación.', ico: 'fa-file-invoice-dollar', cls: 'erp', act: true, est: 'Conectado' },
  { id: 'cal', n: 'Calendario', d: 'Reuniones y recordatorios en tu agenda.', ico: 'fa-calendar-alt', cls: 'cal', act: true, est: 'Conectado' }
];

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
      '<h1>Integraciones</h1>' +
      '<p>Conectá los sistemas que ya usás para que MÍA lea y escriba en ellos con tu permiso.</p>' +
    '</div>' +

    '<div class="card">' +
      '<h3>Servicios conectados</h3>';

  INTEGRACIONES.forEach(function(i) {
    html += 
      '<div class="integ">' +
        '<span class="logo ' + i.cls + '"><i class="' + i.ico + '"></i></span>' +
        '<div class="in">' +
          '<b>' + i.n + '</b>' +
          '<small>' + i.d + '</small>' +
        '</div>' +
        '<div class="act">' +
          '<span class="chip ' + (i.act ? 'gr' : 'rd') + '">' +
            (i.act ? 'Conectado' : 'Desconectado') +
          '</span>' +
          '<button class="btn' + (i.act ? '' : ' p') + '" data-id="' + i.id + '">' +
            (i.act ? 'Administrar' : 'Conectar') +
          '</button>' +
        '</div>' +
      '</div>';
  });

  html += '</div>';
  $('#view').innerHTML = html;

  // Eventos de botones
  document.querySelectorAll('[data-id]').forEach(function (btn) {
    btn.onclick = function () {
      var id = btn.getAttribute('data-id');
      var integ = INTEGRACIONES.find(function (x) { return x.id === id; });
      
      if (integ.act) {
        // Simular panel de administración
        if(confirm('¿Querés desconectar ' + integ.n + '?')) {
            integ.act = false;
            render();
            toast(integ.n + ' desconectado.');
        }
      } else {
        // Simular conexión
        integ.act = true;
        render();
        toast(integ.n + ' conectado con éxito.');
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();