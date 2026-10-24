(function () {
'use strict';

var ESTADO = {
  plan: 'Dedicado',
  precio: '$250',
  tarjeta: 'Visa terminada en 4242',
  facturas: [
    { id: 'INV-2026-003', fecha: '01 Oct 2026', monto: '$250.00', estado: 'Pagada' },
    { id: 'INV-2026-002', fecha: '01 Sep 2026', monto: '$250.00', estado: 'Pagada' },
    { id: 'INV-2026-001', fecha: '01 Ago 2026', monto: '$250.00', estado: 'Pagada' }
  ]
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
      '<h1>Facturación</h1>' +
      '<p>Plan contratado, método de pago y facturas.</p>' +
    '</div>' +

    // Tarjeta del Plan
    '<div class="card">' +
      '<div class="plan-card">' +
        '<div class="plan-left">' +
          '<span class="chip tl">Plan actual</span>' +
          '<div class="plan-title">' + ESTADO.plan + '</div>' +
          '<div class="plan-desc">Nodo propio, usuarios ilimitados, todos los módulos.</div>' +
        '</div>' +
        '<div class="plan-right">' +
          '<div class="plan-price">' + ESTADO.precio + '<small> / mes</small></div>' +
          '<div style="margin-top:12px;">' +
            '<button class="btn outline" id="btn-upgrade">Cambiar de plan</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Método de pago
    '<div class="card">' +
      '<h3>Método de pago</h3>' +
      '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">' +
        '<div style="display:flex; align-items:center; gap:12px;">' +
          '<div style="width:48px; height:32px; background:rgba(255,255,255,.1); border-radius:4px; display:flex; align-items:center; justify-content:center;">' +
            '<i class="fa-solid fa-credit-card" style="color:var(--mist)"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:13px; font-weight:600; color:var(--white);">' + ESTADO.tarjeta + '</div>' +
            '<div style="font-size:12px; color:var(--dim);">Vence 10/28</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn outline" id="btn-edit-card">Editar</button>' +
      '</div>' +
    '</div>' +

    // Historial de facturas
    '<div class="card">' +
      '<h3>Historial de facturas</h3>' +
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th>Factura</th>' +
            '<th>Fecha</th>' +
            '<th>Monto</th>' +
            '<th>Estado</th>' +
            '<th style="text-align:right;">Acciones</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  ESTADO.facturas.forEach(function(f) {
    html +=
      '<tr>' +
        '<td style="font-weight:600; color:var(--white);">' + f.id + '</td>' +
        '<td style="color:var(--mist);">' + f.fecha + '</td>' +
        '<td style="color:var(--white);">' + f.monto + '</td>' +
        '<td><span class="badge gr">' + f.estado + '</span></td>' +
        '<td style="text-align:right;">' +
          '<button class="btn outline" style="padding:4px 8px; font-size:11px;" data-factura="' + f.id + '">' +
            '<i class="fa-solid fa-download"></i> PDF' +
          '</button>' +
        '</td>' +
      '</tr>';
  });

  html += 
        '</tbody>' +
      '</table>' +
    '</div>';

  $('#view').innerHTML = html;

  // Eventos
  $('#btn-upgrade').onclick = function() {
    toast('Contactá a ventas para cambiar de plan.');
  };

  $('#btn-edit-card').onclick = function() {
    toast('Abre el formulario para actualizar tu tarjeta.');
  };

  document.querySelectorAll('[data-factura]').forEach(function(btn) {
    btn.onclick = function() {
      var id = btn.getAttribute('data-factura');
      toast('Descargando factura ' + id + '...');
    };
  });
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();