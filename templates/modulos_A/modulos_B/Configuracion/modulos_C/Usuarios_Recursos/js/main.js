(function () {
'use strict';

var API_BASE = "http://127.0.0.1:8000";
var USUARIOS = [];
var RECURSOS = null;
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
  if (rol === 'invitado') return '<span class="chip rd">Invitado</span>';
  return '<span class="chip bl">Estándar</span>';
}

async function cargarTodo() {
  // Cargar Usuarios (Solo lectura de cuentas, no se crean aquí)
  var res = await apiFetch('/api/usuarios/lista');
  if (res.ok && res.data.ok) {
    USUARIOS = res.data.usuarios || [];
  } else {
    toast('Error al cargar los usuarios.');
    USUARIOS = [];
  }
  
  // Cargar Perfiles de Recursos
  var resRec = await apiFetch('/api/admin/recursos');
  if (resRec.ok && resRec.data.ok) {
    RECURSOS = resRec.data.config;
  }
  
  render();
}

function render() {
  var html =
    '<div class="ph">' +
      '<h1>Asignación de Recursos</h1>' +
      '<p>Asigná el perfil de hardware (CPU, RAM, GPU) que consumirá cada cuenta en el servidor.</p>' +
    '</div>' +

    // TABLA DE USUARIOS Y SUS PERFILES
    '<div class="card">' +
      '<div class="rowb">' +
        '<span class="sec">Usuarios Registrados</span>' +
      '</div>' +
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th>Usuario</th>' +
            '<th>Rol de Sistema</th>' +
            '<th>Perfil de Recursos</th>' +
            '<th style="text-align:right;">Acciones</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  if (USUARIOS.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--dim);">No hay usuarios registrados aún.</td></tr>';
  } else {
    USUARIOS.forEach(function (u) {
      var perfilHardware = u.rol; // Usamos el campo 'rol' como perfil de hardware base
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
          '<td>' +
            (esAdminPrincipal 
              ? '<span class="chip am">Administrador de Cuentas</span>' 
              : '<span class="chip bl">Usuario Normal</span>') +
          '</td>' +
          '<td>' + getRolBadge(perfilHardware) + '</td>' +
          '<td style="text-align:right;">' +
            (esAdminPrincipal
              ? '<span style="font-size:11px; color:var(--dim);">Fijo en Admin</span>'
              : '<button class="btn sm outline btn-edit" data-correo="' + u.correo + '"><i class="fa-solid fa-sliders"></i> Asignar Recursos</button>') +
          '</td>' +
        '</tr>';
    });
  }

  html += '</tbody></table></div>';

  // PANEL DE LÍMITES GLOBALES
  if (RECURSOS) {
    var perfiles = RECURSOS.perfiles_usuario || {};
    var global = RECURSOS.limites_globales || {};

    var htmlPerfiles = Object.keys(perfiles).map(function (key) {
      var p = perfiles[key];
      return '<div class="admin-card">' +
        '<h3><i class="fa-solid fa-' + (key === 'admin' ? 'shield' : key === 'invitado' ? 'user-secret' : 'user') + '"></i> Límites del Perfil: ' + key + '</h3>' +
        '<div class="row"><label>Hilos de CPU</label><input class="inp" type="number" data-perfil="' + key + '" data-campo="hilos_cpu" value="' + p.hilos_cpu + '"></div>' +
        '<div class="row"><label>RAM Máx (MB)</label><input class="inp" type="number" data-perfil="' + key + '" data-campo="ram_max_mb" value="' + p.ram_max_mb + '"></div>' +
        '<div class="row"><label>Capas GPU</label><input class="inp" type="number" data-perfil="' + key + '" data-campo="gpu_layers" value="' + p.gpu_layers + '"></div>' +
      '</div>';
    }).join('');

    html += 
      '<div class="card" style="margin-top:20px;">' +
        '<div class="rowb">' +
          '<div>' +
            '<span class="sec">Definición de Límites Globales</span>' +
            '<p class="lead" style="margin-top:2px;">Configuración del servidor para el uso compartido de modelos.</p>' +
          '</div>' +
          '<button class="btn p sm" id="btn-guardar-recursos"><i class="fa-solid fa-check"></i> Guardar Límites</button>' +
        '</div>' +
        '<div class="admin-grid">' +
          htmlPerfiles +
        '</div>' +
        '<div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--line);">' +
          '<h3 style="font-family:var(--disp); font-size:14px; margin-bottom:12px; color:var(--white)">Límites Globales del Servidor</h3>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div class="fld"><label>Máx. Usuarios Simultáneos</label><input class="inp" id="global-max-usuarios" type="number" value="' + (global.max_usuarios_simultaneos || 10) + '"></div>' +
            '<div class="fld"><label>Máx. RAM Total (MB)</label><input class="inp" id="global-max-ram" type="number" value="' + (global.max_ram_total_mb || 8192) + '"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  $('#view').innerHTML = html;

  // Eventos
  document.querySelectorAll('.btn-edit').forEach(function (btn) {
    btn.onclick = function () {
      var correo = btn.getAttribute('data-correo');
      var u = USUARIOS.find(function(x){ return x.correo === correo; });
      if (u) abrirModal(u);
    };
  });

  if ($('#btn-guardar-recursos')) {
    $('#btn-guardar-recursos').onclick = async function() {
      var newConfig = JSON.parse(JSON.stringify(RECURSOS));
      newConfig.limites_globales.max_usuarios_simultaneos = parseInt($('#global-max-usuarios').value) || 10;
      newConfig.limites_globales.max_ram_total_mb = parseInt($('#global-max-ram').value) || 8192;
      
      document.querySelectorAll('input[data-perfil]').forEach(function(inp) {
        var perfil = inp.getAttribute('data-perfil');
        var campo = inp.getAttribute('data-campo');
        if (newConfig.perfiles_usuario[perfil]) {
          newConfig.perfiles_usuario[perfil][campo] = parseInt(inp.value) || 0;
        }
      });

      var res = await apiFetch('/api/admin/recursos', {
        method: 'POST',
        body: JSON.stringify(newConfig)
      });

      if (res.ok && res.data.ok) {
        toast('Límites globales de hardware guardados.');
        RECURSOS = newConfig;
      } else {
        toast('Error al guardar límites.');
      }
    };
  }
}

function abrirModal(usuario) {
  usuarioEditando = usuario;
  
  $('#modal-title').textContent = 'Asignar Recursos';
  $('#modal-desc').textContent = 'Seleccioná los límites de hardware para ' + usuario.nombre + '.';
  
  // Cargar el rol actual (que representa su perfil de hardware)
  $('#f-rol').value = usuario.rol || 'estandar';
  
  $('#modal').style.display = 'flex';
}

$('#btn-cancel-modal').onclick = function () {
  $('#modal').style.display = 'none';
  usuarioEditando = null;
};

$('#btn-save-modal').onclick = async function () {
  if (!usuarioEditando) return;

  var nuevoPerfil = $('#f-rol').value;

  var btn = $('#btn-save-modal');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  // Actualizamos el usuario (reutilizando el endpoint de edición)
  var payload = {
    correo_original: usuarioEditando.correo,
    nombre: usuarioEditando.nombre,
    nuevo_correo: usuarioEditando.correo,
    nueva_password: '', // No cambiamos contraseña
    rol: nuevoPerfil // Aquí guardamos el nuevo perfil de hardware
  };

  var res = await apiFetch('/api/usuarios/editar', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  btn.disabled = false;
  btn.textContent = 'Guardar Cambios';

  if (res.ok && res.data.ok) {
    toast('Perfil de hardware actualizado.');
    $('#modal').style.display = 'none';
    usuarioEditando = null;
    cargarTodo(); // Recargar para ver los cambios
  } else {
    toast('Error: ' + (res.data.mensaje || 'No se pudo asignar.'));
  }
};

document.addEventListener('DOMContentLoaded', cargarTodo);
if (document.readyState !== 'loading') cargarTodo();

})();