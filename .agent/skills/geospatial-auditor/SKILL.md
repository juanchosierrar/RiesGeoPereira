---
name: geospatial-auditor
description: >
  Herramienta de auditoría geoespacial para el agente Auditor-Datos_Abiertos.
  Ejecuta análisis automático ISO 19157 / ISO 19115 / Resolución IGAC 471-2020 sobre
  archivos GeoJSON, Shapefile (.zip), KML y CSV con coordenadas.
  Produce scores 0.0–1.0 por dimensión, diagnóstico de CRS y recomendaciones de corrección.
---

# Skill: Geospatial Auditor Tool

## Propósito

Automatizar el análisis de calidad de datos geoespaciales usando Python/GeoPandas,
siguiendo el estándar **ISO 19157** y la normativa colombiana (**IGAC Res. 471/2020 — EPSG:9377**).

## Cuándo Usarlo

- El usuario solicita auditar un archivo geoespacial (GeoJSON, SHP, KML, CSV).
- Se necesita generar la Matriz de Radar ISO 19157.
- Se requiere verificar conformidad CRS con MAGNA-SIRGAS (EPSG:9377).
- Se quiere detectar nulos, errores topológicos, o mojibake en atributos.

## Cómo Ejecutarlo

```bash
python .agent/skills/geospatial-auditor/scripts/geospatial_auditor_tool.py --file <ruta_al_archivo>
```

### Argumentos

| Argumento | Requerido | Descripción |
|-----------|-----------|-------------|
| `--file`  | ✅ Sí  | Ruta al archivo (GeoJSON, .zip SHP, KML, CSV) |
| `--bbox`  | No  | BBox de referencia `xmin,ymin,xmax,ymax` (default: Pereira) |
| `--output`| No  | Ruta JSON de salida del reporte |

### Output Esperado

```json
{
  "estado": "CUMPLE PARCIALMENTE",
  "crs": { "detectado": "EPSG:4326", "cumple_471": false },
  "scores": {
    "completitud": 0.82,
    "consistencia_logica": 0.65,
    "exactitud_posicional": 0.70,
    "exactitud_tematica": 0.55,
    "exactitud_temporal": 0.40
  },
  "hallazgos": [...],
  "hoja_de_ruta": [...]
}
```

## Dependencias Requeridas

```bash
pip install geopandas shapely pyproj lxml fastkml pandas
```

## Reglas de Uso para el Agente

1. **Ejecutar PRIMERO** el script antes de generar el informe.
2. **Nunca asumir el CRS** — si no se detecta, reportarlo como error crítico.
3. Usar los `scores` del JSON para poblar la Matriz de Radar (Sección II del output).
4. Traducir los `hallazgos` en lenguaje claro para la Hoja de Ruta (Sección III).
