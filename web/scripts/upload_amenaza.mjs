import fs from 'fs';
import proj4 from 'proj4';

// Definición de Proyección Magna-Sirgas / West (WKID 3115)
// Fuente: epsg.io/3115
const proj3115 = "+proj=tmerc +lat_0=4.596200417 +lon_0=-77.077507917 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const proj4326 = "EPSG:4326";

const INPUT_FILE = './public/Geodata/Areas_amenaza_urbano_expansion.json';
const API_URL = 'https://dt7mf4ie.us-west.insforge.app/api/database/records/areas_amenaza';
const API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';

async function run() {
    console.log('--- Iniciando procesamiento de Capa de Amenaza ---');
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('Error: No se encuentra el archivo ' + INPUT_FILE);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    const features = rawData.features;
    console.log(`Encontradas ${features.length} macro-zonas.`);

    const records = features.map((f, idx) => {
        console.log(`Procesando zona ${idx}: ${f.attributes.Nombre}...`);
        
        // Transformar anillos (rings) de Esri JSON a coordenadas GeoJSON [lon, lat]
        const transformedRings = f.geometry.rings.map(ring => {
            return ring.map(pt => {
                const projected = proj4(proj3115, proj4326, [pt[0], pt[1]]);
                return [projected[0], projected[1]];
            });
        });

        // Crear geometría GeoJSON de tipo Polígono
        // Nota: Esri rings pueden ser múltiples (polígonos con huecos)
        const geometryGeoJSON = {
            type: 'Polygon',
            coordinates: transformedRings
        };

        return {
            fid: f.attributes.FID,
            subcategor: f.attributes.Subcategor,
            nombre: f.attributes.Nombre,
            fuente: f.attributes.Fuente,
            amenaza: f.attributes.Amenaza,
            shape_leng: f.attributes.SHAPE_Leng,
            shape_area: f.attributes.SHAPE_Area,
            geometry_json: JSON.stringify(geometryGeoJSON)
        };
    });

    console.log('Subiendo datos a InsForge...');

    for (const record of records) {
        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(record)
            });

            if (!resp.ok) {
                const err = await resp.text();
                console.error(`Error subiendo registro ${record.nombre}:`, err);
            } else {
                console.log(`✓ Registro guardado: ${record.nombre}`);
            }
        } catch (e) {
            console.error(`Error de conexión al subir ${record.nombre}:`, e.message);
        }
    }

    console.log('--- Proceso finalizado ---');
}

run();
