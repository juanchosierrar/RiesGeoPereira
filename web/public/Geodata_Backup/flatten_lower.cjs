const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\datos_diger_flat.json'));
const lower = data.map(o => Object.fromEntries(Object.entries(o).map(([k,v]) => [k.toLowerCase(), v])));
fs.writeFileSync('d:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\datos_diger_flat_lower.json', JSON.stringify(lower));

console.log('Lowercase flatten conversion done.');
