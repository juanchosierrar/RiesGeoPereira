import { FeatureCollection } from 'geojson';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Fetches administrative boundaries for Pereira from OSM.
 * @param adminLevel 9 for Comunas, 10 for Barrios
 */
export async function fetchPereiraBoundaries(adminLevel: number): Promise<FeatureCollection> {
    const query = `
        [out:json][timeout:25];
        area(id:3600120531)->.searchArea;
        (
          relation["boundary"="administrative"]["admin_level"="${adminLevel}"](area.searchArea);
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);
        const data = await response.json();
        
        // Basic OSM entries to GeoJSON conversion
        return osmToGeoJSON(data);
    } catch (error) {
        console.error(`Error fetching OSM level ${adminLevel}:`, error);
        return { type: 'FeatureCollection', features: [] };
    }
}

/**
 * Fetches the urban perimeter of Pereira from OSM.
 */
export async function fetchUrbanPerimeter(): Promise<FeatureCollection> {
    // We try to find the urban boundary or the main city relation
    const query = `
        [out:json][timeout:25];
        (
          relation(id:120531);
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);
        const data = await response.json();
        return osmToGeoJSON(data);
    } catch (error) {
        console.error('Error fetching OSM urban perimeter:', error);
        return { type: 'FeatureCollection', features: [] };
    }
}

/**
 * Simple OSM to GeoJSON converter for relations/multipolygons.
 * Note: Overpass returns nodes, ways, and relations.
 */
function osmToGeoJSON(data: any): FeatureCollection {
    const features: any[] = [];
    const nodes: Record<number, [number, number]> = {};
    const ways: Record<number, number[][]> = {};

    // First pass: index nodes
    data.elements.forEach((el: any) => {
        if (el.type === 'node') {
            nodes[el.id] = [el.lon, el.lat];
        }
    });

    // Second pass: index ways
    data.elements.forEach((el: any) => {
        if (el.type === 'way' && el.nodes) {
            ways[el.id] = el.nodes.map((nodeId: number) => nodes[nodeId]).filter(Boolean);
        }
    });

    // Third pass: create features from relations (polygons)
    data.elements.forEach((el: any) => {
        if (el.type === 'relation' && el.members) {
            const coordinates: number[][][] = [];
            
            // Simplified multipolygon logic: treat outer rings as polygons
            el.members.forEach((member: any) => {
                if (member.type === 'way' && member.role === 'outer' && ways[member.ref]) {
                    coordinates.push(ways[member.ref]);
                }
            });

            if (coordinates.length > 0) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [coordinates]
                    },
                    properties: el.tags || {}
                });
            }
        }
    });

    return {
        type: 'FeatureCollection',
        features
    };
}
