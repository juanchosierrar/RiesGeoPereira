/**
 * fix-and-upload.js
 * 1. Recrea la tabla amenazas_pot con tipos correctos (DROP + CREATE)
 * 2. Inserta los 4 registros del POT
 * 
 * Uso: node scripts/fix-and-upload.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'dt7mf4ie.us-west.insforge.app';
const API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';
const TABLE_NAME = 'amenazas_pot';
const INPUT_FILE = path.resolve(__dirname, '../public/Geodata/pot_simplified.json');

// HTTPS request helper (no fetch, uses Node's native https)
function httpsPost(path, body, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: HOST,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(postData);
    req.end();
  });
}

// Calcular centroide aproximado
function getCentroid(geometry) {
  try {
    let coords = [];
    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      coords = geometry.coordinates[0][0];
    }
    if (!coords || coords.length === 0) return { lat: null, lon: null };
    const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return { lat, lon };
  } catch {
    return { lat: null, lon: null };
  }
}

// Escape string for SQL
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function runSQL(query) {
  console.log('\n→ SQL:', query.slice(0, 100) + (query.length > 100 ? '...' : ''));
  const result = await httpsPost('/api/database/advance/rawsql', { query });
  console.log(`  Status: ${result.status}`);
  console.log(`  Body: ${result.body.slice(0, 300)}`);
  return result;
}

async function main() {
  console.log('=== Fix & Upload amenazas_pot ===\n');

  // Step 1: Drop existing table
  console.log('--- PASO 1: Eliminar tabla existente ---');
  await runSQL(`DROP TABLE IF EXISTS ${TABLE_NAME};`);

  // Step 2: Create table with correct types
  console.log('\n--- PASO 2: Crear tabla con esquema correcto ---');
  const createSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id              SERIAL PRIMARY KEY,
  fid             INTEGER,
  subcategor      TEXT,
  nombre          TEXT,
  fuente          TEXT,
  amenaza         TEXT,
  shape_leng      DOUBLE PRECISION,
  shape_area      DOUBLE PRECISION,
  geometry_geojson TEXT,
  lat             DOUBLE PRECISION,
  lon             DOUBLE PRECISION,
  created_at      TIMESTAMP DEFAULT NOW()
);`;
  await runSQL(createSQL);

  // Step 3: Read and insert data
  console.log('\n--- PASO 3: Insertar datos ---');
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];
  console.log(`  Encontrados: ${features.length} features`);

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const props = feature.properties || {};
    const { lat, lon } = getCentroid(feature.geometry);
    const geomStr = JSON.stringify(feature.geometry);

    const insertSQL = `
INSERT INTO ${TABLE_NAME} (fid, subcategor, nombre, fuente, amenaza, shape_leng, shape_area, geometry_geojson, lat, lon)
VALUES (
  ${feature.id ?? i},
  ${esc(props.Subcategor)},
  ${esc(String(props.Nombre || '').trim())},
  ${esc(props.Fuente)},
  ${esc(props.Amenaza)},
  ${Number(props.SHAPE_Leng) || 0},
  ${Number(props.SHAPE_Area) || 0},
  ${esc(geomStr)},
  ${lat !== null ? lat : 'NULL'},
  ${lon !== null ? lon : 'NULL'}
);`;

    console.log(`\n[${i + 1}/${features.length}] Insertando: "${props.Amenaza}"`);
    const result = await runSQL(insertSQL);
    
    if (result.status >= 400) {
      console.error(`  ❌ Error en registro ${i}`);
    } else {
      console.log(`  ✅ OK`);
    }
  }

  // Step 4: Verify
  console.log('\n--- PASO 4: Verificar datos ---');
  await runSQL(`SELECT id, fid, amenaza, lat, lon FROM ${TABLE_NAME} ORDER BY id;`);

  console.log('\n=== Proceso completado ===');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
