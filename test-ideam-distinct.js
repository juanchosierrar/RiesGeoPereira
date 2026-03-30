const url = 'https://www.datos.gov.co/resource/57sv-p2fu.json?$select=nombreestacion,municipio,latitud,longitud&$where=departamento%20=%20%27RISARALDA%27&$group=nombreestacion,municipio,latitud,longitud&$limit=100';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.length > 0) {
            console.log('Found', data.length, 'unique stations in RISARALDA');
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found.');
            console.log('Error output (if any):', data);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
