import os
import json
import time
from pathlib import Path

def _slug_usuario(usuario_id):
    s = (usuario_id or "admin@coreteks.com").strip().lower()
    return s

def _carpeta_historiales(usuario_id):
    # Asume que MODELOS_DIR o la estructura base está en el directorio del proyecto
    base_dir = Path(__file__).resolve().parent
    # Se almacenará en modelos/<usuario>/historiales_chat/
    from main import dir_usuario # O ruta equivalente de tu proyecto
    carp = dir_usuario(usuario_id) / "historiales_chat"
    carp.mkdir(parents=True, exist_ok=True)
    return carp

def listar_conversaciones(usuario_id):
    """Devuelve la lista de conversaciones guardadas para el usuario, ordenadas de más reciente a más antigua."""
    carp = _carpeta_historiales(usuario_id)
    conversaciones = []
    for archivo in carp.glob("*.json"):
        try:
            data = json.loads(archivo.read_text(encoding="utf-8"))
            conversaciones.append({
                "id": data.get("id"),
                "titulo": data.get("titulo", "Nueva conversación"),
                "actualizado": data.get("actualizado", time.time())
            })
        except Exception:
            pass
    # Ordenar por fecha de actualización descendente
    conversaciones.sort(key=lambda x: x["actualizado"], reverse=True)
    return conversaciones

def obtener_conversacion(usuario_id, conv_id):
    """Obtiene los detalles y mensajes de una conversación específica."""
    carp = _carpeta_historiales(usuario_id)
    archivo = carp / f"{conv_id}.json"
    if not archivo.exists():
        return None
    try:
        return json.loads(archivo.read_text(encoding="utf-8"))
    except Exception:
        return None

def guardar_conversacion(usuario_id, conv_id, titulo, mensajes):
    """Crea o actualiza una conversación con sus respectivos mensajes."""
    carp = _carpeta_historiales(usuario_id)
    archivo = carp / f"{conv_id}.json"
    
    data = {
        "id": conv_id,
        "titulo": titulo or "Nueva conversación",
        "actualizado": time.time(),
        "mensajes": mensajes or []
    }
    try:
        archivo.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return True
    except Exception as e:
        print(f"Error al guardar conversación {conv_id} para {usuario_id}: {e}")
        return False

def eliminar_conversacion(usuario_id, conv_id):
    """Elimina una conversación del disco."""
    carp = _carpeta_historiales(usuario_id)
    archivo = carp / f"{conv_id}.json"
    try:
        if archivo.exists():
            archivo.unlink()
            return True
    except Exception as e:
        print(f"Error al eliminar conversación {conv_id}: {e}")
    return False