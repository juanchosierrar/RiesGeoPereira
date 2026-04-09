/**
 * Pereira Geocoding Utility
 * Provides hierarchical lookup: Address (OSM) -> Barrio (Local) -> Comuna (Local)
 */

// Known Pereira locations and centroids
export const PEREIRA_NESTED_LOCATIONS: Record<string, { lat: number; lng: number }> = {
    // Comunas
    'cuba': { lat: 4.7870, lng: -75.7231 },
    'centro': { lat: 4.8133, lng: -75.6961 },
    'villasantana': { lat: 4.8180, lng: -75.6750 },
    'boston': { lat: 4.8176, lng: -75.6897 },
    'universidad': { lat: 4.8010, lng: -75.6900 },
    'poblado': { lat: 4.7890, lng: -75.7150 },
    'ferrocarril': { lat: 4.8250, lng: -75.7100 },
    'olimpica': { lat: 4.8050, lng: -75.7200 },
    'san joaquin': { lat: 4.8020, lng: -75.7300 },
    'cerritos': { lat: 4.8350, lng: -75.7480 },
    
    // Barrios / Sectores
    'la esneda': { lat: 4.8080, lng: -75.6800 },
    'futuro bajo': { lat: 4.7932, lng: -75.7251 },
    'maraya': { lat: 4.8050, lng: -75.6940 },
    'pinares': { lat: 4.8090, lng: -75.7120 },
    'alamos': { lat: 4.8167, lng: -75.7020 },
    'nacederos': { lat: 4.8309, lng: -75.6823 },
    'villavicencio': { lat: 4.8067, lng: -75.7200 },
    'la florida': { lat: 4.7700, lng: -75.6400 },
    'tribunas': { lat: 4.7500, lng: -75.6833 },
    'frailes': { lat: 4.8300, lng: -75.6600 },
};

/**
 * Adds a small random jitter to coordinates to avoid perfect overlap of markers
 * @param coord Latitude or Longitude
 * @param amount Amount in decimal degrees (~0.0005 is approx 50m)
 */
function applyJitter(coord: number, amount: number = 0.0008): number {
    return coord + (Math.random() - 0.5) * amount;
}

/**
 * Normalizes strings for search (lowercase, no accents)
 */
function normalize(str: string): string {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Main geocoding function for Pereira
 */
export async function geocodePereira(
    direccion: string, 
    barrio?: string, 
    comuna?: string
): Promise<{ lat: number; lon: number; source: 'address' | 'barrio' | 'comuna' | 'default' } | null> {
    
    // 1. Try Address via Nominatim (OSM)
    if (direccion && direccion.length > 5) {
        try {
            // We append Pereira, Risaralda, Colombia for precision
            const query = `${direccion}, Pereira, Risaralda, Colombia`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                {
                    headers: { 'User-Agent': 'RiesGeoPereira-Geocoding' }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon),
                        source: 'address'
                    };
                }
            }
        } catch (error) {
            console.warn('Nominatim geocoding error:', error);
        }
    }

    // 2. Try Barrio (Local Dict)
    if (barrio) {
        const normalizedBarrio = normalize(barrio);
        const match = Object.entries(PEREIRA_NESTED_LOCATIONS).find(([key]) => normalizedBarrio.includes(key) || key.includes(normalizedBarrio));
        if (match) {
            return {
                lat: applyJitter(match[1].lat),
                lon: applyJitter(match[1].lng),
                source: 'barrio'
            };
        }
    }

    // 3. Try Comuna (Local Dict)
    if (comuna) {
        const normalizedComuna = normalize(comuna);
        const match = Object.entries(PEREIRA_NESTED_LOCATIONS).find(([key]) => normalizedComuna.includes(key) || key.includes(normalizedComuna));
        if (match) {
            return {
                lat: applyJitter(match[1].lat),
                lon: applyJitter(match[1].lng),
                source: 'comuna'
            };
        }
    }

    return null;
}
