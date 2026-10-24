(function () {
'use strict';

var API_BASE = "http://127.0.0.1:8000";
var USUARIOS = [];
var usuarioEditando = null;

function $(s) { return document.querySelector(s); }

function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 3000);
}

async function apiFetch(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  try {
    const resp = await fetch(API_BASE + path, opts);
    const data = await resp.json();
    return { status: resp.status, ok: resp.ok, data: data };
  } catch (e) {
    return { status: 0, ok: false, data: { error: e.message } };
  }
}

function getRolBadge(rol) {
  if (rol === 'admin') return '<span class="chip am">Administrador</span>';
  return '<span class="chip bl">Usuario Normal</span>';
}

async function cargarUsuarios() {
  var res = await apiFetch('/api/usuarios/lista');
  if (res.ok && res.data.ok) {
    USUARIOS = res.data.usuarios || [];
  } else {
    toast('Error al cargar los usuarios.');
    USUARIOS = [];
  }
  render();
}

function render() {
  var html =
    '<div class="ph">' +
      '<h1>Usuarios y Accesos</h1>' +
      '<p>Creá y administrá las cuentas de tu equipo. Asigná roles de administrador o usuario normal.</p>' +
    '</div>' +

    '<div class="card">' +
      '<div class="rowb">' +
        '<span class="sec">Listado de Cuentas</span>' +
        '<button class="btn p" id="btn-nuevo">' +
          '<i class="fa-solid fa-plus"></i> Crear Cuenta' +
        '</button>' +
      '</div>' +
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th>Usuario</th>' +
            '<th>Rol de Sistema</th>' +
            '<th>Estado</th>' +
            '<th style="text-align:right;">Acciones</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  if (USUARIOS.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--dim);">No hay cuentas registradas aún. Creá la primera.</td></tr>';
  } else {
    USUARIOS.forEach(function (u) {
      var inactivo = u.estado === 'Inactivo';
      var colorEstado = inactivo ? 'rd' : 'bl';
      var esAdminPrincipal = u.correo === 'admin@coreteks.com';
      
      html +=
        '<tr>' +
          '<td>' +
            '<div class="user-cell">' +
              '<span class="av">' + (u.iniciales || 'US') + '</span>' +
              '<div class="user-info">' +
                '<b>' + u.nombre + '</b>' +
                '<small>' + u.correo + '</small>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td>' + getRolBadge(u.rol) + '</td>' +
          '<td><span class="chip ' + colorEstado + '">' + u.estado + '</span></td>' +
          '<td style="text-align:right;">' +
            '<button class="btn gh xs btn-edit" data-correo="' + u.correo + '" title="Editar cuenta"><i class="fa-solid fa-pen"></i></button>' +
            (esAdminPrincipal 
              ? '<span style="font-size:11px; color:var(--dim); margin-left:8px;">Protegido</span>' 
              : '<button class="btn gh xs btn-del" data-correo="' + u.correo + '" title="Eliminar cuenta"><i class="fa-solid fa-trash"></i></button>') +
          '</td>' +
        '</tr>';
    });
  }

  html += '</tbody></table></div>';
  $('#view').innerHTML = html;

  // Eventos
  $('#btn-nuevo').onclick = function () { abrirModal(null); };

  document.querySelectorAll('.btn-edit').forEach(function (btn) {
    btn.onclick = function () {
      var correo = btn.getAttribute('data-correo');
      var u = USUARIOS.find(function(x){ return x.correo === correo; });
      if (u) abrirModal(u);
    };
  });

  document.querySelectorAll('.btn-del').forEach(function (btn) {
    btn.onclick = function () {
      var correo = btn.getAttribute('data-correo');
      eliminarUsuario(correo);
    };
  });
}

function abrirModal(usuario) {
  usuarioEditando = usuario;
  var passInput = $('#f-pass');
  var passIcon = $('#toggle-pass i');
  
  if (passIcon) passIcon.className = 'fa-solid fa-eye';
  if (passInput) passInput.type = 'password';

  if (usuario) {
    $('#modal-title').textContent = 'Editar Cuenta';
    $('#f-nombre').value = usuario.nombre;
    $('#f-correo').value = usuario.correo;
    $('#f-pass').value = '';
    $('#f-pass').placeholder = 'Escribir para cambiar...';
    $('#pass-help').style.display = 'block';
    $('#f-rol').value = usuario.rol === 'admin' ? 'admin' : 'estandar';
  } else {
    $('#modal-title').textContent = 'Nueva Cuenta';
    $('#f-nombre').value = '';
    $('#f-correo').value = '';
    $('#f-pass').value = '';
    $('#f-pass').placeholder = '••••••••';
    $('#pass-help').style.display = 'none';
    $('#f-rol').value = 'estandar';
  }
  
  $('#modal').style.display = 'flex';
}

$('#btn-cancel-modal').onclick = function () {
  $('#modal').style.display = 'none';
  usuarioEditando = null;
};

$('#toggle-pass').onclick = function () {
  var input = $('#f-pass');
  var icon = $('#toggle-pass i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
};

$('#btn-save-modal').onclick = async function () {
  var nombre = $('#f-nombre').value.trim();
  var correo = $('#f-correo').value.trim();
  var pass = $('#f-pass').value;
  var rol = $('#f-rol').value;

  if (!nombre || !correo) {
    toast('El nombre y el correo son obligatorios.');
    return;
  }

  if (!usuarioEditando && !pass) {
    toast('La contraseña es obligatoria para nuevas cuentas.');
    return;
  }

  var btn = $('#btn-save-modal');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  var endpoint = usuarioEditando ? '/api/usuarios/editar' : '/api/usuarios/crear';
  var payload = {
    nombre: nombre,
    correo: correo,
    password: pass,
    rol: rol
  };

  if (usuarioEditando) {
    payload.correo_original = usuarioEditando.correo;
    payload.nuevo_correo = correo;
    payload.nueva_password = pass;
  }

  var res = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  btn.disabled = false;
  btn.textContent = 'Guardar Cuenta';

  if (res.ok && res.data.ok) {
    toast(usuarioEditando ? 'Cuenta actualizada.' : 'Cuenta creada.');
    $('#modal').style.display = 'none';
    usuarioEditando = null;
    cargarUsuarios();
  } else {
    toast('Error: ' + (res.data.mensaje || 'No se pudo guardar.'));
  }
};

async function eliminarUsuario(correo) {
  if (correo === 'admin@coreteks.com') {
    toast('El administrador principal no se puede eliminar.');
    return;
  }
  
  if (confirm('¿Seguro que querés eliminar esta cuenta? Perderá acceso inmediatamente.')) {
    var res = await apiFetch('/api/usuarios/eliminar', {
      method: 'POST',
      body: JSON.stringify({ correo: correo })
    });

    if (res.ok && res.data.ok) {
      toast('Cuenta eliminada.');
      cargarUsuarios();
    } else {
      toast('Error al eliminar la cuenta.');
    }
  }
}

document.addEventListener('DOMContentLoaded', cargarUsuarios);
if (document.readyState !== 'loading') cargarUsuarios();

})();