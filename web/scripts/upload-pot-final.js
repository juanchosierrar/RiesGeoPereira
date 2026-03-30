/**
 * upload-pot-final.js
 * Sube los datos de amenazas_pot desde pot_simplified.json a InsForge.
 * Uso: node scripts/upload-pot-final.js
 */

const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const INSFORGE_URL = 'https://dt7mf4ie.us-west.insforge.app';
const INSFORGE_API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';
const TABLE_NAME = 'amenazas_pot';
const INPUT_FILE = path.resolve(__dirname, '../public/Geodata/pot_simplified.json');

// --- HELPER: Calcular centroide aproximado de un GeoJSON geometry ---
function getCentroid(geometry) {
  try {
    let coords = [];
    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0]; // outer ring
    } else if (geometry.type === 'MultiPolygon') {
      // Use first polygon's outer ring
      coords = geometry.coordinates[0][0];
    }
    if (!coords || coords.length === 0) return { lat: null, lon: null };
    const lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    return { lat, lon };
  } catch {
    return { lat: null, lon: null };
  }
}

// --- HELPER: Upload un registro a InsForge ---
async function uploadRecord(record) {
  const res = await fetch(`${INSFORGE_URL}/api/database/records/${TABLE_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': INSFORGE_API_KEY,
    },
    body: JSON.stringify([record]), // API espera un array
  });

  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text };
}

// --- MAIN ---
async function main() {
  console.log('=== Upload POT Data to InsForge ===\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error('ERROR: No se encontró el archivo:', INPUT_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];
  console.log(`Encontrados ${features.length} features en ${path.basename(INPUT_FILE)}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const props = feature.properties || {};
    const { lat, lon } = getCentroid(feature.geometry);

    const record = {
      FID: feature.id ?? i,
      Subcategor: String(props.Subcategor || ''),
      Nombre: String(props.Nombre || '').trim(),
      Fuente: String(props.Fuente || ''),
      Amenaza: String(props.Amenaza || ''),
      SHAPE_Leng: Number(props.SHAPE_Leng) || 0,
      SHAPE_Area: Number(props.SHAPE_Area) || 0,
      geometry_geojson: JSON.stringify(feature.geometry),
      lat: lat,
      lon: lon,
    };

    console.log(`[${i + 1}/${features.length}] Subiendo: "${record.Amenaza}"`);
    console.log(`   FID=${record.FID} | lat=${lat?.toFixed(5)} | lon=${lon?.toFixed(5)}`);

    const result = await uploadRecord(record);

    if (result.ok) {
      console.log(`   ✅ OK (${result.status}): ${result.body.slice(0, 120)}`);
      successCount++;
    } else {
      console.error(`   ❌ FALLO (${result.status}): ${result.body.slice(0, 300)}`);
      failCount++;
    }

    // Pausa breve para no saturar la API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n=== RESUMEN ===');
  console.log(`✅ Subidos: ${successCount}`);
  console.log(`❌ Fallidos: ${failCount}`);
  console.log(`Total: ${features.length}`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
