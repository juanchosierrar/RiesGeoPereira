const SGC_BASE = 'https://services1.arcgis.com/Og2nrTKe5bptW02d/ArcGIS/rest/services';

export interface SismoSGC {
    FID: number;
    Num: number;
    Fecha: number;     // Unix ms
    Hora: string;
    Lat: number;
    Long: number;
    Mw: number;        // Magnitude
    Prof_: number;     // Depth km
    Imax: number;      // Max intensity
    Field9: string;    // Location description
    Fuente: string;    // Fault/source
    Tipo_falla: string;
}

export interface SismoFeature {
    attributes: SismoSGC;
    geometry: { x: number; y: number };
}

export interface SismoResponse {
    features: SismoFeature[];
    exceededTransferLimit?: boolean;
}

/**
 * Fetch historical earthquakes via our server-side proxy (bypasses CORS).
 */
export async function fetchSismosHistoricos(options?: {
    bbox?: { xmin: number; ymin: number; xmax: number; ymax: number };
    minMagnitude?: number;
    maxRecords?: number;
}): Promise<SismoFeature[]> {
    const { bbox, minMagnitude = 0, maxRecords = 200 } = options || {};

    const params = new URLSearchParams({
        minMag: minMagnitude.toString(),
        maxRecords: maxRecords.toString(),
    });

    if (bbox) {
        params.set('xmin', bbox.xmin.toString());
        params.set('ymin', bbox.ymin.toString());
        params.set('xmax', bbox.xmax.toString());
        params.set('ymax', bbox.ymax.toString());
    }

    try {
        const res = await fetch(`/api/sgc/sismos?${params.toString()}`);
        if (!res.ok) {
            console.warn(`SGC proxy responded with ${res.status}`);
            return [];
        }
        const data: SismoResponse = await res.json();
        return data.features || [];
    } catch (err) {
        console.warn('SGC proxy fetch failed:', err);
        return [];
    }
}

/**
 * Fetch geological faults from SGC MAPAGEOLOGIA
 */
export async function fetchFallasGeologicas(maxRecords = 50) {
    const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        outSR: '4326',
        f: 'json',
        resultRecordCount: maxRecords.toString(),
    });

    const url = `${SGC_BASE}/MAPAGEOLOGIA/FeatureServer/1/query?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SGC Fallas API error: ${res.status}`);
    return await res.json();
}

/**
 * Magnitude → circle radius mapping for map visualization
 */
export function magnitudeToRadius(mw: number): number {
    if (mw >= 7) return 14;
    if (mw >= 6) return 11;
    if (mw >= 5) return 8;
    if (mw >= 4) return 6;
    if (mw >= 3) return 4;
    return 3;
}

/**
 * Magnitude → color mapping (Cyan/Teal palette — distinct from risk event markers)
 */
export function magnitudeToColor(mw: number): string {
    if (mw >= 7) return '#4A0072';   // Deep purple
    if (mw >= 6) return '#6A1B9A';   // Purple
    if (mw >= 5) return '#0277BD';   // Dark cyan
    if (mw >= 4) return '#00838F';   // Teal
    if (mw >= 3) return '#00ACC1';   // Cyan
    return '#78909C';                // Blue-gray
}

/**
 * Magnitude → size for diamond markers (px)
 */
export function magnitudeToSize(mw: number): number {
    if (mw >= 7) return 24;
    if (mw >= 6) return 20;
    if (mw >= 5) return 16;
    if (mw >= 4) return 13;
    if (mw >= 3) return 10;
    return 8;
}

/**
 * Fetch volcanoes from SGC proxy
 */
export async function fetchVolcanes() {
    try {
        const res = await fetch('/api/sgc/volcanes');
        if (!res.ok) return { type: 'FeatureCollection', features: [] };
        return await res.json();
    } catch {
        return { type: 'FeatureCollection', features: [] };
    }
}

/**
 * Pereira region bounding box (~50km radius)
 */
export const PEREIRA_BBOX = {
    xmin: -76.1,
    ymin: 4.4,
    xmax: -75.3,
    ymax: 5.2,
};

/**
 * Regional bounding box (includes Eje Cafetero volcanoes)
 */
export const REGIONAL_BBOX = {
    xmin: -76.5,
    ymin: 4.0,
    xmax: -75.0,
    ymax: 5.5,
};
