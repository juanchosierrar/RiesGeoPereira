import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FeatureCollection, Feature, Point } from 'geojson';

const LAT_COLUMNS = ['lat', 'latitude', 'latitud', 'y', 'norte', 'northing', 'coordenada_y'];
const LON_COLUMNS = ['lon', 'long', 'longitude', 'longitud', 'x', 'este', 'easting', 'coordenada_x'];

function findColumn(headers: string[], candidates: string[]): string | undefined {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    for (const cand of candidates) {
        const index = lowerHeaders.indexOf(cand.toLowerCase());
        if (index !== -1) return headers[index];
    }
    return undefined;
}

export function parseCsvFile(file: File): Promise<FeatureCollection> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const data = results.data as Record<string, any>[];
                    if (data.length === 0) {
                        throw new Error('El archivo CSV está vacío');
                    }

                    const headers = Object.keys(data[0]);
                    const latCol = findColumn(headers, LAT_COLUMNS);
                    const lonCol = findColumn(headers, LON_COLUMNS);

                    if (!latCol || !lonCol) {
                        throw new Error(`No se detectaron columnas de coordenadas. Se requieren columnas como: ${LAT_COLUMNS.join(', ')} y ${LON_COLUMNS.join(', ')}`);
                    }

                    const features: Feature<Point>[] = data
                        .map((row, idx) => {
                            const lat = parseFloat(String(row[latCol]));
                            const lon = parseFloat(String(row[lonCol]));

                            if (isNaN(lat) || isNaN(lon)) return null;

                            return {
                                type: 'Feature',
                                id: idx,
                                geometry: {
                                    type: 'Point',
                                    coordinates: [lon, lat]
                                },
                                properties: row
                            } as Feature<Point>;
                        })
                        .filter((f): f is Feature<Point> => f !== null);

                    resolve({
                        type: 'FeatureCollection',
                        features
                    });
                } catch (err) {
                    reject(err);
                }
            },
            error: (err) => reject(new Error(`Error PapaParse: ${err.message}`))
        });
    });
}

export async function parseExcelFile(file: File): Promise<FeatureCollection> {
    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (data.length === 0) {
            throw new Error('El archivo Excel está vacío');
        }

        const headers = Object.keys(data[0]);
        const latCol = findColumn(headers, LAT_COLUMNS);
        const lonCol = findColumn(headers, LON_COLUMNS);

        if (!latCol || !lonCol) {
            throw new Error(`No se detectaron columnas de coordenadas. Se requieren columnas como: ${LAT_COLUMNS.join(', ')} y ${LON_COLUMNS.join(', ')}`);
        }

        const features: Feature<Point>[] = data
            .map((row, idx) => {
                const lat = parseFloat(String(row[latCol]));
                const lon = parseFloat(String(row[lonCol]));

                if (isNaN(lat) || isNaN(lon)) return null;

                return {
                    type: 'Feature',
                    id: idx,
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    properties: row
                } as Feature<Point>;
            })
            .filter((f): f is Feature<Point> => f !== null);

        return {
            type: 'FeatureCollection',
            features
        };
    } catch (err) {
        throw new Error(`Error al procesar Excel: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
}
