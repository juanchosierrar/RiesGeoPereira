#!/usr/bin/env python3
"""
geospatial_auditor_tool.py
Auditoría automática ISO 19157 / ISO 19115 / IGAC Res. 471-2020 (EPSG:9377)
Agente: Auditor-Datos_Abiertos | Skill: geospatial-auditor
"""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
import tempfile
import os
import re
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
PEREIRA_BBOX = (-75.80, 4.60, -75.45, 4.95)  # xmin, ymin, xmax, ymax
EPSG_9377 = "EPSG:9377"   # MAGNA-SIRGAS Origen Nacional (obligatorio IGAC 471-2020)
EPSG_4326 = "EPSG:4326"

LEGACY_CRS = {
    "EPSG:21896": "Bogotá (origen antiguo)",
    "EPSG:21897": "Colombia Oeste (origen antiguo)",
    "EPSG:21898": "Colombia Este (origen antiguo)",
    "EPSG:21899": "Colombia Este Este (origen antiguo)",
    "EPSG:3116": "MAGNA-SIRGAS Colombia Oeste (plana, no 9377)",
    "EPSG:3117": "MAGNA-SIRGAS Colombia Bogotá (plana, no 9377)",
    "EPSG:3118": "MAGNA-SIRGAS Colombia Este (plana, no 9377)",
}

STATUS_OK    = "CUMPLE"
STATUS_WARN  = "CUMPLE PARCIALMENTE"
STATUS_FAIL  = "NO CUMPLE"

# ---------------------------------------------------------------------------
# Importaciones opcionales (reportamos si faltan)
# ---------------------------------------------------------------------------
def _require_geopandas():
    try:
        import geopandas as gpd
        return gpd
    except ImportError:
        print("[ERROR] GeoPandas no instalado. Ejecuta: pip install geopandas shapely pyproj lxml fastkml pandas", file=sys.stderr)
        sys.exit(1)

def _require_pandas():
    try:
        import pandas as pd
        return pd
    except ImportError:
        print("[ERROR] Pandas no instalado. Ejecuta: pip install pandas", file=sys.stderr)
        sys.exit(1)

# ---------------------------------------------------------------------------
# Carga de archivos
# ---------------------------------------------------------------------------
def load_geodataframe(file_path: Path):
    gpd = _require_geopandas()
    ext = file_path.suffix.lower()

    if ext == ".geojson" or ext == ".json":
        return gpd.read_file(file_path)

    if ext == ".zip":
        with tempfile.TemporaryDirectory() as tmp:
            with zipfile.ZipFile(file_path, "r") as zf:
                zf.extractall(tmp)
            shp_files = list(Path(tmp).rglob("*.shp"))
            if not shp_files:
                raise ValueError("El .zip no contiene ningún archivo .shp")
            return gpd.read_file(shp_files[0])

    if ext == ".kml":
        gpd.io.file.fiona_env()
        import fiona
        fiona.supported_drivers["KML"] = "rw"
        return gpd.read_file(file_path, driver="KML")

    if ext in (".csv", ".xlsx", ".xls"):
        pd = _require_pandas()
        df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)
        # Detección heurística de columnas de coordenadas
        lat_col = next((c for c in df.columns if c.lower() in ("lat", "latitude", "latitud", "y")), None)
        lon_col = next((c for c in df.columns if c.lower() in ("lon", "lng", "longitude", "longitud", "x")), None)
        if not lat_col or not lon_col:
            raise ValueError("CSV sin columnas lat/lon reconocibles. Verifica los encabezados.")
        from shapely.geometry import Point
        geometry = gpd.points_from_xy(df[lon_col], df[lat_col])
        return gpd.GeoDataFrame(df, geometry=geometry, crs=EPSG_4326)

    raise ValueError(f"Formato no soportado: {ext}. Usa GeoJSON, .zip (SHP), KML o CSV.")


# ---------------------------------------------------------------------------
# Dimensiones ISO 19157
# ---------------------------------------------------------------------------
def score_completitud(gdf) -> tuple[float, list[str]]:
    """Proporción de celdas no nulas."""
    pd = _require_pandas()
    hallazgos = []
    if gdf.empty:
        return 0.0, ["El archivo no contiene entidades (features)."]

    total_cells = gdf.shape[0] * (gdf.shape[1] - 1)  # excluye geometry col
    null_cells = gdf.drop(columns="geometry").isnull().sum().sum()
    score = round(1.0 - (null_cells / total_cells), 3) if total_cells > 0 else 0.0

    if null_cells > 0:
        top_nulls = gdf.drop(columns="geometry").isnull().sum().sort_values(ascending=False)
        top_nulls = top_nulls[top_nulls > 0].head(5)
        hallazgos.append(f"Se detectaron {int(null_cells)} celdas nulas en {int((gdf.shape[1]-1))} atributos.")
        for col, n in top_nulls.items():
            pct = round(n / gdf.shape[0] * 100, 1)
            hallazgos.append(f"  · '{col}': {n} nulos ({pct}%)")

    return score, hallazgos


def score_consistencia_logica(gdf) -> tuple[float, list[str]]:
    """Detección de geometrías inválidas, duplicadas o vacías."""
    hallazgos = []
    total = len(gdf)
    if total == 0:
        return 0.0, ["Sin entidades para evaluar."]

    invalidas = gdf[~gdf.geometry.is_valid].shape[0]
    vacias    = gdf[gdf.geometry.is_empty].shape[0]
    nulas     = gdf[gdf.geometry.isna()].shape[0]
    duplicadas = gdf[gdf.geometry.duplicated()].shape[0]

    errores = invalidas + vacias + nulas
    score = round(1.0 - (errores / total), 3)

    if invalidas:
        hallazgos.append(f"{invalidas} geometría(s) inválida(s) detectadas (self-intersections, rings mal cerrados).")
        hallazgos.append("  → Corrección: En QGIS → Vectorial → Herramientas de geometría → Corregir geometrías.")
        hallazgos.append("  → Python: gdf.geometry = gdf.geometry.buffer(0)")
    if vacias:
        hallazgos.append(f"{vacias} geometría(s) vacía(s). Elimínalas o revisa el proceso de exportación.")
    if nulas:
        hallazgos.append(f"{nulas} geometría(s) nulas (NULL). No son válidas en ningún estándar GIS.")
    if duplicadas:
        hallazgos.append(f"{duplicadas} geometría(s) duplicadas exactas. Pueden indicar errores de digitalización.")

    return max(score, 0.0), hallazgos


def score_exactitud_posicional(gdf, bbox: tuple) -> tuple[float, list[str]]:
    """Verifica CRS y que los datos intersecten el bounding box de referencia."""
    hallazgos = []
    crs_info  = {"detectado": None, "cumple_471": False, "es_legacy": False, "legacy_nombre": None}

    # Detección CRS
    if gdf.crs:
        crs_epsg = gdf.crs.to_epsg()
        crs_info["detectado"] = f"EPSG:{crs_epsg}" if crs_epsg else str(gdf.crs)
    else:
        hallazgos.append("[CRÍTICO] CRS no definido. La ambigüedad espacial hace el dato inutilizable.")
        return 0.1, hallazgos, crs_info

    # Verificar conformidad IGAC 471-2020
    detected = crs_info["detectado"]
    if detected == EPSG_9377:
        crs_info["cumple_471"] = True
    elif detected in LEGACY_CRS:
        crs_info["es_legacy"] = True
        crs_info["legacy_nombre"] = LEGACY_CRS[detected]
        hallazgos.append(f"[ERROR NORMATIVO] CRS detectado: {detected} ({LEGACY_CRS[detected]}).")
        hallazgos.append("  → La Resolución IGAC 471 de 2020 exige EPSG:9377 (MAGNA-SIRGAS Origen Nacional).")
        hallazgos.append("  → Corrección (QGIS): Reproyectar capa → EPSG:9377.")
        hallazgos.append("  → Corrección (Python): gdf = gdf.to_crs('EPSG:9377')")
    else:
        hallazgos.append(f"[ADVERTENCIA] CRS es {detected}. Para publicación oficial en Colombia debe ser EPSG:9377.")

    # Verificar intersección con BBox de referencia
    try:
        from shapely.geometry import box as shapely_box
        gdf_wgs = gdf.to_crs(EPSG_4326) if gdf.crs.to_epsg() != 4326 else gdf
        ref_box = shapely_box(*bbox)
        intersects = gdf_wgs.geometry.intersects(ref_box).any()
        if not intersects:
            hallazgos.append(f"[ADVERTENCIA] Ninguna entidad intersecta el BBox de referencia {bbox}. ¿Es el dataset correcto?")
            posicional_score = 0.4 if not crs_info["es_legacy"] else 0.2
        else:
            posicional_score = 0.9 if crs_info["cumple_471"] else (0.6 if not crs_info["es_legacy"] else 0.3)
    except Exception as e:
        hallazgos.append(f"No se pudo verificar intersección geográfica: {e}")
        posicional_score = 0.5

    return posicional_score, hallazgos, crs_info


def score_exactitud_tematica(gdf) -> tuple[float, list[str]]:
    """Detecta mojibake, caracteres no válidos y valida estructura de columnas."""
    hallazgos = []
    cols = [c for c in gdf.columns if c != "geometry"]
    if not cols:
        return 0.0, ["Sin atributos para evaluar."]

    # Detección de mojibake en nombres de columnas
    mojibake_pattern = re.compile(r'[Ã¡Ã©ÃÃ³ÃºÃ]')
    bad_cols = [c for c in cols if mojibake_pattern.search(c)]
    if bad_cols:
        hallazgos.append(f"[ERROR] Codificación incorrecta (mojibake) en columnas: {bad_cols}")
        hallazgos.append("  → Guarda el SHP con encoding UTF-8 o re-exporta desde QGIS con esa codificación.")

    # Verificar longitud excesiva de nombres (SHP limita a 10 chars)
    long_cols = [c for c in cols if len(c) > 10]
    if long_cols:
        hallazgos.append(f"[ADVERTENCIA] Columnas con nombre >10 chars (problemáticas en SHP): {long_cols}")

    # Columnas duplicadas (mismo nombre case-insensitive)
    lower_cols = [c.lower() for c in cols]
    dupes = [c for c in lower_cols if lower_cols.count(c) > 1]
    if dupes:
        hallazgos.append(f"[ERROR] Nombres de columnas duplicados (case-insensitive): {list(set(dupes))}")

    # Detección de valores de texto con mojibake en celdas
    mojibake_cells = 0
    for col in cols:
        if gdf[col].dtype == object:
            mask = gdf[col].astype(str).str.contains(r'[Ã¡Ã©ÃÃ³ÃºÃ]', na=False, regex=True)
            mojibake_cells += mask.sum()

    if mojibake_cells:
        hallazgos.append(f"[ERROR] {mojibake_cells} celdas con mojibake detectadas en valores de atributos.")

    penalties = len(bad_cols) * 0.10 + (0.10 if long_cols else 0) + (0.15 if dupes else 0) + min(mojibake_cells * 0.01, 0.20)
    score = round(max(0.0, 1.0 - penalties), 3)
    return score, hallazgos


def score_exactitud_temporal(gdf) -> tuple[float, list[str]]:
    """Identifica y valida columnas de fecha/timestamp."""
    pd = _require_pandas()
    hallazgos = []
    date_cols = [c for c in gdf.columns if "fecha" in c.lower() or "date" in c.lower() or "time" in c.lower() or "año" in c.lower() or "year" in c.lower()]

    if not date_cols:
        hallazgos.append("No se detectaron columnas de fecha/tiempo. No es posible evaluar exactitud temporal.")
        return 0.30, hallazgos  # Score bajo por falta de metadata temporal

    scores_col = []
    for col in date_cols:
        try:
            parsed = pd.to_datetime(gdf[col], errors="coerce")
            valid_count = parsed.notna().sum()
            null_count  = parsed.isna().sum()
            total       = len(gdf)
            col_score   = valid_count / total if total > 0 else 0.0

            # Verificar fechas en el futuro
            future = (parsed > pd.Timestamp.now()).sum()
            if future:
                hallazgos.append(f"[ADVERTENCIA] '{col}': {future} fechas en el futuro (posibles errores de captura).")
                col_score -= 0.15

            # Verificar fechas muy antiguas (antes de 1980 — improbable para Pereira)
            ancient = (parsed < pd.Timestamp("1980-01-01")).sum()
            if ancient:
                hallazgos.append(f"[ADVERTENCIA] '{col}': {ancient} fechas anteriores a 1980. Verificar vigencia.")
                col_score -= 0.05

            if null_count:
                hallazgos.append(f"  · '{col}': {null_count} fechas nulas o no parseables.")

            scores_col.append(max(0.0, col_score))
        except Exception as e:
            hallazgos.append(f"  · '{col}': No se pudo analizar ({e}).")
            scores_col.append(0.5)

    return round(sum(scores_col) / len(scores_col), 3), hallazgos


# ---------------------------------------------------------------------------
# Clasificador de estado final
# ---------------------------------------------------------------------------
def classify_status(scores: dict[str, float]) -> str:
    avg = sum(scores.values()) / len(scores)
    min_score = min(scores.values())
    if avg >= 0.80 and min_score >= 0.60:
        return STATUS_OK
    if avg >= 0.50 or min_score >= 0.30:
        return STATUS_WARN
    return STATUS_FAIL


def build_hoja_de_ruta(all_hallazgos: dict[str, list[str]]) -> list[str]:
    hoja = []
    order = ["exactitud_posicional", "consistencia_logica", "exactitud_tematica", "completitud", "exactitud_temporal"]
    labels = {
        "exactitud_posicional": "🗺️  CRS y Posición",
        "consistencia_logica":  "🔺 Topología y Geometrías",
        "exactitud_tematica":   "🔤 Atributos y Codificación",
        "completitud":          "📋 Datos Faltantes",
        "exactitud_temporal":   "🕐 Fechas y Vigencia",
    }
    for key in order:
        items = all_hallazgos.get(key, [])
        if items:
            hoja.append(f"\n{labels[key]}")
            hoja.extend(f"  {h}" for h in items)
    return hoja


# ---------------------------------------------------------------------------
# Punto de entrada principal
# ---------------------------------------------------------------------------
def audit(file_path: Path, bbox: tuple = PEREIRA_BBOX) -> dict[str, Any]:
    gdf = load_geodataframe(file_path)

    s_comp, h_comp                   = score_completitud(gdf)
    s_cons, h_cons                   = score_consistencia_logica(gdf)
    s_pos, h_pos, crs_info           = score_exactitud_posicional(gdf, bbox)
    s_tem, h_tem                     = score_exactitud_tematica(gdf)
    s_tmp, h_tmp                     = score_exactitud_temporal(gdf)

    scores = {
        "completitud":          s_comp,
        "consistencia_logica":  s_cons,
        "exactitud_posicional": s_pos,
        "exactitud_tematica":   s_tem,
        "exactitud_temporal":   s_tmp,
    }

    all_hallazgos = {
        "completitud":          h_comp,
        "consistencia_logica":  h_cons,
        "exactitud_posicional": h_pos,
        "exactitud_tematica":   h_tem,
        "exactitud_temporal":   h_tmp,
    }

    return {
        "archivo":      str(file_path),
        "entidades":    len(gdf),
        "atributos":    [c for c in gdf.columns if c != "geometry"],
        "tipo_geometria": str(gdf.geom_type.value_counts().to_dict()) if not gdf.empty else "N/A",
        "crs":          crs_info,
        "scores":       scores,
        "estado":       classify_status(scores),
        "hallazgos":    all_hallazgos,
        "hoja_de_ruta": build_hoja_de_ruta(all_hallazgos),
    }


def print_report(report: dict[str, Any]) -> None:
    print("\n" + "="*65)
    print(f"  AUDITORÍA GEOESPACIAL — ISO 19157 / IGAC 471-2020")
    print("="*65)
    print(f"  Archivo   : {report['archivo']}")
    print(f"  Entidades : {report['entidades']}")
    print(f"  CRS       : {report['crs'].get('detectado', 'NO DEFINIDO')}")
    crs_ok = report['crs'].get('cumple_471', False)
    print(f"  EPSG:9377 : {'✅ CUMPLE' if crs_ok else '❌ NO CUMPLE'}")
    print(f"\n  ESTADO GENERAL: [{report['estado']}]")
    print("-"*65)
    print("  SCORES ISO 19157 (0.0 – 1.0):")
    for dim, val in report['scores'].items():
        bar = "█" * int(val * 20)
        print(f"    {dim:<26} {val:.2f}  {bar}")
    print("-"*65)
    if report['hoja_de_ruta']:
        print("  HOJA DE RUTA DE CORRECCIÓN:")
        for item in report['hoja_de_ruta']:
            print(f"  {item}")
    print("="*65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Auditoría geoespacial ISO 19157 / IGAC 471-2020")
    parser.add_argument("--file",   required=True, help="Ruta al archivo geoespacial")
    parser.add_argument("--bbox",   default=None,  help="BBox xmin,ymin,xmax,ymax (default: Pereira)")
    parser.add_argument("--output", default=None,  help="Ruta de salida JSON del reporte")
    args = parser.parse_args()

    bbox = PEREIRA_BBOX
    if args.bbox:
        try:
            bbox = tuple(float(x) for x in args.bbox.split(","))
        except ValueError:
            print("[ERROR] --bbox debe ser cuatro números separados por coma: xmin,ymin,xmax,ymax", file=sys.stderr)
            sys.exit(1)

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"[ERROR] Archivo no encontrado: {file_path}", file=sys.stderr)
        sys.exit(1)

    report = audit(file_path, bbox)
    print_report(report)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Reporte JSON guardado en: {out_path}")


if __name__ == "__main__":
    main()
