(function () {
'use strict';

/* ---------- iconos ---------- */
var IC = {
  file:    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
  folder:  '<path d="M4 20h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  up:      '<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M4 4h16"/>',
  down:    '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  eye:     '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  edit:    '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m14.5 5.5 4 4"/>',
  copy:    '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1"/>',
  trash:   '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>',
  lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  right:   '<path d="m9 6 6 6-6 6"/>',
  left:    '<path d="m15 6-6 6 6 6"/>',
  dots:    '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  check:   '<path d="m5 13 4.5 4.5L19 6"/>',
  dl:      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>'
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
function modal(html, ancho) {
  var m = $('#modal'); if (!m) return null;
  var b = $('.mbox', m);
  b.className = 'mbox' + (ancho ? ' w' : '');
  b.innerHTML = html; m.hidden = false;
  var f = b.querySelector('input,textarea,button.p');
  if (f) setTimeout(function () { f.focus(); }, 40);
  return b;
}
function cerrarModal() {
  var m = $('#modal'); if (!m) return;
  m.hidden = true;
  var b = $('.mbox', m);
  if (b) { b.innerHTML = ''; b.className = 'mbox'; }
}

/* =====================================================================
   CONEXIÓN API
   ===================================================================== */
async function apiFetch(path, opts = {}) {
  let uid = 'admin@coreteks.com';
  try {
    const u1 = localStorage.getItem('naveia_usuario');
    const u2 = localStorage.getItem('usuario_id');
    const u3 = sessionStorage.getItem('usuario_id');
    if (u1) uid = u1;
    else if (u2) uid = u2;
    else if (u3) uid = u3;
  } catch (e) {}

  const headers = { 'Content-Type': 'application/json', 'X-Usuario-Id': uid, ...(opts.headers || {}) };
  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify({ ...opts.body, usuario_id: uid });
  }
  const method = (opts.method || 'GET').toUpperCase();
  if (method === 'GET') {
    path += (path.includes('?') ? '&' : '?') + 'usuario_id=' + encodeURIComponent(uid);
  }
  try {
    const resp = await fetch('http://127.0.0.1:8000' + path, { ...opts, headers });
    const data = await resp.json();
    return { status: resp.status, ok: resp.ok, data };
  } catch (e) {
    console.error('API Error:', e);
    return { status: 0, ok: false, data: { error: 'Error de conexión' } };
  }
}

/* =====================================================================
   DATOS
   ===================================================================== */

var ESTADO = {
  carpetas: [],
  archivos: [],
  seq: 0
};

var UI = {};

function tipoDe(ext) {
  ext = String(ext || '').toLowerCase();
  if (ext === 'pdf')  return { n: 'PDF',          et: 'PDF', k: 'rd' };
  if (ext === 'docx' || ext === 'doc') return { n: 'Documento', et: 'DOC', k: 'bl' };
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return { n: 'Planilla', et: 'XLS', k: 'gr' };
  if (ext === 'pptx' || ext === 'ppt') return { n: 'Presentación', et: 'PPT', k: 'am' };
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return { n: 'Imagen', et: 'IMG', k: 'cy' };
  if (ext === 'txt' || ext === 'md') return { n: 'Texto', et: 'TXT', k: 'tl' };
  return { n: 'Archivo', et: 'DOC', k: 'bl' };
}
function extDe(n) { var m = String(n || '').match(/\.(\w+)$/); return m ? m[1].toLowerCase() : ''; }
function tipoArchivo(n) { return tipoDe(extDe(n)); }
function esDescargable(n) { return /\.(pdf|docx|pptx|xlsx|xls|csv|txt|md)$/i.test(String(n || '')); }
function archivo(id) { return ESTADO.archivos.filter(function (f) { return f.id === id; })[0] || null; }

/* =====================================================================
   VISTAS
   ===================================================================== */

function vistaArchivos() {
  var carp = UI.carpeta || null;
  var q = (UI.q || '').toLowerCase();
  var lista = ESTADO.archivos.filter(function (f) {
    return (!carp || f.carpeta === carp) && (!q || f.n.toLowerCase().indexOf(q) !== -1);
  });
  var sel = archivo(UI.sel);

  return '<div class="ph"><div class="rowb">' +
    '<div><h1>Mis archivos</h1>' +
    '<p class="sub">Lo que subís y lo que MÍA genera viven en el mismo lugar, con el acceso que vos definís. Nada se comparte solo.</p></div>' +
    '<div class="hbtns">' +
      '<button class="btn" data-accion="carpeta">' + ic('folder') + 'Nueva carpeta</button>' +
      '<button class="btn p" data-accion="subir">' + ic('up') + 'Subir archivo</button>' +
    '</div></div></div>' +

    '<div class="rowb" style="margin-bottom:14px">' +
      '<div class="search" style="flex:1;min-width:220px"><span>' + ic('search') + '</span>' +
        '<input class="inp" id="aq" placeholder="Buscar archivo…" value="' + esc(UI.q || '') + '"></div>' +
      '<span class="mono">' + lista.length + ' de ' + ESTADO.archivos.length + ' archivos</span>' +
    '</div>' +

    '<div class="crumb">' +
      '<button class="cb' + (!carp ? ' on' : '') + '" data-carp="">' + ic('folder') + 'Todas las carpetas</button>' +
      (carp ? ic('right', 'sep') + '<span class="cb on">' + esc(carp) + '</span>' : '') +
    '</div>' +

    (!carp
      ? '<div class="cgrid">' + ESTADO.carpetas.map(function (c) {
          var n = ESTADO.archivos.filter(function (f) { return f.carpeta === c; }).length;
          return '<button class="fcard" data-carp="' + esc(c) + '">' + ic('folder') +
            '<b>' + esc(c) + '</b><small>' + n + (n === 1 ? ' archivo' : ' archivos') + '</small></button>';
        }).join('') + '</div>'
      : '') +

    '<div class="split' + (sel ? ' open' : '') + '"><div>' +
      (lista.length
        ? '<div class="card tight"><table class="tbl"><thead><tr>' +
            '<th>Nombre</th><th>Carpeta</th><th>Editado</th><th>Acceso</th><th></th>' +
          '</tr></thead><tbody>' +
          lista.map(function (f) {
            var t = tipoArchivo(f.n);
            return '<tr class="' + (f.id === UI.sel ? 'sel' : '') + '" data-f="' + f.id + '">' +
              '<td><span class="fico ' + t.k + '">' + t.et + '</span><b>' + esc(f.n) + '</b>' +
                (f.badge ? '<span class="chip tl xs">' + ic('spark') + esc(f.badge) + '</span>' : '') + '</td>' +
              '<td>' + esc(f.carpeta || '—') + '</td>' +
              '<td>' + esc(f.edit || '—') + '</td>' +
              '<td><span class="chip xs">' + ic(f.acceso === 'Solo yo' ? 'lock' : 'users') + esc(f.acceso || 'Solo yo') + '</span></td>' +
              '<td class="ta-r"><button class="iconbtn xs" data-kb="' + f.id + '">' + ic('dots') + '</button></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="empty">' + ic('file') + 'No hay archivos acá todavía. Subí uno o pedile a MÍA que genere un informe.</div>') +
    '</div>' + (sel ? panelArchivo(sel) : '') + '</div>';
}

function panelArchivo(f) {
  var t = tipoArchivo(f.n);
  return '<aside class="panel">' +
    '<div class="phd"><div><b>' + esc(f.n) + '</b><small>' + t.n + ' · ' + esc(f.carpeta || '—') + '</small></div>' +
    '<button class="xbtn" data-cerrar>' + ic('x') + '</button></div>' +
    '<div class="pbody">' +

    '<div class="pblock"><div class="fprev">' +
      '<span class="fico ' + t.k + ' big">' + t.et + '</span>' +
      '<b>' + esc(f.n) + '</b>' +
      '<small>' + (f.badge ? 'Generado por MÍA con la información oficial del espacio' : 'Subido al espacio') + '</small>' +
    '</div></div>' +

    '<div class="pblock">' +
      '<div class="kv"><span>Editado</span><b>' + esc(f.edit || '—') + '</b></div>' +
      '<div class="kv"><span>Acceso</span><b>' + esc(f.acceso || 'Solo yo') + '</b></div>' +
      '<div class="kv"><span>Origen</span><b>' + esc(f.badge || 'Carga manual') + '</b></div>' +
    '</div>' +

    '<div class="pblock">' +
      '<label class="lbl">Acceso</label>' +
      '<div class="segs">' + ['Solo yo', 'Mi equipo', 'Toda la empresa'].map(function (a) {
        return '<button class="seg' + ((f.acceso || 'Solo yo') === a ? ' on' : '') + '" data-acc="' + esc(a) + '">' + esc(a) + '</button>';
      }).join('') + '</div>' +
    '</div>' +

    (esDescargable(f.n)
      ? '<div class="pblock pdocs">' +
          '<button class="btn b full" data-accion="ver">' + ic('eye') + 'Ver completo</button>' +
          '<button class="btn p full" data-accion="descargar">' + ic('dl') + 'Descargar</button>' +
        '</div>'
      : '<div class="pblock pdocs">' +
          '<button class="btn b full" data-accion="descargar">' + ic('dl') + 'Descargar</button>' +
        '</div>') +

    '<div class="pblock pfoot">' +
      '<button class="btn p full" data-accion="chat">' + ic('spark') + 'Trabajar este archivo con MÍA</button>' +
      '<button class="btn g full" data-accion="renombrar">' + ic('edit') + 'Renombrar</button>' +
      '<button class="btn g full" data-accion="borrar">' + ic('trash') + 'Eliminar</button>' +
    '</div>' +

    '</div></aside>';
}

/* =====================================================================
   LÓGICA DE API Y EVENTOS
   ===================================================================== */

async function cargarArchivos() {
  const r = await apiFetch('/api/archivos');
  if (r.ok && r.data.ok) {
    ESTADO.carpetas = r.data.carpetas || [];
    ESTADO.archivos = r.data.archivos || [];
    ESTADO.seq = r.data.seq || 0;
  } else {
    console.warn("Error cargando archivos, usando cache local.");
    var saved = localStorage.getItem('naveia_archivos');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        ESTADO.carpetas = parsed.carpetas || [];
        ESTADO.archivos = parsed.archivos || [];
        ESTADO.seq = parsed.seq || 0;
      } catch(e){}
    }
  }
  render();
}

function bind() {
  var q = $('#aq');
  if (q) q.oninput = function () { UI.q = q.value; var pos = q.selectionStart; render(); var n = $('#aq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };

  $$('[data-carp]').forEach(function (b) {
    b.onclick = function () { UI.carpeta = b.getAttribute('data-carp') || null; UI.sel = null; render(); };
  });

  $$('.tbl tbody tr').forEach(function (r) {
    r.onclick = function (e) {
      if (e.target.closest('[data-kb]')) return;
      UI.sel = r.getAttribute('data-f');
      render();
    };
  });

  $$('[data-kb]').forEach(function (b) {
    b.onclick = function (e) { e.stopPropagation(); menuArchivo(b.getAttribute('data-kb')); };
  });

  $$('[data-cerrar]').forEach(function (b) { b.onclick = function () { UI.sel = null; render(); }; });
  $$('[data-acc]').forEach(function (b) {
    b.onclick = async function () {
      var f = archivo(UI.sel); if (!f) return;
      f.acceso = b.getAttribute('data-acc');
      
      await apiFetch('/api/archivos/actualizar', {
        method: 'POST',
        body: { id: f.id, archivo: { acceso: f.acceso } }
      });
      
      render();
      toast('Acceso: ' + f.acceso + '.', 'lock');
    };
  });
  $$('[data-accion]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); accion(b.getAttribute('data-accion')); }; });
}

async function accion(a) {
  if (a === 'subir')     return subirArchivo();
  if (a === 'carpeta')   return nuevaCarpeta();
  var f = archivo(UI.sel);
  if (a === 'ver')       { toast('Este módulo abriría el visor del archivo.', 'eye'); return; }
  if (a === 'descargar') { descargarArchivo(f); return; }
  if (a === 'chat')      { toast('Este módulo abriría el chat con el archivo adjunto.', 'spark'); return; }
  if (a === 'renombrar') return renombrar(f);
  if (a === 'borrar')    return borrarArch(f);
}

function menuArchivo(id) {
  var f = archivo(id); if (!f) return;
  modal('<h2>' + esc(f.n) + '</h2>' +
    '<div class="stack" style="margin-top:14px">' +
      (esDescargable(f.n) ? '<button class="lrow" data-m="ver">' + ic('eye', 'i') + '<span class="lt"><b>Ver completo</b><small>todas las páginas</small></span></button>' : '') +
      '<button class="lrow" data-m="desc">' + ic('dl', 'i') + '<span class="lt"><b>Descargar</b><small>el archivo listo para abrir</small></span></button>' +
      '<button class="lrow" data-m="ren">' + ic('edit', 'i') + '<span class="lt"><b>Renombrar</b><small>cambia el nombre en el espacio</small></span></button>' +
      '<button class="lrow" data-m="mov">' + ic('folder', 'i') + '<span class="lt"><b>Mover de carpeta</b><small>reubica el archivo</small></span></button>' +
      '<button class="lrow" data-m="dup">' + ic('copy', 'i') + '<span class="lt"><b>Duplicar</b><small>crea una copia editable</small></span></button>' +
      '<button class="lrow" data-m="del">' + ic('trash', 'i') + '<span class="lt"><b>Eliminar</b><small>lo saca del espacio</small></span></button>' +
    '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cerrar</button></div>');
  $$('#modal [data-m]').forEach(function (b) {
    b.onclick = async function () {
      var m = b.getAttribute('data-m'); cerrarModal();
      if (m === 'ver')  { UI.sel = f.id; render(); toast('Este módulo abriría el visor.', 'eye'); }
      if (m === 'desc') { descargarArchivo(f); }
      if (m === 'ren')  renombrar(f);
      if (m === 'mov')  moverArch(f);
      if (m === 'dup') {
        var c = JSON.parse(JSON.stringify(f));
        c.n = f.n.replace(/(\.\w+)$/, '_copia$1');
        c.edit = 'hace un momento';
        
        await apiFetch('/api/archivos/subir', {
          method: 'POST',
          body: { archivo: { n: c.n, carpeta: c.carpeta, acceso: c.acceso, badge: c.badge } }
        });
        await cargarArchivos();
        toast('Copia creada.', 'copy');
      }
      if (m === 'del') borrarArch(f);
    };
  });
}

function renombrar(f) {
  modal('<h2>Renombrar archivo</h2>' +
    '<div class="form" style="margin-top:12px"><label class="lbl">Nombre</label><input class="inp" id="rn" value="' + esc(f.n) + '"></div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="ok">Guardar</button></div>');
  $('#modal #ok').onclick = async function () {
    var v = $('#rn').value.trim(); if (!v) return;
    
    await apiFetch('/api/archivos/actualizar', {
      method: 'POST',
      body: { id: f.id, archivo: { n: v, edit: 'hace un momento' } }
    });
    
    await cargarArchivos();
    cerrarModal();
    toast('Nombre actualizado.', 'edit');
  };
}

function moverArch(f) {
  modal('<h2>Mover «' + esc(f.n) + '»</h2>' +
    '<div class="stack" style="margin-top:14px">' + ESTADO.carpetas.map(function (c) {
      return '<button class="lrow" data-mc="' + esc(c) + '">' + ic('folder', 'i') +
        '<span class="lt"><b>' + esc(c) + '</b></span>' +
        (c === f.carpeta ? '<span class="chip tl">Actual</span>' : ic('right', 'ar')) + '</button>';
    }).join('') + '</div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button></div>');
  $$('#modal [data-mc]').forEach(function (b) {
    b.onclick = async function () {
      f.carpeta = b.getAttribute('data-mc');
      f.edit = 'hace un momento';
      
      await apiFetch('/api/archivos/actualizar', {
        method: 'POST',
        body: { id: f.id, archivo: { carpeta: f.carpeta, edit: f.edit } }
      });
      
      cerrarModal(); 
      render();
      toast('Archivo movido a ' + f.carpeta + '.', 'folder');
    };
  });
}

function borrarArch(f) {
  modal('<h2>¿Eliminar «' + esc(f.n) + '»?</h2>' +
    '<p class="lead" style="margin:8px 0 0">Sale del espacio.</p>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="ok">Eliminar</button></div>');
  $('#modal #ok').onclick = async function () {
    await apiFetch('/api/archivos/eliminar', {
      method: 'POST',
      body: { id: f.id }
    });
    
    await cargarArchivos();
    UI.sel = null;
    cerrarModal(); 
    toast('Archivo eliminado.', 'trash');
  };
}

async function subirArchivo() {
  var inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = true;
  inp.onchange = async function () {
    var n = 0;
    for (const file of inp.files) {
      // Convertir archivo a Base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      
      const nuevoArchivo = {
        n: file.name,
        carpeta: UI.carpeta || ESTADO.carpetas[0] || 'Documentos',
        edit: 'hace un momento',
        acceso: 'Solo yo',
        badge: null
      };
      
      await apiFetch('/api/archivos/subir', {
        method: 'POST',
        body: { archivo: nuevoArchivo, contenido_base64: base64 }
      });
      n++;
    }
    
    await cargarArchivos();
    toast(n === 1 ? 'Archivo cargado al espacio.' : n + ' archivos cargados al espacio.', 'up');
  };
  inp.click();
}

async function descargarArchivo(f) {
  const r = await apiFetch('/api/archivos/descargar?id=' + f.id);
  
  if (r.ok && r.data.ok) {
    // El backend devolvió el base64. Lo descargamos.
    try {
      const bc = atob(r.data.base64);
      const bytes = new Uint8Array(bc.length);
      for (let i = 0; i < bc.length; i++) bytes[i] = bc.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = r.data.nombre;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Descargando ' + r.data.nombre);
    } catch (e) {
      toast('Error al procesar el archivo.', 'alert');
    }
  } else {
    toast('Error al descargar: ' + (r.data.error || 'Desconocido'), 'alert');
  }
}

function nuevaCarpeta() {
  modal('<h2>Nueva carpeta</h2>' +
    '<div class="form" style="margin-top:12px"><label class="lbl">Nombre</label><input class="inp" id="nc" placeholder="Ej.: Contratos 2026"></div>' +
    '<div class="mact"><button class="btn gh" data-x>Cancelar</button><button class="btn p" id="ok">Crear</button></div>');
  $('#modal #ok').onclick = async function () {
    var v = $('#nc').value.trim(); if (!v) return;
    
    const r = await apiFetch('/api/archivos/carpeta', {
      method: 'POST',
      body: { nombre: v }
    });
    
    if (r.ok && r.data.ok) {
      await cargarArchivos();
      cerrarModal();
      toast('Carpeta «' + v + '» creada.', 'folder');
    } else {
      toast('Error al crear carpeta: ' + (r.data.error || 'Desconocido'), 'alert');
    }
  };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */

function render() {
  var cont = document.getElementById('view');
  if (!cont) return;
  cont.innerHTML = '<div class="fade">' + vistaArchivos() + '</div>';
  bind();
}

function init() { 
  cargarArchivos(); 
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'MODULE_READY', module: 'archivos' }, '*');
  }
} catch (e) {}

})();