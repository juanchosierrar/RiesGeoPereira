import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Calculates the bounding box of a GeoJSON object.
 * Returns [minLng, minLat, maxLng, maxLat]
 */
export function calculateBBox(geojson: FeatureCollection | Geometry): [number, number, number, number] | null {
    let coords: number[][] = [];

    const extractFromGeom = (geom: Geometry) => {
        switch (geom.type) {
            case 'Point':
                coords.push(geom.coordinates);
                break;
            case 'MultiPoint':
            case 'LineString':
                coords.push(...geom.coordinates);
                break;
            case 'MultiLineString':
            case 'Polygon':
                geom.coordinates.forEach(ring => coords.push(...ring));
                break;
            case 'MultiPolygon':
                geom.coordinates.forEach(poly => poly.forEach(ring => coords.push(...ring)));
                break;
            case 'GeometryCollection':
                geom.geometries.forEach(extractFromGeom);
                break;
        }
    };

    if ('type' in geojson && geojson.type === 'FeatureCollection') {
        geojson.features.forEach(f => f.geometry && extractFromGeom(f.geometry));
    } else {
        extractFromGeom(geojson as Geometry);
    }

    if (coords.length === 0) return null;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    coords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
    });

    return [minLng, minLat, maxLng, maxLat];
}
