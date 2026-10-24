(function () {
'use strict';

var EQUIPO = [
  { ini: 'ML', nombre: 'Marco Ledesma', rol: 'Administrador', correo: 'marco.ledesma@constructoravertice.com', act: 'Ahora mismo' },
  { ini: 'EZ', nombre: 'Elena Zapata',  rol: 'Editor',        correo: 'elena.zapata@constructoravertice.com',  act: 'Hace 40 min' },
  { ini: 'HB', nombre: 'Hugo Barrera',  rol: 'Editor',        correo: 'hugo.barrera@constructoravertice.com',  act: 'Hace 1 hora' },
  { ini: 'NC', nombre: 'Nadia Cruz',    rol: 'Editor',        correo: 'nadia.cruz@constructoravertice.com',    act: 'Ayer' },
  { ini: 'FM', nombre: 'Félix Mora',    rol: 'Consulta',      correo: 'felix.mora@constructoravertice.com',    act: 'Hace 5 horas' }
];

function $(s) { return document.querySelector(s); }

function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600);
}

function getRolClass(rol) {
  if (rol === 'Administrador') return 'am';
  if (rol === 'Editor') return 'bl';
  return 'tl';
}

function render() {
  var html =
    '<div class="ph">' +
      '<h1>Equipo y accesos</h1>' +
      '<p>Quién tiene acceso al espacio y con qué rol.</p>' +
    '</div>' +

    '<div class="card">' +
      '<div class="rowb">' +
        '<span class="sec">Miembros del equipo (' + EQUIPO.length + ')</span>' +
        '<button class="btn p" id="btn-invitar">' +
          '<i class="fa-solid fa-plus"></i> Invitar persona' +
        '</button>' +
      '</div>' +
      
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th>Persona</th>' +
            '<th>Rol</th>' +
            '<th>Último acceso</th>' +
            '<th style="width:40px"></th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  EQUIPO.forEach(function (u, index) {
    html +=
      '<tr>' +
        '<td>' +
          '<div class="user-cell">' +
            '<span class="av">' + u.ini + '</span>' +
            '<div class="user-info">' +
              '<b>' + u.nombre + '</b>' +
              '<small>' + u.correo + '</small>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' +
          '<span class="chip ' + getRolClass(u.rol) + '">' + u.rol + '</span>' +
        '</td>' +
        '<td style="font-size:12.5px; color:var(--mist);">' + u.act + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="btn gh xs btn-dots" data-idx="' + index + '">' +
            '<i class="fa-solid fa-ellipsis-vertical"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  $('#view').innerHTML = html;

  // Invitar
  $('#btn-invitar').onclick = function () {
    var correo = prompt("Ingresá el correo de la persona a invitar:");
    if (correo && correo.includes('@')) {
      toast('Invitación enviada a ' + correo);
    } else if (correo) {
      toast('El correo ingresado no es válido.');
    }
  };

  // Opciones de cada usuario
  document.querySelectorAll('.btn-dots').forEach(function (btn) {
    btn.onclick = function () {
      var idx = btn.getAttribute('data-idx');
      var u = EQUIPO[idx];
      var accion = prompt("Opciones para " + u.nombre + "\n\n1. Cambiar rol\n2. Eliminar del equipo\n\nEscribí el número de la acción:");
      
      if (accion === '1') {
        var nuevoRol = prompt("Nuevo rol para " + u.nombre + " (Administrador, Editor, Consulta):");
        if (nuevoRol && ['Administrador', 'Editor', 'Consulta'].includes(nuevoRol)) {
          u.rol = nuevoRol;
          render();
          toast('Rol de ' + u.nombre + ' actualizado a ' + nuevoRol + '.');
        } else if (nuevoRol) {
          toast('Rol inválido. Usá: Administrador, Editor o Consulta.');
        }
      } else if (accion === '2') {
        if (confirm("¿Seguro que querés eliminar a " + u.nombre + " del equipo?")) {
          EQUIPO.splice(idx, 1);
          render();
          toast(u.nombre + ' ha sido eliminado del equipo.');
        }
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();

})();