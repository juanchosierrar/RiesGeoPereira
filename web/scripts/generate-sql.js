const fs = require('fs');

const file = fs.readFileSync(__dirname + '/../public/Geodata/pot_simplified.json', 'utf8');
const data = JSON.parse(file);

let sql = `INSERT INTO amenazas_pot ("FID", "Subcategor", "Nombre", "Fuente", "Amenaza", "SHAPE_Leng", "SHAPE_Area", "geometry_geojson", "lat", "lon") VALUES\n`;

const values = data.features.map(f => {
  const geom = JSON.stringify(f.geometry).replace(/'/g, "''");
  const lat = f.geometry.coordinates[0]?.[0]?.[1] || 4.819;
  const lon = f.geometry.coordinates[0]?.[0]?.[0] || -75.73;
  return `(${f.properties.FID}, '${f.properties.Subcategor || ''}', '${f.properties.Nombre || ''}', '${f.properties.Fuente || ''}', ${f.properties.Amenaza || 0}, ${f.properties.SHAPE_Leng || 0}, ${f.properties.SHAPE_Area || 0}, '${geom}', ${lat}, ${lon})`;
});

sql += values.join(',\n') + ';';

fs.writeFileSync(__dirname + '/pot_insert.sql', sql);
console.log('SQL generated. Bytes:', Buffer.byteLength(sql, 'utf8'));
