const url = 'https://www.datos.gov.co/resource/cqmv-a99d.json?departamento=RISARALDA&$limit=5';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.length > 0) {
            console.log('Found', data.length, 'stations for RISARALDA');
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found for RISARALDA.');
            // Let's try to find what departments are available
            const urlDistinct = 'https://www.datos.gov.co/resource/cqmv-a99d.json?$select=distinct%20departamento';
            const resD = await fetch(urlDistinct);
            const dataD = await resD.json();
            console.log('Available departments:', dataD.map(d => d.departamento).join(', '));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
