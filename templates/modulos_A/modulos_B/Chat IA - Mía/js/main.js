(function () {
  'use strict';

  var API_BASE = "http://127.0.0.1:8000";
  var archivoAdjuntoActual = { base64: '', nombre: '', tipo: '' };
  
  var modeloSeleccionadoId = localStorage.getItem('mya_modelo_seleccionado') || '__principal__';
  var conversacionActualId = 'conv_' + Date.now();
  var mensajesActuales = [];
  
  var modelosOcupados = {};
  var chatsPensando = {};

  // Modo activo persistente: null (chat), 'pdf', 'excel', 'dashboard', 'imagenes', 'empresa'
  var herramientaActiva = null; 
  // Bandera simple: true si ya se generó un archivo en este modo (para avisar que es edición)
  var ultimoArchivoGenerado = false;

  var previewWrap = null;
  var inputArchivoGlobal = null;

  function limpiarAdjuntoGlobal() {
    archivoAdjuntoActual = { base64: '', nombre: '', tipo: '' };
    if (inputArchivoGlobal) inputArchivoGlobal.value = '';
    if (previewWrap) {
      previewWrap.style.display = 'none';
      previewWrap.innerHTML = '';
    }
  }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function getUsuarioActual() {
    try { var u = localStorage.getItem('coreteks_usuario'); if (u) return u; } catch (_) {}
    try { var s = sessionStorage.getItem('usuario_id'); if (s) return s; } catch (_) {}
    return 'admin@coreteks.com';
  }

  async function apiFetch(path, opts) {
    opts = opts || {};
    var uid = getUsuarioActual();
    opts.headers = Object.assign({ 'Content-Type': 'application/json', 'X-Usuario-Id': uid }, opts.headers || {});
    if (opts.body && typeof opts.body === 'string') {
      try { var b = JSON.parse(opts.body); if (!b.usuario_id) b.usuario_id = uid; opts.body = JSON.stringify(b); } catch (_) {}
    }
    var method = (opts.method || 'GET').toUpperCase();
    if (method === 'GET') path += (path.indexOf('?') === -1 ? '?' : '&') + 'usuario_id=' + encodeURIComponent(uid);
    const resp = await fetch(API_BASE + path, opts);
    let data = null;
    try { data = await resp.json(); } catch (e) { data = {}; }
    return { status: resp.status, ok: resp.ok, data: data };
  }

  function sanitizarTexto(texto) { return !texto ? '' : String(texto).replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '').replace(/\r\n/g, '\n'); }
  
  function construirContenidoFormateado(container, textoCrudo) {
    container.innerHTML = '';
    var textoLimpio = sanitizarTexto(textoCrudo);
    var regexCodigo = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    var ultimoIndice = 0;
    var match;
    while ((match = regexCodigo.exec(textoLimpio)) !== null) {
      if (match.index > ultimoIndice) procesarTextoPlanoConEstilos(container, textoLimpio.substring(ultimoIndice, match.index));
      agregarBloqueCodigo(container, match[1] || 'código', match[2]);
      ultimoIndice = regexCodigo.lastIndex;
    }
    if (ultimoIndice < textoLimpio.length) procesarTextoPlanoConEstilos(container, textoLimpio.substring(ultimoIndice));
  }

  function procesarTextoPlanoConEstilos(container, texto) {
    if (!texto.trim()) return;
    texto.split('\n').forEach(function(linea) {
      var lineaTrim = linea.trim();
      if (!lineaTrim) return;
      var elementoP = document.createElement('div');
      elementoP.style.cssText = 'font-family: "Segoe UI", system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 8px; color: inherit;';
      if (lineaTrim.startsWith('### ') || lineaTrim.startsWith('## ') || lineaTrim.startsWith('# ')) {
        elementoP.style.fontWeight = '650'; elementoP.style.fontSize = '15px'; elementoP.style.color = 'var(--teal, #2DD4BF)'; elementoP.style.marginTop = '10px'; elementoP.style.marginBottom = '4px';
        lineaTrim = lineaTrim.replace(/^#+\s*/, '');
      } else if (lineaTrim.startsWith('- ') || lineaTrim.startsWith('* ')) {
        elementoP.style.paddingLeft = '14px'; lineaTrim = '• ' + lineaTrim.substring(2);
      } else if (/^\d+\.\s/.test(lineaTrim)) {
        elementoP.style.paddingLeft = '6px';
      }
      var partes = lineaTrim.split(/(\*\*.*?\*\*)/g);
      partes.forEach(function(parte) {
        if (parte.startsWith('**') && parte.endsWith('**')) {
          var spanBold = document.createElement('strong');
          spanBold.style.fontWeight = '650'; spanBold.style.color = 'var(--white, #EAF0FA)';
          spanBold.textContent = parte.substring(2, parte.length - 2); elementoP.appendChild(spanBold);
        } else if (parte) {
          elementoP.appendChild(document.createTextNode(parte));
        }
      });
      container.appendChild(elementoP);
    });
  }

  function agregarBloqueCodigo(container, lenguaje, codigo) {
    var wrapperCode = document.createElement('div');
    wrapperCode.style.cssText = 'margin: 12px 0; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; overflow: hidden; max-width: 100%;';
    var headerCode = document.createElement('div');
    headerCode.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.05); padding: 6px 12px; font-size: 11px; font-family: monospace; color: var(--teal, #4ff0b7); opacity: 0.9; border-bottom: 1px solid rgba(255, 255, 255, 0.08);';
    headerCode.innerHTML = '<span>⚡ ' + lenguaje.toUpperCase() + '</span>';
    var preEl = document.createElement('pre');
    preEl.style.cssText = 'margin: 0; padding: 12px; overflow-x: auto; font-family: Consolas, Monaco, "Courier New", monospace; font-size: 13px; line-height: 1.45; color: #f8f9fa; white-space: pre;';
    var codeEl = document.createElement('code');
    codeEl.textContent = codigo.trim();
    preEl.appendChild(codeEl); wrapperCode.appendChild(headerCode); wrapperCode.appendChild(preEl); container.appendChild(wrapperCode);
  }

function abrirModalArchivo(nombre, base64) {
  var modal = $('#modal-archivo');
  var textEl = $('#modal-archivo-texto');
  var nameEl = $('#modal-archivo-nombre');
  if (!modal || !textEl || !nameEl) return;

  // Limpiar Blob URLs anteriores para evitar fugas de memoria
  if (modal._blobUrls) {
    modal._blobUrls.forEach(function(url) {
      try { URL.revokeObjectURL(url); } catch (_) {}
    });
    modal._blobUrls = [];
  }

  nameEl.textContent = nombre;
  modal.classList.add('activo');

  // Resetear estilos del contenedor
  textEl.style.padding = '16px';
  textEl.style.overflow = 'auto';
  textEl.style.background = 'transparent';

  var ext = (nombre || '').split('.').pop().toLowerCase();

  // Determinar el MIME type según la extensión
  var mime = 'application/octet-stream';
  if (ext === 'png') mime = 'image/png';
  else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
  else if (ext === 'gif') mime = 'image/gif';
  else if (ext === 'webp') mime = 'image/webp';
  else if (ext === 'svg') mime = 'image/svg+xml';
  else if (ext === 'pdf') mime = 'application/pdf';
  else if (ext === 'html' || ext === 'htm') mime = 'text/html';
  else if (ext === 'xls' || ext === 'xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Normalizar base64 para imágenes: si no tiene prefijo data:, agregarlo
  var srcImg = base64;
  if (base64 && base64.indexOf('data:') !== 0) {
    srcImg = 'data:' + mime + ';base64,' + base64;
  }

  // 1. IMÁGENES
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    textEl.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:70vh; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 20px;">' +
      '<img src="' + srcImg + '" style="max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); object-fit: contain;" ' +
      'onerror="this.parentElement.innerHTML=\'<p style=&quot;color:#f87171;text-align:center;&quot;>No se pudo cargar la imagen. Verificá que el base64 sea válido.</p>\';" />' +
      '</div>';
    return;
  }

  // 2. PDF
  if (ext === 'pdf') {
    try {
      var base64Data = base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64;
      var binario = atob(base64Data);
      var bytes = new Uint8Array(binario.length);
      for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);

      if (!modal._blobUrls) modal._blobUrls = [];
      modal._blobUrls.push(url);

      textEl.style.padding = '0';
      textEl.style.overflow = 'hidden';
      textEl.innerHTML = '<iframe src="' + url + '" style="width: 100%; height: 75vh; border: none; border-radius: 8px;"></iframe>';
    } catch (e) {
      textEl.textContent = "Error al cargar la vista previa del PDF.";
    }
    return;
  }

  // 3. HTML (dashboard) o Excel (XLS/XLSX)
  if (ext === 'html' || ext === 'htm' || ext === 'xls' || ext === 'xlsx') {
    try {
      var base64Data = base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64;
      var htmlText = decodeURIComponent(escape(window.atob(base64Data)));

      // Para Excel: inyectar estilos de tabla y fondo blanco
      if (ext === 'xls' || ext === 'xlsx') {
        var styleExcel = '<style>' +
          'body { padding: 20px !important; background: #fff !important; margin: 0; font-family: "Calibri", "Segoe UI", sans-serif; }' +
          'table { border-collapse: collapse !important; width: 100% !important; margin-top: 10px; }' +
          'th { background-color: #17365D !important; color: #FFFFFF !important; padding: 8px !important; border: 1px solid #a0a0a0 !important; text-align: center; }' +
          'td { padding: 6px 8px !important; border: 1px solid #d0d0d0 !important; text-align: center; }' +
          'tr:nth-child(even) td { background-color: #f9f9f9 !important; }' +
          '</style>';

        if (htmlText.indexOf('</head>') !== -1) {
          htmlText = htmlText.replace('</head>', styleExcel + '</head>');
        } else if (htmlText.indexOf('<body') !== -1) {
          htmlText = htmlText.replace('<body', styleExcel + '<body');
        } else {
          htmlText = styleExcel + htmlText;
        }
      }
      // Para HTML (dashboard): NO tocar el background, ya trae la marca inyectada por html_chat.py

      textEl.style.padding = '0';
      textEl.style.overflow = 'hidden';

      // Crear iframe y cargar el HTML como Blob URL (evita límites de document.write)
      textEl.innerHTML = '<iframe id="preview-iframe" style="width: 100%; height: 70vh; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; background: #fff;"></iframe>';
      var iframe = document.getElementById('preview-iframe');
      
      var blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      
      if (!modal._blobUrls) modal._blobUrls = [];
      modal._blobUrls.push(url);
      
      iframe.src = url;

      // Aplicar estilos adicionales al iframe si es necesario (ej. forzar que el body no tenga fondo blanco en dashboards)
      iframe.onload = function () {
        try {
          var doc = iframe.contentWindow.document;
          // Verificar si el HTML ya tiene el estilo de fondo inyectado
          var tieneFondo = doc.getElementById('nave-fondo-inyectado');
          if (!tieneFondo && (ext === 'html' || ext === 'htm')) {
            // Si no tiene fondo, es un dashboard generado sin la marca (fallback)
            // No forzamos nada, solo dejamos que se vea el contenido.
            console.warn('[preview] El dashboard no tiene fondo de marca inyectado.');
          }
        } catch (e) {
          console.error('[preview] Error en iframe.onload:', e);
        }
      };

    } catch (e) {
      textEl.textContent = "Error al renderizar el archivo: " + e.message;
    }
    return;
  }

  // 4. Fallback: texto plano o código
  try {
    var base64Data = base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64;
    var texto = decodeURIComponent(escape(window.atob(base64Data)));
    textEl.textContent = texto;
  } catch (e) {
    textEl.textContent = "No se puede previsualizar este archivo.";
  }
}

  function descargarArchivoBlob(base64, nombre, mime) {
    try {
      if (!base64) {
        alert("El archivo no tiene contenido para descargar.");
        return;
      }
      var base64Puro = base64.indexOf(",") !== -1 ? base64.split(",", 2)[1] : base64;
      var binario = atob(base64Puro);
      var bytes = new Uint8Array(binario.length);
      for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

      var blob = new Blob([bytes], { type: mime || "application/octet-stream" });

      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, nombre);
        return;
      }

      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = nombre || "archivo";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      setTimeout(function () {
        try { document.body.removeChild(a); } catch (_) {}
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error("Error al descargar archivo:", e);
      alert("No se pudo descargar el archivo: " + (e.message || e));
    }
  }

  async function descargarConDialogo(base64, nombre, mime) {
    if (!base64) {
      alert("El archivo no tiene contenido para descargar.");
      return;
    }

    if (typeof window.showSaveFilePicker !== "function") {
      descargarArchivoBlob(base64, nombre, mime);
      return;
    }

    try {
      var base64Puro = base64.indexOf(",") !== -1 ? base64.split(",", 2)[1] : base64;
      var binario = atob(base64Puro);
      var bytes = new Uint8Array(binario.length);
      for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

      var ext = "." + ((nombre || "").split(".").pop() || "bin");
      var tipos = [];
      if (mime) {
        var aceptar = {};
        aceptar[mime] = [ext];
        tipos.push({ description: "Archivo", accept: aceptar });
      }
      tipos.push({ description: "Todos los archivos", accept: { "application/octet-stream": [ext] } });

      var handle = await window.showSaveFilePicker({
        suggestedName: nombre || "archivo",
        types: tipos
      });

      var writable = await handle.createWritable();
      await writable.write(new Blob([bytes], { type: mime || "application/octet-stream" }));
      await writable.close();
    } catch (e) {
      if (e && e.name === "AbortError") return;
      console.warn("showSaveFilePicker falló, usando fallback Blob:", e);
      descargarArchivoBlob(base64, nombre, mime);
    }
  }

  function actualizarEstadoInputPorModelo() {
    var menuModelos = $('#menu-modelos');
    var seleccionadoActivo = menuModelos ? menuModelos.querySelector('input[type="radio"]:checked') : null;
    var modelActual = seleccionadoActivo ? seleccionadoActivo.value : modeloSeleccionadoId;
    var estaBloqueado = modelosOcupados[modelActual] === true;
    
    var qInput = $('#q');
    var bsend = $('#bsend');
    var bclip = $('#bclip');

    if (estaBloqueado) {
      if (qInput) { qInput.disabled = true; qInput.placeholder = "Este modelo está trabajando en otra conversación..."; }
      if (bsend) { bsend.disabled = true; bsend.style.opacity = '0.5'; bsend.style.cursor = 'not-allowed'; }
      if (bclip) { bclip.disabled = true; bclip.style.opacity = '0.5'; bclip.style.cursor = 'not-allowed'; }
    } else {
      if (qInput) { qInput.disabled = false; qInput.placeholder = "Pedile a MÍA lo que necesitás…"; }
      if (bsend) { bsend.disabled = false; bsend.style.opacity = '1'; bsend.style.cursor = 'pointer'; }
      if (bclip) { bclip.disabled = false; bclip.style.opacity = '1'; bclip.style.cursor = 'pointer'; }
    }
  }

  function agregarMensajeAsistenteAlDOM(contenedorHilo, respuestaItem, animar, callbackFin) {
    if (!contenedorHilo) { if (callbackFin) callbackFin(); return; }

    var msgDiv = document.createElement('div');
    msgDiv.className = 'msg a';
    var whoDiv = document.createElement('div');
    whoDiv.className = 'who';
    whoDiv.textContent = 'MÍA';
    var contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 4px; min-width: 0; max-width: 100%;';

    if (respuestaItem.modeloNombre) {
      var badgeModelo = document.createElement('div');
      badgeModelo.style.cssText = 'font-size: 10.5px; color: var(--teal); opacity: 0.85; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;';
      badgeModelo.innerHTML = '🤖 ' + respuestaItem.modeloNombre;
      contentWrapper.appendChild(badgeModelo);
    }

    var bubDiv = document.createElement('div');
    bubDiv.className = 'bub';
    bubDiv.style.cssText = 'font-family: "Segoe UI", system-ui, sans-serif; font-size: 14px; line-height: 1.6;';
    contentWrapper.appendChild(bubDiv);
    msgDiv.appendChild(whoDiv);
    msgDiv.appendChild(contentWrapper);
    contenedorHilo.appendChild(msgDiv);

    var chatsc = $('#chatsc');
    if (chatsc) chatsc.scrollTop = chatsc.scrollHeight;

    var terminarDibujo = function() {
      if (respuestaItem.archivoGenerado) {
        var adjuntoWrapper = document.createElement('div');
        adjuntoWrapper.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);';

        var fileTag = document.createElement('div');
        fileTag.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--teal); transition: opacity 0.2s;';
        fileTag.onmouseenter = function() { fileTag.style.opacity = '0.8'; };
        fileTag.onmouseleave = function() { fileTag.style.opacity = '1'; };
        
        fileTag.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        fileTag.innerHTML += '<span style="font-weight: 600; text-decoration: underline; text-underline-offset: 3px;">' + respuestaItem.archivoGenerado.nombre + '</span>';

        fileTag.onclick = function() {
          abrirModalArchivo(respuestaItem.archivoGenerado.nombre, respuestaItem.archivoGenerado.base64);
        };

        var btnDescarga = document.createElement('button');
        btnDescarga.innerHTML = '⬇️ Descargar';
        btnDescarga.className = 'btn-descarga-chat';
        btnDescarga.onclick = function() {
          descargarConDialogo(
            respuestaItem.archivoGenerado.base64Real || respuestaItem.archivoGenerado.base64,
            respuestaItem.archivoGenerado.nombreReal || respuestaItem.archivoGenerado.nombre,
            respuestaItem.archivoGenerado.mimeReal || respuestaItem.archivoGenerado.mime
          );
        };

        adjuntoWrapper.appendChild(fileTag);
        adjuntoWrapper.appendChild(btnDescarga);
        bubDiv.appendChild(adjuntoWrapper);
      }
      if (callbackFin) callbackFin();
    };

    if (animar) {
      animarEscrituraTexto(bubDiv, respuestaItem.texto, terminarDibujo);
    } else {
      construirContenidoFormateado(bubDiv, respuestaItem.texto);
      terminarDibujo();
    }
  }

  function initChat() {
    var qInput = $('#q');
    var bsend = $('#bsend');
    var bclip = $('#bclip');
    var inputArchivo = $('#input-archivo');
    var bnueva = $('#bnueva');
    var bvaciar = $('#bvaciar');

    if (!qInput || !bsend) return;

    var modalArchivo = $('#modal-archivo');
    var btnCerrarModal = $('#modal-archivo-cerrar');
    if (btnCerrarModal && modalArchivo) {
      btnCerrarModal.onclick = function() { modalArchivo.classList.remove('activo'); };
      modalArchivo.onclick = function(e) { if (e.target === modalArchivo) modalArchivo.classList.remove('activo'); };
    }

    cargarListaHistorial().then(function () { marcarChatActivo(conversacionActualId); });
    cargarModelosDisponibles().then(function() { actualizarEstadoInputPorModelo(); });

    // ==========================================
    // BOTONES DE GRUPO DE RELACIONES (MODOS)
    // ==========================================
    var botonesRelaciones = $$('.qab');
    botonesRelaciones.forEach(function(btn) {
      btn.onclick = function() {
        var accion = btn.getAttribute('data-accion');
        
        // Si toca "chat", desactivamos la herramienta. Si no, activamos ese modo.
        herramientaActiva = (accion === 'chat') ? null : accion;
        // Al cambiar de modo, reseteamos el historial de archivos generados
        ultimoArchivoGenerado = false; 

        var nombreModo = 
          accion === 'pdf' ? 'PDF' : 
          accion === 'excel' ? 'Excel' : 
          accion === 'dashboard' ? 'Dashboard' : 
          accion === 'imagenes' ? 'Imágenes' : 
          accion === 'empresa' ? 'Empresa' : 'Chat Normal';
        
        qInput.placeholder = (accion === 'chat') 
          ? "Pedile a MÍA lo que necesitás…" 
          : "Describí qué " + nombreModo + " querés crear/editar...";

        // Actualizar estilos visuales
        botonesRelaciones.forEach(function(b) { b.classList.remove('activo'); });
        btn.classList.add('activo');
        
        qInput.focus();
      };
    });

    var compw = $('.comp');
    previewWrap = document.createElement('div');
    previewWrap.id = 'imgPreviewContainer';
    previewWrap.style.cssText = 'display: none; align-items: center; gap: 8px; margin-bottom: 8px; width: 100%;';
    if (compw) compw.insertBefore(previewWrap, qInput);
    inputArchivoGlobal = inputArchivo;

    function mostrarPreviewArchivo(file, base64) {
      var tipoMime = file.type || '';
      var nombre = file.name || 'archivo';
      var ext = nombre.split('.').pop().toLowerCase();
      var extImagen = ['png','jpg','jpeg','gif','bmp','webp','svg','tiff','tif','ico'];
      var esImagen = tipoMime.startsWith('image/') || extImagen.indexOf(ext) !== -1;

      archivoAdjuntoActual = { base64: base64, nombre: nombre, tipo: esImagen ? 'image' : 'file' };
      if (previewWrap) previewWrap.style.display = 'flex';

      if (esImagen) {
        previewWrap.innerHTML = '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">' +
          '<img src="' + base64 + '" style="height: 20px; width: 20px; border-radius: 3px; object-fit: cover;" />' +
          '<span style="font-size: 11px; opacity: 0.8; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + nombre + '</span>' +
          '<button type="button" id="removeImgBtn" style="background:none; border:none; color:inherit; cursor:pointer; font-size: 12px; padding:0 2px;">✕</button>' +
          '</div>';
      } else {
        previewWrap.innerHTML = '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(34, 211, 238, 0.1); border:1px solid rgba(34, 211, 238, 0.3); padding:4px 8px; border-radius:6px;">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>' +
          '<span style="font-size: 11.5px; font-weight: 500; color: var(--white); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + nombre + '</span>' +
          '<button type="button" id="removeImgBtn" style="background:none; border:none; color:var(--mist); cursor:pointer; font-size: 12px; padding:0 2px; margin-left:4px;">✕</button>' +
          '</div>';
      }

      setTimeout(function() { var btn = $('#removeImgBtn'); if (btn) btn.onclick = limpiarAdjuntoGlobal; }, 10);
    }

    if (bclip && inputArchivo) {
      bclip.onclick = function () { 
        if (modelosOcupados[modeloSeleccionadoId]) return;
        inputArchivo.click(); 
      };
      inputArchivo.onchange = function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) { limpiarAdjuntoGlobal(); return; }
        var reader = new FileReader();
        reader.onload = function (evt) { mostrarPreviewArchivo(file, evt.target.result); };
        reader.readAsDataURL(file);
      };
    }

    qInput.addEventListener('input', function () {
      qInput.style.height = 'auto';
      qInput.style.height = Math.min(160, qInput.scrollHeight) + 'px';
    });

    qInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        if (!modelosOcupados[modeloSeleccionadoId]) enviarMensaje(); 
      }
    });

    bsend.onclick = function() {
      if (!modelosOcupados[modeloSeleccionadoId]) enviarMensaje();
    };

    if (bnueva) {
      bnueva.onclick = function () {
        conversacionActualId = 'conv_' + Date.now(); mensajesActuales = [];
        herramientaActiva = null;
        ultimoArchivoGenerado = false;
        renderizarHiloCompleto(mensajesActuales, false); limpiarAdjuntoGlobal();
        qInput.value = ''; qInput.style.height = 'auto'; qInput.placeholder = "Pedile a MÍA lo que necesitás…";
        marcarChatActivo(conversacionActualId);
        apiFetch('/api/reiniciar', { method: 'POST', body: JSON.stringify({}) });
      };
    }

    if (bvaciar) {
      bvaciar.onclick = function () {
        if (!mensajesActuales || mensajesActuales.length === 0) return;
        if (!confirm('¿Vaciar el chat actual? Se borrarán los mensajes de esta sesión.')) return;
        persistirConversacionPorId(conversacionActualId, mensajesActuales);
        conversacionActualId = 'conv_' + Date.now(); mensajesActuales = []; herramientaActiva = null;
        ultimoArchivoGenerado = false;
        limpiarAdjuntoGlobal(); qInput.value = ''; qInput.style.height = 'auto'; qInput.placeholder = "Pedile a MÍA lo que necesitás…";
        renderizarHiloCompleto(mensajesActuales, false); marcarChatActivo(conversacionActualId);
        apiFetch('/api/reiniciar', { method: 'POST', body: JSON.stringify({}) });
      };
    }

    async function enviarMensaje() {
      var modeloSeleccionado = modeloSeleccionadoId;
      if (modelosOcupados[modeloSeleccionado]) return;

      var texto = (qInput.value || '').trim();
      var adjuntoAEnviar = archivoAdjuntoActual.base64;
      var nombreArchivo = archivoAdjuntoActual.nombre;
      var tipoAdjunto = archivoAdjuntoActual.tipo;

      if (!texto && !adjuntoAEnviar) return;

      var chatIdAlEnviar = conversacionActualId;
      
      mensajesActuales.push({
        rol: 'user', texto: texto,
        imagen: tipoAdjunto === 'image' ? adjuntoAEnviar : '',
        archivoNombre: tipoAdjunto === 'file' ? (nombreArchivo || '') : '',
        archivoBase64: tipoAdjunto === 'file' ? adjuntoAEnviar : ''
      });

      var mensajesDelChatAlEnviar = mensajesActuales.slice();
      modelosOcupados[modeloSeleccionado] = true;
      chatsPensando[chatIdAlEnviar] = true;

      if (conversacionActualId === chatIdAlEnviar) {
        renderizarHiloCompleto(mensajesActuales, true);
        actualizarEstadoInputPorModelo();
      }

      qInput.value = ''; 
      qInput.style.height = 'auto';
      limpiarAdjuntoGlobal();

      persistirConversacionPorId(chatIdAlEnviar, mensajesDelChatAlEnviar);

      var textoRespuesta = '';
      var esError = false;
      var respuestaItem = null;

      var historialParaEnviar = mensajesDelChatAlEnviar.slice(0, mensajesDelChatAlEnviar.length - 1).map(function (m) {
        return { role: m.rol === 'user' ? 'user' : 'assistant', content: m.texto || '' };
      });

      if (herramientaActiva) {
        try {
          var temaParaIA = texto;
          
          // Si ya generamos un archivo en este modo, le avisamos a la IA que es una edición
          if (ultimoArchivoGenerado) {
             temaParaIA = "El usuario está editando un archivo ya generado en esta conversación. Pedido de modificación actual: " + texto;
          }

          // Ahora todos los modos (incluido 'imagenes') usan el generador de archivos
          var respGen = await apiFetch('/api/generar_archivo', {
            method: 'POST',
            body: JSON.stringify({ 
              script: herramientaActiva, 
              tema: temaParaIA,
              modelo_id: modeloSeleccionadoId,
              historial_previo: historialParaEnviar 
            })
          });
          
          if (respGen.ok && respGen.data.ok) {
            textoRespuesta = ultimoArchivoGenerado 
              ? "¡Listo! He actualizado el archivo. Puedes verlo o descargarlo:" 
              : "¡Listo! He generado el archivo. Puedes verlo o descargarlo:";
            
            ultimoArchivoGenerado = true; // 👈 Marcamos que ya hay un archivo generado

            respuestaItem = { 
              rol: 'assistant', 
              texto: textoRespuesta,
              modeloNombre: 'Generador de Archivos',
              archivoGenerado: {
                nombre: respGen.data.nombre,
                mime: respGen.data.mime || 'text/html',
                base64: respGen.data.base64,
                nombreReal: respGen.data.nombre_real,
                base64Real: respGen.data.base64_real,
                mimeReal: respGen.data.mime_real || respGen.data.mime
              }
            };
          } else {
            textoRespuesta = "❌ Hubo un error al generar el archivo: " + (respGen.data.error || 'Desconocido');
            respuestaItem = { rol: 'assistant', texto: textoRespuesta, modeloNombre: 'Sistema' };
            esError = true;
          }
        } catch (err) {
          textoRespuesta = "❌ Error de conexión al generar el archivo.";
          respuestaItem = { rol: 'assistant', texto: textoRespuesta, modeloNombre: 'Sistema' };
          esError = true;
        }
        // ⚠️ IMPORTANTE: NO reseteamos herramientaActiva aquí. El modo persiste.

      } else {
        // Chat normal
        var payload = {
          mensaje: texto,
          datos_frontend: nombreArchivo ? '[Archivo adjunto: ' + nombreArchivo + ']' : '',
          modelo_id: modeloSeleccionado, historial: historialParaEnviar,
          imagen_base64: tipoAdjunto === 'image' ? adjuntoAEnviar : '',
          archivo_base64: tipoAdjunto === 'file' ? adjuntoAEnviar : '',
          nombre_archivo: nombreArchivo || '', tipo_archivo: tipoAdjunto || '',
          adjunto_base64: adjuntoAEnviar || '', adjunto_nombre: nombreArchivo || '', adjunto_tipo: tipoAdjunto || ''
        };

        try {
          var controller = new AbortController();
          var timeoutId = setTimeout(function () { controller.abort(); }, 5 * 60 * 1000);
          var resp = await apiFetch('/api/chat', { method: 'POST', body: JSON.stringify(payload), signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (resp.data && (resp.data.error === 'modelo_ocupado' || resp.data.error === 'request_too_large')) {
              textoRespuesta = resp.data.reply; 
              esError = true;
          } else if (resp.data && resp.data.reply) {
              textoRespuesta = resp.data.reply;
          } else {
              textoRespuesta = 'No se recibió respuesta.';
              esError = true;
          }
        } catch (err) {
          textoRespuesta = (err && err.name === 'AbortError') ? '⏱️ La solicitud tardó demasiado (5 minutos).' : '❌ Error: ' + (err.message || 'desconocido');
          esError = true;
        }

        respuestaItem = { rol: 'assistant', texto: textoRespuesta, modeloNombre: 'MÍA' };
      }

      var mensajesFinales = mensajesDelChatAlEnviar.concat([respuestaItem]);
      persistirConversacionPorId(chatIdAlEnviar, mensajesFinales);

      if (chatIdAlEnviar === conversacionActualId) {
        mensajesActuales.push(respuestaItem);
        var hilo = $('#hilo');
        var typingDiv = $('#typing-activo');
        if (typingDiv) typingDiv.remove();

        agregarMensajeAsistenteAlDOM(hilo, respuestaItem, true, function () {
          modelosOcupados[modeloSeleccionado] = false;
          chatsPensando[chatIdAlEnviar] = false;
          actualizarEstadoInputPorModelo();
        });
      } else {
        modelosOcupados[modeloSeleccionado] = false;
        chatsPensando[chatIdAlEnviar] = false;
        actualizarEstadoInputPorModelo();
      }
    }
  }

  function renderizarHiloCompleto(mensajes, estaPensando) {
    var bienvenida = $('#bienvenida'), chatsc = $('#chatsc'), hilo = $('#hilo'); 
    if (!hilo) return;
    $$('.msg:not(#bienvenida)', hilo).forEach(function(m) { m.remove(); });

    if (mensajes.length > 0 || estaPensando) {
      if (bienvenida) bienvenida.style.display = 'none';
      if (chatsc) chatsc.classList.remove('chatsc-vacio');
    } else {
      if (bienvenida) bienvenida.style.display = 'flex';
      if (chatsc) chatsc.classList.add('chatsc-vacio');
    }

    mensajes.forEach(function(m) {
      var msgDiv = document.createElement('div'); msgDiv.className = 'msg ' + (m.rol === 'user' ? 'u' : 'a');
      var whoDiv = document.createElement('div'); whoDiv.className = 'who'; whoDiv.textContent = m.rol === 'user' ? 'TÚ' : 'MÍA';
      var contentWrapper = document.createElement('div'); contentWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 4px; min-width: 0; max-width: 100%;';

      if (m.rol === 'assistant' && m.modeloNombre) {
        var badgeModelo = document.createElement('div'); badgeModelo.style.cssText = 'font-size: 10.5px; color: var(--teal); opacity: 0.85; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;';
        badgeModelo.innerHTML = '🤖 ' + m.modeloNombre; contentWrapper.appendChild(badgeModelo);
      }

      var bubDiv = document.createElement('div'); bubDiv.className = 'bub'; bubDiv.style.cssText = 'font-family: "Segoe UI", system-ui, sans-serif; font-size: 14px; line-height: 1.6;';

      if (m.imagen) {
        var imgEl = document.createElement('img'); imgEl.src = m.imagen; imgEl.style.cssText = 'max-width: 240px; max-height: 180px; border-radius: 8px; display: block; margin-bottom: 8px; object-fit: cover;';
        bubDiv.appendChild(imgEl);
      }

      if (m.archivoNombre) {
        var fileContainer = document.createElement('div');
        fileContainer.style.display = 'block'; 
        fileContainer.style.marginBottom = '8px';

        var fileTag = document.createElement('div');
        fileTag.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 8px; font-size: 12.5px; cursor: pointer; transition: all 0.2s; color: var(--white);';
        fileTag.onmouseenter = function() { this.style.background = 'rgba(34, 211, 238, 0.2)'; this.style.borderColor = 'rgba(34, 211, 238, 0.6)'; };
        fileTag.onmouseleave = function() { this.style.background = 'rgba(34, 211, 238, 0.1)'; this.style.borderColor = 'rgba(34, 211, 238, 0.3)'; };
        
        fileTag.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        fileTag.innerHTML += '<span style="font-weight: 500; text-decoration: underline; text-underline-offset: 3px;">' + m.archivoNombre + '</span>';
        
        fileTag.onclick = function() {
          if (m.archivoBase64) abrirModalArchivo(m.archivoNombre, m.archivoBase64);
          else alert("El contenido del archivo no está disponible en esta versión del chat.");
        };
        fileContainer.appendChild(fileTag);
        bubDiv.appendChild(fileContainer);
      }

      if (m.texto) {
        if (m.rol === 'user') { 
          bubDiv.style.whiteSpace = 'pre-wrap'; 
          var textoMostrar = m.texto.length > 1000 ? m.texto.substring(0, 1000) + '...' : m.texto;
          bubDiv.appendChild(document.createTextNode(textoMostrar));
        }
        else construirContenidoFormateado(bubDiv, m.texto);
      }

      if (m.archivoGenerado) {
        var adjuntoWrapper = document.createElement('div');
        adjuntoWrapper.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);';

        var fileTag = document.createElement('div');
        fileTag.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--teal); transition: opacity 0.2s;';
        fileTag.onmouseenter = function() { fileTag.style.opacity = '0.8'; };
        fileTag.onmouseleave = function() { fileTag.style.opacity = '1'; };
        
        fileTag.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        fileTag.innerHTML += '<span style="font-weight: 600; text-decoration: underline; text-underline-offset: 3px;">' + m.archivoGenerado.nombre + '</span>';

        fileTag.onclick = function() {
          abrirModalArchivo(m.archivoGenerado.nombre, m.archivoGenerado.base64);
        };

        var btnDescarga = document.createElement('button');
        btnDescarga.innerHTML = '⬇️ Descargar';
        btnDescarga.className = 'btn-descarga-chat';
        btnDescarga.onclick = function() {
          descargarConDialogo(
            m.archivoGenerado.base64Real || m.archivoGenerado.base64,
            m.archivoGenerado.nombreReal || m.archivoGenerado.nombre,
            m.archivoGenerado.mimeReal || m.archivoGenerado.mime
          );
        };

        adjuntoWrapper.appendChild(fileTag);
        adjuntoWrapper.appendChild(btnDescarga);
        bubDiv.appendChild(adjuntoWrapper);
      }

      contentWrapper.appendChild(bubDiv); msgDiv.appendChild(whoDiv); msgDiv.appendChild(contentWrapper); hilo.appendChild(msgDiv);
    });

    if (estaPensando) {
      var typingDiv = document.createElement('div'); typingDiv.className = 'msg a'; typingDiv.id = 'typing-activo';
      typingDiv.innerHTML = '<div class="who">MÍA</div><div class="bub"><p style="opacity: 0.6; font-style: italic;">Pensando...</p></div>'; hilo.appendChild(typingDiv);
    }
    if (chatsc) chatsc.scrollTop = chatsc.scrollHeight;
  }

  function animarEscrituraTexto(container, textoCompleto, callbackFin) {
    var textoLimpio = sanitizarTexto(textoCompleto); var i = 0;
    function escribirPaso() {
      if (i < textoLimpio.length) {
        i = Math.min(textoLimpio.length, i + 3);
        construirContenidoFormateado(container, textoLimpio.substring(0, i));
        var chatsc = $('#chatsc'); if (chatsc) chatsc.scrollTop = chatsc.scrollHeight;
        setTimeout(escribirPaso, 8);
      } else { 
        construirContenidoFormateado(container, textoLimpio); 
        if (callbackFin) callbackFin(); 
      }
    }
    escribirPaso();
  }

  function marcarChatActivo(convId) {
    var histContainer = $('#historial'); if (!histContainer) return;
    $$('.hqb.hist-item', histContainer).forEach(function (el) {
      el.classList[el.dataset.convId === convId ? 'add' : 'remove']('active');
    });
  }

  async function cargarListaHistorial() {
    var r = await apiFetch('/api/chat/historial/listar');
    var histContainer = $('#historial'); if (!histContainer) return;
    histContainer.innerHTML = '';
    if (r.ok && r.data && r.data.conversaciones) {
      r.data.conversaciones.forEach(function(c) {
        var wrapper = document.createElement('div'); wrapper.className = 'hist-item-wrapper';
        var btn = document.createElement('button'); btn.className = 'hqb hist-item'; btn.textContent = c.titulo; btn.dataset.convId = c.id;
        if (c.id === conversacionActualId) btn.classList.add('active');
        btn.onclick = function() { cargarConversacion(c.id); };
        var btnEliminar = document.createElement('button'); btnEliminar.className = 'btn-eliminar-chat'; btnEliminar.title = 'Eliminar chat'; btnEliminar.innerHTML = '<span>×</span>';
        btnEliminar.onclick = function(e) { e.stopPropagation(); eliminarChat(c.id); };
        wrapper.appendChild(btn); wrapper.appendChild(btnEliminar); histContainer.appendChild(wrapper);
      });
    }
  }

  async function eliminarChat(convId) {
    if (!confirm('¿Eliminar esta conversación?')) return;
    var r = await apiFetch('/api/chat/historial/eliminar', { method: 'POST', body: JSON.stringify({ id: convId }) });
    if (r.ok) { 
      if (convId === conversacionActualId) { var b = $('#bnueva'); if(b) b.click(); } 
      cargarListaHistorial(); 
    }
  }

  async function cargarConversacion(convId) {
    var r = await apiFetch('/api/chat/historial/obtener?id=' + encodeURIComponent(convId));
    if (r.ok && r.data && r.data.conversacion) {
      var conv = r.data.conversacion; 
      conversacionActualId = conv.id; 
      mensajesActuales = conv.mensajes || [];
      herramientaActiva = null;
      ultimoArchivoGenerado = false;
      
      // Restaurar botón "Chat" como activo
      $$('.qab').forEach(function(b) { 
        if (b.getAttribute('data-accion') === 'chat') b.classList.add('activo'); 
        else b.classList.remove('activo'); 
      });

      var estaPensando = chatsPensando[conversacionActualId] === true;
      renderizarHiloCompleto(mensajesActuales, estaPensando); 
      marcarChatActivo(conversacionActualId);
      actualizarEstadoInputPorModelo();
      await apiFetch('/api/reiniciar', { method: 'POST', body: JSON.stringify({ conversacion_id: convId }) });
    }
  }

  function persistirConversacionPorId(convId, mensajes) {
    if (!mensajes || mensajes.length === 0) return;
    var p = mensajes[0].texto || 'Nueva conversación';
    apiFetch('/api/chat/historial/guardar', { method: 'POST', body: JSON.stringify({ id: convId, titulo: p.length > 28 ? p.substring(0,28)+'...' : p, mensajes: mensajes }) })
      .then(function() { cargarListaHistorial().then(function () { marcarChatActivo(conversacionActualId); }); });
  }

  async function cargarModelosDisponibles() {
    var menuModelos = $('#menu-modelos'), lblModelos = $('#lbl-modelos-seleccionados'), btnToggle = $('#btn-toggle-modelos'), wrapper = $('#modelos-wrapper');
    if (!menuModelos || !lblModelos || !btnToggle) return;
    btnToggle.onclick = function(e) { e.stopPropagation(); menuModelos.hidden = !menuModelos.hidden; };
    document.addEventListener('click', function(e) { if (wrapper && !wrapper.contains(e.target)) menuModelos.hidden = true; });

    var r = await apiFetch('/api/modelos');
    if (r.ok && r.data && r.data.modelos) {
      menuModelos.innerHTML = '';
      r.data.modelos.forEach(function(m) {
        if (m.descargado || m.es_principal || m.es_api) {
          var labelItem = document.createElement('label'); labelItem.className = 'modelo-option-item';
          var radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'modelo_seleccionado'; radio.value = m.id;
          if (m.id === modeloSeleccionadoId || (modeloSeleccionadoId === '__principal__' && m.es_principal)) radio.checked = true;
          radio.onchange = async function() {
            modeloSeleccionadoId = radio.value; localStorage.setItem('mya_modelo_seleccionado', modeloSeleccionadoId);
            actualizarTextoModelosSeleccionados(); menuModelos.hidden = true;
            actualizarEstadoInputPorModelo();
            try {
              if (modeloSeleccionadoId === '__principal__') await apiFetch('/api/modelo/principal', { method: 'POST', body: JSON.stringify({}) });
              else await apiFetch('/api/modelo/activar', { method: 'POST', body: JSON.stringify({ id: modeloSeleccionadoId }) });
            } catch (err) { console.error(err); }
          };
          var spanNombre = document.createElement('span'); spanNombre.textContent = m.nombre || m.id;
          labelItem.appendChild(radio); labelItem.appendChild(spanNombre); menuModelos.appendChild(labelItem);
        }
      });
      actualizarTextoModelosSeleccionados();
    }
  }

  function actualizarTextoModelosSeleccionados() {
    var menuModelos = $('#menu-modelos'), lblModelos = $('#lbl-modelos-seleccionados');
    if (!menuModelos || !lblModelos) return;
    var elRadio = menuModelos.querySelector('input[value="' + modeloSeleccionadoId + '"]') || menuModelos.querySelector('input[type="radio"]');
    if (elRadio) { elRadio.checked = true; lblModelos.textContent = elRadio.parentElement.textContent.trim(); }
    else lblModelos.textContent = 'Modelo Principal';
  }

  document.addEventListener('DOMContentLoaded', initChat);
  if (document.readyState !== 'loading') initChat();
})();