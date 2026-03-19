// USGS GeoJSON feature structure
export interface UsgsQuake {
    mag: number;
    place: string;
    time: number;       // Unix ms
    updated: number;
    type: string;
    title: string;
    depth?: number;
    magType?: string;
    net?: string;
    status?: string;
}

export interface UsgsFeature {
    type: 'Feature';
    properties: UsgsQuake;
    geometry: {
        type: 'Point';
        coordinates: [number, number, number]; // [lng, lat, depth_km]
    };
    id: string;
}

export interface UsgsResponse {
    type: 'FeatureCollection';
    features: UsgsFeature[];
    metadata: { count: number; title: string };
}

/**
 * Fetch historical earthquakes from USGS via our server-side proxy.
 * Covers Pereira / Eje Cafetero region by default.
 */
export async function fetchUSGSSismos(options?: {
    minMag?: number;
    limit?: number;
    startTime?: string;
}): Promise<UsgsFeature[]> {
    const { minMag = 2.5, limit = 300, startTime = '1990-01-01' } = options || {};

    const params = new URLSearchParams({
        minMag: minMag.toString(),
        limit: limit.toString(),
        start: startTime,
    });

    try {
        const res = await fetch(`/api/usgs/sismos?${params.toString()}`);
        if (!res.ok) {
            console.warn(`USGS proxy responded with ${res.status}`);
            return [];
        }
        const data: UsgsResponse = await res.json();
        return data.features || [];
    } catch (err) {
        console.warn('USGS proxy fetch failed:', err);
        return [];
    }
}
