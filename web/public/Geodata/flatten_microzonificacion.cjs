const fs = require('fs');

const filePath = 'd:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\Microzonificacion_sismica.geojson';
console.log('Leyendo archivo:', filePath);

const rawData = fs.readFileSync(filePath, 'utf8');
const geojson = JSON.parse(rawData);

if (!geojson.features || !Array.isArray(geojson.features)) {
    console.error('El archivo no parece ser un FeatureCollection válido.');
    process.exit(1);
}

const flatData = geojson.features.map(feature => {
    const props = {};
    
    // Normalizar las propiedades para que funcionen bien como columnas en la base de datos (Postgres/Insforge)
    if (feature.properties) {
        for (const [key, value] of Object.entries(feature.properties)) {
            // Convertir a minúsculas
            let safeKey = key.toLowerCase();
            
            // Reemplazar el símbolo $ por _peso y el símbolo ‰ por _permil o _tasa
            safeKey = safeKey.replace(/\$/g, '_val').replace(/‰/g, '_tasa');
            
            // Remover cualquier otro caracter que no sea alfanumérico o guion bajo
            safeKey = safeKey.replace(/[^a-z0-9_]/g, '');
            
            // Prevenir llaves vacías
            if (!safeKey) safeKey = 'prop_' + Object.keys(props).length;
            
            props[safeKey] = value;
        }
    }
    
    // Serializar la geometría para almacenarla en un campo de texto
    props.geometry_json = JSON.stringify(feature.geometry);
    
    return props;
});

const outputPath = 'd:\\PROYECTOS\\MAESTRIA EN GESTION DEL RIESGO\\TESIS\\2026\\DESARROLLO IA\\RiesGeoPereira\\web\\public\\Geodata\\Microzonificacion_flat.json';
fs.writeFileSync(outputPath, JSON.stringify(flatData));

console.log(`Conversión completada. Se aplanaron ${flatData.length} registros y se guardaron en ${outputPath}`);
