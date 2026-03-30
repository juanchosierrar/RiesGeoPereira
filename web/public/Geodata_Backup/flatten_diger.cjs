const fs = require('fs');

const rawData = fs.readFileSync('d:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\datos_diger.json', 'utf8');
const data = JSON.parse(rawData);

const flatData = data.features.map(f => f.attributes);

fs.writeFileSync('d:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\datos_diger_flat.json', JSON.stringify(flatData, null, 2));
console.log(`Successfully flattened ${flatData.length} records.`);
