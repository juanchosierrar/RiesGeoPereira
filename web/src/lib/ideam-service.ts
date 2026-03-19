import { FeatureCollection } from 'geojson';

const IDEAM_BASE_URL = 'https://visualizador.ideam.gov.co/gisserver/rest/services/Vulnerabilidad_Susceptibilidad_Ambiental/MapServer';

export interface IdeamLayer {
    id: number;
    name: string;
}

export const IDEAM_LAYERS = [
    { id: 0, name: 'SZH (Cuencas)' },
    { id: 1, name: 'Zonas Inundación' },
    { id: 2, name: 'Zonas Deslizamiento' }
];

/**
 * Fetches features from an IDEAM MapServer layer as GeoJSON.
 * Note: For very large layers, this might need pagination or spatial filtering.
 */
export async function fetchIdeamLayer(layerId: number): Promise<FeatureCollection> {
    const params = new URLSearchParams({
        where: '1=1', // Fetch all features
        outFields: '*',
        f: 'geojson',
        outSR: '4326', // Request WGS84
    });

    const url = `${IDEAM_BASE_URL}/${layerId}/query?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al consultar IDEAM (Layer ${layerId}): ${response.statusText}`);
        }
        const data = await response.json();
        return data as FeatureCollection;
    } catch (error) {
        console.error(`IDEAM Fetch Error (Layer ${layerId}):`, error);
        throw error;
    }
}

/** 
 * Type for an IDEAM Station from Open Data Portal (datos.gov.co)
 * Dataset: cqmv-a99d
 */
export interface IdeamFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: {
        id: string;
        name: string;
        municipality: string;
        department: string;
        lastUpdate?: string;
        sensor?: string;
        altitude?: number | string;
        status?: string;
        category?: string;
    };
}

/** 
 * Fetches meteorological stations from IDEAM via Socrata Open Data API.
 */
export async function fetchIdeamStations(opts: { departamento?: string }): Promise<IdeamFeature[]> {
    const params = new URLSearchParams();
    // In this dataset, departamento is often uppercase
    if (opts.departamento) params.set('departamento', opts.departamento.toUpperCase());
    params.set('$limit', '5000'); // Higher limit because it contains observations

    const url = `/api/ideam/stations?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`IDEAM Proxy API error`);
        const data = await res.json();
        
        if (data.error) {
            console.warn(data.error);
            return [];
        }

        // Reduce to unique stations by name+code
        const uniqueStations = new Map<string, Record<string, unknown>>();
        
        data.forEach((d: Record<string, unknown>) => {
            if (!uniqueStations.has(d.codigoestacion as string)) {
                uniqueStations.set(d.codigoestacion as string, d);
            }
        });

        return Array.from(uniqueStations.values()).map((d: Record<string, unknown>) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    parseFloat(d.longitud as string),
                    parseFloat(d.latitud as string)
                ]
            },
            properties: {
                id: d.codigoestacion as string,
                name: d.nombreestacion as string,
                municipality: d.municipio as string,
                department: d.departamento as string,
                lastUpdate: d.fechaobservacion as string,
                sensor: d.descripcionsensor as string
            }
        }));
    } catch (error) {
        console.error("fetchIdeamStations error:", error);
        return [];
    }
}
