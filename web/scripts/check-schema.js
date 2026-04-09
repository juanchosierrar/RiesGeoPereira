/**
 * check-schema.js
 * Verifica el esquema de la tabla amenazas_pot en InsForge usando rawsql.
 */
const https = require('https');

const INSFORGE_URL = 'dt7mf4ie.us-west.insforge.app';
const INSFORGE_API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';

const query = `
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'amenazas_pot'
ORDER BY ordinal_position;
`;

const postData = JSON.stringify({ query });

const options = {
  hostname: INSFORGE_URL,
  path: '/api/database/advance/rawsql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${INSFORGE_API_KEY}`,
    'Content-Length': Buffer.byteLength(postData),
  },
  timeout: 30000,
};

console.log('Consultando esquema de amenazas_pot...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.on('timeout', () => {
  console.error('Request timed out!');
  req.destroy();
});

req.write(postData);
req.end();
