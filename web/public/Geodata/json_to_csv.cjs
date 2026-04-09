const fs = require('fs');

const inputPath = 'd:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\Microzonificacion_flat.json';
const outputPath = 'd:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\Microzonificacion.csv';

const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

if (data.length === 0) {
    console.log('No data to convert.');
    process.exit(0);
}

// Extract headers
const headers = Object.keys(data[0]);

// Escape logic for CSV
function escapeCSV(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Si contiene comas, comillas dobles, o saltos de línea, se debe envolver en comillas dobles
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Escapar las comillas dobles internas duplicándolas
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

const csvRows = [];
// Add header row
csvRows.push(headers.map(escapeCSV).join(','));

// Add data rows
for (const row of data) {
    const values = headers.map(header => escapeCSV(row[header]));
    csvRows.push(values.join(','));
}

fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');
console.log('CSV guardado exitosamente en:', outputPath);
