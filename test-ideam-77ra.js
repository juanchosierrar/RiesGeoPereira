const url = 'https://www.datos.gov.co/resource/77ra-mrxj.json?departamento=Risaralda&$limit=5';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.length > 0) {
            console.log('Found', data.length, 'stations in Risaralda for 77ra-mrxj');
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found for Risaralda in 77ra-mrxj.');
            // Try uppercase
             const urlUpper = 'https://www.datos.gov.co/resource/77ra-mrxj.json?departamento=RISARALDA&$limit=5';
             const resUpper = await fetch(urlUpper);
             const dataUpper = await resUpper.json();
             if (dataUpper.length > 0) {
                 console.log('Found', dataUpper.length, 'stations in RISARALDA (UPPER) for 77ra-mrxj');
             } else {
                console.log('No data found for RISARALDA (UPPER) in 77ra-mrxj.');
             }
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
