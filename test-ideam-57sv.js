const url = 'https://www.datos.gov.co/resource/57sv-p2fu.json?departamento=RISARALDA&$limit=5';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.length > 0) {
            console.log('Found', data.length, 'stations in RISARALDA for 57sv-p2fu');
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found for RISARALDA in 57sv-p2fu.');
            // Test if it exists at all
            const urlAll = 'https://www.datos.gov.co/resource/57sv-p2fu.json?$limit=1';
            const resAll = await fetch(urlAll);
            const dataAll = await resAll.json();
            console.log('Sample data (no filter):', JSON.stringify(dataAll, null, 2));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
