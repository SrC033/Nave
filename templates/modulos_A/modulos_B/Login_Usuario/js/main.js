(function () {
'use strict';

var API_BASE = "http://127.0.0.1:8000";

var IC = {
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye:     '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff:  '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  arrow:   '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  cube:    '<path d="M12 2 3 7v10l9 5 9-5V7l-9-5z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  alert:   '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  mail:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
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
function modal(html) {
  var m = $('#modal'); if (!m) return null;
  var b = $('.mbox', m);
  b.innerHTML = html; m.hidden = false;
  var f = b.querySelector('input,button.p');
  if (f) setTimeout(function () { f.focus(); }, 40);
  return b;
}
function cerrarModal() {
  var m = $('#modal'); if (!m) return;
  m.hidden = true;
  var b = $('.mbox', m);
  if (b) b.innerHTML = '';
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

var ESTADO = {
  usuario: sessionStorage.getItem('last_user') || '',
  recordar: true,
  cargando: false,
  intentos: 0
};

function vistaLogin() {
  return '<div class="login-wrap fade">' +
    '<div class="login-card">' +
      '<div class="login-logo">' + ic('cube') + '</div>' +
      '<div class="login-title">Bienvenido a NAVE</div>' +
      '<div class="login-sub">Tu espacio de trabajo con IA privada. Ingresá con tu cuenta corporativa.</div>' +

      '<form class="login-form" id="loginForm" autocomplete="on" novalidate>' +

        '<label class="fld">' +
          '<span>Usuario o correo</span>' +
          '<div class="fld-inner">' +
            ic('user') +
            '<input class="inp" id="lgUser" type="text" placeholder="nombre@empresa.com" autocomplete="username" spellcheck="false" value="' + esc(ESTADO.usuario) + '">' +
          '</div>' +
        '</label>' +

        '<label class="fld">' +
          '<span>Contraseña</span>' +
          '<div class="fld-inner">' +
            ic('lock') +
            '<input class="inp pwd" id="lgPass" type="password" placeholder="Tu contraseña" autocomplete="current-password">' +
            '<button class="toggle-pwd" type="button" id="lgEye" aria-label="Mostrar contraseña">' + ic('eye') + '</button>' +
          '</div>' +
        '</label>' +

        '<div class="login-row">' +
          '<label class="ck"><input type="checkbox" id="lgRemember"' + (ESTADO.recordar ? ' checked' : '') + '><span>Recordarme</span></label>' +
          '<a class="link" id="lgForgot" href="#" onclick="return false;">¿Olvidaste tu contraseña?</a>' +
        '</div>' +

        '<button class="btn p full login-btn" id="lgBtn" type="submit">' +
          '<span id="lgBtnTxt">Ingresar</span>' +
          ic('arrow') +
        '</button>' +

        '<div class="login-msg" id="lgMsg" role="alert"></div>' +

      '</form>' +

      '<div class="login-foot">' +
        '¿No tenés cuenta? <a id="lgSignup" href="#" onclick="return false;">Solicitá acceso</a>' +
      '</div>' +

      '<div class="login-secure">' + ic('shield') + 'Conexión cifrada · datos en el nodo propio' + '</div>' +
    '</div>' +
  '</div>';
}

function bind() {
  var form = $('#loginForm');
  var inpU = $('#lgUser');
  var inpP = $('#lgPass');
  var eye  = $('#lgEye');
  var btn  = $('#lgBtn');

  if (eye) {
    eye.onclick = function () {
      var esPwd = inpP.type === 'password';
      inpP.type = esPwd ? 'text' : 'password';
      eye.innerHTML = ic(esPwd ? 'eyeOff' : 'eye');
      eye.setAttribute('aria-label', esPwd ? 'Ocultar contraseña' : 'Mostrar contraseña');
      inpP.focus();
    };
  }

  var chk = $('#lgRemember');
  if (chk) chk.onchange = function () { ESTADO.recordar = chk.checked; };

  if (inpU) inpU.oninput = function () { ESTADO.usuario = inpU.value; };

  if (form) form.onsubmit = function (e) { e.preventDefault(); enviarLogin(); };

  if ($('#lgForgot')) $('#lgForgot').onclick = abrirRecuperar;
  if ($('#lgSignup')) $('#lgSignup').onclick = abrirSolicitud;
}

function setMsg(txt, ok) {
  var m = $('#lgMsg'); if (!m) return;
  m.textContent = txt || '';
  m.classList.toggle('ok', !!ok);
}

function setCargando(v) {
  ESTADO.cargando = v;
  var t = $('#lgBtnTxt'), b = $('#lgBtn');
  if (!t || !b) return;
  if (v) {
    b.disabled = true;
    t.textContent = 'Verificando…';
    b.style.opacity = '.8';
  } else {
    b.disabled = false;
    t.textContent = 'Ingresar';
    b.style.opacity = '';
  }
}

async function enviarLogin() {
  if (ESTADO.cargando) return;

  var u = ($('#lgUser') ? $('#lgUser').value : '').trim();
  var p = ($('#lgPass') ? $('#lgPass').value : '').trim();
  setMsg('');

  if (!u) { setMsg('Ingresá tu usuario o correo.'); sacudir(); return; }
  if (!p) { setMsg('Ingresá tu contraseña.'); sacudir(); return; }

  setCargando(true);

  // ⭐ CONEXIÓN CON EL BACKEND[cite: 4]
  var res = await apiFetch('/api/usuarios/validar', {
    method: 'POST',
    body: JSON.stringify({ correo: u, password: p })
  });

  setCargando(false);

  if (res.ok && res.data.ok && res.data.usuario) {
    var usr = res.data.usuario;

    setMsg('¡Bienvenido, ' + usr.nombre.split(' ')[0] + '!', true);
    toast('Sesión iniciada correctamente.', 'check');

    // Guardar sesión en el navegador[cite: 4]
    sessionStorage.setItem('sesion_activa', '1');
    sessionStorage.setItem('usuario_actual', JSON.stringify(usr));
    sessionStorage.setItem('usuario_id', usr.correo);
    
    if (ESTADO.recordar) {
      sessionStorage.setItem('last_user', usr.correo);
    } else {
      sessionStorage.removeItem('last_user');
    }

    // Avisar al shell principal[cite: 4]
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'LOGIN_OK',
          usuario: usr,
          recordar: ESTADO.recordar
        }, '*');
      }
    } catch (e) {}

    setTimeout(function () { cerrarLogin(usr); }, 700);

  } else {
    ESTADO.intentos++;
    setMsg(res.data.error || 'Credenciales incorrectas.');
    sacudir();
  }
}

function sacudir() {
  var c = $('.login-card'); if (!c) return;
  c.classList.remove('shake');
  void c.offsetWidth;
  c.classList.add('shake');
}

function cerrarLogin(usuario) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'LOGIN_CLOSE', usuario: usuario }, '*');
    }
  } catch (e) {}
}

function abrirRecuperar() {
  modal(
    '<h2>Recuperar contraseña</h2>' +
    '<p class="lead">Escribí tu correo y te enviamos un enlace para restablecerla.</p>' +
    '<div style="margin-top:14px">' +
      '<label class="fld"><span style="display:block;font-size:11.5px;font-weight:600;color:var(--dim);margin-bottom:6px">Correo</span>' +
        '<div class="fld-inner">' + ic('mail') +
          '<input class="inp" id="rcMail" type="email" placeholder="nombre@empresa.com">' +
        '</div>' +
      '</label>' +
    '</div>' +
    '<div class="mact">' +
      '<button class="btn" type="button" data-x>Cancelar</button>' +
      '<button class="btn p" type="button" id="rcOk">Enviar enlace</button>' +
    '</div>'
  );
  var ok = $('#rcOk');
  if (ok) ok.onclick = function () {
    var m = $('#rcMail');
    var v = m ? m.value.trim() : '';
    if (!v || v.indexOf('@') === -1) { toast('Ingresá un correo válido.', 'alert'); return; }
    cerrarModal();
    toast('Te enviamos un enlace a ' + v + ' (demo).', 'mail');
  };
}

function abrirSolicitud() {
  modal(
    '<h2>Solicitar acceso</h2>' +
    '<p class="lead">Dejanos tus datos y el administrador del espacio te habilita.</p>' +
    '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">' +
      '<input class="inp" id="sqNombre" placeholder="Nombre completo">' +
      '<input class="inp" id="sqMail" type="email" placeholder="Correo corporativo">' +
      '<input class="inp" id="sqArea" placeholder="Área o equipo">' +
    '</div>' +
    '<div class="mact">' +
      '<button class="btn" type="button" data-x>Cancelar</button>' +
      '<button class="btn p" type="button" id="sqOk">Enviar solicitud</button>' +
    '</div>'
  );
  var ok = $('#sqOk');
  if (ok) ok.onclick = function () {
    var n = ($('#sqNombre') || {}).value || '';
    var m = ($('#sqMail') || {}).value || '';
    if (!n.trim() || !m.trim() || m.indexOf('@') === -1) {
      toast('Completá nombre y correo válido.', 'alert');
      return;
    }
    cerrarModal();
    toast('Solicitud enviada. Te avisamos cuando esté aprobada.', 'check');
  };
}

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = vistaLogin();
  bind();
}
function init() { render(); }

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'login' }, '*');
  }
} catch (e) {}

})();