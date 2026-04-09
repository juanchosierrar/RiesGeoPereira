import boto3
from botocore import UNSIGNED
from botocore.config import Config
from datetime import datetime, timedelta
import os
import io
import base64
from PIL import Image
import numpy as np

# Configuración del Radar Quibdó (R12)
RADAR_METADATA = {
    "Quibdo": {
        "id": "QUI",
        "lat": 5.69,
        "lon": -76.65,
        "range_km": 240,
        "s3_name": "Quibdo"
    }
}

BUCKET_NAME = "s3-radaresideam"
REGION_NAME = "us-east-1"

def get_latest_radar_file(station_name="Quibdo"):
    """Busca el archivo RAW más reciente en S3 para la estación dada."""
    s3 = boto3.client('s3', region_name=REGION_NAME, config=Config(signature_version=UNSIGNED))
    
    # Intentar con la fecha actual y la anterior (por si es medianoche UTC)
    now = datetime.utcnow()
    dates_to_check = [now, now - timedelta(days=1)]
    
    for date in dates_to_check:
        prefix = f"l2_data/{date.year}/{date.month:02d}/{date.day:02d}/{station_name}/"
        try:
            response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
            if 'Contents' in response:
                # Ordenar por fecha de última modificación
                sorted_files = sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True)
                return sorted_files[0]['Key']
        except Exception as e:
            print(f"Error listing S3 for {prefix}: {e}")
            continue
            
    return None

def generate_radar_layer(station_key="Quibdo"):
    """
    Descarga, procesa y genera la imagen del radar.
    Para esta versión, generamos una huella sintética basada en la ubicación real 
    mientras se validan las librerías xradar en el servidor.
    """
    metadata = RADAR_METADATA.get(station_key)
    if not metadata:
        raise ValueError(f"Estación {station_key} no configurada.")

    latest_key = get_latest_radar_file(metadata['s3_name'])
    if not latest_key:
        # Si no hay archivos recientes, devolvemos un estado vacío o error
        return {"error": "No se encontraron datos recientes en el IDEAM."}

    # Coordenadas aproximadas del recuadro (Bounds)
    # 240km en grados es aprox 2.16 grados de lat/lon
    half_side = 2.16
    bounds = [
        [metadata['lon'] - half_side, metadata['lat'] - half_side], # SW
        [metadata['lon'] + half_side, metadata['lat'] - half_side], # SE
        [metadata['lon'] + half_side, metadata['lat'] + half_side], # NE
        [metadata['lon'] - half_side, metadata['lat'] + half_side]  # NW
    ]

    # Generación de imagen (Simulación de datos RAW a Reflectividad)
    # En una fase siguiente, usaremos xradar para procesar el binario real.
    img = Image.new('RGBA', (500, 500), (0, 0, 0, 0))
    # Simulación de mancha de lluvia estéticamente agradable para Pereira
    # lat_pereira = 4.81, lon_pereira = -75.69
    
    # TODO: Integrar xradar.decode_iris(file_content) aquí
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "station": station_key,
        "file": latest_key,
        "image_base64": f"data:image/png;base64,{img_str}",
        "bounds": bounds,
        "timestamp": datetime.now().isoformat()
    }

def generate_siata_layer():
    """
    Consume el JSON de SIATA para el radar de Santa Elena.
    URL: https://siata.gov.co/data/siata_app/radar_ulthorasantaElena.json
    """
    import requests
    try:
        url_json = "https://siata.gov.co/data/siata_app/radar_ulthorasantaElena.json"
        response = requests.get(url_json, timeout=10)
        data = response.json()
        
        # SIATA entrega la URL de la imagen en el JSON
        # Estructura: {"radar": [{"url": "...", "hora": "...", "fecha": "..."}]}
        radar_info = data.get("radar", [{}])[0]
        image_url = radar_info.get("url")
        
        if not image_url:
            # Fallback a la imagen estándar si el JSON falla
            image_url = "https://siata.gov.co/data/siata_app/ultima_imagen_radarDBZH.png"

        # Coordenadas geográficas para Santa Elena (R1)
        # Basado en la proyección SIATA: Centro 6.2308, -75.4983
        # Radio aprox de 120km para este producto específico
        half_side = 1.08 # Aprox 120km en grados
        lat_c, lon_c = 6.2308, -75.4983
        
        bounds = [
            [lon_c - half_side, lat_c - half_side], # SW
            [lon_c + half_side, lat_c - half_side], # SE
            [lon_c + half_side, lat_c + half_side], # NE
            [lon_c - half_side, lat_c + half_side]  # NW
        ]

        return {
            "station": "Santa Elena",
            "source": "SIATA",
            "image_url": image_url,
            "bounds": bounds,
            "timestamp": f"{radar_info.get('fecha')} {radar_info.get('hora')}"
        }
    except Exception as e:
        print(f"Error in SIATA service: {e}")
        return {"error": str(e)}
