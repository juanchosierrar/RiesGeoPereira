const fs = require('fs');

const sql = fs.readFileSync(__dirname + '/pot_insert.sql', 'utf8');

const INSFORGE_URL = 'https://dt7mf4ie.us-west.insforge.app';
const INSFORGE_API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';

async function run() {
  console.log('Sending raw SQL...');
  const res = await fetch(`${INSFORGE_URL}/api/database/advance/rawsql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const ds = await res.text();
  console.log(res.status, ds);
}
run();
