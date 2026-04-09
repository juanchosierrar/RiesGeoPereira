import fs from 'fs';
import path from 'path';
import proj4 from 'proj4';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://dt7mf4ie.us-west.insforge.app';
const INSFORGE_API_KEY = process.env.NEXT_PUBLIC_INSFORGE_API_KEY;

if (!INSFORGE_API_KEY) {
  console.error('Error: NEXT_PUBLIC_INSFORGE_API_KEY is not defined in .env.local');
  process.exit(1);
}

// EPSG:3115 (MAGNA-SIRGAS / Colombia West zone)
// Source: https://epsg.io/3115
const EPSG3115 = '+proj=tmerc +lat_0=4.596200416666666 +lon_0=-77.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const EPSG4326 = 'EPSG:4326';

proj4.defs('EPSG:3115', EPSG3115);

const INPUT_FILE = path.resolve(process.cwd(), 'public/Geodata/pot_simplified.json');
const TABLE_NAME = 'amenazas_pot';

async function uploadToInsforge(records: any[]) {
  console.log(`Uploading batch of ${records.length} records...`);
  try {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INSFORGE_API_KEY as string,
      },
      body: JSON.stringify(records),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error uploading to Insforge: ${response.status} ${response.statusText}`, errorText);
        return false;
    }
    return true;
  } catch (error) {
    console.error('Fetch error:', error);
    return false;
  }
}

async function main() {
  const rawData = fs.readFileSync(path.resolve(process.cwd(), 'pot_insert.json'), 'utf8');
  const convertedRecords = JSON.parse(rawData);

  // Batch upload (1 at a time due to huge polygon sizes)
  const BATCH_SIZE = 1;
  for (let i = 0; i < convertedRecords.length; i += BATCH_SIZE) {
    const batch = convertedRecords.slice(i, i + BATCH_SIZE);
    const success = await uploadToInsforge(batch);
    if (!success) {
      console.warn('Stopping upload due to error.');
      break;
    }
    console.log(`Uploaded ${Math.min(i + BATCH_SIZE, convertedRecords.length)} / ${convertedRecords.length}`);
  }

  console.log('Finished processing.');
}

main().catch(console.error);
