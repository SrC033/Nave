from pathlib import Path
from datetime import datetime
from xml.sax.saxutils import escape
import re
import os
import json

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak
)

OUTPUT = Path(__file__).resolve().parent / "documentos"
OUTPUT.mkdir(parents=True, exist_ok=True)

RUTA_IMAGEN = Path(__file__).resolve().parent / "Imagen" / "marca.png"

_ultimo_archivo = None

def obtener_prompt(tema: str) -> str:
    if "editando un archivo" in tema.lower() or "modificación" in tema.lower():
        return (
            "Sos un redactor experto. El usuario está editando un documento PDF que ya generaste.\n\n"
            "Revisá el historial, encontrá el contenido anterior y aplicá SOLO los cambios pedidos.\n\n"
            "Devolvé EXCLUSIVAMENTE un JSON válido con esta estructura:\n"
            '{"titulo": "...", "subtitulo": "...", "contenido": "# Título\\n..."}\n\n'
            "Mantené todo el contenido original y solo agregá, quitá o modificá lo que el usuario pide.\n"
            "NO uses ```json. Solo el JSON puro.\n\n"
            f"PEDIDO DEL USUARIO:\n{tema}"
        )
    
    return (
        "Sos un redactor experto. El usuario pidió un DOCUMENTO PDF.\n\n"
        "Devolvé EXCLUSIVAMENTE un objeto JSON válido, sin markdown, sin explicaciones, "
        "con esta estructura exacta:\n"
        '{"titulo": "Título del documento", "subtitulo": "Subtítulo o descripción breve", '
        '"contenido": "# Título\\n\\n## Sección 1\\nTexto...\\n\\n## Sección 2\\nTexto..."}\n\n'
        "REGLAS:\n"
        "- 'titulo' es el título principal del documento (string).\n"
        "- 'subtitulo' es una breve descripción o bajada (string).\n"
        "- 'contenido' es el cuerpo COMPLETO en Markdown (string). Usá \\n para saltos de línea.\n"
        "- Dentro de 'contenido' usá # para título, ## para secciones, ### para subsecciones, "
        "- para listas, **negrita** para énfasis.\n"
        "- El contenido debe ser sustancial, bien estructurado, en español, adaptado al pedido.\n"
        "- NO devuelvas código Python. NO uses ```json. Solo el JSON puro.\n\n"
        f"PEDIDO DEL USUARIO:\n{tema}"
    )

def construir_codigo(datos: dict) -> str:
    titulo = str(datos.get('titulo') or 'Documento')
    subtitulo = str(datos.get('subtitulo') or '')
    contenido = str(datos.get('contenido') or '')

    # Limpiamos caracteres corruptos antes de armar el código Python
    titulo = titulo.encode('utf-8', 'ignore').decode('utf-8', 'ignore')
    subtitulo = subtitulo.encode('utf-8', 'ignore').decode('utf-8', 'ignore')
    contenido = contenido.encode('utf-8', 'ignore').decode('utf-8', 'ignore')

    return (
        f"titulo = {json.dumps(titulo)}\n"
        f"subtitulo = {json.dumps(subtitulo)}\n"
        f"contenido = {json.dumps(contenido)}\n"
        "crear(titulo=titulo, subtitulo=subtitulo, contenido_markdown=contenido)\n"
    )

def _slug(texto, maximo=60):
    s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", str(texto or "documento")).strip("_")
    return (s or "documento")[:maximo]

def _inline_md(texto):
    texto = escape(texto)
    texto = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", texto)
    texto = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", texto)
    texto = re.sub(r"`([^`]+)`", r'<font face="Courier">\1</font>', texto)
    return texto

def _crear_styles():
    styles = {}
    styles["DocTitle"] = ParagraphStyle(
        name="DocTitle", fontSize=32, leading=38,
        textColor=colors.HexColor("#FFFFFF"),
        alignment=TA_CENTER, spaceAfter=10, fontName="Helvetica-Bold",
    )
    styles["DocSubTitle"] = ParagraphStyle(
        name="DocSubTitle", fontSize=16, leading=22,
        textColor=colors.HexColor("#EAF0FA"),
        alignment=TA_CENTER, spaceAfter=20, fontName="Helvetica",
    )
    for lvl, size, before in [(1, 18, 20), (2, 14, 16), (3, 12, 12)]:
        styles[f"H{lvl}"] = ParagraphStyle(
            name=f"H{lvl}", fontSize=size, leading=size + 5,
            spaceBefore=before, spaceAfter=8, fontName="Helvetica-Bold",
            textColor=colors.HexColor("#17365D"),
        )
    styles["Body"] = ParagraphStyle(
        name="Body", fontSize=11, leading=17,
        alignment=TA_JUSTIFY, spaceAfter=10, fontName="Helvetica",
        textColor=colors.HexColor("#333333"),
    )
    styles["Bullet"] = ParagraphStyle(
        name="Bullet", parent=styles["Body"],
        leftIndent=20, firstLineIndent=-10, spaceAfter=6,
    )
    return styles

def _envolver_texto(canvas, texto, ancho_maximo, font_name, font_size):
    palabras = texto.split()
    lineas = []
    linea_actual = ""
    for palabra in palabras:
        prueba = linea_actual + " " + palabra if linea_actual else palabra
        if canvas.stringWidth(prueba, font_name, font_size) <= ancho_maximo:
            linea_actual = prueba
        else:
            if linea_actual:
                lineas.append(linea_actual)
            linea_actual = palabra
    if linea_actual:
        lineas.append(linea_actual)
    return lineas

def _dibujar_portada(canvas, doc, titulo, subtitulo, ruta_img):
    ancho_pagina, alto_pagina = A4
    if ruta_img and os.path.isfile(ruta_img):
        try:
            canvas.drawImage(str(ruta_img), 0, 0, width=ancho_pagina, height=alto_pagina, preserveAspectRatio=False, mask='auto')
        except Exception:
            canvas.setFillColor(colors.HexColor("#0A1526"))
            canvas.rect(0, 0, ancho_pagina, alto_pagina, fill=1, stroke=0)
    else:
        canvas.setFillColor(colors.HexColor("#0A1526"))
        canvas.rect(0, 0, ancho_pagina, alto_pagina, fill=1, stroke=0)

    try:
        canvas.saveState()
        canvas.setFillColorRGB(0.04, 0.08, 0.15, alpha=0.55)
        canvas.rect(0, 0, ancho_pagina, alto_pagina, fill=1, stroke=0)
        canvas.restoreState()
    except Exception:
        pass

    margen_lados = 4 * cm
    ancho_max_texto = ancho_pagina - (margen_lados * 2)

    canvas.setFont("Helvetica-Bold", 34)
    canvas.setFillColor(colors.HexColor("#FFFFFF"))
    lineas_titulo = _envolver_texto(canvas, titulo, ancho_max_texto, "Helvetica-Bold", 34)
    
    alto_titulo = len(lineas_titulo) * 40
    alto_subtitulo = 0
    if subtitulo:
        lineas_subtitulo = _envolver_texto(canvas, subtitulo, ancho_max_texto, "Helvetica", 16)
        alto_subtitulo = len(lineas_subtitulo) * 22 + 15
    else:
        lineas_subtitulo = []

    alto_total = alto_titulo + alto_subtitulo
    y_actual = (alto_pagina + alto_total) / 2

    for linea in lineas_titulo:
        y_actual -= 40
        canvas.drawCentredString(ancho_pagina / 2, y_actual, linea)

    if lineas_subtitulo:
        y_actual -= 15
        canvas.setFont("Helvetica", 16)
        canvas.setFillColor(colors.HexColor("#EAF0FA"))
        for linea in lineas_subtitulo:
            y_actual -= 22
            canvas.drawCentredString(ancho_pagina / 2, y_actual, linea)

    y_linea = y_actual - 30
    canvas.setStrokeColor(colors.HexColor("#2DD4BF"))
    canvas.setLineWidth(2)
    canvas.line(ancho_pagina * 0.30, y_linea, ancho_pagina * 0.70, y_linea)

    canvas.setFont("Helvetica", 10)
    canvas.setFillColor(colors.HexColor("#A3B3CD"))
    canvas.drawCentredString(ancho_pagina / 2, alto_pagina * 0.08, "Generado con NAVE.IA")

def _dibujar_pie(canvas, doc):
    ancho_pagina, _ = A4
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#999999"))
    canvas.drawString(2.5 * cm, 1.25 * cm, "NAVE.IA - Documento")
    canvas.drawRightString(ancho_pagina - 2.5 * cm, 1.25 * cm, f"Página {doc.page - 1}")
    canvas.restoreState()

def crear(titulo="Documento", subtitulo="", contenido_markdown="", autor=None, **kwargs):
    global _ultimo_archivo
    styles = _crear_styles()
    archivo = OUTPUT / f"{_slug(titulo, 50)}_{datetime.now():%Y%m%d_%H%M%S}.pdf"

    margen_h = 2.5 * cm
    margen_v = 2.5 * cm

    doc = SimpleDocTemplate(
        str(archivo), pagesize=A4,
        rightMargin=margen_h, leftMargin=margen_h,
        topMargin=margen_v, bottomMargin=margen_v,
        title=str(titulo), author=autor or "NAVE.IA",
    )

    story = [PageBreak()]

    buffer_parrafo = []
    in_code = False

    def flush():
        if buffer_parrafo:
            story.append(Paragraph(_inline_md(" ".join(buffer_parrafo)), styles["Body"]))
            buffer_parrafo.clear()

    for raw in (contenido_markdown or "").splitlines():
        line = raw.strip()
        if line.startswith("```"):
            flush()
            in_code = not in_code
            continue
        if not line:
            flush()
            continue
        if in_code:
            flush()
            story.append(Paragraph(f'<font face="Courier" color="#555555">{escape(line).replace(" ", "&nbsp;")}</font>', styles["Body"]))
            continue

        m = re.match(r"^(#{1,3})\s+(.+)", line)
        if m:
            flush()
            lvl = len(m.group(1))
            story.append(Paragraph(_inline_md(m.group(2)), styles[f"H{lvl}"]))
            continue

        if re.match(r"^[-*+]\s+", line):
            flush()
            story.append(Paragraph("&#8226; " + _inline_md(re.sub(r"^[-*+]\s+", "", line)), styles["Bullet"]))
            continue

        if re.match(r"^\d+[.)]\s+", line):
            flush()
            story.append(Paragraph(_inline_md(line), styles["Bullet"]))
            continue

        buffer_parrafo.append(line)

    flush()

    def on_first(canvas, doc_):
        _dibujar_portada(canvas, doc_, titulo, subtitulo, RUTA_IMAGEN)

    def on_later(canvas, doc_):
        _dibujar_pie(canvas, doc_)

    doc.build(story, onFirstPage=on_first, onLaterPages=on_later)
    _ultimo_archivo = str(archivo)
    print(f"[documento_chat] PDF creado con portada: {archivo}")
    return str(archivo)

def ultimo_archivo():
    return _ultimo_archivo