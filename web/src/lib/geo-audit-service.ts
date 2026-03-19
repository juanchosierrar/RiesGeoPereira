/**
 * geo-audit-service.ts
 * Client-side geospatial audit: ISO 19157 / IGAC Res. 471-2020
 * Runs fully in the browser against a parsed GeoJSON FeatureCollection.
 */

import type { FeatureCollection, Feature, Geometry } from 'geojson';

// NOTE: AuditData is imported by auditoria-panel — define here to avoid circular deps
export interface AuditData {
    completitud_score:    number;
    topologia_score:      number;
    posicional_score:     number;
    tematica_score:       number;
    temporal_score:       number;
    is_normative_ok:      boolean;
    crs_detected:         string | number;
    estado?:              'CUMPLE' | 'CUMPLE PARCIALMENTE' | 'NO CUMPLE';
    hallazgos?:           string[];
}

// EPSG:9377 MAGNA-SIRGAS Origen Nacional bbox (aprox)
const COLOMBIA_BBOX = { minX: -81.7, minY: -4.2, maxX: -66.8, maxY: 13.5 };
const PEREIRA_BBOX  = { minX: -75.80, minY: 4.60, maxX: -75.45, maxY: 4.95 };

export interface AuditResult extends AuditData {
    invalidGeometryIndices: number[];          // indices of invalid features
    invalidGeojson:         FeatureCollection; // sub-collection for map highlight
    filename:               string;
    featureCount:           number;
    attributeColumns:       string[];
}

// ---------------------------------------------------------------------------
// Geometry validity helpers (pure JS — no external deps)
// ---------------------------------------------------------------------------
function isValidPoint(coords: number[]): boolean {
    return coords.length >= 2 &&
        isFinite(coords[0]) && isFinite(coords[1]) &&
        coords[0] >= -180 && coords[0] <= 180 &&
        coords[1] >= -90  && coords[1] <= 90;
}

function isRingClosed(ring: number[][]): boolean {
    if (ring.length < 4) return false;
    const first = ring[0], last = ring[ring.length - 1];
    return first[0] === last[0] && first[1] === last[1];
}

function hasCollinearPoints(ring: number[][]): boolean {
    for (let i = 0; i < ring.length - 2; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        const [x3, y3] = ring[i + 2];
        const cross = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
        if (Math.abs(cross) < 1e-10) return true;
    }
    return false;
}

function checkRingIntersection(ring: number[][]): boolean {
    // O(n²) simplified self-intersection check on the exterior ring
    for (let i = 0; i < ring.length - 1; i++) {
        for (let j = i + 2; j < ring.length - 1; j++) {
            if (i === 0 && j === ring.length - 2) continue;
            if (segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
                return true;
            }
        }
    }
    return false;
}

function segmentsIntersect(a: number[], b: number[], c: number[], d: number[]): boolean {
    const det = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
    if (Math.abs(det) < 1e-10) return false;
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / det;
    const u = -((a[0] - c[0]) * (b[1] - a[1]) - (a[1] - c[1]) * (b[0] - a[0])) / det;
    return t > 0 && t < 1 && u > 0 && u < 1;
}

function validateGeometry(geom: Geometry | null): { valid: boolean; reason?: string } {
    if (!geom) return { valid: false, reason: 'Geometría nula' };

    switch (geom.type) {
        case 'Point': {
            if (!isValidPoint(geom.coordinates))
                return { valid: false, reason: 'Coordenadas de punto fuera de rango' };
            return { valid: true };
        }
        case 'MultiPoint': {
            const bad = geom.coordinates.filter(c => !isValidPoint(c));
            if (bad.length) return { valid: false, reason: `${bad.length} puntos inválidos en MultiPoint` };
            return { valid: true };
        }
        case 'LineString': {
            if (geom.coordinates.length < 2) return { valid: false, reason: 'LineString con < 2 puntos' };
            return { valid: true };
        }
        case 'Polygon': {
            for (const ring of geom.coordinates) {
                if (!isRingClosed(ring)) return { valid: false, reason: 'Anillo no cerrado (first ≠ last)' };
                if (ring.length < 4) return { valid: false, reason: 'Anillo con < 4 vértices' };
                if (checkRingIntersection(ring)) return { valid: false, reason: 'Self-intersection en anillo exterior' };
            }
            return { valid: true };
        }
        case 'MultiPolygon': {
            for (const poly of geom.coordinates) {
                for (const ring of poly) {
                    if (!isRingClosed(ring)) return { valid: false, reason: 'Anillo no cerrado en MultiPolygon' };
                    if (ring.length < 4) return { valid: false, reason: 'Anillo con < 4 vértices en MultiPolygon' };
                }
            }
            return { valid: true };
        }
        case 'GeometryCollection': {
            for (const g of geom.geometries) {
                const r = validateGeometry(g);
                if (!r.valid) return r;
            }
            return { valid: true };
        }
        default:
            return { valid: true };
    }
}

// ---------------------------------------------------------------------------
// Check if coordinates are within Colombia bounding box
// ---------------------------------------------------------------------------
function isInColombiaBbox(geom: Geometry): boolean {
    const flatCoords = extractCoordinates(geom);
    return flatCoords.some(([x, y]) =>
        x >= COLOMBIA_BBOX.minX && x <= COLOMBIA_BBOX.maxX &&
        y >= COLOMBIA_BBOX.minY && y <= COLOMBIA_BBOX.maxY
    );
}

function isNearPereira(geom: Geometry): boolean {
    const flatCoords = extractCoordinates(geom);
    return flatCoords.some(([x, y]) =>
        x >= PEREIRA_BBOX.minX && x <= PEREIRA_BBOX.maxX &&
        y >= PEREIRA_BBOX.minY && y <= PEREIRA_BBOX.maxY
    );
}

function extractCoordinates(geom: Geometry): number[][] {
    switch (geom.type) {
        case 'Point':        return [geom.coordinates];
        case 'MultiPoint':
        case 'LineString':   return geom.coordinates;
        case 'MultiLineString':
        case 'Polygon':      return geom.coordinates.flat();
        case 'MultiPolygon': return geom.coordinates.flat(2);
        case 'GeometryCollection':
            return geom.geometries.flatMap(extractCoordinates);
        default:             return [];
    }
}

// ---------------------------------------------------------------------------
// Detect CRS hint (heuristic from coordinate ranges)
// ---------------------------------------------------------------------------
function detectCrsHint(fc: FeatureCollection): { label: string; is9377: boolean; isSuspectLocal: boolean } {
    const coords = fc.features
        .filter(f => f.geometry)
        .flatMap(f => extractCoordinates(f.geometry!))
        .slice(0, 50);

    if (!coords.length) return { label: 'No determinado', is9377: false, isSuspectLocal: false };

    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    // WGS84 / EPSG:4326 range
    if (minX >= -180 && maxX <= 180 && minY >= -90 && maxY <= 90) {
        return { label: 'EPSG:4326 (WGS84)', is9377: false, isSuspectLocal: false };
    }

    // Very large numbers → projected (likely old local Colombian CRS)
    if (Math.abs(minX) > 10000 || Math.abs(minY) > 10000) {
        return { label: 'Proyected/Local (posible origen antiguo IGAC)', is9377: false, isSuspectLocal: true };
    }

    return { label: 'Indeterminado', is9377: false, isSuspectLocal: false };
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------
function scoreCompletitud(fc: FeatureCollection): { score: number; hallazgos: string[] } {
    const features = fc.features;
    if (!features.length) return { score: 0, hallazgos: ['Sin entidades en el archivo'] };

    const cols = new Set<string>();
    features.forEach(f => f.properties && Object.keys(f.properties).forEach(k => cols.add(k)));
    const colArr = Array.from(cols);

    let totalCells = 0, nullCells = 0;
    const nullByCol: Record<string, number> = {};

    features.forEach(f => {
        colArr.forEach(col => {
            totalCells++;
            const val = f.properties?.[col];
            if (val === null || val === undefined || val === '') {
                nullCells++;
                nullByCol[col] = (nullByCol[col] || 0) + 1;
            }
        });
    });

    const score = totalCells > 0 ? Math.max(0, 1 - nullCells / totalCells) : 0;
    const hallazgos: string[] = [];

    if (nullCells > 0) {
        hallazgos.push(`${nullCells} celdas nulas de ${totalCells} (${Math.round(nullCells / totalCells * 100)}%)`);
        Object.entries(nullByCol)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .forEach(([col, n]) => hallazgos.push(`  · "${col}": ${n} nulos (${Math.round(n / features.length * 100)}%)`));
    }

    return { score: Math.round(score * 100) / 100, hallazgos };
}

function scoreTopologia(fc: FeatureCollection): { score: number; hallazgos: string[]; invalidIndices: number[] } {
    const features = fc.features;
    const invalidIndices: number[] = [];
    const reasons: string[] = [];

    features.forEach((f, i) => {
        const result = validateGeometry(f.geometry);
        if (!result.valid) {
            invalidIndices.push(i);
            if (result.reason && !reasons.includes(result.reason)) reasons.push(result.reason);
        }
    });

    const score = features.length > 0 ? Math.max(0, 1 - invalidIndices.length / features.length) : 0;
    const hallazgos: string[] = [];

    if (invalidIndices.length > 0) {
        hallazgos.push(`${invalidIndices.length} geometría(s) inválida(s) (${Math.round(invalidIndices.length / features.length * 100)}% del total)`);
        reasons.forEach(r => hallazgos.push(`  → ${r}`));
        hallazgos.push('  Corrección QGIS: Vectorial → Geometría → Corregir geometrías');
    }

    return { score: Math.round(score * 100) / 100, hallazgos, invalidIndices };
}

function scorePosicional(fc: FeatureCollection, crs: ReturnType<typeof detectCrsHint>): { score: number; hallazgos: string[] } {
    const hallazgos: string[] = [];
    let score = 0.5;

    if (crs.isSuspectLocal) {
        hallazgos.push('[ERROR NORMATIVO] Coordenadas en sistema local/proyectado (posible origen antiguo IGAC)');
        hallazgos.push('  → La Res. 471/2020 exige EPSG:9377 (MAGNA-SIRGAS Origen Nacional)');
        hallazgos.push('  → Corrección: Reproyectar en QGIS a EPSG:9377');
        score = 0.20;
    } else {
        // Check intersection with Colombia
        const hasGeoms = fc.features.filter(f => f.geometry);
        const inColombia = hasGeoms.filter(f => isInColombiaBbox(f.geometry!));
        const inPereira  = hasGeoms.filter(f => isNearPereira(f.geometry!));

        if (inPereira.length > 0) {
            score = crs.is9377 ? 0.95 : 0.65;
        } else if (inColombia.length > 0) {
            score = crs.is9377 ? 0.80 : 0.55;
            hallazgos.push('Datos en Colombia pero fuera del área de Pereira/Risaralda');
        } else {
            score = 0.20;
            hallazgos.push('[ADVERTENCIA] Ninguna entidad intersecta el bbox de Colombia. ¿Correcto?');
        }

        if (!crs.is9377) {
            hallazgos.push(`CRS detectado: ${crs.label} — no cumple IGAC Res. 471/2020 (requiere EPSG:9377)`);
        }
    }

    return { score: Math.round(score * 100) / 100, hallazgos };
}

function scoreTematica(fc: FeatureCollection): { score: number; hallazgos: string[] } {
    const features = fc.features;
    const hallazgos: string[] = [];
    let penalty = 0;

    const cols = new Set<string>();
    features.forEach(f => f.properties && Object.keys(f.properties).forEach(k => cols.add(k)));
    const colArr = Array.from(cols);

    // Check for mojibake patterns in column names
    const mojibake = /[Ã¡Ã©ÃÃ³ÃºÃ]/;
    const badCols = colArr.filter(c => mojibake.test(c));
    if (badCols.length) {
        hallazgos.push(`Codificación incorrecta (mojibake) en columnas: ${badCols.join(', ')}`);
        penalty += 0.20;
    }

    // Check column names > 10 chars (Shapefile limit)
    const longCols = colArr.filter(c => c.length > 10);
    if (longCols.length) {
        hallazgos.push(`${longCols.length} columna(s) con nombre >10 chars (problemático en SHP)`);
        penalty += 0.10;
    }

    // No attribute columns at all
    if (colArr.length === 0) {
        hallazgos.push('Sin atributos. El dato tiene solo geometría (mínimo aceptable).');
        penalty += 0.30;
    }

    // Check for mixed geometry types (can indicate dataset quality issues)
    const types = new Set(features.filter(f => f.geometry).map(f => f.geometry!.type));
    if (types.size > 2) {
        hallazgos.push(`Tipos de geometría mixtos detectados: ${Array.from(types).join(', ')}`);
        penalty += 0.10;
    }

    const score = Math.max(0, 1 - penalty);
    return { score: Math.round(score * 100) / 100, hallazgos };
}

function scoreTemporal(fc: FeatureCollection): { score: number; hallazgos: string[] } {
    const features = fc.features;
    const hallazgos: string[] = [];

    const cols = new Set<string>();
    features.forEach(f => f.properties && Object.keys(f.properties).forEach(k => cols.add(k)));

    const dateCols = Array.from(cols).filter(c =>
        /fecha|date|time|año|year|periodo|timestamp/i.test(c)
    );

    if (!dateCols.length) {
        hallazgos.push('Sin columnas de fecha/tiempo detectadas. Exactitud temporal no evaluable.');
        return { score: 0.30, hallazgos };
    }

    const scores: number[] = [];
    for (const col of dateCols) {
        const vals = features
            .map(f => f.properties?.[col])
            .filter(v => v !== null && v !== undefined && v !== '');

        if (!vals.length) { scores.push(0.0); continue; }

        const parsed = vals.map(v => new Date(String(v)));
        const valid  = parsed.filter(d => !isNaN(d.getTime()));
        const future = valid.filter(d => d > new Date()).length;
        const ancient = valid.filter(d => d < new Date('1970-01-01')).length;

        let colScore = valid.length / vals.length;
        if (future)  { hallazgos.push(`"${col}": ${future} fecha(s) en el futuro (posible error)`); colScore -= 0.15; }
        if (ancient) { hallazgos.push(`"${col}": ${ancient} fecha(s) anteriores a 1970`); colScore -= 0.05; }

        scores.push(Math.max(0, colScore));
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { score: Math.round(avg * 100) / 100, hallazgos };
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------
export function auditGeoJSON(fc: FeatureCollection, filename: string): AuditResult {
    const crs = detectCrsHint(fc);

    const { score: completitud_score, hallazgos: h_comp }               = scoreCompletitud(fc);
    const { score: topologia_score,  hallazgos: h_topo, invalidIndices } = scoreTopologia(fc);
    const { score: posicional_score, hallazgos: h_pos }                 = scorePosicional(fc, crs);
    const { score: tematica_score,   hallazgos: h_tem }                 = scoreTematica(fc);
    const { score: temporal_score,   hallazgos: h_tmp }                 = scoreTemporal(fc);

    const scores = [completitud_score, topologia_score, posicional_score, tematica_score, temporal_score];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);

    const estado: AuditData['estado'] =
        avg >= 0.80 && min >= 0.60 ? 'CUMPLE' :
        avg >= 0.50 || min >= 0.30  ? 'CUMPLE PARCIALMENTE' :
        'NO CUMPLE';

    const allHallazgos = [
        ...h_pos.map(h => `CRS: ${h}`),
        ...h_topo,
        ...h_comp,
        ...h_tem,
        ...h_tmp,
    ].filter(Boolean);

    // Build invalid geometries sub-collection for map highlighting
    const invalidGeojson: FeatureCollection = {
        type: 'FeatureCollection',
        features: invalidIndices.map(i => fc.features[i]).filter(Boolean),
    };

    const cols = new Set<string>();
    fc.features.forEach(f => f.properties && Object.keys(f.properties).forEach(k => cols.add(k)));

    return {
        completitud_score,
        topologia_score,
        posicional_score,
        tematica_score,
        temporal_score,
        is_normative_ok: crs.is9377,
        crs_detected:    crs.label,
        estado,
        hallazgos:       allHallazgos,
        invalidGeometryIndices: invalidIndices,
        invalidGeojson,
        filename,
        featureCount:    fc.features.length,
        attributeColumns: Array.from(cols),
    };
}
