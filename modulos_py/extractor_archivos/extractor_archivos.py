"""
Extractor universal de contenido de archivos.
Convierte cualquier archivo a texto plano (y extrae imágenes cuando aplica)
para que el modelo pueda procesarlo.

Soporta:
  - Texto plano y código: .txt .md .csv .json .xml .yml .py .js .ts .html .css ...
  - Documentos: .pdf .docx .doc .pptx .xlsx .xls .xlsm .odt .rtf
  - Imágenes: .png .jpg .jpeg .gif .bmp .webp .tiff .svg (con OCR si está disponible)
  - Archivos: .zip (extrae textos internos)
  - Fallback: detección automática de texto por heurística

Optimizado para PDFs generados con ReportLab (usa pdfplumber con fallback a pypdf).
"""
import base64
import io
import os
import re
import zipfile
import mimetypes

TEXTO_DIRECTO = {
    '.txt', '.md', '.markdown', '.rst', '.log', '.csv', '.tsv',
    '.json', '.jsonl', '.ndjson', '.xml', '.yml', '.yaml', '.toml',
    '.ini', '.cfg', '.conf', '.env', '.properties', '.gitignore',
    '.editorconfig', '.dockerfile', '.makefile',
    '.py', '.pyw', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
    '.html', '.htm', '.css', '.scss', '.sass', '.less',
    '.php', '.rb', '.go', '.rs', '.java', '.kt', '.kts',
    '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx', '.cs', '.m', '.mm',
    '.swift', '.dart', '.lua', '.pl', '.pm', '.r', '.jl',
    '.sql', '.graphql', '.gql', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd',
    '.vue', '.svelte', '.astro', '.ex', '.exs', '.erl', '.hs', '.clj', '.scala',
    '.gradle', '.cmake', '.mk', '.asm', '.s', '.v', '.vhd', '.vhdl',
    '.tex', '.bib', '.diff', '.patch',
}

EXTENSIONES_IMAGEN = {
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp',
    '.tiff', '.tif', '.ico', '.svg',
}

MAX_CHARS_TEXTO = 400_000
MAX_IMAGENES = 2
MAX_BYTES_HEURISTICA = 5 * 1024 * 1024

def _leer_texto_seguro(data: bytes) -> str:
    for enc in ('utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'utf-16'):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode('utf-8', errors='ignore')

def _es_texto_imprimible(data: bytes) -> bool:
    muestra = data[:4096]
    if not muestra:
        return False
    imprimibles = sum(1 for b in muestra if 32 <= b <= 126 or b in (9, 10, 13))
    return imprimibles / len(muestra) > 0.85

def _img_a_data_url(raw: bytes, mime_default: str = "image/png") -> str:
    if raw[:3] == b"\xff\xd8\xff": mime = "image/jpeg"
    elif raw[:8] == b"\x89PNG\r\n\x1a\n": mime = "image/png"
    elif raw[:6] in (b"GIF87a", b"GIF89a"): mime = "image/gif"
    elif raw[:2] == b"BM": mime = "image/bmp"
    elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP": mime = "image/webp"
    else: mime = mime_default
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"

def _extraer_pdf(data: bytes):
    texto = ""
    imagenes = []
    try:
        import pdfplumber
        partes = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for i, page in enumerate(pdf.pages):
                try: t = page.extract_text() or ""
                except Exception: t = ""
                if t.strip(): partes.append(f"[Página {i + 1}]\n{t}")
                try:
                    tablas = page.extract_tables()
                    for j, tabla in enumerate(tablas):
                        if not tabla: continue
                        partes.append(f"\n[Tabla {j + 1} - Página {i + 1}]")
                        for fila in tabla:
                            celdas = ["" if c is None else str(c).strip() for c in fila]
                            partes.append("\t".join(celdas))
                except Exception: pass
                if len(imagenes) < MAX_IMAGENES:
                    try:
                        for img in page.images:
                            try:
                                stream = img.get("stream")
                                if stream is None: continue
                                raw = stream.get_data() if hasattr(stream, "get_data") else bytes(stream)
                                if raw:
                                    imagenes.append(_img_a_data_url(raw))
                                    if len(imagenes) >= MAX_IMAGENES: break
                            except Exception: pass
                    except Exception: pass
                if len(imagenes) >= MAX_IMAGENES: break
        texto = "\n\n".join(partes)
        if texto.strip() or imagenes: return texto, imagenes
    except Exception as ex:
        print(f"[PDF] pdfplumber falló: {ex}. Probando pypdf...")
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        partes = []
        for i, page in enumerate(reader.pages):
            try:
                t = page.extract_text() or ""
                if t.strip(): partes.append(f"[Página {i + 1}]\n{t}")
            except Exception: pass
        texto = "\n\n".join(partes)
        if len(imagenes) < MAX_IMAGENES:
            try:
                for page in reader.pages:
                    try:
                        for img in page.images:
                            try:
                                raw = img.data
                                if raw:
                                    imagenes.append(_img_a_data_url(raw))
                                    if len(imagenes) >= MAX_IMAGENES: break
                            except Exception: pass
                    except Exception: pass
                    if len(imagenes) >= MAX_IMAGENES: break
            except Exception: pass
    except Exception as ex:
        texto = f"[No se pudo leer el PDF: {ex}]"
    return texto, imagenes

def _extraer_docx(data: bytes):
    imagenes = []
    try:
        from docx import Document
        doc = Document(io.BytesIO(data))
        partes = []
        for p in doc.paragraphs:
            if p.text and p.text.strip(): partes.append(p.text)
        for tabla in doc.tables:
            partes.append("\n[Tabla]")
            for fila in tabla.rows:
                celdas = [c.text.strip() if c.text else "" for c in fila.cells]
                partes.append("\t".join(celdas))
        try:
            for rel in doc.part.rels.values():
                if "image" in rel.reltype and len(imagenes) < MAX_IMAGENES:
                    try:
                        raw = rel.target_part.blob
                        if raw: imagenes.append(_img_a_data_url(raw))
                    except Exception: pass
        except Exception: pass
        return "\n".join(partes), imagenes
    except Exception as ex: return f"[No se pudo leer el DOCX: {ex}]", []

def _extraer_pptx(data: bytes):
    imagenes = []
    try:
        from pptx import Presentation
        prs = Presentation(io.BytesIO(data))
        partes = []
        for i, slide in enumerate(prs.slides):
            partes.append(f"=== Diapositiva {i + 1} ===")
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip(): partes.append(shape.text)
                if len(imagenes) < MAX_IMAGENES and hasattr(shape, "image"):
                    try:
                        raw = shape.image.blob
                        if raw: imagenes.append(_img_a_data_url(raw))
                    except Exception: pass
        return "\n".join(partes), imagenes
    except Exception as ex: return f"[No se pudo leer el PPTX: {ex}]", []

def _extraer_xlsx(data: bytes):
    imagenes = []
    try:
        from openpyxl import load_workbook
        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        partes = []
        for hoja in wb.sheetnames:
            ws = wb[hoja]
            partes.append(f"=== Hoja: {hoja} ===")
            for fila in ws.iter_rows(values_only=True):
                partes.append("\t".join("" if c is None else str(c) for c in fila))
        return "\n".join(partes), imagenes
    except Exception as ex: return f"[No se pudo leer el XLSX: {ex}]", []

def _extraer_odt(data: bytes):
    try:
        from odf import teletype
        from odf.opendocument import load
        doc = load(io.BytesIO(data))
        return teletype.extractText(doc), []
    except Exception as ex: return f"[No se pudo leer el ODT: {ex}]", []

def _extraer_rtf(data: bytes):
    try:
        from striprtf.striprtf import rtf_to_text
        return rtf_to_text(_leer_texto_seguro(data)), []
    except Exception:
        txt = _leer_texto_seguro(data)
        txt = re.sub(r'\\[a-z]+\d*\s?', '', txt)
        txt = txt.replace('{', '').replace('}', '')
        return txt, []

def _extraer_zip(data: bytes):
    try:
        partes = []
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for name in z.namelist():
                if name.endswith('/'): continue
                ext = os.path.splitext(name)[1].lower()
                partes.append(f"=== {name} ===")
                if ext in TEXTO_DIRECTO:
                    try:
                        contenido = _leer_texto_seguro(z.read(name))
                        partes.append(contenido[:20000])
                    except Exception: partes.append("[No se pudo leer]")
                else: partes.append(f"[Archivo binario: {ext or 'desconocido'}]")
                if sum(len(p) for p in partes) > MAX_CHARS_TEXTO:
                    partes.append("[... truncado por tamaño ...]")
                    break
        return "\n".join(partes), []
    except Exception as ex: return f"[No se pudo leer el ZIP: {ex}]", []

def _ocr_imagen(data: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(data))
        return pytesseract.image_to_string(img, lang='spa+eng')
    except ImportError: return ""
    except Exception as ex: return f"[OCR falló: {ex}]"

def extraer_contenido(nombre_archivo: str, data: bytes) -> dict:
    nombre = nombre_archivo or 'archivo'
    ext = os.path.splitext(nombre.lower())[1]
    mime = mimetypes.guess_type(nombre)[0] or 'application/octet-stream'
    texto = ""
    imagenes = []
    tipo = "texto"

    try:
        if ext in TEXTO_DIRECTO:
            texto = _leer_texto_seguro(data)
            tipo = "texto"
        elif ext in EXTENSIONES_IMAGEN:
            if ext == '.svg': texto = _leer_texto_seguro(data)
            else:
                texto_ocr = _ocr_imagen(data)
                if texto_ocr and texto_ocr.strip(): texto = f"[Texto detectado en la imagen por OCR]\n{texto_ocr}"
            imagenes.append(_img_a_data_url(data, mime))
            tipo = "imagen"
        elif ext == '.pdf':
            texto, imagenes = _extraer_pdf(data)
            tipo = "documento"
        elif ext in ('.docx', '.doc'):
            texto, imagenes = _extraer_docx(data)
            tipo = "documento"
        elif ext == '.pptx':
            texto, imagenes = _extraer_pptx(data)
            tipo = "documento"
        elif ext in ('.xlsx', '.xls', '.xlsm'):
            texto, imagenes = _extraer_xlsx(data)
            tipo = "documento"
        elif ext == '.odt':
            texto, imagenes = _extraer_odt(data)
            tipo = "documento"
        elif ext == '.rtf':
            texto, imagenes = _extraer_rtf(data)
            tipo = "documento"
        elif ext == '.zip':
            texto, imagenes = _extraer_zip(data)
            tipo = "documento"
        else:
            if len(data) <= MAX_BYTES_HEURISTICA and _es_texto_imprimible(data):
                texto = _leer_texto_seguro(data)
                tipo = "texto"
            else:
                texto = f"[Archivo binario no reconocido: {mime}, {len(data)} bytes]\n[No se pudo extraer texto automáticamente.]"
                tipo = "binario"

        if len(texto) > MAX_CHARS_TEXTO:
            texto = texto[:MAX_CHARS_TEXTO] + "\n\n[... contenido truncado por tamaño ...]"
    except Exception as ex:
        texto = f"[Error procesando '{nombre}': {ex}]"
        tipo = "binario"

    return {
        "texto": texto or "",
        "imagenes": imagenes,
        "tipo": tipo,
        "mime": mime,
        "nombre": nombre,
    }

def dividir_texto_en_trozos(texto: str, tamano_trozo: int = 3000) -> list:
    """
    Divide un texto largo en trozos lógicos intentando respetar los saltos de línea.
    """
    if not texto:
        return []
    if len(texto) <= tamano_trozo:
        return [texto]
    
    trozos = []
    lineas = texto.split('\n')
    trozo_actual = ""
    
    for linea in lineas:
        if len(trozo_actual) + len(linea) + 1 > tamano_trozo:
            if trozo_actual:
                trozos.append(trozo_actual.strip())
            trozo_actual = linea + "\n"
        else:
            trozo_actual += linea + "\n"
            
    if trozo_actual:
        trozos.append(trozo_actual.strip())
        
    return trozos