const url = 'https://www.datos.gov.co/resource/cqmv-a99d.json?$limit=50';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Total records fetched:', data.length);
        const depts = [...new Set(data.map(d => d.departamento))];
        console.log('Departments in this sample:', depts.join(', '));
        
        const risaralda = data.filter(d => d.departamento && d.departamento.toUpperCase().includes('RISARALDA'));
        console.log('Risaralda stations in this sample:', risaralda.length);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
