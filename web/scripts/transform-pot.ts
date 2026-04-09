import fs from 'fs';
import proj4 from 'proj4';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

// Define projections
const EPSG3115 = "+proj=tmerc +lat_0=4.596200416666666 +lon_0=-77.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const EPSG4326 = "EPSG:4326";

async function transformData() {
    console.log('Reading original GeoJSON...');
    const inputPath = 'public/Geodata/Areas_amenaza_urbano_expansion.json';
    const outputPath = 'public/Geodata/pot_transformed.json';
    
    if (!fs.existsSync(inputPath)) {
        console.error('File not found:', inputPath);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const features = rawData.features || [];

    console.log(`Processing ${features.length} features...`);

    const transformedFeatures = features.map((feature: any) => {
        const attributes = feature.attributes;
        const rings = feature.geometry.rings;

        // Transform coordinates
        const transformedRings = rings.map((ring: any[]) => {
            return ring.map((coord: number[]) => {
                try {
                    return proj4(EPSG3115, EPSG4326, coord);
                } catch (e) {
                    console.error('Error transforming coordinate:', coord, e);
                    return coord;
                }
            });
        });

        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: transformedRings
            },
            properties: attributes
        };
    });

    const outputGeoJSON = {
        type: 'FeatureCollection',
        features: transformedFeatures
    };

    console.log(`Writing transformed GeoJSON to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(outputGeoJSON, null, 2));
    console.log('Success!');
}

transformData().catch(console.error);
