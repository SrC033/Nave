import http.server
import socketserver
import socket
import threading
import time
import os
import sys
import json
import glob
import traceback
import subprocess
import shutil
import urllib.request
import urllib.error
import re as _re
import io
import base64
from pathlib import Path

try:
    import webview
except ImportError:
    print("Falta pywebview. Instalalo con: pip install pywebview")
    sys.exit(1)

try:
    import psutil
    _PSUTIL_OK = True
except ImportError:
    psutil = None
    _PSUTIL_OK = False

try:
    from huggingface_hub import HfApi, hf_hub_download, list_models
    from tqdm.auto import tqdm
    _HF_API_OK = True
except ImportError:
    HfApi = None
    hf_hub_download = None
    list_models = None
    _HF_API_OK = False
    tqdm = None

try:
    import keyring
    _KEYRING_OK = True
except ImportError:
    keyring = None
    _KEYRING_OK = False

# --- LIBRERIAS PARA GENERAR ARCHIVOS EN MEMORIA (fallback) ---
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    _PDF_OK = True
except ImportError:
    _PDF_OK = False

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill
    _EXCEL_OK = True
except ImportError:
    _EXCEL_OK = False


PUERTO_PREFERIDO = 8000
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
PAGINA_INICIAL = "index.html"
TITULO = "NAVE.IA"
ANCHO = 1440
ALTO = 900
DEBUG = False

BASE_DIR = Path(__file__).resolve().parent
MODULOS_PY_DIR = BASE_DIR / "modulos_py"

# --- Rutas de los modulos principales ---
RUTA_IA = str(MODULOS_PY_DIR / "ia")
RUTA_RECURSOS = str(MODULOS_PY_DIR / "recurso")
RUTA_USUARIOS_PY = str(MODULOS_PY_DIR / "usuarios")
RUTA_DESCARGADOR = str(MODULOS_PY_DIR / "descargar_modelos")
ARCHIVO_DESCARGADOR = os.path.join(RUTA_DESCARGADOR, "Descargar_modelos.py")

# --- Rutas de los generadores de archivos ---
RUTA_DOCUMENTOS_CHAT = str(MODULOS_PY_DIR / "documentos_chat")
RUTA_EXCEL_CHAT      = str(MODULOS_PY_DIR / "excel_chat")
RUTA_HTML_CHAT       = str(MODULOS_PY_DIR / "html_chat")
RUTA_IMAGEN_CHAT     = str(MODULOS_PY_DIR / "imagen_chat")
RUTA_RUNNER          = str(MODULOS_PY_DIR / "runner")

USUARIO_ADMIN = "admin@coreteks.com"
MODELOS_DIR = BASE_DIR / "modelos"

RUTA_EXTRACTOR = str(MODULOS_PY_DIR / "extractor_archivos")
RUTA_HISTORIAL = str(MODULOS_PY_DIR / "historial_chat")

if RUTA_HISTORIAL not in sys.path:
    sys.path.insert(0, RUTA_HISTORIAL)

import historial_chat

# --- IMPORTAR EL MÓDULO DE CORREO ---
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
    
    
# --- AGREGAR LA RUTA DE MAIL AL SISTEMA ---
RUTA_MAIL = str(MODULOS_PY_DIR / "mail")
if RUTA_MAIL not in sys.path:
    sys.path.insert(0, RUTA_MAIL)

try:
    import mail
    _MAIL_OK = True
    print(f"[MAIL] Módulo cargado desde: {mail.__file__}")
except ImportError as e:
    print(f"No se pudo importar mail.py: {e}")
    mail = None
    _MAIL_OK = False

# --- IMPORTAR EL MÓDULO DE TAREAS ---
RUTA_TAREAS = str(MODULOS_PY_DIR / "tareas")
if RUTA_TAREAS not in sys.path:
    sys.path.insert(0, RUTA_TAREAS)

try:
    import tarea
    _TAREAS_OK = True
    print(f"[TAREAS] Módulo cargado desde: {tarea.__file__}")
except ImportError as e:
    print(f"No se pudo importar tarea.py: {e}")
    tarea = None
    _TAREAS_OK = False

# --- IMPORTAR EL MÓDULO DE PROYECTOS ---
RUTA_PROYECTOS = str(MODULOS_PY_DIR / "proyectos")
if RUTA_PROYECTOS not in sys.path:
    sys.path.insert(0, RUTA_PROYECTOS)

try:
    import proyecto
    _PROYECTOS_OK = True
    print(f"[PROYECTOS] Módulo cargado desde: {proyecto.__file__}")
except ImportError as e:
    print(f"No se pudo importar proyecto.py: {e}")
    proyecto = None
    _PROYECTOS_OK = False

# --- IMPORTAR EL MÓDULO DE MIS ARCHIVOS ---
RUTA_ARCHIVOS = str(MODULOS_PY_DIR / "mis_archivos")
if RUTA_ARCHIVOS not in sys.path:
    sys.path.insert(0, RUTA_ARCHIVOS)

try:
    import mis_archivos
    _ARCHIVOS_OK = True
    print(f"[ARCHIVOS] Módulo cargado desde: {mis_archivos.__file__}")
except ImportError as e:
    print(f"No se pudo importar mis_archivos.py: {e}")
    mis_archivos = None
    _ARCHIVOS_OK = False

if RUTA_IA not in sys.path:
    sys.path.insert(0, RUTA_IA)

if RUTA_EXTRACTOR not in sys.path:
    sys.path.insert(0, RUTA_EXTRACTOR)

# --- sys.path de los generadores (para que el runner pueda importarlos) ---
for _ruta_gen in (RUTA_DOCUMENTOS_CHAT, RUTA_EXCEL_CHAT, RUTA_HTML_CHAT, RUTA_IMAGEN_CHAT, RUTA_RUNNER):
    if _ruta_gen not in sys.path:
        sys.path.insert(0, _ruta_gen)


def _slug_usuario(usuario_id):
    s = (usuario_id or USUARIO_ADMIN).strip().lower()
    s = _re.sub(r'[^a-z0-9@._\-]+', '_', s)
    return s or USUARIO_ADMIN

def dir_usuario(usuario_id):
    return MODELOS_DIR / _slug_usuario(usuario_id)

def descargas_dir(uid):
    return dir_usuario(uid) / "descargas_modelos"

def _sanitizar_nombre_modelo(nombre):
    nombre = str(nombre or "modelo").strip()
    nombre = _re.sub(r'[<>:"/\\|?*]+', '_', nombre)
    nombre = _re.sub(r'\s+', '_', nombre)
    return nombre.strip("._ ") or "modelo"

def _guardar_modelo_local_catalogo(usuario_id, modelo):
    uid = _slug_usuario(usuario_id)
    asegurar_dirs_usuario(uid)
    if not isinstance(modelo, dict):
        return False
    mid = str(modelo.get("id") or "").strip()
    if not mid:
        return False
    data = dict(modelo)
    data["id"] = mid
    data["nombre"] = str(data.get("nombre") or mid)
    if not data.get("archivo"):
        data["archivo"] = (str(data.get("hf_file") or "").replace("\\", "/").split("/")[-1]
                           or f"{_sanitizar_nombre_modelo(mid)}.gguf")
    ruta = url_modelos_dir(uid) / f"{_sanitizar_nombre_modelo(mid)}.json"
    try:
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return True
    except Exception as e:
        print(f"[MODELO] No se pudo guardar catalogo de {uid}: {e}")
        return False

def modelo_activo_local_file(uid):
    return descargas_dir(uid) / "modelo_activo_local.json"

def guardar_modelo_activo_local(usuario_id, modelo_id):
    try:
        ruta = modelo_activo_local_file(usuario_id)
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(json.dumps({"modelo_id": modelo_id}, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        print(f"No se pudo guardar modelo activo local ({usuario_id}): {e}")

def cargar_modelo_activo_local(usuario_id):
    ruta = modelo_activo_local_file(usuario_id)
    if not ruta.exists():
        return None
    try:
        data = json.loads(ruta.read_text(encoding="utf-8"))
        return data.get("modelo_id")
    except Exception:
        return None

def url_modelos_dir(uid):
    return descargas_dir(uid) / "url_modelos"
def configs_modelos_dir(uid):
    return descargas_dir(uid) / "configs_modelos"
def modelo_activo_file(uid):
    return descargas_dir(uid) / "modelo_activo.json"
def carpeta_modelo_principal(uid):
    return dir_usuario(uid) / "modelo_principal"
def apis_dir(uid):
    return dir_usuario(uid) / "apis"
def proveedores_json(uid):
    return apis_dir(uid) / "proveedores.json"
def keys_dir(uid):
    return apis_dir(uid) / "keys"
def apis_modelos_dir(uid):
    return apis_dir(uid) / "descargas_api"
def api_activa_file(uid):
    return apis_dir(uid) / "api_activa.json"
def prom_dir(uid):
    return dir_usuario(uid) / "prom"
def prom_locales_dir(uid):
    return prom_dir(uid) / "locales"
def prom_api_dir(uid):
    return prom_dir(uid) / "api"
def usuarios_data_dir(uid):
    return dir_usuario(uid) / "usuarios"

CONFIGS_MODELOS_DIR = configs_modelos_dir(USUARIO_ADMIN)
PROM_LOCALES_DIR = prom_locales_dir(USUARIO_ADMIN)
PROM_API_DIR = prom_api_dir(USUARIO_ADMIN)
APIS_DIR = apis_dir(USUARIO_ADMIN)
KEYS_DIR = keys_dir(USUARIO_ADMIN)
APIS_MODELOS_DIR = apis_modelos_dir(USUARIO_ADMIN)
URL_MODELOS_DIR = url_modelos_dir(USUARIO_ADMIN)
CARPETA_MODELO_PRINCIPAL = carpeta_modelo_principal(USUARIO_ADMIN)
PROVEEDORES_JSON = proveedores_json(USUARIO_ADMIN)
CONFIG_API_ACTIVA = api_activa_file(USUARIO_ADMIN)

def asegurar_dirs_usuario(usuario_id):
    uid = _slug_usuario(usuario_id)
    carpetas = [
        dir_usuario(uid),
        descargas_dir(uid),
        url_modelos_dir(uid),
        configs_modelos_dir(uid),
        carpeta_modelo_principal(uid),
        apis_dir(uid),
        keys_dir(uid),
        apis_modelos_dir(uid),
        prom_dir(uid),
        prom_locales_dir(uid),
        prom_api_dir(uid),
    ]
    if uid == USUARIO_ADMIN:
        carpetas.append(usuarios_data_dir(uid))
    for d in carpetas:
        d.mkdir(parents=True, exist_ok=True)

    if uid != _slug_usuario(USUARIO_ADMIN):
        carp_usuario = carpeta_modelo_principal(uid)
        if not list(carp_usuario.glob("**/*.gguf")):
            carp_admin = carpeta_modelo_principal(USUARIO_ADMIN)
            if carp_admin.exists():
                ggufs_admin = list(carp_admin.glob("**/*.gguf"))
                if ggufs_admin:
                    print(f"[MODELO PRINCIPAL] Copiando modelo para el nuevo usuario: {uid}")
                    for gguf in ggufs_admin:
                        try:
                            destino = carp_usuario / gguf.name
                            shutil.copy2(gguf, destino)
                            print(f"[MODELO PRINCIPAL] Copiado exitoso: {gguf.name} -> {destino}")
                        except Exception as e:
                            print(f"[ERROR] No se pudo copiar el modelo principal a {uid}: {e}")

def _migrar_a_carpeta_admin():
    admin_dir = dir_usuario(USUARIO_ADMIN)
    if admin_dir.exists() and any(admin_dir.iterdir()):
        return

    print("[MIGRACION] Moviendo estructura vieja a", admin_dir)
    admin_dir.mkdir(parents=True, exist_ok=True)

    legacy = {
        BASE_DIR / "modelos" / "descargas_modelos": descargas_dir(USUARIO_ADMIN),
        BASE_DIR / "modelos" / "modelo_principal": carpeta_modelo_principal(USUARIO_ADMIN),
        BASE_DIR / "modelos" / "apis": apis_dir(USUARIO_ADMIN),
        BASE_DIR / "modelos" / "prom": prom_dir(USUARIO_ADMIN),
        BASE_DIR / "modelos" / "configs_modelos": configs_modelos_dir(USUARIO_ADMIN),
        BASE_DIR / "modelos" / "usuarios": usuarios_data_dir(USUARIO_ADMIN),
    }
    for viejo, nuevo in legacy.items():
        if viejo.exists() and not nuevo.exists():
            try:
                nuevo.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(viejo), str(nuevo))
                print(f"[MIGRACION] {viejo.name} -> {nuevo}")
            except Exception as e:
                print(f"[MIGRACION] Error moviendo {viejo.name}: {e}")

_migrar_a_carpeta_admin()
asegurar_dirs_usuario(USUARIO_ADMIN)
os.environ["CORETEKS_USUARIOS_DIR"] = str(usuarios_data_dir(USUARIO_ADMIN))

if RUTA_RECURSOS not in sys.path:
    sys.path.insert(0, RUTA_RECURSOS)
if RUTA_USUARIOS_PY not in sys.path:
    sys.path.insert(0, RUTA_USUARIOS_PY)

try:
    import recurso
    _RECURSO_OK = True
except ImportError as e:
    print(f"No se pudo importar recurso.py desde {RUTA_RECURSOS}: {e}")
    recurso = None
    _RECURSO_OK = False

try:
    import usuarios
    _USUARIOS_OK = True
except ImportError as e:
    print(f"No se pudo importar usuarios.py desde {RUTA_USUARIOS_PY}: {e}")
    usuarios = None
    _USUARIOS_OK = False

_estado_usuarios = {}
_estado_lock = threading.Lock()

# CANDADOS INDEPENDIENTES POR MODELO
_locks_modelos = {}
_locks_modelos_lock = threading.Lock()

# Banderas de cancelación de descargas
_cancelaciones = {}
_cancelaciones_lock = threading.Lock()

def _solicitar_cancelacion(modelo_id):
    with _cancelaciones_lock:
        _cancelaciones[modelo_id] = True

def _esta_cancelado(modelo_id):
    with _cancelaciones_lock:
        return _cancelaciones.get(modelo_id, False)

def _limpiar_cancelacion(modelo_id):
    with _cancelaciones_lock:
        _cancelaciones.pop(modelo_id, None)

def _obtener_lock_modelo(modelo_id):
    with _locks_modelos_lock:
        if modelo_id not in _locks_modelos:
            _locks_modelos[modelo_id] = threading.Lock()
        return _locks_modelos[modelo_id]

def _estado_vacio(uid=None):
    return {
        "usuario_id": uid,
        "api_activa": None,
        "params": {
            "temperature": 0.3, "top_p": 0.9, "top_k": 40,
            "max_tokens": 8192, "max_input_tokens": 0,
            "n_threads": 6, "n_ctx": 16384, "n_gpu_layers": 0,
            "modo": "cpu",
        },
        "sesion": None,
        "sesiones_por_modelo": {},
        "modelo_activo": None,
        "metricas": {
            "tokens_entrada": 0, "tokens_salida": 0, "tokens_total": 0,
            "velocidad_tok_s": 0.0, "tiempo_respuesta_s": 0.0,
            "timestamp": 0, "modelo_id": None, "turnos": 0,
        },
        "metricas_por_modelo": {},
        "descargas": {},
    }

def obtener_estado(usuario_id):
    uid = _slug_usuario(usuario_id)
    with _estado_lock:
        if uid not in _estado_usuarios:
            _estado_usuarios[uid] = _estado_vacio(uid)
        return _estado_usuarios[uid]

def detectar_hardware():
    info = {
        "cpu_modelo": "Desconocido", "cpu_nucleos_fisicos": 0,
        "cpu_nucleos_logicos": 0, "cpu_freq_mhz": 0, "cpu_uso_pct": 0,
        "ram_total_gb": 0, "ram_disponible_gb": 0, "ram_uso_pct": 0,
        "gpu": None, "disco_libre_gb": 0, "disco_total_gb": 0,
        "disco_uso_pct": 0, "uptime_h": 0,
    }
    if _PSUTIL_OK:
        try:
            info["cpu_nucleos_fisicos"] = psutil.cpu_count(logical=False) or 0
            info["cpu_nucleos_logicos"] = psutil.cpu_count(logical=True) or 0
            freq = psutil.cpu_freq()
            if freq:
                info["cpu_freq_mhz"] = int(freq.max or freq.current or 0)
            info["cpu_uso_pct"] = round(psutil.cpu_percent(interval=None), 1)
            mem = psutil.virtual_memory()
            info["ram_total_gb"] = round(mem.total / (1024 ** 3), 1)
            info["ram_disponible_gb"] = round(mem.available / (1024 ** 3), 1)
            info["ram_uso_pct"] = round(mem.percent, 1)
            disk = psutil.disk_usage(str(BASE_DIR))
            info["disco_libre_gb"] = round(disk.free / (1024 ** 3), 1)
            info["disco_total_gb"] = round(disk.total / (1024 ** 3), 1)
            info["disco_uso_pct"] = round(disk.percent, 1)
            info["uptime_h"] = round((time.time() - psutil.boot_time()) / 3600, 1)
        except Exception as e:
            print(f"Error detectando hardware: {e}")
    if sys.platform == "win32":
        try:
            import platform
            info["cpu_modelo"] = platform.processor() or "Desconocido"
        except Exception:
            pass
        try:
            out = subprocess.check_output(
                ["wmic", "path", "win32_VideoController", "get", "name"],
                text=True, timeout=5, stderr=subprocess.DEVNULL
            )
            gpus = [l.strip() for l in out.splitlines() if l.strip() and l.strip().lower() != "name"]
            if gpus:
                info["gpu"] = gpus[0]
        except Exception:
            pass
    return info

def evaluar_compatibilidad(modelo, hw):
    if not hw:
        return {"apto": True, "motivo": "No se pudo detectar el hardware", "nivel": "ok"}
    ram_min = float(modelo.get("ram_min_gb", 0) or 0)
    vram_min = float(modelo.get("vram_min_gb", 0) or 0)
    tamano = float(modelo.get("tamano_gb", 0) or 0)
    ram_total = hw.get("ram_total_gb", 0)
    ram_libre = hw.get("ram_disponible_gb", 0)
    disco_libre = hw.get("disco_libre_gb", 0)
    tiene_gpu = bool(hw.get("gpu"))
    if vram_min > 0 and not tiene_gpu:
        if ram_total < ram_min:
            return {"apto": False,
                    "motivo": f"Requiere {ram_min} GB de RAM o GPU con {vram_min} GB VRAM.",
                    "nivel": "no"}
    if ram_min > 0:
        if ram_total < ram_min:
            return {"apto": False,
                    "motivo": f"Requiere {ram_min} GB de RAM. Este equipo tiene {ram_total} GB.",
                    "nivel": "no"}
        if ram_libre < ram_min * 0.6:
            return {"apto": True,
                    "motivo": f"RAM justa: {ram_libre} GB libres de {ram_min} GB recomendados.",
                    "nivel": "ajustado"}
    if tamano > 0 and disco_libre < tamano * 1.2:
        return {"apto": False, "motivo": f"Necesita {tamano} GB libres en disco.", "nivel": "no"}
    return {"apto": True,
            "motivo": f"Compatible. RAM: {ram_total} GB, Disco: {disco_libre} GB.",
            "nivel": "ok"}

def _leer_contexto_modelo(nombre):
    s = (nombre or "").lower()
    if "qwen" in s:
        if "0.5b" in s or "1.5b" in s or "1b" in s: return 32768, 4096
        if "3b" in s or "4b" in s: return 32768, 4096
        if "7b" in s: return 32768, 8192
        if "14b" in s or "32b" in s: return 32768, 8192
        if "72b" in s: return 131072, 8192
        return 32768, 8192
    if "llama-3" in s or "llama3" in s:
        if "1b" in s or "3b" in s: return 131072, 8192
        if "8b" in s: return 131072, 8192
        if "70b" in s: return 131072, 32768
        return 131072, 8192
    if "llama-2" in s or "llama2" in s: return 4096, 2048
    if "mixtral" in s: return 32768, 8192
    if "mistral" in s: return 32768, 8192
    if "gemma" in s: return 8192, 4096
    if "phi-3" in s or "phi3" in s: return 128000, 4096
    if "phi-" in s: return 4096, 2048
    if "deepseek" in s: return 65536, 8192
    if "gpt-oss" in s or "gpt_oss" in s: return 131072, 32768
    return 4096, 2048

def _ruta_config_modelo(uid, modelo_id):
    d = configs_modelos_dir(uid)
    d.mkdir(parents=True, exist_ok=True)
    safe = _re.sub(r'[^a-zA-Z0-9_\-]+', '_', modelo_id or 'default')
    return d / f"{safe}.json"

def guardar_config_modelo(uid, modelo_id, params):
    if not modelo_id: return False
    try:
        ruta = _ruta_config_modelo(uid, modelo_id)
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump({"modelo_id": modelo_id, "params": params,
                       "actualizado": time.time()}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error guardando config ({uid}/{modelo_id}): {e}")
        return False

def cargar_config_modelo(uid, modelo_id):
    if not modelo_id: return None
    ruta = _ruta_config_modelo(uid, modelo_id)
    if not ruta.exists(): return None
    try:
        return json.loads(ruta.read_text(encoding="utf-8")).get("params") or None
    except Exception as e:
        print(f"Error leyendo config ({uid}/{modelo_id}): {e}")
        return None

def _params_para_modelo(uid, modelo_id):
    base = {
        "temperature": 0.3, "top_p": 0.9, "top_k": 40,
        "max_tokens": 8192, "n_threads": 6, "n_ctx": 16384,
        "n_gpu_layers": 0, "modo": "cpu",
    }
    guardados = cargar_config_modelo(uid, modelo_id)
    if guardados:
        base.update(guardados)
    return base

def _slug_prom(modelo_id):
    return _re.sub(r'[^a-zA-Z0-9_\-]+', '_', modelo_id or 'default')

def _ruta_prom_local(uid, mid):
    d = prom_locales_dir(uid); d.mkdir(parents=True, exist_ok=True)
    return d / f"{_slug_prom(mid)}.txt"

def _ruta_prom_api(uid, mid):
    d = prom_api_dir(uid); d.mkdir(parents=True, exist_ok=True)
    return d / f"{_slug_prom(mid)}.txt"

def _ruta_prom(uid, mid, es_api=False):
    return _ruta_prom_api(uid, mid) if es_api else _ruta_prom_local(uid, mid)

def guardar_prompt(uid, modelo_id, prompt, es_api=False):
    if not modelo_id: return False
    try:
        _ruta_prom(uid, modelo_id, es_api).write_text(prompt or "", encoding="utf-8")
        return True
    except Exception as e:
        print(f"Error guardando prompt ({uid}/{modelo_id}): {e}")
        return False

def cargar_prompt(uid, modelo_id, es_api=False):
    if not modelo_id: return ""
    ruta = _ruta_prom(uid, modelo_id, es_api)
    if not ruta.exists(): return ""
    try:
        return ruta.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error leyendo prompt ({uid}/{modelo_id}): {e}")
        return ""

def eliminar_prompt(uid, modelo_id, es_api=False):
    if not modelo_id: return False
    ruta = _ruta_prom(uid, modelo_id, es_api)
    try:
        if ruta.exists(): ruta.unlink(); return True
    except Exception as e:
        print(f"Error eliminando prompt ({uid}/{modelo_id}): {e}")
    return False

def _prompt_activo(usuario_id):
    estado = obtener_estado(usuario_id)
    if estado["api_activa"]:
        return cargar_prompt(usuario_id, estado["api_activa"].get("id"), es_api=True)
    return ""

def _leer_key_guardada(usuario_id, proveedor):
    ruta = keys_dir(usuario_id) / f"{proveedor}.key"
    if ruta.exists():
        try:
            c = ruta.read_text(encoding="utf-8").strip()
            if c: return c
        except Exception:
            pass
    if _KEYRING_OK:
        try:
            v = keyring.get_password(f"coreteks_{_slug_usuario(usuario_id)}_{proveedor}", "default")
            if v: return v
        except Exception:
            pass
    return None

def _guardar_key(usuario_id, proveedor, api_key):
    ok = False
    try:
        d = keys_dir(usuario_id); d.mkdir(parents=True, exist_ok=True)
        (d / f"{proveedor}.key").write_text(api_key, encoding="utf-8")
        ok = True
    except Exception:
        pass
    if _KEYRING_OK:
        try:
            keyring.set_password(f"coreteks_{_slug_usuario(usuario_id)}_{proveedor}", "default", api_key)
        except Exception:
            pass
    return ok

def _eliminar_key(usuario_id, proveedor):
    ok = False
    ruta = keys_dir(usuario_id) / f"{proveedor}.key"
    try:
        if ruta.exists(): ruta.unlink(); ok = True
    except Exception:
        pass
    if _KEYRING_OK:
        try:
            keyring.delete_password(f"coreteks_{_slug_usuario(usuario_id)}_{proveedor}", "default")
        except Exception:
            pass
    return ok

def _slug_api(txt):
    return _re.sub(r'[^a-z0-9]+', '-', (txt or '').lower()).strip('-') or 'modelo-api'

def cargar_proveedores(usuario_id):
    ruta = proveedores_json(usuario_id)
    if not ruta.exists():
        return []
    try:
        return json.loads(ruta.read_text(encoding="utf-8")).get("proveedores", [])
    except Exception as e:
        print(f"Error leyendo proveedores.json ({usuario_id}): {e}")
        return []

def cargar_modelos_api_catalogo(usuario_id):
    out = []
    d = apis_modelos_dir(usuario_id)
    if not d.exists():
        return out
    estado = obtener_estado(usuario_id)
    for archivo in sorted(d.glob("*.json")):
        try:
            data = json.loads(archivo.read_text(encoding="utf-8"))
            data["_archivo"] = archivo.name
            data["es_api"] = True
            data["descargado"] = True
            data["apto_hardware"] = True
            data["nivel_compat"] = "ok"
            data["motivo_compat"] = "No consume RAM local."
            data["activo"] = bool(estado["api_activa"] and estado["api_activa"].get("id") == data["id"])
            data["_api"] = {"proveedor": data.get("proveedor"), "modelo": data.get("modelo")}
            if "contexto_tokens" not in data:
                ctx, out_tok = _leer_contexto_modelo(data.get("modelo", data.get("nombre", "")))
                data["contexto_tokens"] = ctx
                data["max_output_tokens"] = out_tok
                data["max_input_tokens"] = max(1, ctx - out_tok)
            data["params_guardados"] = _params_para_modelo(usuario_id, data["id"])
            data["prompt_guardado"] = cargar_prompt(usuario_id, data["id"], es_api=True)
            data["tiene_prompt"] = bool(data["prompt_guardado"].strip())
            out.append(data)
        except Exception as e:
            print(f"Error leyendo {archivo.name} ({usuario_id}): {e}")
    return out

def buscar_modelo_api_por_id(usuario_id, modelo_id):
    if not modelo_id:
        return None
    d = apis_modelos_dir(usuario_id)
    if not d.exists():
        return None
    
    archivo = d / f"{modelo_id}.json"
    if archivo.exists():
        try:
            return json.loads(archivo.read_text(encoding="utf-8"))
        except Exception:
            pass
            
    for archivo_json in d.glob("*.json"):
        try:
            data = json.loads(archivo_json.read_text(encoding="utf-8"))
            if data.get("id") == modelo_id or data.get("modelo") == modelo_id or _slug_api(data.get("proveedor") + "-" + data.get("modelo")) == modelo_id:
                return data
        except Exception:
            pass
    return None

def guardar_modelo_api(usuario_id, data):
    d = apis_modelos_dir(usuario_id); d.mkdir(parents=True, exist_ok=True)
    (d / f"{data['id']}.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )

def _es_modelo_chat(modelo_id):
    s = (modelo_id or "").lower()
    excluir = ["whisper", "prompt-guard", "guard", "embedding", "embed",
               "rerank", "classif", "moderation", "speech", "tts", "stt",
               "dall-e", "stable-diffusion", "clip", "vision-only"]
    return not any(e in s for e in excluir)

def validar_key_proveedor(usuario_id, proveedor_id, api_key):
    provs = cargar_proveedores(usuario_id)
    prov = next((p for p in provs if p["id"] == proveedor_id), None)
    if not prov:
        return {"ok": False, "error": f"Proveedor '{proveedor_id}' no existe"}

    if not api_key:
        api_key = _leer_key_guardada(usuario_id, proveedor_id)
        if not api_key:
            return {"ok": False, "error": "No hay API key guardada"}

    base = prov.get("base", "").rstrip("/")
    if not base:
        return {"ok": False, "error": "El proveedor no tiene base URL"}

    url = base + "/models"
    headers = {"Authorization": "Bearer " + api_key, "Accept": "application/json",
               "User-Agent": "CORETEKS/1.0"}
    if proveedor_id.startswith("gemini"):
        url = base + "/models?key=" + api_key
        headers = {"Accept": "application/json", "User-Agent": "CORETEKS/1.0"}
    if proveedor_id == "anthropic":
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01",
                   "Accept": "application/json"}
    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                try: data = json.loads(resp.read().decode("utf-8"))
                except Exception: data = {}
                modelos = data.get("data", data.get("models", []))
                return {"ok": True, "modelos": len(modelos) if isinstance(modelos, list) else 0}
            return {"ok": False, "error": f"HTTP {resp.status}"}
    except urllib.error.HTTPError as e:
        try: cuerpo = e.read().decode("utf-8", errors="replace")[:200]
        except Exception: cuerpo = str(e.reason)
        return {"ok": False, "error": f"HTTP {e.code}: {cuerpo}"}
    except urllib.error.URLError as e:
        return {"ok": False, "error": f"Error de conexion: {e.reason}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def estado_proveedores(usuario_id):
    estado = {}
    d = apis_modelos_dir(usuario_id)
    for p in cargar_proveedores(usuario_id):
        key = _leer_key_guardada(usuario_id, p["id"])
        tiene_key = key is not None and len(key) > 0
        n_modelos = 0
        if d.exists():
            for arch in d.glob("*.json"):
                try:
                    dd = json.loads(arch.read_text(encoding="utf-8"))
                    if dd.get("proveedor") == p["id"]:
                        n_modelos += 1
                except Exception:
                    pass
        estado[p["id"]] = {
            "conectado": tiene_key, "validado": tiene_key,
            "modelos_guardados": n_modelos,
            "key_preview": (key[:8] + "..." if key and len(key) > 8 else None),
        }
    return estado

def listar_modelos_api(usuario_id, proveedor_id):
    provs = cargar_proveedores(usuario_id)
    prov = next((p for p in provs if p["id"] == proveedor_id), None)
    if not prov:
        return {"ok": False, "error": "Proveedor no existe"}
    api_key = _leer_key_guardada(usuario_id, proveedor_id)
    if not api_key:
        return {"ok": False, "error": "No hay API key guardada"}

    base = prov.get("base", "").rstrip("/")
    url = base + "/models"
    headers = {"Authorization": "Bearer " + api_key, "Accept": "application/json",
               "User-Agent": "CORETEKS/1.0"}
    if proveedor_id.startswith("gemini"):
        url = base + "/models?key=" + api_key
        headers = {"Accept": "application/json", "User-Agent": "CORETEKS/1.0"}
    if proveedor_id == "anthropic":
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01",
                   "Accept": "application/json"}
    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status != 200:
                return {"ok": False, "error": f"HTTP {resp.status}"}
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try: cuerpo = e.read().decode("utf-8", errors="replace")[:200]
        except Exception: cuerpo = str(e.reason)
        return {"ok": False, "error": f"HTTP {e.code}: {cuerpo}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

    lista = []
    for m in data.get("data", data.get("models", [])):
        if isinstance(m, dict):
            mid = m.get("id") or m.get("name", "")
            if mid:
                ctx, out = _leer_contexto_modelo(mid)
                lista.append({
                    "id": mid,
                    "nombre": mid.split("/")[-1] if "/" in mid else mid,
                    "es_chat": _es_modelo_chat(mid),
                    "contexto_tokens": ctx, "max_output_tokens": out,
                    "max_input_tokens": max(1, ctx - out),
                })
    return {"ok": True, "modelos": lista}

def guardar_api_activa(usuario_id):
    estado = obtener_estado(usuario_id)
    d = apis_dir(usuario_id); d.mkdir(parents=True, exist_ok=True)
    try:
        api_activa_file(usuario_id).write_text(
            json.dumps(estado["api_activa"] or {}, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
    except Exception as e:
        print(f"No se pudo guardar API activa ({usuario_id}): {e}")

def cargar_api_activa(usuario_id):
    estado = obtener_estado(usuario_id)
    ruta = api_activa_file(usuario_id)
    if not ruta.exists():
        return
    try:
        data = json.loads(ruta.read_text(encoding="utf-8"))
        if data.get("id"):
            estado["api_activa"] = data
            if data.get("contexto_tokens"):
                estado["params"]["n_ctx"] = data["contexto_tokens"]
            if data.get("max_output_tokens"):
                estado["params"]["max_tokens"] = data["max_output_tokens"]
    except Exception:
        pass

def restaurar_modelo_local_activo(usuario_id):
    estado = obtener_estado(usuario_id)
    if estado.get("api_activa"):
        return
    mid = cargar_modelo_activo_local(usuario_id)
    if not mid:
        return
    
    modelo = buscar_modelo_por_id(usuario_id, mid)
    if modelo and modelo.get("descargado"):
        print(f"[RESTAURAR] Cargando modelo local previo para {usuario_id}: {mid}")
        obtener_ia_para_usuario(usuario_id, modelo)

def cargar_modelos_catalogo(usuario_id):
    hw = detectar_hardware()
    modelos = []
    estado = obtener_estado(usuario_id)
    ids_registrados = set()
    
    uid = _slug_usuario(usuario_id)

    d_url = url_modelos_dir(uid)
    if not d_url.exists():
        print(f"No existe la carpeta: {d_url}")
    else:
        archivos = sorted(d_url.glob("*.json"))
        print(f"{len(archivos)} archivos .json en {d_url}")
        for archivo in archivos:
            try:
                data = json.loads(archivo.read_text(encoding="utf-8"))
                data["_archivo"] = archivo.name
                nombre_carpeta = _sanitizar_nombre_modelo(data.get("nombre", data["id"]))
                carpeta = descargas_dir(uid) / nombre_carpeta
                archivo_nombre = data.get("archivo") or \
                    (data.get("hf_file", "").split("/")[-1]) or f"{data['id']}.gguf"
                archivo_bin = carpeta / Path(archivo_nombre).name

                data["descargado"] = archivo_bin.exists()
                data["carpeta"] = str(carpeta)
                data["ruta_modelo"] = str(archivo_bin) if archivo_bin.exists() else None
                data["activo"] = bool(
                    (estado["modelo_activo"] or {}).get("id") == data["id"] or
                    (estado["api_activa"] or {}).get("id") == data["id"]
                )

                compat = evaluar_compatibilidad(data, hw)
                data["apto_hardware"] = compat["apto"]
                data["motivo_compat"] = compat["motivo"]
                data["nivel_compat"] = compat["nivel"]

                if "contexto_tokens" not in data:
                    ctx, out = _leer_contexto_modelo(data.get("nombre", data["id"]))
                    data["contexto_tokens"] = ctx
                    data["max_output_tokens"] = out
                    data["max_input_tokens"] = max(1, ctx - out)

                data["params_guardados"] = _params_para_modelo(uid, data["id"])
                data["prompt_guardado"] = cargar_prompt(uid, data["id"], es_api=False)
                data["tiene_prompt"] = bool(data["prompt_guardado"].strip())
                modelos.append(data)
                ids_registrados.add(data["id"])
            except Exception as e:
                print(f"Error leyendo {archivo.name}: {e}")

    d_descargas = descargas_dir(uid)
    if d_descargas.exists():
        ggufs_fisicos = sorted(glob.glob(str(d_descargas / "**" / "*.gguf"), recursive=True))
        for g_path in ggufs_fisicos:
            if "mmproj" in os.path.basename(g_path).lower():
                continue
            if str(carpeta_modelo_principal(uid)) in g_path:
                continue
            
            g_file = Path(g_path)
            mid = g_file.stem
            
            if mid in ids_registrados:
                continue
                
            nombre_modelo = g_file.name
            ctx, out = _leer_contexto_modelo(nombre_modelo)
            tamano_gb = round(g_file.stat().st_size / (1024 ** 3), 2) if g_file.exists() else 0
            
            entry = {
                "id": mid,
                "nombre": g_file.stem.replace("_", " ").title(),
                "descripcion": "Modelo local detectado en disco.",
                "archivo": nombre_modelo,
                "ruta_modelo": str(g_file),
                "descargado": True,
                "es_principal": False,
                "familia": "Local",
                "contexto_tokens": ctx,
                "max_output_tokens": out,
                "max_input_tokens": max(1, ctx - out),
                "tamano_gb": tamano_gb,
                "ram_min_gb": 0, "vram_min_gb": 0,
                "activo": bool((estado["modelo_activo"] or {}).get("id") == mid),
            }
            compat = evaluar_compatibilidad(entry, hw)
            entry["apto_hardware"] = compat["apto"]
            entry["motivo_compat"] = compat["motivo"]
            entry["nivel_compat"] = compat["nivel"]
            entry["params_guardados"] = _params_para_modelo(uid, mid)
            entry["prompt_guardado"] = cargar_prompt(uid, mid, es_api=False)
            entry["tiene_prompt"] = bool(entry["prompt_guardado"].strip())
            
            _guardar_modelo_local_catalogo(uid, entry)
            
            modelos.append(entry)
            ids_registrados.add(mid)

    carp_principal = carpeta_modelo_principal(uid)
    if carp_principal.exists():
        ggufs = sorted(glob.glob(str(carp_principal / "**" / "*.gguf"), recursive=True))
        ggufs = [g for g in ggufs if "mmproj" not in os.path.basename(g).lower()]
        if ggufs:
            prioridad = [g for g in ggufs if any(t in os.path.basename(g).lower() for t in ("qwen2.5-vl", "qwen2-vl", "qwen2vl"))]
            principal_path = prioridad[0] if prioridad else ggufs[0]
            nombre_modelo = os.path.basename(principal_path)
            ctx, out = _leer_contexto_modelo(nombre_modelo)
            principal_entry = {
                "id": "__principal__",
                "nombre": "Modelo principal",
                "descripcion": "Modelo por defecto del sistema.",
                "archivo": nombre_modelo,
                "ruta_modelo": principal_path,
                "descargado": True,
                "es_principal": True,
                "familia": "Principal",
                "licencia": "", "contexto": "",
                "contexto_tokens": ctx,
                "max_output_tokens": out,
                "max_input_tokens": max(1, ctx - out),
                "tamano_gb": round(os.path.getsize(principal_path) / (1024 ** 3), 2)
                    if os.path.exists(principal_path) else 0,
                "ram_min_gb": 0, "vram_min_gb": 0,
                "activo": bool((estado["modelo_activo"] or {}).get("id") == "__principal__"),
            }
            compat = evaluar_compatibilidad(principal_entry, hw)
            principal_entry["apto_hardware"] = compat["apto"]
            principal_entry["motivo_compat"] = compat["motivo"]
            principal_entry["nivel_compat"] = compat["nivel"]
            principal_entry["params_guardados"] = _params_para_modelo(uid, "__principal__")
            principal_entry["prompt_guardado"] = cargar_prompt(uid, "__principal__", es_api=False)
            principal_entry["tiene_prompt"] = bool(principal_entry["prompt_guardado"].strip())
            modelos.insert(0, principal_entry)

    return modelos


def buscar_modelo_por_id(usuario_id, modelo_id):
    for m in cargar_modelos_catalogo(usuario_id):
        if m["id"] == modelo_id:
            return m
            
    if _slug_usuario(usuario_id) != _slug_usuario(USUARIO_ADMIN):
        for m in cargar_modelos_catalogo(USUARIO_ADMIN):
            if m["id"] == modelo_id:
                try:
                    _guardar_modelo_local_catalogo(usuario_id, m)
                except Exception:
                    pass
                return m
                
    return None

def cargar_modulo_ia():
    print("Iniciando carga del modulo IA")
    print(f"Ruta configurada: {RUTA_IA}")
    if not os.path.isdir(RUTA_IA):
        print(f"Ruta IA no encontrada: {RUTA_IA}")
        return False
    if RUTA_IA not in sys.path:
        sys.path.insert(0, RUTA_IA)
    try:
        import ia as modulo_ia
        print(f"Modulo importado desde: {modulo_ia.__file__}")
    except Exception as e:
        print(f"No se pudo importar ia.py: {e}")
        traceback.print_exc()
        return False
    print("Motor IA listo.")
    return True

def obtener_ia_para_usuario(usuario_id, modelo_info):
    estado = obtener_estado(usuario_id)
    mid = modelo_info["id"]

    with _estado_lock:
        if mid in estado["sesiones_por_modelo"]:
            return estado["sesiones_por_modelo"][mid]

    print(f"SESION: Cargando IA para '{usuario_id}' (Modelo: {mid})")
    try:
        if not os.path.isdir(RUTA_IA):
            raise FileNotFoundError(f"No se encontro el modulo IA: {os.path.join(RUTA_IA, 'ia.py')}")
        if RUTA_IA not in sys.path:
            sys.path.insert(0, RUTA_IA)
        import ia as modulo_ia
        nueva = modulo_ia.IA(
            tipo_usuario="estandar",
            carpeta_modelo_principal=str(carpeta_modelo_principal(usuario_id)),
            prom_locales_dir=str(prom_locales_dir(usuario_id)),
        )
        cfg = nueva.get_config()
        cfg.modelo_path = modelo_info.get("ruta_modelo")
        cfg.modelo_id = mid
        ruta_modelo = cfg.modelo_path
        if ruta_modelo and os.path.isfile(ruta_modelo):
            carpeta_modelo = os.path.dirname(ruta_modelo)
            candidatos_mmproj = sorted(glob.glob(os.path.join(carpeta_modelo, "*mmproj*.gguf")))
            if not candidatos_mmproj:
                candidatos_mmproj = sorted(glob.glob(os.path.join(carpeta_modelo, "**", "*mmproj*.gguf"), recursive=True))
            cfg.mmproj_path = candidatos_mmproj[0] if candidatos_mmproj else None
            print(f"[MODELO] Archivo seleccionado: {ruta_modelo}")
            print(f"[MODELO] Proyector visual: {cfg.mmproj_path or 'no encontrado'}")
        cfg._detectar_parametros()
        cfg.chat_format = cfg._detectar_chat_format()
        cfg._cargar_prompt_especifico()

        if not nueva.iniciar():
            print(f"No se pudo iniciar la IA para {usuario_id}")
            return None

        with _estado_lock:
            estado["sesiones_por_modelo"][mid] = nueva
            if (estado["modelo_activo"] is None or 
                (estado["modelo_activo"] or {}).get("id") == mid or 
                mid == "__principal__" or modelo_info.get("es_principal")):
                if mid == "__principal__" or modelo_info.get("es_principal"):
                    estado["sesion"] = {"instancia": nueva, "modelo_id": mid}
                estado["modelo_activo"] = modelo_info
                estado["params"].update(_params_para_modelo(usuario_id, mid))
            
        return nueva
    except Exception as e:
        print(f"Error creando IA para {usuario_id}: {e}")
        traceback.print_exc()
        return None

def _registrar_metricas(usuario_id, mensaje, reply, tiempo, modelo, usage=None):
    estado = obtener_estado(usuario_id)
    with _estado_lock:
        if usage and isinstance(usage, dict):
            tok_in = int(usage.get("prompt_tokens", 0))
            tok_out = int(usage.get("completion_tokens", 0))
            tok_total = int(usage.get("total_tokens", tok_in + tok_out))
        else:
            tok_in = max(1, len((mensaje or "").split()) * 2)
            tok_out = max(1, len((reply or "").split()) * 2)
            tok_total = tok_in + tok_out
        velocidad = (tok_out / tiempo) if tiempo > 0 else 0
        turnos = (estado["metricas_por_modelo"].get(modelo) or {}).get("turnos", 0) + 1
        entrada = {
            "tokens_entrada": tok_in, "tokens_salida": tok_out, "tokens_total": tok_total,
            "velocidad_tok_s": round(velocidad, 2),
            "tiempo_respuesta_s": round(tiempo, 2),
            "timestamp": time.time(), "modelo_id": modelo, "turnos": turnos,
        }
        estado["metricas"] = entrada
        estado["metricas_por_modelo"][modelo] = entrada

def _registrar_metricas_local(usuario_id, mensaje, reply, tiempo, modelo_id):
    _registrar_metricas(usuario_id, mensaje, reply, tiempo, modelo_id)

def _split_data_url(data_url):
    mime = "image/jpeg"
    b64 = data_url or ""
    if b64.startswith("data:") and "," in b64:
        cab, b64 = b64.split(",", 1)
        mime = cab[5:].split(";", 1)[0] or mime
    return mime, b64


def _extraer_json_de_texto(texto):
    if not texto:
        raise ValueError("Respuesta vacia")
    t = texto.strip()
    m = _re.match(r'^```(?:json)?\s*\n?(.*?)\n?```\s*$', t, _re.DOTALL | _re.I)
    if m:
        t = m.group(1).strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass
    inicio = t.find('{')
    fin = t.rfind('}')
    if inicio == -1 or fin == -1 or fin <= inicio:
        raise ValueError(f"No se encontro un JSON en la respuesta")
    candidato = t[inicio:fin+1]
    try:
        return json.loads(candidato)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON invalido: {e}\n\nRecibido:\n{candidato[:800]}")


def ia_preguntar_api(usuario_id, mensaje, datos_frontend="", imagen_base64="",
                     historial_previo=None, imagenes_extra=None):
    if imagenes_extra is None:
        imagenes_extra = []

    estado = obtener_estado(usuario_id)
    api = estado["api_activa"]
    if not api:
        return {'success': False, 'reply': 'No hay API activa', 'error': 'sin_api_activa'}

    proveedor_id = api.get("proveedor")
    modelo = api.get("modelo")
    base = api.get("base", "").rstrip("/")
    api_key = _leer_key_guardada(usuario_id, proveedor_id)
    if not api_key:
        return {'success': False, 'reply': 'Falta la API key', 'error': 'sin_api_key'}

    if not _es_modelo_chat(modelo):
        return {'success': False,
                'reply': f"El modelo '{modelo}' no es de chat. Elegi otro.",
                'error': 'modelo_no_chat'}

    max_tokens = int(estado["params"].get("max_tokens", 8192))
    max_out_modelo = int(api.get("max_output_tokens", 0))
    if max_out_modelo > 0:
        max_tokens = min(max_tokens, max_out_modelo)

    system_prompt = _prompt_activo(usuario_id) or \
        "Eres ALFA, asistente del sistema logistico Alfa Logistics. Responde en espanol, breve y natural."
    t0 = time.time()

    todas_imagenes = []
    if imagen_base64:
        todas_imagenes.append(imagen_base64)
    todas_imagenes.extend(imagenes_extra)

    mensajes_chat = [{"role": "system", "content": system_prompt}]
    if datos_frontend:
        mensajes_chat.append({"role": "system", "content": datos_frontend})

    if historial_previo and isinstance(historial_previo, list):
        for msg in historial_previo:
            rol = msg.get("role") or msg.get("rol")
            if rol == "u": rol = "user"
            if rol == "a": rol = "assistant"

            cont = msg.get("content") or msg.get("texto")
            if rol in ("user", "assistant", "system") and cont:
                mensajes_chat.append({"role": rol, "content": cont})

    if todas_imagenes:
        contenido_user = [{"type": "text", "text": mensaje or "Analiza las imagenes adjuntas."}]
        for img in todas_imagenes:
            contenido_user.append({
                "type": "image_url",
                "image_url": {"url": img}
            })
        mensajes_chat.append({"role": "user", "content": contenido_user})
    elif mensaje:
        mensajes_chat.append({"role": "user", "content": mensaje})

    if proveedor_id.startswith("gemini"):
        url = f"{base}/models/{modelo}:generateContent?key={api_key}"
        contents_g = []
        for m in mensajes_chat:
            if m["role"] == "system":
                continue
            r = "user" if m["role"] == "user" else "model"
            contenido = m["content"]
            if isinstance(contenido, list):
                partes = []
                for p in contenido:
                    if p.get("type") == "text":
                        partes.append({"text": p["text"]})
                    elif p.get("type") == "image_url":
                        mime, b64 = _split_data_url(p["image_url"]["url"])
                        partes.append({
                            "inlineData": {"mimeType": mime, "data": b64}
                        })
                contents_g.append({"role": r, "parts": partes})
            else:
                contents_g.append({"role": r, "parts": [{"text": str(contenido)}]})

        payload_g = {
            "contents": contents_g,
            "generationConfig": {
                "temperature": estado["params"].get("temperature", 0.3),
                "maxOutputTokens": max_tokens,
            },
            "systemInstruction": {"parts": [{"text": system_prompt + (("\n\n" + datos_frontend) if datos_frontend else "")}]},
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload_g).encode("utf-8"),
                                         headers={"Content-Type": "application/json"},
                                         method="POST")
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            try:
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                reply = str(data)[:500]
            _registrar_metricas(usuario_id, mensaje, reply, time.time() - t0, modelo)
            return {'success': True, 'reply': reply}
        except urllib.error.HTTPError as e:
            try: cuerpo = e.read().decode("utf-8", errors="replace")[:300]
            except Exception: cuerpo = str(e.reason)
            if e.code == 413 or "Request too large" in cuerpo:
                return {'success': False, 'reply': 'El archivo o mensaje es demasiado grande para este modelo.', 'error': 'request_too_large'}
            return {'success': False, 'reply': f'Error {e.code}: {cuerpo}', 'error': 'http_error'}
        except Exception as e:
            return {'success': False, 'reply': f'Error: {e}', 'error': 'excepcion'}

    if proveedor_id == "anthropic":
        url = base + "/messages"
        msgs_a = []
        for m in mensajes_chat:
            if m["role"] == "system":
                continue
            contenido = m["content"]
            if isinstance(contenido, list):
                bloques = []
                for p in contenido:
                    if p.get("type") == "text":
                        bloques.append({"type": "text", "text": p["text"]})
                    elif p.get("type") == "image_url":
                        mime, b64 = _split_data_url(p["image_url"]["url"])
                        bloques.append({
                            "type": "image",
                            "source": {"type": "base64", "media_type": mime, "data": b64}
                        })
                msgs_a.append({"role": m["role"], "content": bloques})
            else:
                msgs_a.append({"role": m["role"], "content": str(contenido)})

        payload_a = {
            "model": modelo, "max_tokens": max_tokens,
            "messages": msgs_a,
            "system": system_prompt + (("\n\n" + datos_frontend) if datos_frontend else ""),
        }
        headers_a = {"Content-Type": "application/json", "x-api-key": api_key,
                     "anthropic-version": "2023-06-01"}
        try:
            req = urllib.request.Request(url, data=json.dumps(payload_a).encode("utf-8"),
                                         headers=headers_a, method="POST")
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            reply = data.get("content", [{}])[0].get("text", str(data)[:500])
            _registrar_metricas(usuario_id, mensaje, reply, time.time() - t0, modelo)
            return {'success': True, 'reply': reply}
        except urllib.error.HTTPError as e:
            try: cuerpo = e.read().decode("utf-8", errors="replace")[:300]
            except Exception: cuerpo = str(e.reason)
            if e.code == 413:
                return {'success': False, 'reply': 'El archivo o mensaje es demasiado grande para este modelo.', 'error': 'request_too_large'}
            return {'success': False, 'reply': f'Error {e.code}: {cuerpo}', 'error': 'http_error'}
        except Exception as e:
            return {'success': False, 'reply': f'Error: {e}', 'error': 'excepcion'}

    url = base + "/chat/completions"
    payload = {
        "model": modelo, "messages": mensajes_chat,
        "temperature": estado["params"].get("temperature", 0.3),
        "max_tokens": max_tokens,
    }
    headers = {"Content-Type": "application/json",
               "Authorization": "Bearer " + api_key,
               "User-Agent": "CORETEKS/1.0"}
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                     headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = data["choices"][0]["message"]["content"]
        _registrar_metricas(usuario_id, mensaje, reply, time.time() - t0, modelo,
                            data.get("usage", {}))
        return {'success': True, 'reply': reply}
    except urllib.error.HTTPError as e:
        try: cuerpo = e.read().decode("utf-8", errors="replace")[:300]
        except Exception: cuerpo = str(e.reason)
        if e.code == 413 or "Request too large" in cuerpo:
            return {'success': False, 'reply': 'El archivo o mensaje es demasiado grande para este modelo. Intenta con un archivo mas corto o un modelo con mayor contexto.', 'error': 'request_too_large'}
        return {'success': False, 'reply': f'Error {e.code}: {cuerpo}', 'error': 'http_error'}
    except Exception as e:
        return {'success': False, 'reply': f'Error: {e}', 'error': 'excepcion'}


def ia_preguntar(mensaje, datos_frontend="", usuario_id=USUARIO_ADMIN,
                 modelo_id="__principal__", imagen_base64="",
                 imagenes_extra=None, historial_previo=None):
    if mensaje is None: mensaje = ""
    if not isinstance(mensaje, str): mensaje = str(mensaje)
    mensaje = mensaje.strip()
    if datos_frontend is None: datos_frontend = ""
    if not isinstance(datos_frontend, str): datos_frontend = str(datos_frontend)
    if imagenes_extra is None: imagenes_extra = []

    lock_modelo = _obtener_lock_modelo(modelo_id)
    adquirido = lock_modelo.acquire(timeout=2.0)
    if not adquirido:
        return {
            'success': False, 
            'reply': 'El modelo esta ocupado procesando otra conversacion. Por favor, espera a que termine para enviar otro mensaje.', 
            'error': 'modelo_ocupado'
        }

    try:
        estado = obtener_estado(usuario_id)

        modelo_api = buscar_modelo_api_por_id(usuario_id, modelo_id)
        if not modelo_api:
            d_apis = apis_modelos_dir(usuario_id)
            if d_apis.exists():
                for arch in d_apis.glob("*.json"):
                    try:
                        jdata = json.loads(arch.read_text(encoding="utf-8"))
                        if jdata.get("id") == modelo_id or jdata.get("modelo") == modelo_id or arch.stem == modelo_id:
                            modelo_api = jdata
                            break
                    except Exception:
                        pass

        if modelo_api:
            estado["api_activa"] = modelo_api
            return ia_preguntar_api(
                usuario_id, mensaje, datos_frontend, imagen_base64,
                historial_previo, imagenes_extra=imagenes_extra
            )
        else:
            estado["api_activa"] = None

        if not mensaje and not imagen_base64 and not imagenes_extra:
            return {'success': False, 'reply': '', 'error': 'mensaje_vacio'}
        if not mensaje and (imagen_base64 or imagenes_extra):
            mensaje = "Describe y analiza la imagen adjunta."

        modelo_info = buscar_modelo_por_id(usuario_id, modelo_id)
        if not modelo_info:
            return {'success': False, 'reply': '', 'error': 'modelo_no_encontrado'}
        if not modelo_info.get("descargado"):
            return {'success': False, 'reply': '', 'error': 'modelo_no_descargado'}

        ia_u = obtener_ia_para_usuario(usuario_id, modelo_info)
        if not ia_u:
            return {'success': False, 'reply': 'No se pudo cargar el modelo.', 'error': 'ia_fallo'}

        t0 = time.time()
        try:
            tiene_vision = bool(getattr(ia_u.get_config(), "mmproj_path", None))
            if (imagen_base64 or imagenes_extra) and not tiene_vision:
                nota = "\n\n[Nota: el modelo local activo no tiene vision. Las imagenes fueron omitidas.]"
                datos_frontend = (datos_frontend + nota).strip()
                imagen_base64 = ""
                imagenes_extra = []

            r = ia_u.enviar_mensaje_con_historial(
                mensaje=mensaje,
                imagen_base64=imagen_base64 or "",
                datos_frontend=datos_frontend or "",
                historial_previo=historial_previo or []
            )

            if imagenes_extra and tiene_vision and r and r.get("success"):
                for idx, img in enumerate(imagenes_extra, start=1):
                    extra = ia_u.enviar_mensaje_con_historial(
                        mensaje=f"Imagen {idx} extraida del documento adjunto. Describela brevemente.",
                        imagen_base64=img,
                        datos_frontend="",
                        historial_previo=[]
                    )
                    if extra and extra.get("success") and extra.get("reply"):
                        r["reply"] += f"\n\n[Imagen {idx}]: {extra['reply'][:800]}"

            if r and r.get("success") and r.get("reply"):
                _registrar_metricas_local(usuario_id, mensaje, r["reply"],
                                          time.time() - t0, modelo_id)
            return r
        except Exception as e:
            traceback.print_exc()
            return {'success': False, 'reply': '', 'error': 'excepcion', 'detalle': str(e)}
            
    finally:
        lock_modelo.release()
        

def ia_reiniciar(usuario_id=USUARIO_ADMIN):
    estado = obtener_estado(usuario_id)
    with _estado_lock:
        estado["metricas"] = _estado_vacio(usuario_id)["metricas"]
    return {'success': True}

def buscar_modelos_hf(query="", limite=30):
    if not _HF_API_OK:
        return {"ok": False, "error": "huggingface_hub no instalado"}
    try:
        api = HfApi()
        kwargs = {"sort": "downloads", "limit": limite, "filter": "gguf"}
        if query: kwargs["search"] = query
        modelos = []
        for m in list(api.list_models(**kwargs)):
            modelos.append({
                "id": m.id,
                "nombre": m.id.split("/")[-1],
                "autor": m.id.split("/")[0] if "/" in m.id else "",
                "descargas": getattr(m, "downloads", 0) or 0,
                "likes": getattr(m, "likes", 0) or 0,
                "tags": (getattr(m, "tags", []) or [])[:8],
                "actualizado": str(getattr(m, "lastModified", "") or ""),
            })
        return {"ok": True, "modelos": modelos}
    except Exception as e:
        traceback.print_exc()
        return {"ok": False, "error": str(e)}

def listar_archivos_hf(repo_id):
    if not _HF_API_OK:
        return {"ok": False, "error": "huggingface_hub no instalado"}
    try:
        archivos = HfApi().list_repo_files(repo_id=repo_id)
        ggufs = [a for a in archivos if a.lower().endswith(".gguf")]
        ggufs = [g for g in ggufs if "mmproj" not in g.lower()]
        return {"ok": True, "repo_id": repo_id, "archivos": ggufs}
    except Exception as e:
        traceback.print_exc()
        return {"ok": False, "error": str(e)}


def _ejecutar_descarga_en_hilo(usuario_id, modelo_id, modelo_snapshot=None):
    import sys
    import urllib.request
    import urllib.error
    
    uid = _slug_usuario(usuario_id)
    asegurar_dirs_usuario(uid)
    estado = obtener_estado(uid)
    
    # Limpiar bandera de cancelación previa
    _limpiar_cancelacion(modelo_id)
    
    # Forzamos estado "descargando" inmediatamente
    with _estado_lock:
        estado["descargas"][modelo_id] = {
            "estado": "descargando", 
            "progreso": 1, 
            "mensaje": "Iniciando descarga..."
        }
    
    time.sleep(0.3)

    try:
        if isinstance(modelo_snapshot, dict):
            modelo_snapshot = dict(modelo_snapshot)
            modelo_snapshot["id"] = str(modelo_snapshot.get("id") or modelo_id).strip()
            if modelo_snapshot["id"] != modelo_id:
                raise ValueError("El id del modelo no coincide con la solicitud")
            _guardar_modelo_local_catalogo(uid, modelo_snapshot)

        modelo = buscar_modelo_por_id(uid, modelo_id)
        if not modelo:
            raise FileNotFoundError(
                f"Modelo '{modelo_id}' no encontrado en el catalogo privado de '{uid}'."
            )

        nombre_carpeta = _sanitizar_nombre_modelo(modelo.get("nombre") or modelo_id)
        carpeta = descargas_dir(uid) / nombre_carpeta
        carpeta.mkdir(parents=True, exist_ok=True)

        archivo_nombre = (modelo.get("archivo")
                          or str(modelo.get("hf_file") or "").replace("\\", "/").split("/")[-1]
                          or f"{_sanitizar_nombre_modelo(modelo_id)}.gguf")
        archivo_nombre = Path(archivo_nombre).name
        destino = carpeta / archivo_nombre
        parcial = destino.with_suffix(destino.suffix + ".part")

        if destino.exists() and destino.stat().st_size > 0:
            with _estado_lock:
                estado["descargas"][modelo_id] = {"estado": "completado", "progreso": 100, "mensaje": "Listo", "ruta": str(destino)}
            return

        # --- DESCARGA DIRECTA DESDE HUGGINGFACE ---
        if modelo.get("hf_repo") and modelo.get("hf_file"):
            repo_id = modelo["hf_repo"]
            hf_file = modelo["hf_file"]
            revision = modelo.get("hf_revision", "main")
            
            # Construir URL directa de descarga
            url = f"https://huggingface.co/{repo_id}/resolve/{revision}/{hf_file}"
            if "?" not in url:
                url += "?download=true"
            
            headers = {
                "User-Agent": "CORETEKS/1.0",
                "Accept": "*/*",
            }
            
            # Soporte para token si es necesario
            token = modelo.get("hf_token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            print(f"[DESCARGA] URL: {url}")
            
            # Verificar si hay descarga parcial para reanudar
            reanudar = parcial.stat().st_size if parcial.exists() else 0
            if reanudar > 0:
                headers["Range"] = f"bytes={reanudar}-"
                print(f"[DESCARGA] Reanudando desde byte {reanudar}")
            
            req = urllib.request.Request(url, headers=headers)
            
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    # Obtener tamaño total
                    content_length = resp.headers.get("Content-Length")
                    if content_length:
                        total = reanudar + int(content_length) if reanudar else int(content_length)
                    else:
                        total = 0
                    
                    # Si el servidor no soporta reanudación, empezar de cero
                    if reanudar and getattr(resp, "status", 200) != 206:
                        reanudar = 0
                        total = int(content_length) if content_length else 0
                        print("[DESCARGA] Servidor no soporta reanudación, reiniciando")
                    
                    modo = "ab" if reanudar else "wb"
                    leido = reanudar
                    
                    with open(parcial, modo) as f:
                        while True:
                            # Verificar cancelación
                            if _esta_cancelado(modelo_id):
                                print(f"[DESCARGA] Cancelación solicitada para {modelo_id}")
                                break
                            
                            chunk = resp.read(1024 * 1024)  # 1MB chunks
                            if not chunk:
                                break
                            f.write(chunk)
                            leido += len(chunk)
                            
                            if total > 0:
                                pct = int(leido * 100 / total)
                                with _estado_lock:
                                    estado["descargas"][modelo_id] = {
                                        "estado": "descargando",
                                        "progreso": min(99, pct),
                                        "mensaje": f"Descargando... {pct}% ({leido // (1024*1024)}MB / {total // (1024*1024)}MB)"
                                    }
                            else:
                                mb = leido // (1024 * 1024)
                                with _estado_lock:
                                    estado["descargas"][modelo_id] = {
                                        "estado": "descargando",
                                        "progreso": 50,
                                        "mensaje": f"Descargando... {mb}MB"
                                    }
                    
                    # Si se canceló, limpiar
                    if _esta_cancelado(modelo_id):
                        try:
                            parcial.unlink()
                        except Exception:
                            pass
                        with _estado_lock:
                            estado["descargas"][modelo_id] = {
                                "estado": "cancelado",
                                "progreso": 0,
                                "mensaje": "Descarga cancelada por el usuario"
                            }
                        _limpiar_cancelacion(modelo_id)
                        return
            
            except urllib.error.HTTPError as e:
                if e.code == 416:  # Range not satisfiable - archivo ya completo
                    print("[DESCARGA] Archivo ya completo (416)")
                else:
                    raise
            
            if parcial.stat().st_size <= 0:
                raise IOError("La descarga devolvio un archivo vacio")
            
            os.replace(parcial, destino)
            
            with _estado_lock:
                estado["descargas"][modelo_id] = {
                    "estado": "completado", 
                    "progreso": 100, 
                    "mensaje": "Descarga completada", 
                    "ruta": str(destino)
                }

        elif modelo.get("url"):
            # Descarga desde URL directa
            headers = {"User-Agent": "CORETEKS/1.0", "Accept": "*/*"}
            reanudar = parcial.stat().st_size if parcial.exists() else 0
            if reanudar:
                headers["Range"] = f"bytes={reanudar}-"

            req = urllib.request.Request(modelo["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                total_header = resp.headers.get("Content-Length")
                total = (reanudar + int(total_header)) if total_header and reanudar else (int(total_header) if total_header else 0)
                if reanudar and getattr(resp, "status", 200) != 206:
                    reanudar = 0
                    total = int(total_header) if total_header else 0
                modo = "ab" if reanudar else "wb"
                leido = reanudar
                with open(parcial, modo) as f:
                    while True:
                        if _esta_cancelado(modelo_id):
                            print(f"[DESCARGA] Cancelación solicitada para {modelo_id}")
                            break
                        chunk = resp.read(1024 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                        leido += len(chunk)
                        pct = int(leido * 100 / total) if total else 0
                        with _estado_lock:
                            estado["descargas"][modelo_id] = {"estado": "descargando", "progreso": min(99, pct), "mensaje": f"Descargando... ({pct}%)"}
            if _esta_cancelado(modelo_id):
                try:
                    parcial.unlink()
                except Exception:
                    pass
                with _estado_lock:
                    estado["descargas"][modelo_id] = {
                        "estado": "cancelado",
                        "progreso": 0,
                        "mensaje": "Descarga cancelada por el usuario"
                    }
                _limpiar_cancelacion(modelo_id)
                return
            if parcial.stat().st_size <= 0:
                raise IOError("La descarga devolvio un archivo vacio")
            os.replace(parcial, destino)
            
            with _estado_lock:
                estado["descargas"][modelo_id] = {"estado": "completado", "progreso": 100, "mensaje": "Descarga completada", "ruta": str(destino)}
        else:
            raise ValueError("modelo sin URL ni hf_repo")

        try:
            (carpeta / "modelo.json").write_text(
                json.dumps(modelo, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        except Exception:
            pass

    except Exception as e:
        traceback.print_exc()
        try:
            if 'parcial' in locals() and parcial.exists() and not parcial.stat().st_size:
                parcial.unlink()
        except Exception:
            pass
        with _estado_lock:
            estado["descargas"][modelo_id] = {
                "estado": "error", "progreso": 0, "mensaje": f"Error: {str(e)}", "error": str(e)
            }
    finally:
        _limpiar_cancelacion(modelo_id)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def log_message(self, fmt, *args):
        print("[HTTP] " + (fmt % args))

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
        try:
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            print("[HTTP] Cliente desconectado antes de recibir respuesta (ignorado).")
        except Exception as e:
            print(f"[HTTP] Error enviando respuesta JSON: {e}")

    def _leer_json(self):
        try:
            largo = int(self.headers.get('Content-Length', 0))
            if largo <= 0: return {}
            return json.loads(self.rfile.read(largo).decode('utf-8'))
        except Exception as e:
            print(f"Error JSON: {e}")
            return {}

    def _usuario_id(self, body=None):
        uid = self.headers.get("X-Usuario-Id")
        if uid:
            return _slug_usuario(uid)
        if "?" in self.path:
            for kv in self.path.split("?", 1)[1].split("&"):
                if kv.startswith("usuario_id="):
                    return _slug_usuario(kv.split("=", 1)[1])
        if body and body.get("usuario_id"):
            return _slug_usuario(body["usuario_id"])
        return USUARIO_ADMIN

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Usuario-Id')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/chat/historial/listar'):
            uid = self._usuario_id()
            self._json({'ok': True, 'conversaciones': historial_chat.listar_conversaciones(uid)})
            return

        if self.path.startswith('/api/chat/historial/obtener'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            conv_id = qs.get('id', '')
            if not conv_id:
                self._json({'ok': False, 'error': 'Falta id de conversacion'}, status=400)
                return
            conv = historial_chat.obtener_conversacion(uid, conv_id)
            self._json({'ok': True, 'conversacion': conv})
            return

        if self.path.startswith('/api/api/proveedores/lista'):
            uid = self._usuario_id()
            self._json({'ok': True, 'proveedores': cargar_proveedores(uid)})
            return

        if self.path.startswith('/api/api/proveedores'):
            uid = self._usuario_id()
            estado = obtener_estado(uid)
            self._json({'ok': True, 'proveedores': estado_proveedores(uid),
                        'api_activa': estado["api_activa"]})
            return

        if self.path.startswith('/api/api/modelos'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            self._json(listar_modelos_api(uid, qs.get('proveedor', '')))
            return

        if self.path.startswith('/api/prompt/activo'):
            uid = self._usuario_id()
            texto = _prompt_activo(uid)
            estado = obtener_estado(uid)
            self._json({
                'ok': True, 'prompt': texto,
                'tiene_prompt': bool(texto.strip()),
                'modelo_id': estado["api_activa"].get('id') if estado["api_activa"] else None,
            })
            return

        if self.path.startswith('/api/prompt'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            mid = qs.get('id', '')
            es_api = qs.get('es_api', '0') in ('1', 'true', 'yes')
            if not mid:
                self._json({'ok': False, 'error': 'Falta id'}, status=400)
                return
            texto = cargar_prompt(uid, mid, es_api=es_api)
            self._json({'ok': True, 'modelo_id': mid, 'es_api': es_api,
                        'prompt': texto, 'tiene_prompt': bool(texto.strip())})
            return

        if self.path.startswith('/api/estado'):
            uid = self._usuario_id()
            estado = obtener_estado(uid)
            info = estado["api_activa"] or estado["modelo_activo"]
            ctx = (info or {}).get("contexto_tokens", 4096)
            out = (info or {}).get("max_output_tokens", 2048)
            self._json({
                'listo': True,
                'activo': bool(estado["api_activa"] or estado["sesion"]),
                'modelo_id': (info or {}).get('id'),
                'tipo': 'api' if estado["api_activa"] else 'local',
                'api': estado["api_activa"],
                'info': {'modelo': info} if info else None,
                'params': estado["params"],
                'limites': {'contexto_tokens': ctx, 'max_output_tokens': out,
                            'max_input_tokens': max(1, ctx - out)},
                'metricas': estado["metricas"],
                'sesiones_activas': 1 if estado["sesion"] else 0,
            })
            return

        if self.path.startswith('/api/admin/recursos'):
            if _RECURSO_OK:
                self._json({'ok': True, 'config': recurso.cargar_recursos()})
            else:
                self._json({'ok': False, 'error': 'Modulo recurso no disponible'})
            return

        if self.path.startswith('/api/usuarios/lista'):
            if _USUARIOS_OK:
                self._json({'ok': True, 'usuarios': usuarios.listar_usuarios()})
            else:
                self._json({'ok': False, 'error': 'Modulo usuarios no disponible'})
            return

        if self.path.startswith('/api/hardware/vivo'):
            uid = self._usuario_id()
            estado = obtener_estado(uid)
            self._json({
                'ok': True, 'hardware': detectar_hardware(),
                'sesiones_activas': 1 if estado["sesion"] else 0,
                'params': estado["params"], 'metricas': estado["metricas"],
                'timestamp': time.time(),
            })
            return

        if self.path.startswith('/api/hardware'):
            self._json({'ok': True, 'hardware': detectar_hardware()})
            return

        if self.path.startswith('/api/metricas'):
            uid = self._usuario_id()
            estado = obtener_estado(uid)
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            mid = qs.get('modelo')
            if mid:
                self._json({'ok': True, 'modelo_id': mid,
                            'metricas': estado["metricas_por_modelo"].get(mid, {})})
            else:
                self._json({'ok': True, 'metricas': estado["metricas"],
                            'por_modelo': dict(estado["metricas_por_modelo"])})
            return

        if self.path.startswith('/api/modelo/params'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            mid = qs.get('id', '')
            if not mid:
                self._json({'ok': False, 'error': 'Falta id'}, status=400)
                return
            self._json({'ok': True, 'modelo_id': mid, 'params': _params_para_modelo(uid, mid)})
            return

        if self.path.startswith('/api/modelo/progreso'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            mid = qs.get('id', '')
            estado = obtener_estado(uid)
            with _estado_lock:
                info = estado["descargas"].get(mid, {'estado': 'desconocido', 'progreso': 0, 'mensaje': ''})
            self._json({'ok': True, 'id': mid, **info})
            return

        if self.path.startswith('/api/modelos'):
            uid = self._usuario_id()
            self._json({
                'ok': True,
                'modelos': cargar_modelos_catalogo(uid) + cargar_modelos_api_catalogo(uid),
                'hardware': detectar_hardware(),
            })
            return

        if self.path.startswith('/api/tienda/disponible'):
            self._json({'ok': True, 'hf_api': _HF_API_OK})
            return

        # ============================================================
        # ESTADO DEL CORREO (GET)
        # ============================================================
        if self.path.startswith('/api/email/estado'):
            uid = self._usuario_id()
            
            if not _MAIL_OK:
                self._json({'ok': False, 'error': 'Módulo de correo no disponible'}, status=500)
                return

            buzones = mail._leer_buzones(uid)
            self._json({
                'ok': True,
                'conectado': len(buzones) > 0,
                'buzones': buzones
            })
            return

        # ============================================================
        # ESTADO DE TAREAS (GET)
        # ============================================================
        if self.path.startswith('/api/tareas'):
            uid = self._usuario_id()
            if not _TAREAS_OK:
                self._json({'ok': False, 'error': 'Módulo de tareas no disponible'}, status=500)
                return
            self._json(tarea.leer_tareas(uid))
            return

        # ============================================================
        # ESTADO DE PROYECTOS (GET)
        # ============================================================
        if self.path.startswith('/api/proyectos'):
            uid = self._usuario_id()
            if not _PROYECTOS_OK:
                self._json({'ok': False, 'error': 'Módulo de proyectos no disponible'}, status=500)
                return
            self._json(proyecto.leer_proyectos(uid))
            return

        # ============================================================
        # ESTADO DE ARCHIVOS (GET)
        # ============================================================
        if self.path.startswith('/api/archivos/descargar'):
            uid = self._usuario_id()
            qs = {}
            if '?' in self.path:
                for kv in self.path.split('?', 1)[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1); qs[k] = v
            archivo_id = qs.get('id', '')
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
                
            self._json(mis_archivos.leer_archivo_fisico(uid, archivo_id))
            return

        if self.path.startswith('/api/archivos'):
            uid = self._usuario_id()
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
            self._json(mis_archivos.leer_metadata(uid))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == '/api/chat/historial/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            conv_id = data.get('id')
            titulo = data.get('titulo')
            mensajes = data.get('mensajes', [])
            if not conv_id:
                self._json({'ok': False, 'error': 'Falta id de conversacion'}, status=400)
                return
            ok = historial_chat.guardar_conversacion(uid, conv_id, titulo, mensajes)
            self._json({'ok': ok})
            return

        if self.path == '/api/chat/historial/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            conv_id = data.get('id')
            if not conv_id:
                self._json({'ok': False, 'error': 'Falta id de conversacion'}, status=400)
                return
            ok = historial_chat.eliminar_conversacion(uid, conv_id)
            self._json({'ok': ok})
            return

        if self.path == '/api/usuarios/crear':
            if not _USUARIOS_OK:
                self._json({'ok': False, 'error': 'Modulo usuarios no disponible'}, status=500)
                return
            data = self._leer_json()
            correo = data.get('correo', '')
            ok, msg = usuarios.crear_usuario(
                data.get('nombre', ''), correo,
                data.get('password', ''), data.get('rol', 'estandar')
            )
            if ok and correo:
                asegurar_dirs_usuario(correo)
            self._json({'ok': ok, 'mensaje': msg}, status=200 if ok else 400)
            return

        if self.path == '/api/usuarios/editar':
            if not _USUARIOS_OK:
                self._json({'ok': False, 'error': 'Modulo usuarios no disponible'}, status=500)
                return
            data = self._leer_json()
            correo_original = data.get('correo_original', '')
            nuevo_correo = (data.get('nuevo_correo', '') or correo_original)
            ok, msg = usuarios.editar_usuario(
                correo_original, data.get('nombre', ''), nuevo_correo,
                data.get('nueva_password', ''), data.get('rol', 'estandar')
            )
            if ok and correo_original and nuevo_correo and \
               _slug_usuario(correo_original) != _slug_usuario(nuevo_correo):
                viejo = dir_usuario(correo_original)
                nuevo = dir_usuario(nuevo_correo)
                if viejo.exists() and not nuevo.exists():
                    try:
                        viejo.rename(nuevo)
                    except Exception:
                        pass
            self._json({'ok': ok, 'mensaje': msg}, status=200 if ok else 400)
            return

        if self.path == '/api/usuarios/eliminar':
            if not _USUARIOS_OK:
                self._json({'ok': False, 'error': 'Modulo usuarios no disponible'}, status=500)
                return
            data = self._leer_json()
            correo = data.get('correo', '')
            ok, msg = usuarios.eliminar_usuario(correo)
            if ok and correo and _slug_usuario(correo) != USUARIO_ADMIN:
                carpeta = dir_usuario(correo)
                if carpeta.exists():
                    try: shutil.rmtree(carpeta)
                    except Exception: pass
            self._json({'ok': ok, 'mensaje': msg})
            return

        if self.path == '/api/usuarios/validar':
            if not _USUARIOS_OK:
                self._json({'ok': False, 'error': 'Modulo usuarios no disponible'}, status=500)
                return
            data = self._leer_json()
            u = usuarios.verificar_credenciales(
                data.get('correo', ''), data.get('password', '')
            )
            if u:
                asegurar_dirs_usuario(u['correo'])
                cargar_api_activa(u['correo'])
                restaurar_modelo_local_activo(u['correo'])
                self._json({'ok': True, 'usuario': u})
            else:
                self._json({'ok': False, 'error': 'Credenciales invalidas o cuenta inactiva'},
                           status=401)
            return

        if self.path == '/api/admin/recursos':
            data = self._leer_json()
            if _RECURSO_OK:
                self._json({'ok': recurso.guardar_recursos(data)})
            else:
                self._json({'ok': False, 'error': 'Modulo recurso no disponible'}, status=500)
            return

        if self.path == '/api/prompt/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            prompt = data.get('prompt') or ''
            es_api = bool(data.get('es_api'))
            if not mid:
                self._json({'ok': False, 'error': 'Falta id'}, status=400)
                return
            ok = guardar_prompt(uid, mid, prompt, es_api=es_api)
            self._json({'ok': ok, 'modelo_id': mid, 'es_api': es_api,
                        'tiene_prompt': bool((prompt or '').strip())},
                       status=200 if ok else 500)
            return

        if self.path == '/api/prompt/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            es_api = bool(data.get('es_api'))
            if not mid:
                self._json({'ok': False, 'error': 'Falta id'}, status=400)
                return
            ok = eliminar_prompt(uid, mid, es_api=es_api)
            self._json({'ok': ok, 'modelo_id': mid})
            return

        if self.path == '/api/api/validar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proveedor = (data.get('proveedor') or '').strip()
            if not proveedor:
                self._json({'ok': False, 'error': "Falta proveedor"}, status=400)
                return
            self._json(validar_key_proveedor(uid, proveedor,
                                             (data.get('api_key') or '').strip()))
            return

        if self.path == '/api/api/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proveedor = (data.get('proveedor') or '').strip()
            api_key = (data.get('api_key') or '').strip()
            if not proveedor or not api_key:
                self._json({'ok': False, 'error': "Faltan proveedor o api_key"}, status=400)
                return
            ok = _guardar_key(uid, proveedor, api_key)
            verif = _leer_key_guardada(uid, proveedor)
            verif_ok = verif is not None and verif == api_key
            self._json({'ok': ok and verif_ok, 'proveedor': proveedor,
                        'guardado': ok, 'verificado': verif_ok},
                       status=200 if (ok and verif_ok) else 500)
            return

        if self.path == '/api/api/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proveedor = (data.get('proveedor') or '').strip()
            if not proveedor:
                self._json({'ok': False, 'error': "Falta proveedor"}, status=400)
                return
            ok = _eliminar_key(uid, proveedor)
            estado = obtener_estado(uid)
            if estado["api_activa"] and estado["api_activa"].get("proveedor") == proveedor:
                estado["api_activa"] = None
                guardar_api_activa(uid)
            self._json({'ok': ok, 'proveedor': proveedor})
            return

        if self.path == '/api/api/activar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proveedor_id = (data.get('proveedor') or '').strip()
            modelo = (data.get('modelo') or '').strip()
            if not proveedor_id or not modelo:
                self._json({'ok': False, 'error': "Faltan proveedor o modelo"}, status=400)
                return
            provs = cargar_proveedores(uid)
            prov = next((p for p in provs if p["id"] == proveedor_id), None)
            if not prov:
                self._json({'ok': False, 'error': "Proveedor no encontrado"}, status=404)
                return
            if not _leer_key_guardada(uid, proveedor_id):
                self._json({'ok': False, 'error': "No hay API key guardada"}, status=400)
                return

            estado = obtener_estado(uid)
            ctx, out = _leer_contexto_modelo(modelo)
            modelo_id = "api-" + _slug_api(proveedor_id + "-" + modelo)
            entrada = {
                "id": modelo_id, "nombre": modelo,
                "descripcion": "API conectada: " + prov.get("n", proveedor_id),
                "familia": "API " + prov.get("n", proveedor_id),
                "licencia": prov.get("tier", "API"),
                "contexto": "remoto", "tamano_gb": 0, "ram_min_gb": 0, "vram_min_gb": 0,
                "proveedor": proveedor_id, "proveedor_nombre": prov.get("n", proveedor_id),
                "modelo": modelo, "base": prov.get("base", ""), "url": prov.get("url", ""),
                "tier": prov.get("tier", ""), "logo": prov.get("logo", ""),
                "cls": prov.get("cls", ""), "creado": time.time(),
                "contexto_tokens": ctx, "max_output_tokens": out,
                "max_input_tokens": max(1, ctx - out),
            }
            guardar_modelo_api(uid, entrada)
            estado["api_activa"] = entrada
            params = _params_para_modelo(uid, modelo_id)
            params["n_ctx"] = ctx
            params["max_tokens"] = out
            params["max_input_tokens"] = max(1, ctx - out)
            estado["params"].update(params)
            guardar_config_modelo(uid, modelo_id, estado["params"])
            guardar_api_activa(uid)

            self._json({'ok': True, 'estado': 'activo', 'modelo': modelo,
                        'proveedor': prov.get("n", proveedor_id),
                        'info': entrada, 'params': estado["params"],
                        'limites': {'contexto_tokens': ctx, 'max_output_tokens': out,
                                    'max_input_tokens': max(1, ctx - out)}})
            return

        if self.path == '/api/api/desactivar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            estado = obtener_estado(uid)
            estado["api_activa"] = None
            guardar_api_activa(uid)
            self._json({'ok': True})
            return

        if self.path == '/api/api/modelo/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            if not mid:
                self._json({'ok': False, 'error': "Falta id"}, status=400)
                return
            archivo = apis_modelos_dir(uid) / f"{mid}.json"
            try:
                if archivo.exists(): archivo.unlink()
            except Exception:
                pass
            estado = obtener_estado(uid)
            if estado["api_activa"] and estado["api_activa"].get("id") == mid:
                estado["api_activa"] = None
                guardar_api_activa(uid)
            self._json({'ok': True, 'id': mid})
            return

        if self.path == '/api/modelo/eliminar_descargado':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            if not mid:
                self._json({'ok': False, 'error': "Falta id"}, status=400)
                return
            
            try:
                modelo_obj = buscar_modelo_por_id(uid, mid)
                carpetas_a_borrar = set()
                if modelo_obj and modelo_obj.get('carpeta'):
                    carpetas_a_borrar.add(Path(modelo_obj['carpeta']))
                
                carpetas_a_borrar.add(descargas_dir(uid) / _sanitizar_nombre_modelo(mid))
                if modelo_obj and modelo_obj.get('nombre'):
                    carpetas_a_borrar.add(descargas_dir(uid) / _sanitizar_nombre_modelo(modelo_obj.get('nombre')))

                for carp in carpetas_a_borrar:
                    if carp.exists() and carp.is_dir():
                        try:
                            shutil.rmtree(carp)
                            print(f"[ELIMINAR] Carpeta borrada exitosamente: {carp}")
                        except Exception as ex:
                            print(f"[ELIMINAR] No se pudo borrar la carpeta {carp}: {ex}")

                ruta_json = url_modelos_dir(uid) / f"{_sanitizar_nombre_modelo(mid)}.json"
                if ruta_json.exists():
                    ruta_json.unlink()
                
                ruta_json_alt = url_modelos_dir(uid) / f"{mid}.json"
                if ruta_json_alt.exists():
                    ruta_json_alt.unlink()

                ruta_cfg = _ruta_config_modelo(uid, mid)
                if ruta_cfg.exists():
                    ruta_cfg.unlink()

                eliminar_prompt(uid, mid, es_api=False)

                estado = obtener_estado(uid)
                if (estado.get("modelo_activo") or {}).get("id") == mid:
                    sesion = estado.get("sesion")
                    if sesion:
                        try:
                            sesion["instancia"].detener()
                        except Exception:
                            pass
                        estado["sesion"] = None
                    estado["modelo_activo"] = None

                self._json({'ok': True, 'id': mid})
            except Exception as e:
                traceback.print_exc()
                self._json({'ok': False, 'error': str(e)}, status=500)
            return

        # ============================================================
        # CANCELACIÓN DE DESCARGA
        # ============================================================
        if self.path == '/api/modelo/cancelar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            if not mid:
                self._json({'ok': False, 'error': "Falta id"}, status=400)
                return
            
            _solicitar_cancelacion(mid)
            
            estado = obtener_estado(uid)
            with _estado_lock:
                if mid in estado["descargas"]:
                    estado["descargas"][mid] = {
                        "estado": "cancelado",
                        "progreso": 0,
                        "mensaje": "Descarga cancelada"
                    }
            
            self._json({'ok': True, 'id': mid})
            return

        # ============================================================
        # ENDPOINTS DE CORREO (Smart Email) - POST
        # ============================================================
        if self.path == '/api/email/conectar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            
            if not _MAIL_OK:
                self._json({'ok': False, 'error': 'Módulo de correo no disponible'}, status=500)
                return

            servidor = data.get('servidor', 'imap.gmail.com')
            puerto = data.get('puerto', '993')
            usuario = data.get('usuario')
            password = data.get('password')
            proveedor = data.get('proveedor', 'google')
            
            if not usuario or not password:
                self._json({'ok': False, 'error': 'Faltan credenciales'}, status=400)
                return
            
            creds = {"servidor": servidor, "puerto": puerto, "usuario": usuario, "password": password}
            mail_conn, error = mail.conectar_imap(creds)
            
            if error:
                self._json({'ok': False, 'error': error}, status=400)
                return
            
            try:
                mail_conn.logout()
            except Exception:
                pass
            
            ok, msg = mail.guardar_credenciales(uid, servidor, puerto, usuario, password, proveedor)
            
            if ok:
                self._json({'ok': True, 'mensaje': 'Conectado correctamente'})
            else:
                self._json({'ok': False, 'error': msg}, status=500)
            return

        if self.path == '/api/email/sincronizar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            email_buzon = data.get('email_buzon')
            
            if not _MAIL_OK:
                self._json({'ok': False, 'error': 'Módulo de correo no disponible'}, status=500)
                return

            creds = mail.cargar_credenciales(uid, email_buzon)
            if not creds:
                self._json({'ok': False, 'error': 'No hay buzón conectado'}, status=400)
                return
            
            # 1. Leer correos de IMAP (Bandeja de entrada)
            resultado = mail.leer_correos(creds, limite=15)
            
            if resultado.get('ok'):
                # 2. Leer correos enviados (Caché local)
                enviados = mail.leer_correos_enviados(uid)
                
                # 3. Combinar ambos
                todos_correos = resultado.get('correos', []) + enviados
                
                # 4. Guardar en caché general (opcional, para persistencia)
                ruta_cache = BASE_DIR / "modelos" / _slug_usuario(uid) / "mail" / "correos_cache.json"
                ruta_cache.parent.mkdir(parents=True, exist_ok=True)
                ruta_cache.write_text(json.dumps(todos_correos, indent=2, ensure_ascii=False), encoding="utf-8")
                
                resultado['correos'] = todos_correos
            
            try:
                self._json(resultado)
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                print("[HTTP] Sincronización completada, pero el cliente canceló la espera.")
            return

        if self.path == '/api/email/enviar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            email_buzon = data.get('email_buzon')
            
            if not _MAIL_OK:
                self._json({'ok': False, 'error': 'Módulo de correo no disponible'}, status=500)
                return

            creds = mail.cargar_credenciales(uid, email_buzon)
            if not creds:
                self._json({'ok': False, 'error': 'No hay buzón conectado'}, status=400)
                return
            
            para = data.get('para')
            asunto = data.get('asunto')
            cuerpo = data.get('cuerpo')
            adjuntos = data.get('adjuntos', []) # <-- NUEVO
            
            if not para or not asunto or not cuerpo:
                self._json({'ok': False, 'error': 'Faltan datos para enviar'}, status=400)
                return
            
            # Pasar adjuntos a enviar_correo
            resultado = mail.enviar_correo(creds, para, asunto, cuerpo, adjuntos=adjuntos)
            
            if resultado.get('ok'):
                import time
                nuevo_enviado = {
                    "id": "env_" + str(int(time.time() * 1000)),
                    "de": creds.get("usuario"),
                    "deMail": creds.get("usuario"),
                    "t": asunto,
                    "p": cuerpo[:150],
                    "cuerpo": cuerpo,
                    "cuerpo_html": cuerpo, # Asumimos que ya viene con formato
                    "cuerpo_texto": cuerpo,
                    "fecha": time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()),
                    "estado": "enviado",
                    "para": para,
                    "adjuntos": adjuntos,
                    "imagenes_inline": []
                }
                mail.guardar_correo_enviado(uid, nuevo_enviado)
                
            self._json(resultado)
            return

        if self.path == '/api/email/desconectar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            email_buzon = data.get('email_buzon')
            
            if not _MAIL_OK:
                self._json({'ok': False, 'error': 'Módulo de correo no disponible'}, status=500)
                return

            ok, msg = mail.eliminar_credenciales(uid, email_buzon)
            
            if not email_buzon:
                ruta_cache = BASE_DIR / "modelos" / _slug_usuario(uid) / "mail" / "correos_cache.json"
                if ruta_cache.exists():
                    try:
                        ruta_cache.unlink()
                    except Exception:
                        pass
            
            self._json({'ok': ok, 'mensaje': msg})
            return

        # ============================================================
        # ENDPOINTS DE TAREAS (POST)
        # ============================================================
        if self.path == '/api/tareas/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            tareas = data.get('tareas', [])
            seq = data.get('seq', len(tareas))
            
            if not _TAREAS_OK:
                self._json({'ok': False, 'error': 'Módulo de tareas no disponible'}, status=500)
                return
            
            self._json(tarea.guardar_tareas(uid, tareas, seq))
            return

        if self.path == '/api/tareas/crear':
            data = self._leer_json()
            uid = self._usuario_id(data)
            tarea_data = data.get('tarea')
            
            if not _TAREAS_OK:
                self._json({'ok': False, 'error': 'Módulo de tareas no disponible'}, status=500)
                return
                
            if not tarea_data or not tarea_data.get('t'):
                self._json({'ok': False, 'error': 'Faltan datos de la tarea'}, status=400)
                return
                
            self._json(tarea.agregar_tarea(uid, tarea_data))
            return

        if self.path == '/api/tareas/actualizar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            tarea_id = data.get('id')
            tarea_data = data.get('tarea')
            
            if not _TAREAS_OK:
                self._json({'ok': False, 'error': 'Módulo de tareas no disponible'}, status=500)
                return
                
            if not tarea_id or not tarea_data:
                self._json({'ok': False, 'error': 'Faltan datos'}, status=400)
                return
                
            self._json(tarea.actualizar_tarea(uid, tarea_id, tarea_data))
            return

        if self.path == '/api/tareas/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            tarea_id = data.get('id')
            
            if not _TAREAS_OK:
                self._json({'ok': False, 'error': 'Módulo de tareas no disponible'}, status=500)
                return
                
            if not tarea_id:
                self._json({'ok': False, 'error': 'Falta id de la tarea'}, status=400)
                return
                
            self._json(tarea.eliminar_tarea(uid, tarea_id))
            return

        # ============================================================
        # ENDPOINTS DE PROYECTOS (POST)
        # ============================================================
        if self.path == '/api/proyectos/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proyectos = data.get('proyectos', [])
            seq = data.get('seq', len(proyectos))
            
            if not _PROYECTOS_OK:
                self._json({'ok': False, 'error': 'Módulo de proyectos no disponible'}, status=500)
                return
            
            self._json(proyecto.guardar_proyectos(uid, proyectos, seq))
            return

        if self.path == '/api/proyectos/crear':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proyecto_data = data.get('proyecto')
            
            if not _PROYECTOS_OK:
                self._json({'ok': False, 'error': 'Módulo de proyectos no disponible'}, status=500)
                return
                
            if not proyecto_data or not proyecto_data.get('n'):
                self._json({'ok': False, 'error': 'Faltan datos del proyecto'}, status=400)
                return
                
            self._json(proyecto.agregar_proyecto(uid, proyecto_data))
            return

        if self.path == '/api/proyectos/actualizar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proyecto_id = data.get('id')
            proyecto_data = data.get('proyecto')
            
            if not _PROYECTOS_OK:
                self._json({'ok': False, 'error': 'Módulo de proyectos no disponible'}, status=500)
                return
                
            if not proyecto_id or not proyecto_data:
                self._json({'ok': False, 'error': 'Faltan datos'}, status=400)
                return
                
            self._json(proyecto.actualizar_proyecto(uid, proyecto_id, proyecto_data))
            return

        if self.path == '/api/proyectos/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            proyecto_id = data.get('id')
            
            if not _PROYECTOS_OK:
                self._json({'ok': False, 'error': 'Módulo de proyectos no disponible'}, status=500)
                return
                
            if not proyecto_id:
                self._json({'ok': False, 'error': 'Falta id del proyecto'}, status=400)
                return
                
            self._json(proyecto.eliminar_proyecto(uid, proyecto_id))
            return

        # ============================================================
        # ENDPOINTS DE ARCHIVOS (POST)
        # ============================================================
        if self.path == '/api/archivos/guardar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            carpetas = data.get('carpetas', [])
            archivos = data.get('archivos', [])
            seq = data.get('seq', len(archivos))
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
            
            self._json(mis_archivos.guardar_metadata(uid, carpetas, archivos, seq))
            return

        if self.path == '/api/archivos/subir':
            data = self._leer_json()
            uid = self._usuario_id(data)
            archivo_data = data.get('archivo')
            contenido_base64 = data.get('contenido_base64')
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
                
            if not archivo_data or not archivo_data.get('n'):
                self._json({'ok': False, 'error': 'Faltan datos del archivo'}, status=400)
                return
                
            self._json(mis_archivos.agregar_archivo(uid, archivo_data, contenido_base64))
            return

        if self.path == '/api/archivos/actualizar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            archivo_id = data.get('id')
            archivo_data = data.get('archivo')
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
                
            if not archivo_id or not archivo_data:
                self._json({'ok': False, 'error': 'Faltan datos'}, status=400)
                return
                
            self._json(mis_archivos.actualizar_archivo(uid, archivo_id, archivo_data))
            return

        if self.path == '/api/archivos/eliminar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            archivo_id = data.get('id')
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
                
            if not archivo_id:
                self._json({'ok': False, 'error': 'Falta id del archivo'}, status=400)
                return
                
            self._json(mis_archivos.eliminar_archivo(uid, archivo_id))
            return

        if self.path == '/api/archivos/carpeta':
            data = self._leer_json()
            uid = self._usuario_id(data)
            nombre_carpeta = data.get('nombre')
            
            if not _ARCHIVOS_OK:
                self._json({'ok': False, 'error': 'Módulo de archivos no disponible'}, status=500)
                return
                
            if not nombre_carpeta:
                self._json({'ok': False, 'error': 'Falta nombre de carpeta'}, status=400)
                return
                
            self._json(mis_archivos.agregar_carpeta(uid, nombre_carpeta))
            return

        # ============================================================
        # GENERACION DE ARCHIVOS
        # ============================================================
        if self.path == '/api/generar_archivo':
            data = self._leer_json()
            uid = self._usuario_id(data)
            tipo = (data.get('script') or '').strip()
            tema = (data.get('tema') or '').strip()
            modelo_id = data.get('modelo_id', '__principal__')

            if not tipo or not tema:
                self._json({'ok': False, 'error': 'Faltan parametros (script/tema)'}, status=400)
                return

            if tipo not in ('pdf', 'excel', 'dashboard', 'imagenes'):
                self._json({'ok': False, 'error': f'Tipo "{tipo}" no soportado'}, status=400)
                return

            MAPA = {
                'pdf': {'mime': 'application/pdf', 'modulo': 'documento_chat'},
                'excel': {'mime': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'modulo': 'excel_chat'},
                'dashboard': {'mime': 'text/html', 'modulo': 'html_chat'},
                'imagenes': {'mime': 'image/png', 'modulo': 'imagen_chat'},
            }
            conf = MAPA[tipo]

            try:
                modulo = __import__(conf['modulo'])
                prompt = modulo.obtener_prompt(tema)
            except Exception as e:
                self._json({'ok': False, 'error': f'Error cargando herramienta: {e}'}, status=500)
                return

            resp_ia = None
            texto_ia = ""

            for intento in range(1, 3):
                print(f"[GENERADOR] Solicitando JSON a la IA para {tipo} (intento {intento}/2)...")
                try:
                    resp_ia = ia_preguntar(
                        mensaje=prompt,
                        datos_frontend="",
                        usuario_id=uid,
                        modelo_id=modelo_id,
                        historial_previo=[], 
                    )
                except Exception as e:
                    traceback.print_exc()
                    if intento == 2:
                        self._json({'ok': False, 'error': f'Error de IA: {e}'}, status=500)
                        return
                    continue

                if not resp_ia.get('success'):
                    reply_err = (resp_ia.get('reply') or resp_ia.get('error') or '').strip()
                    if 'grande' in reply_err.lower() or 'large' in reply_err.lower():
                        self._json({'ok': False, 'error': 'La respuesta fue demasiado larga para el modelo.'}, status=500)
                        return
                    if intento == 2:
                        self._json({'ok': False, 'error': f"La IA no respondio: {reply_err}"}, status=500)
                        return
                    continue

                texto_ia = (resp_ia.get('reply') or '').strip()
                if texto_ia:
                    break

            if not texto_ia:
                self._json({'ok': False, 'error': 'La IA devolvio una respuesta vacia.'}, status=500)
                return

            if tipo == 'imagenes':
                try:
                    datos = _extraer_json_de_texto(texto_ia)
                    codigo_img = datos.get('codigo', '')
                    ruta_img = modulo.crear(nombre=datos.get('nombre', tema), codigo_python=codigo_img)
                    with open(ruta_img, "rb") as f:
                        b64_img = base64.b64encode(f.read()).decode("utf-8")
                    
                    self._json({
                        'ok': True, 'mensaje': 'Imagen generada.', 'nombre': Path(ruta_img).name,
                        'mime': 'image/png', 'base64': b64_img, 'nombre_real': Path(ruta_img).name,
                        'base64_real': b64_img, 'mime_real': 'image/png', 'contexto': texto_ia
                    })
                    return
                except Exception as e:
                    traceback.print_exc()
                    self._json({'ok': False, 'error': f'Error generando imagen: {e}'}, status=500)
                    return

            try:
                datos = _extraer_json_de_texto(texto_ia)
                codigo_ia = modulo.construir_codigo(datos)
                if RUTA_RUNNER not in sys.path:
                    sys.path.insert(0, RUTA_RUNNER)
                import importlib
                if 'runner' in sys.modules:
                    importlib.reload(sys.modules['runner'])
                from runner import ejecutar_codigo
                ruta_generada = ejecutar_codigo(codigo_ia, tipo)
            except Exception as e:
                traceback.print_exc()
                self._json({'ok': False, 'error': f'Error: {e}'}, status=500)
                return

            try:
                p = Path(ruta_generada)
                contenido_bytes = p.read_bytes()
                b64_preview = base64.b64encode(contenido_bytes).decode('utf-8')
                nombre_preview = p.name
                mime_preview = conf['mime']

                b64_real = b64_preview
                nombre_real = nombre_preview
                mime_real = mime_preview

                if tipo == 'excel':
                    ruta_xlsx = None
                    try: ruta_xlsx = modulo.archivo_real()
                    except Exception: pass
                    if ruta_xlsx:
                        p_real = Path(ruta_xlsx)
                        if p_real.exists():
                            b64_real = base64.b64encode(p_real.read_bytes()).decode('utf-8')
                            nombre_real = p_real.name
                            mime_real = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            try: p_real.unlink()
                            except Exception: pass

                try: shutil.rmtree(p.parent, ignore_errors=True)
                except Exception: pass

                self._json({
                    'ok': True, 'mensaje': f'Archivo {tipo.upper()} generado.', 'nombre': nombre_preview,
                    'mime': mime_preview, 'base64': b64_preview, 'nombre_real': nombre_real,
                    'base64_real': b64_real, 'mime_real': mime_real, 'contexto': datos 
                })
                return
            except Exception as e:
                traceback.print_exc()
                self._json({'ok': False, 'error': str(e)}, status=500)
                return

        if self.path == '/api/chat':
            data = self._leer_json()
            uid = self._usuario_id(data)
            historial_previo = data.get('historial', [])
            modelo_id_solicitado = data.get('modelo_id', '__principal__')

            mensaje_usuario = data.get('mensaje', '') or ''
            datos_frontend = data.get('datos_frontend', '') or ''

            imagen_base64 = data.get('imagen_base64', '') or ''
            archivo_b64 = data.get('archivo_base64', '') or ''
            nombre_archivo = data.get('nombre_archivo', '') or ''
            adjunto_tipo_decl = (data.get('adjunto_tipo') or data.get('tipo_archivo') or '').lower()

            if not archivo_b64:
                archivo_b64 = data.get('adjunto_base64', '') or ''
            if not nombre_archivo:
                nombre_archivo = data.get('adjunto_nombre', '') or ''

            imagenes_extra = []

            if archivo_b64:
                try:
                    if "," in archivo_b64:
                        _, contenido_b64 = archivo_b64.split(",", 1)
                    else:
                        contenido_b64 = archivo_b64

                    import base64 as _b64
                    bytes_archivo = _b64.b64decode(contenido_b64)

                    try:
                        from extractor_archivos import extraer_contenido, dividir_texto_en_trozos
                    except ImportError:
                        if RUTA_IA not in sys.path:
                            sys.path.insert(0, RUTA_IA)
                        from extractor_archivos import extraer_contenido, dividir_texto_en_trozos

                    resultado = extraer_contenido(nombre_archivo, bytes_archivo)
                    texto_archivo = resultado.get("texto", "")
                    imagenes_extra = resultado.get("imagenes", []) or []

                    if not mensaje_usuario:
                        if resultado.get("tipo") == "imagen":
                            mensaje_usuario = f"Analiza la imagen '{nombre_archivo}' y describe su contenido."
                        elif resultado.get("tipo") == "documento":
                            mensaje_usuario = f"Analiza el documento '{nombre_archivo}' y resume su contenido."
                        else:
                            mensaje_usuario = f"Analiza el archivo '{nombre_archivo}'."

                    if len(texto_archivo) > 8000:
                        print(f"[ADJUNTO] Archivo grande detectado ({len(texto_archivo)} chars). Procesando por partes...")
                        trozos = dividir_texto_en_trozos(texto_archivo, tamano_trozo=6000)
                        respuestas_parciales = []

                        for i, trozo in enumerate(trozos):
                            print(f"[ADJUNTO] Procesando parte {i+1}/{len(trozos)}...")
                            prompt_trozo = mensaje_usuario if i == 0 else f"Continuacion del archivo '{nombre_archivo}' (Parte {i+1}). Analiza y extrae lo mas importante de esta seccion."

                            resp_parte = ia_preguntar(
                                mensaje=prompt_trozo,
                                datos_frontend=trozo,
                                usuario_id=uid,
                                modelo_id=modelo_id_solicitado,
                                imagen_base64="",
                                historial_previo=[],
                            )

                            if resp_parte.get("success"):
                                respuestas_parciales.append(resp_parte.get("reply", ""))
                            else:
                                respuestas_parciales.append(f"[Error procesando parte {i+1}: {resp_parte.get('reply')}]")

                        texto_respuesta_final = "\n\n".join(respuestas_parciales)
                        self._json({'success': True, 'reply': texto_respuesta_final})
                        return

                    else:
                        if texto_archivo.strip():
                            contenido_extra = (
                                f"\n\n--- CONTENIDO DEL ARCHIVO ADJUNTO ({nombre_archivo}) ---\n"
                                f"{texto_archivo}\n"
                                f"--------------------------------------------------"
                            )
                            datos_frontend = (datos_frontend + "\n" + contenido_extra).strip()

                    if imagenes_extra and not imagen_base64:
                        if adjunto_tipo_decl == 'image' or len(imagenes_extra) == 1:
                            imagen_base64 = imagenes_extra[0]
                            imagenes_extra = imagenes_extra[1:]

                    print(f"[ADJUNTO] {nombre_archivo} | tipo={resultado.get('tipo')} | "
                          f"texto={len(texto_archivo)} chars | imagenes={len(imagenes_extra) + (1 if imagen_base64 else 0)}")
                except Exception as ex:
                    print(f"[ERROR] No se pudo procesar el archivo adjunto: {ex}")
                    traceback.print_exc()

            self._json(ia_preguntar(
                mensaje=mensaje_usuario,
                datos_frontend=datos_frontend,
                usuario_id=uid,
                modelo_id=modelo_id_solicitado,
                imagen_base64=imagen_base64,
                imagenes_extra=imagenes_extra,
                historial_previo=historial_previo
            ))
            return

        if self.path == '/api/reiniciar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            self._json(ia_reiniciar(uid))
            return

        if self.path == '/api/modelo/activar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = data.get('id')
            if not mid:
                self._json({'ok': False, 'error': "Falta id"}, status=400)
                return

            estado = obtener_estado(uid)

            # LIBERAR MEMORIA RAM DE MODELOS ANTERIORES
            if estado["sesion"] and estado["sesion"].get("modelo_id") != mid:
                print(f"[RAM] Liberando modelo anterior: {estado['sesion']['modelo_id']}")
                try:
                    estado["sesion"]["instancia"].detener()
                except Exception:
                    pass
                estado["sesion"] = None
            
            estado["api_activa"] = None
            guardar_api_activa(uid)
            
            # Si el modelo ya estaba cargado en la RAM, lo reutilizamos
            if mid in estado["sesiones_por_modelo"]:
                modelo_existente = buscar_modelo_por_id(uid, mid)
                if modelo_existente:
                    ia_u = estado["sesiones_por_modelo"][mid]
                    estado["sesion"] = {"instancia": ia_u, "modelo_id": mid}
                    estado["modelo_activo"] = modelo_existente
                    self._json({'ok': True, 'estado': 'activo', 'tipo': 'local', 'modelo': modelo_existente['nombre'],
                                'info': ia_u.get_info_modelo(),
                                'limites': {
                                    'contexto_tokens': modelo_existente.get('contexto_tokens', 4096),
                                    'max_output_tokens': modelo_existente.get('max_output_tokens', 2048),
                                    'max_input_tokens': max(1, modelo_existente.get('contexto_tokens', 4096) - modelo_existente.get('max_output_tokens', 2048)),
                                }})
                    return

            modelo = buscar_modelo_por_id(uid, mid)
            if not modelo:
                self._json({'ok': False, 'error': f"Modelo {mid} no encontrado"}, status=404)
                return

            if not modelo.get('descargado'):
                # *** CAMBIO CLAVE: Actualizar estado de descarga ANTES de lanzar el hilo ***
                with _estado_lock:
                    estado["descargas"][mid] = {
                        "estado": "descargando",
                        "progreso": 1,
                        "mensaje": "Iniciando descarga..."
                    }
                
                threading.Thread(target=_ejecutar_descarga_en_hilo,
                                 args=(uid, mid), daemon=True).start()
                self._json({'ok': True, 'estado': 'descargando',
                            'mensaje': f"Descarga de {modelo['nombre']} iniciada."},
                           status=202)
                return

            ia_u = obtener_ia_para_usuario(uid, modelo)
            if ia_u:
                guardar_modelo_activo_local(uid, mid)
                self._json({'ok': True, 'estado': 'activo', 'tipo': 'local', 'modelo': modelo['nombre'],
                            'info': ia_u.get_info_modelo(),
                            'limites': {
                                'contexto_tokens': modelo.get('contexto_tokens', 4096),
                                'max_output_tokens': modelo.get('max_output_tokens', 2048),
                                'max_input_tokens': max(1,
                                    modelo.get('contexto_tokens', 4096) -
                                    modelo.get('max_output_tokens', 2048)),
                            }})
            else:
                self._json({'ok': False, 'error': 'No se pudo iniciar el modelo local'}, status=500)
            return

        if self.path == '/api/modelo/principal':
            try: data = self._leer_json()
            except Exception: data = {}
            uid = self._usuario_id(data)
            modelo = buscar_modelo_por_id(uid, '__principal__')
            if not modelo:
                self._json({'ok': False, 'error': 'No se encontro modelo principal'}, status=404)
                return
            ia_u = obtener_ia_para_usuario(uid, modelo)
            if ia_u:
                guardar_modelo_activo_local(uid, '__principal__')
                self._json({'ok': True, 'estado': 'activo', 'modelo': modelo['nombre'],
                            'info': ia_u.get_info_modelo()})
            else:
                self._json({'ok': False, 'error': 'No se pudo iniciar el modelo'}, status=500)
            return

        if self.path == '/api/modelo/guardar_params':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = (data.get('id') or '').strip()
            params = data.get('params') or {}
            ok = guardar_config_modelo(uid, mid, params)
            self._json({'ok': ok, 'modelo_id': mid, 'params': params})
            return

        if self.path == '/api/modelo/descargar':
            data = self._leer_json()
            uid = self._usuario_id(data)
            mid = str(data.get('id') or '').strip()
            if not mid:
                self._json({'ok': False, 'error': "Falta id"}, status=400)
                return

            modelo = data.get('modelo')
            if not isinstance(modelo, dict):
                campos_modelo = ('nombre', 'descripcion', 'archivo', 'url',
                                 'hf_repo', 'hf_file', 'hf_revision',
                                 'tamano_gb', 'ram_min_gb', 'vram_min_gb',
                                 'contexto_tokens', 'max_output_tokens')
                if any(k in data for k in campos_modelo):
                    modelo = {k: data[k] for k in campos_modelo if k in data}
                    modelo['id'] = mid

            if isinstance(modelo, dict):
                modelo = dict(modelo)
                modelo['id'] = mid
                if not _guardar_modelo_local_catalogo(uid, modelo):
                    self._json({'ok': False, 'error': 'No se pudo guardar el modelo para el usuario'}, status=500)
                    return

            if not buscar_modelo_por_id(uid, mid):
                self._json({'ok': False, 'error': 'Modelo no encontrado para este usuario. Envia la ficha modelo.'}, status=404)
                return

            threading.Thread(
                target=_ejecutar_descarga_en_hilo,
                args=(uid, mid, modelo if isinstance(modelo, dict) else None),
                daemon=True,
                name=f"descarga-{uid}-{mid}"
            ).start()
            self._json({'ok': True, 'estado': 'descargando', 'usuario_id': uid, 'modelo_id': mid}, status=202)
            return

        if self.path == '/api/tienda/buscar':
            data = self._leer_json()
            self._json(buscar_modelos_hf(query=(data.get('query') or '').strip(), limite=int(data.get('limite') or 30)))
            return

        if self.path == '/api/tienda/archivos':
            data = self._leer_json()
            self._json(listar_archivos_hf((data.get('repo_id') or '').strip()))
            return

        if self.path == '/api/tienda/instalar':
            data = self._leer_json()
            uid = self._usuario_id(data)

            repo_id = (data.get('repo_id') or '').strip()
            archivo = (data.get('archivo') or '').strip()
            nombre = (data.get('nombre') or '').strip()

            if not repo_id:
                self._json({'ok': False, 'error': 'Falta repo_id'}, status=400)
                return

            if not archivo:
                self._json({'ok': False, 'error': 'Falta archivo GGUF'}, status=400)
                return

            if not nombre:
                nombre = repo_id.split('/')[-1] or 'Modelo'

            modelo_id = 'hf-' + _sanitizar_nombre_modelo(
                repo_id.replace('/', '-') + '-' + archivo
            )

            ctx, out = _leer_contexto_modelo(archivo)

            modelo = {
                'id': modelo_id,
                'nombre': nombre,
                'descripcion': f'Modelo Hugging Face: {repo_id}',
                'familia': 'Hugging Face',
                'licencia': '',
                'contexto': '',
                'contexto_tokens': ctx,
                'max_output_tokens': out,
                'max_input_tokens': max(1, ctx - out),
                'tamano_gb': 0,
                'ram_min_gb': 0,
                'vram_min_gb': 0,
                'autor': repo_id.split('/')[0] if '/' in repo_id else '',
                'hf_repo': repo_id,
                'hf_file': archivo,
                'hf_revision': (data.get('revision') or 'main').strip() or 'main',
                'archivo': Path(archivo).name,
                'url': '',
                'descargado': False,
            }

            if not _guardar_modelo_local_catalogo(uid, modelo):
                self._json({
                    'ok': False,
                    'error': f'No se pudo guardar el modelo para {uid}'
                }, status=500)
                return

            modelo_guardado = buscar_modelo_por_id(uid, modelo_id)
            if not modelo_guardado:
                self._json({
                    'ok': False,
                    'error': 'El modelo no quedo registrado en el catalogo del usuario'
                }, status=500)
                return

            estado = obtener_estado(uid)
            with _estado_lock:
                estado['descargas'][modelo_id] = {
                    'estado': 'iniciando',
                    'progreso': 0,
                    'mensaje': 'En cola...',
                    'modelo': modelo_id,
                    'usuario': uid,
                }

            threading.Thread(
                target=_ejecutar_descarga_en_hilo,
                args=(uid, modelo_id),
                daemon=True
            ).start()

            self._json({
                'ok': True,
                'estado': 'descargando',
                'usuario_id': uid,
                'modelo': {
                    'id': modelo_id,
                    'nombre': nombre,
                    'repo_id': repo_id,
                    'archivo': archivo,
                }
            }, status=202)
            return

        self._json({'error': 'not_found'}, status=404)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Permitir imágenes externas (https, http, data) y estilos inline
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; "
            "img-src 'self' data: blob: https: http:; "
            "style-src 'self' 'unsafe-inline' https:; "
            "font-src 'self' https: data:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "connect-src 'self' https: http:;"
        )
        super().end_headers()


def puerto_libre(inicial):
    for p in range(inicial, inicial + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p)); return p
            except OSError:
                continue
    raise RuntimeError("No hay puerto libre")

def levantar_servidor(puerto):
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", puerto), Handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


class Api:
    def ping(self): return "pong"
    def estado(self):
        estado = obtener_estado(USUARIO_ADMIN)
        return {'listo': True, 'sesiones_activas': 1 if estado["sesion"] else 0}
    def preguntar(self, mensaje, datos_frontend, usuario_id=USUARIO_ADMIN):
        return ia_preguntar(mensaje, datos_frontend, usuario_id)
    def reiniciar(self, usuario_id=USUARIO_ADMIN):
        return ia_reiniciar(usuario_id)

    def guardar_archivo(self, nombre_archivo, base64_data):
        try:
            import tkinter as tk
            from tkinter import filedialog
            contenido = base64.b64decode(base64_data)
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            ruta_guardado = filedialog.asksaveasfilename(
                defaultextension=f".{nombre_archivo.split('.')[-1]}",
                initialfile=nombre_archivo,
                title="Guardar archivo generado",
                filetypes=[("Todos los archivos", "*.*")]
            )
            if ruta_guardado:
                with open(ruta_guardado, 'wb') as f:
                    f.write(contenido)
                root.destroy()
                return {"ok": True, "ruta": ruta_guardado}
            else:
                root.destroy()
                return {"ok": False, "error": "Cancelado por el usuario"}
        except Exception as e:
            return {"ok": False, "error": str(e)}


def main():
    try:
        ruta_main = os.path.join(RAIZ, PAGINA_INICIAL)
        if not os.path.isfile(ruta_main):
            print("ERROR: no se encontro %s" % ruta_main, file=sys.stderr)
            return 1

        asegurar_dirs_usuario(USUARIO_ADMIN)
        if _USUARIOS_OK:
            try: usuarios.crear_admin_por_defecto()
            except Exception: pass

        puerto = puerto_libre(PUERTO_PREFERIDO)
        httpd = levantar_servidor(puerto)
        url = "http://127.0.0.1:%d/%s" % (puerto, PAGINA_INICIAL)

        cargar_api_activa(USUARIO_ADMIN)
        restaurar_modelo_local_activo(USUARIO_ADMIN)
        cargar_modulo_ia()

        api = Api()
        window = webview.create_window(TITULO, url, width=ANCHO, height=ALTO,
                                       min_size=(1024, 640), text_select=True, js_api=api)

        def on_loaded():
            try:
                window.maximize()
            except Exception as e:
                print(f"No se pudo maximizar automaticamente: {e}")

        window.events.loaded += on_loaded

        webview.start(debug=DEBUG)
    except Exception as e:
        traceback.print_exc()
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())