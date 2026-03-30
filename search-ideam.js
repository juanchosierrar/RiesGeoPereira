async function search() {
    const query = 'IDEAM';
    const url = `https://www.datos.gov.co/api/views?q=${encodeURIComponent(query)}&limit=15`;
    console.log('Searching for:', query);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Found', data.length, 'results');
        data.forEach((item, i) => {
            console.log(`${i+1}. Title: ${item.name}, ID: ${item.id}`);
        });
    } catch (err) {
        console.error('Search error:', err);
    }
}

search();
