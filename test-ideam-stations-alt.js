const url = 'https://www.datos.gov.co/resource/sbv2-4hcy.json?departamento=RISARALDA&$limit=5';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.length > 0) {
            console.log('Found', data.length, 'stations in RISARALDA for sbv2-4hcy');
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found for RISARALDA in sbv2-4hcy.');
            // Let's try to find what departments are available in this one
            const urlAll = 'https://www.datos.gov.co/resource/sbv2-4hcy.json?$select=distinct%20departamento';
            const resAll = await fetch(urlAll);
            const dataAll = await resAll.json();
            console.log('Available departments (sbv2-4hcy):', dataAll.map(d => d.departamento).join(', '));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
