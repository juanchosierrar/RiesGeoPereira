import { NextResponse } from 'next/server';

const SGC_BASE = 'https://services1.arcgis.com/Og2nrTKe5bptW02d/ArcGIS/rest/services';

export async function GET() {
    const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        outSR: '4326',
        f: 'geojson',
    });

    const url = `${SGC_BASE}/Volcanes_2023/FeatureServer/0/query?${params.toString()}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json(
                { type: 'FeatureCollection', features: [], error: `SGC Volcanes ${res.status}` },
                { status: 200 }
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { type: 'FeatureCollection', features: [], error: 'SGC Volcanes unreachable' },
            { status: 200 }
        );
    }
}
