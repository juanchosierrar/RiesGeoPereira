const fs = require('fs');

const file = fs.readFileSync(__dirname + '/../public/Geodata/pot_simplified.json', 'utf8');
const data = JSON.parse(file);

const out = data.features.map(f => {
  return {
    FID: f.properties.FID,
    Subcategor: f.properties.Subcategor,
    Nombre: f.properties.Nombre,
    Fuente: f.properties.Fuente,
    Amenaza: f.properties.Amenaza,
    SHAPE_Leng: f.properties.SHAPE_Leng,
    SHAPE_Area: f.properties.SHAPE_Area,
    geometry_geojson: JSON.stringify(f.geometry),
    lat: f.geometry.coordinates[0]?.[0]?.[1] || 4.819,
    lon: f.geometry.coordinates[0]?.[0]?.[0] || -75.73
  };
});

fs.writeFileSync(__dirname + '/../pot_insert.json', JSON.stringify(out, null, 2));
console.log('Items parsed:', out.length);
