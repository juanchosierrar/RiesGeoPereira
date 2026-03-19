import * as toGeoJSON from '@mapbox/togeojson';
import shp from 'shpjs';
import JSZip from 'jszip';
import type { FeatureCollection } from 'geojson';

export interface KmlLayer {
    id: string;
    name: string;
    filename: string;
    geojson: FeatureCollection;
    visible: boolean;
    color: string;
    addedAt: Date;
}

const LAYER_COLORS = ['#1B365D', '#D32F2F', '#F57C00', '#2E7D32', '#7B1FA2', '#00838F', '#C62828', '#4527A0'];
let colorIndex = 0;

function nextColor(): string {
    const color = LAYER_COLORS[colorIndex % LAYER_COLORS.length];
    colorIndex++;
    return color;
}

function parseKmlDoc(text: string, fileName: string): FeatureCollection {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const parseError = xml.querySelector('parsererror');
    if (parseError) {
        throw new Error('El archivo no es un KML válido');
    }

    const geojson = toGeoJSON.kml(xml) as FeatureCollection;

    if (!geojson.features || geojson.features.length === 0) {
        throw new Error('El archivo KML no contiene geometrías');
    }

    // Attempt to extract name from KML document
    const docName = xml.querySelector('Document > name')?.textContent
        || xml.querySelector('Folder > name')?.textContent
        || fileName.replace(/\.kml$/i, '');
    
    // Attach name to the geojson so we can use it later
    (geojson as any).name = docName;

    return geojson;
}

export function parseKmlFile(file: File): Promise<KmlLayer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const geojson = parseKmlDoc(text, file.name);

                const layer: KmlLayer = {
                    id: `kml-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name: (geojson as any).name || file.name.replace('.kml', ''),
                    filename: file.name,
                    geojson,
                    visible: true,
                    color: nextColor(),
                    addedAt: new Date(),
                };

                resolve(layer);
            } catch (err) {
                reject(new Error(`Error al parsear KML: ${err instanceof Error ? err.message : 'desconocido'}`));
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

export async function parseKmzFile(file: File): Promise<KmlLayer> {
    try {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        
        // KMZ is a zipped KML. Look for doc.kml or any .kml file
        const kmlFile = zip.file('doc.kml') || zip.file(/\.kml$/i)[0];
        
        if (!kmlFile) {
            throw new Error('No se encontró un archivo .kml dentro del KMZ');
        }

        const kmlText = await kmlFile.async('string');
        const geojson = parseKmlDoc(kmlText, file.name);

        return {
            id: `kmz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: (geojson as any).name || file.name.replace(/\.kmz$/i, ''),
            filename: file.name,
            geojson,
            visible: true,
            color: nextColor(),
            addedAt: new Date(),
        };
    } catch (err) {
        throw new Error(`Error al procesar KMZ: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
}

export async function parseShapefileZip(file: File): Promise<KmlLayer> {
    try {
        const buffer = await file.arrayBuffer();
        const geojsonRaw = await shp(buffer);

        let fc: FeatureCollection;
        let name = file.name.replace(/\.zip$/i, '');

        if (Array.isArray(geojsonRaw)) {
            fc = {
                type: 'FeatureCollection',
                features: geojsonRaw.flatMap(g => g.features)
            };
            if (geojsonRaw[0]?.fileName) name = geojsonRaw[0].fileName;
        } else {
            fc = geojsonRaw as FeatureCollection;
            if (geojsonRaw.fileName) name = geojsonRaw.fileName;
        }

        if (!fc.features || fc.features.length === 0) {
            throw new Error('El archivo Shapefile no contiene geometrías válidas');
        }

        return {
            id: `shp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: name,
            filename: file.name,
            geojson: fc,
            visible: true,
            color: nextColor(),
            addedAt: new Date(),
        };
    } catch (err) {
        throw new Error(`Error al procesar Shapefile: ${err instanceof Error ? err.message : 'Asegúrese de subir un .zip que contenga .shp, .shx y .dbf'}`);
    }
}
