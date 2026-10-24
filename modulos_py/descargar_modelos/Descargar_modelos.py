#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CORETEKS - Descargador de modelos por usuario.

Cada usuario tiene su propio catalogo, carpeta de descargas y logs:
modelos/<usuario>/descargas_modelos/
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from huggingface_hub import hf_hub_download
    from huggingface_hub.utils import HfHubHTTPError
    _HF_OK = True
except ImportError:
    hf_hub_download = None
    HfHubHTTPError = Exception
    _HF_OK = False

try:
    import psutil
    _PSUTIL_OK = True
except ImportError:
    psutil = None
    _PSUTIL_OK = False

BASE_DIR = Path(__file__).resolve().parent
# Si el archivo vive en modulos_py/descargar_modelos/, subimos hasta el proyecto.
RAIZ_PROYECTO = BASE_DIR
for _ in range(3):
    if (RAIZ_PROYECTO / "main.py").exists():
        break
    RAIZ_PROYECTO = RAIZ_PROYECTO.parent

USUARIO_ADMIN = "admin@coreteks.com"
MODELOS_DIR = RAIZ_PROYECTO / "modelos"
CHUNK_SIZE = 1024 * 1024
TIMEOUT = 60


def slug_usuario(usuario):
    usuario = str(usuario or USUARIO_ADMIN).strip().lower()
    usuario = re.sub(r"[^a-z0-9@._-]+", "_", usuario)
    return usuario or USUARIO_ADMIN


def sanitizar_nombre(nombre):
    nombre = str(nombre or "modelo").strip()
    nombre = re.sub(r'[<>:"/\\|?*]+', "_", nombre)
    nombre = re.sub(r"\s+", "_", nombre)
    return nombre.strip("._ ") or "modelo"


def dir_usuario(usuario):
    return MODELOS_DIR / slug_usuario(usuario)


def descargas_dir(usuario):
    return dir_usuario(usuario) / "descargas_modelos"


def url_modelos_dir(usuario):
    return descargas_dir(usuario) / "url_modelos"


def logs_dir(usuario):
    return descargas_dir(usuario) / "logs"


def asegurar_directorios(usuario):
    for d in (dir_usuario(usuario), descargas_dir(usuario), url_modelos_dir(usuario), logs_dir(usuario)):
        d.mkdir(parents=True, exist_ok=True)


def log(msg, usuario=USUARIO_ADMIN, nivel="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    linea = f"[{timestamp}] [{nivel}] [{slug_usuario(usuario)}] {msg}"
    try:
        print(linea)
    except UnicodeEncodeError:
        print(linea.encode("ascii", "replace").decode("ascii"))
    try:
        asegurar_directorios(usuario)
        ruta = logs_dir(usuario) / f"descargas_{datetime.now():%Y-%m-%d}.log"
        with ruta.open("a", encoding="utf-8") as f:
            f.write(linea + "\n")
    except Exception:
        pass


def formatear_bytes(n):
    n = float(n or 0)
    for u in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.2f} {u}"
        n /= 1024
    return f"{n:.2f} PB"


def formatear_tiempo(s):
    if s < 0 or s == float("inf"):
        return "--:--:--"
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sg = int(s % 60)
    return f"{h:02d}:{m:02d}:{sg:02d}"


def detectar_ram_gb():
    if not _PSUTIL_OK:
        return 0
    try:
        return round(psutil.virtual_memory().total / (1024 ** 3), 1)
    except Exception:
        return 0


def evaluar_compatibilidad_modelo(ram_total_gb, tamano_modelo_gb, ram_min_gb=0, factor=2.0):
    presupuesto = round(ram_total_gb / factor, 2) if ram_total_gb and factor > 0 else 0
    consumo = round((float(tamano_modelo_gb or 0)) * 1.2, 2)
    ram_min = float(ram_min_gb or 0)

    if ram_total_gb <= 0:
        return {"apto": True, "nivel": "desconocido", "motivo": "No se pudo detectar la RAM.",
                "presupuesto_gb": presupuesto, "consumo_estimado_gb": consumo}
    if ram_min > ram_total_gb:
        return {"apto": False, "nivel": "no_apto", "motivo": f"Requiere al menos {ram_min} GB de RAM.",
                "presupuesto_gb": presupuesto, "consumo_estimado_gb": consumo}
    if consumo > presupuesto:
        return {"apto": False, "nivel": "no_apto", "motivo": f"Consumo estimado {consumo} GB > presupuesto {presupuesto} GB.",
                "presupuesto_gb": presupuesto, "consumo_estimado_gb": consumo}
    if consumo > presupuesto * 0.8:
        return {"apto": True, "nivel": "ajustado", "motivo": f"Consumo estimado {consumo} GB cerca del limite ({presupuesto} GB).",
                "presupuesto_gb": presupuesto, "consumo_estimado_gb": consumo}
    return {"apto": True, "nivel": "ok", "motivo": f"Compatible: {consumo} GB de {presupuesto} GB disponibles.",
            "presupuesto_gb": presupuesto, "consumo_estimado_gb": consumo}


def cargar_modelos(usuario):
    asegurar_directorios(usuario)
    modelos = []
    for archivo in sorted(url_modelos_dir(usuario).glob("*.json")):
        try:
            data = json.loads(archivo.read_text(encoding="utf-8"))
            if not data.get("id") or not data.get("nombre"):
                log(f"JSON invalido: {archivo.name}", usuario, "WARN")
                continue
            if not data.get("url") and not data.get("hf_repo"):
                log(f"JSON sin url ni hf_repo: {archivo.name}", usuario, "WARN")
                continue
            data["_archivo_origen"] = archivo.name
            modelos.append(data)
        except json.JSONDecodeError as e:
            log(f"Error parseando {archivo.name}: {e}", usuario, "ERROR")
        except Exception as e:
            log(f"Error leyendo {archivo.name}: {e}", usuario, "ERROR")
    return modelos


def archivo_modelo(modelo, usuario):
    nombre = sanitizar_nombre(modelo.get("nombre") or modelo.get("id"))
    carpeta = descargas_dir(usuario) / nombre
    archivo = modelo.get("archivo") or str(modelo.get("hf_file") or "").replace("\\", "/").split("/")[-1]
    archivo = os.path.basename(archivo) if archivo else f"{sanitizar_nombre(modelo.get('id'))}.gguf"
    return carpeta, carpeta / archivo


def listar_modelos(modelos, usuario):
    if not modelos:
        print("\nNo hay modelos disponibles.\n")
        return
    print("\n" + "=" * 105)
    print(f" MODELOS DE: {slug_usuario(usuario)}")
    print("=" * 105)
    for m in modelos:
        carpeta, destino = archivo_modelo(m, usuario)
        part = destino.with_suffix(destino.suffix + ".part")
        estado = "[OK]" if destino.exists() and destino.stat().st_size > 0 else "[PARCIAL]" if part.exists() else "[PENDIENTE]"
        modo = "HF" if m.get("hf_repo") else "URL"
        print(f" {m['id']:<42} {modo:<4} {estado:<10} {carpeta}")
    print("=" * 105 + "\n")


def descargar_por_url(url, destino, nombre_modelo, usuario, tamano_esperado_gb=None):
    destino = Path(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    if destino.exists() and destino.stat().st_size > 0:
        log(f"Ya existe: {destino}", usuario)
        return True

    reanudar = parcial.stat().st_size if parcial.exists() else 0
    headers = {"User-Agent": "CORETEKS-Descargador/1.0", "Accept": "*/*"}
    if reanudar:
        headers["Range"] = f"bytes={reanudar}-"

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            status = getattr(response, "status", 200)
            content_length = response.headers.get("Content-Length")
            if reanudar and status != 206:
                reanudar = 0
            total = int(content_length) + reanudar if content_length else None
            if total is None and tamano_esperado_gb:
                total = int(float(tamano_esperado_gb) * 1024 ** 3)

            inicio = time.time()
            leido = reanudar
            modo = "ab" if reanudar else "wb"
            log(f"Iniciando descarga: {nombre_modelo}", usuario)
            with parcial.open(modo) as f:
                while True:
                    chunk = response.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    f.write(chunk)
                    leido += len(chunk)
                    if total:
                        pct = min(100, leido * 100 / total)
                        print(f"\r  {pct:6.2f}%  {formatear_bytes(leido)}/{formatear_bytes(total)}", end="", flush=True)
            print()
        if parcial.stat().st_size <= 0:
            raise IOError("El servidor devolvio un archivo vacio")
        os.replace(parcial, destino)
        log(f"[OK] Descarga completada: {destino}", usuario, "OK")
        return True
    except urllib.error.HTTPError as e:
        log(f"[X] HTTP {e.code}: {e.reason}", usuario, "ERROR")
    except urllib.error.URLError as e:
        log(f"[X] Conexion: {e.reason}", usuario, "ERROR")
    except Exception as e:
        log(f"[X] Error: {e}", usuario, "ERROR")
    return False


def descargar_por_hf(repo_id, filename, carpeta_destino, nombre_modelo, usuario, revision="main", token=None):
    if not _HF_OK:
        log("[X] huggingface_hub no esta instalado", usuario, "ERROR")
        return False
    carpeta_destino = Path(carpeta_destino)
    carpeta_destino.mkdir(parents=True, exist_ok=True)
    destino = carpeta_destino / os.path.basename(filename)
    if destino.exists() and destino.stat().st_size > 0:
        log(f"Ya existe: {destino}", usuario)
        return True
    try:
        log(f"Iniciando descarga HF: {repo_id}/{filename}", usuario)
        ruta = Path(hf_hub_download(repo_id=repo_id, filename=filename, revision=revision,
                                    token=token, local_dir=str(carpeta_destino)))
        if not ruta.exists():
            candidato = carpeta_destino / os.path.basename(filename)
            if candidato.exists():
                ruta = candidato
            else:
                raise FileNotFoundError(f"No se encontro el archivo descargado en {carpeta_destino}")
        if ruta.resolve() != destino.resolve():
            shutil.copy2(ruta, destino)
        log(f"[OK] Descarga HF completada: {destino}", usuario, "OK")
        return True
    except HfHubHTTPError as e:
        log(f"[X] Error HF: {e}", usuario, "ERROR")
    except Exception as e:
        log(f"[X] Error HF: {e}", usuario, "ERROR")
    return False


def descargar_modelo(modelo, usuario, ram_total_gb=0, factor=2.0, forzar=False):
    usuario = slug_usuario(usuario)
    asegurar_directorios(usuario)
    nombre = modelo.get("nombre", modelo.get("id", "modelo"))
    carpeta, destino = archivo_modelo(modelo, usuario)
    carpeta.mkdir(parents=True, exist_ok=True)

    if not forzar and ram_total_gb > 0:
        compat = evaluar_compatibilidad_modelo(ram_total_gb, modelo.get("tamano_gb", 0), modelo.get("ram_min_gb", 0), factor)
        if not compat["apto"]:
            log(f"[X] Modelo no compatible: {compat['motivo']}", usuario, "ERROR")
            return False
        log(f"Compatibilidad: {compat['motivo']}", usuario)

    # La ficha tambien se guarda junto al modelo, pero el catalogo fuente es privado del usuario.
    try:
        (carpeta / "modelo.json").write_text(json.dumps(modelo, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        log(f"No se pudo guardar modelo.json: {e}", usuario, "WARN")

    if modelo.get("hf_repo"):
        return descargar_por_hf(
            modelo["hf_repo"], modelo.get("hf_file") or destino.name, carpeta, nombre,
            usuario, modelo.get("hf_revision", "main"), modelo.get("hf_token")
        )
    if modelo.get("url"):
        return descargar_por_url(modelo["url"], destino, nombre, usuario, modelo.get("tamano_gb"))
    log("[X] Modelo sin url ni hf_repo", usuario, "ERROR")
    return False


def main():
    parser = argparse.ArgumentParser(description="CORETEKS - Descargador de modelos por usuario")
    parser.add_argument("--usuario", "-u", default=USUARIO_ADMIN, help="ID/email del usuario propietario")
    parser.add_argument("--modelo", "-m", help="ID del modelo")
    parser.add_argument("--listar", "-l", action="store_true")
    parser.add_argument("--listar-compat", action="store_true")
    parser.add_argument("--json", "-j", help="JSON de modelo especifico")
    parser.add_argument("--factor", "-f", type=float, default=2.0)
    parser.add_argument("--forzar", action="store_true")
    args = parser.parse_args()

    usuario = slug_usuario(args.usuario)
    asegurar_directorios(usuario)
    ram = detectar_ram_gb()

    print("=" * 70)
    print("CORETEKS - DESCARGA POR USUARIO")
    print(f"Usuario         : {usuario}")
    print(f"Modelos         : {MODELOS_DIR}")
    print(f"Descargas       : {descargas_dir(usuario)}")
    print(f"Catalogo        : {url_modelos_dir(usuario)}")
    print(f"Logs            : {logs_dir(usuario)}")
    print(f"RAM total       : {ram} GB")
    print("=" * 70)

    if args.json:
        ruta = Path(args.json)
        if not ruta.exists():
            log(f"No existe: {ruta}", usuario, "ERROR")
            return 1
        modelos = [json.loads(ruta.read_text(encoding="utf-8"))]
        # Copiar el JSON al catalogo privado del usuario.
        modelo = modelos[0]
        mid = modelo.get("id")
        if mid:
            (url_modelos_dir(usuario) / f"{sanitizar_nombre(mid)}.json").write_text(
                json.dumps(modelo, indent=2, ensure_ascii=False), encoding="utf-8"
            )
    else:
        modelos = cargar_modelos(usuario)

    if args.modelo:
        modelos = [m for m in modelos if m.get("id") == args.modelo]
        if not modelos:
            log(f"No se encontro el modelo '{args.modelo}' para '{usuario}'", usuario, "ERROR")
            return 1

    if not modelos:
        log("No hay modelos disponibles para este usuario", usuario, "WARN")
        return 0

    if args.listar:
        listar_modelos(modelos, usuario)
        return 0

    exitos = fallos = 0
    for modelo in modelos:
        try:
            if descargar_modelo(modelo, usuario, ram, args.factor, args.forzar):
                exitos += 1
            else:
                fallos += 1
        except KeyboardInterrupt:
            log("Interrumpido por el usuario", usuario, "WARN")
            break
        except Exception as e:
            log(f"Error procesando {modelo.get('id')}: {e}", usuario, "ERROR")
            fallos += 1

    print("=" * 70)
    print(f"RESUMEN: {exitos} OK, {fallos} fallos")
    print(f"Usuario: {usuario}")
    print(f"Carpeta: {descargas_dir(usuario)}")
    print("=" * 70)
    return 0 if fallos == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
