(function () {
  'use strict';

  var MODULES_CONFIG = {
    'chat':           { src: 'modulos_B/Chat IA - Mía/Chat IA - Mía.html',                    id: 'iframe_chat',           title: 'Chat IA · MÍA' },
    'email':          { src: 'modulos_B/Smart_Email/Smart_Email.html',                        id: 'iframe_email',          title: 'Smart Email' },
    'tareas':         { src: 'modulos_B/Tareas/Tareas.html',                                  id: 'iframe_tareas',         title: 'Tareas' },
    'herramientas':   { src: 'modulos_B/Herramientas/Herramientas.html',                      id: 'iframe_herramientas',   title: 'Herramientas' },
    'proyectos':      { src: 'modulos_B/Proyectos/Proyectos.html',                            id: 'iframe_proyectos',      title: 'Proyectos' },
    'agentes':        { src: 'modulos_B/Mis_Agentes/Mis_Agentes.html',                        id: 'iframe_agentes',        title: 'Mis agentes' },
    'archivos':       { src: 'modulos_B/Mis_Archivos/Mis_Archivos.html',                      id: 'iframe_archivos',       title: 'Mis archivos' },
    'conocimiento':   { src: 'modulos_B/Conocimiento/Conocimiento.html',                      id: 'iframe_conocimiento',   title: 'Conocimiento empresarial' },
    'learning':       { src: 'modulos_B/Learning/Learning.html',                              id: 'iframe_learning',       title: 'Learning Center' },
    'memoria':        { src: 'modulos_B/Memoria/Memoria.html',                                id: 'iframe_memoria',        title: 'Memoria' },
    'indicadores':    { src: 'modulos_B/Indicadores/Indicadores.html',                        id: 'iframe_indicadores',    title: 'Indicadores' },
    'ayuda':          { src: 'modulos_B/Ayuda/Ayuda.html',                                    id: 'iframe_ayuda',          title: 'Ayuda' },
    'notificaciones': { src: 'modulos_B/Notificaciones/Notificaciones.html',                  id: 'iframe_notificaciones', title: 'Notificaciones' },
    'configuracion':  { src: 'modulos_B/Configuracion/Configuracion.html',                    id: 'iframe_config',         title: 'Configuración' },
    'temas':          { src: 'modulos_B/Temas_Personalizacion/Temas_Personalizacion.html',    id: 'iframe_temas',          title: 'Temas y personalización' }
  };

  var TERMINAL_SRC = 'modulos_B/TERMINAL/terminal.html';

  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function esc(txt) {
    return String(txt == null ? '' : txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var IC = {
    build: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6"/>',
    down:  '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell:  '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    lock:  '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 13 4.5 4.5L19 6"/>',
    alert: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>'
  };
  function ic(n, c) {
    var s = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if (c) s += ' class="' + c + '"';
    return s + '>' + (IC[n] || '') + '</svg>';
  }

  function toast(msg, icon) {
    var t = $('#toast'); if (!t) return;
    t.innerHTML = ic(icon || 'check') + '<span>' + esc(msg) + '</span>';
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }

  var SHELL = {
    empresa: 'Constructora Vértice',
    usuario: { nombre: 'Invitado', rol: 'Sin Sesión', ini: '--' },
    activo: null,
    terminalActive: false,
    terminalReady: false,
    notifIframe: null // Referencia al iframe de notificaciones para retransmitir mensajes
  };

  function pintarUsuario() {
    var c = $('#suser'); if (!c) return;
    var u = SHELL.usuario;
    c.innerHTML =
      '<button class="ubtn" type="button" id="btnUsuario" data-module="configuracion" data-tip="' + esc(u.nombre) + ' · ' + esc(u.rol) + '" aria-label="Usuario">' +
        '<span class="av">' + esc(u.ini) + '</span>' +
      '</button>';
  }

  function pintarTop() {
    var c = $('#tright'); if (!c) return;
    c.innerHTML =
      '<button class="iconbtn" type="button" id="btnNotif" data-module="notificaciones" aria-label="Notificaciones" style="position:relative">'
        + ic('bell')
        + '<span id="notifDot" style="position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--amber);display:none"></span>'
      + '</button>';
  }

  function engancharNav() {
    $$('[data-module]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); cargarDesde(btn); });
    });
  }

  function marcarActivo(id) {
    $$('#snav [data-module]').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-module') === id);
    });
  }

  function engancharTooltips() {
    var tip = document.createElement('div');
    tip.className = 'nv-tip';
    document.body.appendChild(tip);
    function mostrar(el) {
      var txt = el.getAttribute('data-tip'); if (!txt) return;
      tip.textContent = txt; tip.classList.add('on');
      requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var x = r.right + 14, y = r.top + (r.height / 2) - (th / 2);
        if (x + tw > window.innerWidth - 8) { x = r.left - tw - 14; tip.classList.add('left'); }
        else { tip.classList.remove('left'); }
        if (y < 8) y = 8;
        if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
        tip.style.left = x + 'px'; tip.style.top = y + 'px';
      });
    }
    function ocultar() { tip.classList.remove('on'); }
    $$('[data-tip]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { mostrar(el); });
      el.addEventListener('mouseleave', ocultar);
      el.addEventListener('focus', function () { mostrar(el); });
      el.addEventListener('blur', ocultar);
    });
  }

  function cargarDesde(btn) {
    var id = btn.getAttribute('data-module');
    if (!id) return;
    var config = MODULES_CONFIG[id];
    if (!config) { toast('Módulo no configurado: ' + id, 'alert'); return; }
    if (id === SHELL.activo) return;

    var cont = $('#moduleContainer'); if (!cont) return;

    // Si el módulo es notificaciones, no destruimos el iframe, solo lo ocultamos
    if (SHELL.activo === 'notificaciones' && SHELL.notifIframe) {
      SHELL.notifIframe.style.display = 'none';
    }

    // Destruir el iframe anterior (excepto si es notificaciones)
    cont.querySelectorAll('iframe').forEach(function (f) {
      if (f.id === 'iframe_notificaciones') return;
      try { f.src = 'about:blank'; } catch (e) {}
      try { f.remove(); } catch (e) {}
    });

    SHELL.activo = id;
    mostrarCargando(true);

    var iframe = document.createElement('iframe');
    iframe.id = config.id;
    iframe.dataset.module = id;
    iframe.title = config.title;
    iframe.setAttribute('scrolling', 'yes');
    iframe.setAttribute('allow', 'fullscreen');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.onload = function () {
      if (SHELL.activo !== id) return;
      inyectarBridgeAtajos(iframe);
      setTimeout(function () { mostrarCargando(false); }, 150);
    };
    iframe.onerror = function () {
      if (SHELL.activo !== id) return;
      mostrarCargando(false);
      toast('No se pudo cargar "' + config.title + '"', 'alert');
    };

    iframe.src = config.src;
    cont.appendChild(iframe);

    // Si es el módulo de notificaciones, guardamos la referencia y lo mostramos
    if (id === 'notificaciones') {
      SHELL.notifIframe = iframe;
      iframe.style.display = 'block';
    }

    marcarActivo(id);
    document.body.classList.remove('nav');
  }

  function mostrarCargando(v) {
    var c = $('#cargando'); if (c) c.hidden = !v;
  }

  function inyectarBridgeAtajos(iframe) {
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;
      if (doc.getElementById('coreteks-shortcut-bridge')) return;
      var s = doc.createElement('script');
      s.id = 'coreteks-shortcut-bridge';
      s.textContent = '(' + function () {
        function send() { try { window.parent.postMessage({ type: 'OPEN_TERMINAL_SHORTCUT' }, '*'); } catch (err) {} }
        var pressed = { c: false, f12: false };
        function onKey(e) {
          var ctrl  = e.ctrlKey || e.metaKey;
          var shift = e.shiftKey;
          var key   = (e.key || '').toLowerCase();
          var code  = e.code || '';
          if (ctrl && shift && key === 't') { e.preventDefault(); send(); return false; }
          if (ctrl && (e.key === '`' || code === 'Backquote')) { e.preventDefault(); send(); return false; }
          if (ctrl && key === 'c') pressed.c = true;
          if (e.key === 'F12')     pressed.f12 = true;
          if (pressed.c && pressed.f12) { e.preventDefault(); pressed.c = false; pressed.f12 = false; send(); return false; }
        }
        function onKeyUp(e) {
          if (e.key === 'c' || e.key === 'C') pressed.c = false;
          if (e.key === 'F12') pressed.f12 = false;
        }
        window.addEventListener('keydown',   onKey,   true);
        document.addEventListener('keydown', onKey,   true);
        window.addEventListener('keyup',   onKeyUp, true);
        document.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('blur', function () { pressed.c = false; pressed.f12 = false; });
      }.toString() + ')();';
      (doc.head || doc.documentElement).appendChild(s);
    } catch (err) {}
  }

  function abrirTerminal() {
    if (SHELL.terminalActive) return;
    var ov = $('#terminalOverlay'), fr = $('#terminalIframe');
    if (!ov || !fr) return;
    var actual = fr.getAttribute('src') || '';
    if (!actual || actual === 'about:blank') fr.src = TERMINAL_SRC;
    SHELL.terminalActive = true;
    ov.classList.add('active');
    ov.setAttribute('aria-hidden', 'false');
  }
  function cerrarTerminal() {
    if (!SHELL.terminalActive) return;
    var ov = $('#terminalOverlay'); if (!ov) return;
    SHELL.terminalActive = false;
    ov.classList.remove('active');
    ov.setAttribute('aria-hidden', 'true');
  }
  function toggleTerminal() { if (SHELL.terminalActive) cerrarTerminal(); else abrirTerminal(); }

  function engancharBusqueda() {
    var s = $('#tsearch'); if (!s) return;
    s.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = s.value.trim(); if (!q) return;
        toast('Buscando «' + q + '»…', 'search');
      }
      if (e.key === 'Escape') { s.value = ''; s.blur(); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); s.focus(); s.select();
      }
    });
  }

  function engancharAtajos() {
    var pressed = { c: false, f12: false };
    function onKey(e) {
      var ctrl = e.ctrlKey || e.metaKey, shift = e.shiftKey;
      var key = (e.key || '').toLowerCase(), code = e.code || '';
      if (ctrl && shift && key === 't') { e.preventDefault(); toggleTerminal(); return false; }
      if (ctrl && (e.key === '`' || code === 'Backquote')) { e.preventDefault(); toggleTerminal(); return false; }
      if (ctrl && key === 'c') pressed.c = true;
      if (e.key === 'F12')     pressed.f12 = true;
      if (pressed.c && pressed.f12) { e.preventDefault(); pressed.c = false; pressed.f12 = false; toggleTerminal(); return false; }
    }
    function onKeyUp(e) {
      if (e.key === 'c' || e.key === 'C') pressed.c = false;
      if (e.key === 'F12') pressed.f12 = false;
    }
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('keyup', onKeyUp, true);
    
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (SHELL.terminalActive) { e.preventDefault(); cerrarTerminal(); return; }
        var m = $('#modal'); if (m) m.hidden = true;
      }
    }, true);
  }

  function engancharMensajes() {
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (!d.type) return;

      if (d.type === 'LOGIN_OK') {
        var usr = d.usuario || {};
        SHELL.usuario = {
          nombre: usr.nombre || 'Usuario',
          rol: usr.rol === 'admin' ? 'Administrador' : (usr.rol === 'estandar' ? 'Estándar' : 'Invitado'),
          ini: usr.iniciales || 'US'
        };
        pintarUsuario();

        var loginOv = $('#loginOverlay');
        var app = $('#app');
        if (loginOv) loginOv.hidden = true;
        if (app) app.hidden = false;

        var inicial = $('#snav [data-module="chat"]');
        if (inicial) setTimeout(function () { cargarDesde(inicial); }, 100);

        toast('Bienvenido, ' + SHELL.usuario.nombre, 'check');
        return;
      }

      if (d.type === 'CLOSE_TERMINAL') { cerrarTerminal(); return; }
      if (d.type === 'TERMINAL_READY') { SHELL.terminalReady = true; return; }
      if (d.type === 'OPEN_TERMINAL_SHORTCUT') { toggleTerminal(); return; }
      
      // --- LÓGICA DE NOTIFICACIONES ---
      if (d.type === 'NOTIF_COUNT') {
        var dot = document.getElementById('notifDot');
        if (dot) dot.style.display = (d.count > 0) ? 'block' : 'none';
        return;
      }

      // El Smart Email (u otro módulo) envía una notificación
      if (d.type === 'NOTIF') {
        // Si el iframe de notificaciones está cargado, se la pasamos
        if (SHELL.notifIframe && SHELL.notifIframe.contentWindow) {
          SHELL.notifIframe.contentWindow.postMessage(d, '*');
        } else {
          // Si no está cargado, lo cargamos en segundo plano de forma invisible
          var cont = $('#moduleContainer');
          if (cont) {
            var iframe = document.createElement('iframe');
            iframe.id = 'iframe_notificaciones';
            iframe.style.display = 'none';
            iframe.src = MODULES_CONFIG['notificaciones'].src;
            
            iframe.onload = function() {
              // Una vez cargado, le enviamos la notificación pendiente
              iframe.contentWindow.postMessage(d, '*');
            };
            
            cont.appendChild(iframe);
            SHELL.notifIframe = iframe;
          }
        }
        return;
      }

      if (d.type === 'THEME_APPLY') {
        var root = document.documentElement;
        if (d.vars) Object.keys(d.vars).forEach(function (k) { root.style.setProperty(k, d.vars[k]); });
        if (d.tipografia) root.style.setProperty('--disp', d.tipografia);
        if (d.theme) {
          if (d.theme.radio) {
            root.style.setProperty('--r', d.theme.radio + 'px');
            root.style.setProperty('--r2', Math.max(6, d.theme.radio - 4) + 'px');
          }
          if (d.theme.fontSize) root.style.setProperty('font-size', d.theme.fontSize + 'px');
          document.body.dataset.modo = d.theme.modo;
          document.body.dataset.densidad = d.theme.densidad;
        }
        return;
      }
    });
  }

  function arrancar() {
    pintarUsuario();
    pintarTop();
    engancharNav();
    engancharTooltips();
    engancharBusqueda();
    engancharAtajos();
    engancharMensajes();

    var ham   = $('#ham');
    var scrim = $('#scrim');
    if (ham)   ham.addEventListener('click', function () { document.body.classList.toggle('nav'); });
    if (scrim) scrim.addEventListener('click', function () { document.body.classList.remove('nav'); });

    var modal = $('#modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.id === 'modal' || e.target.hasAttribute('data-x')) {
          modal.hidden = true;
          var caja = $('.mbox');
          if (caja) { caja.innerHTML = ''; caja.className = 'mbox'; }
        }
      });
    }
  }

  arrancar();
})();