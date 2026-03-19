import { NextResponse } from 'next/server';

const SGC_BASE = 'https://services1.arcgis.com/Og2nrTKe5bptW02d/ArcGIS/rest/services';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const volcán = searchParams.get('volcan');

    // Build where clause — optionally filter by volcano name
    const where = volcán
        ? `NOMBRE_VOLCAN='${volcán}'`
        : "1=1";

    const params = new URLSearchParams({
        where,
        outFields: 'OBJECTID,NOMBRE_VOLCAN,GRADO_AMENAZA,FENOMENO_VOLCANICO,CATEGORIA_ESPECIFICA_FENOMENO,ZONA_SUBZONA,DESCRIPCION,AREAKM2',
        outSR: '4326',
        f: 'geojson',
        resultRecordCount: '500',
    });

    const url = `${SGC_BASE}/AmenazasVolcanicasCOLOMBIA/FeatureServer/0/query?${params.toString()}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json(
                { type: 'FeatureCollection', features: [], error: `SGC Volcánica ${res.status}` },
                { status: 200 }
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { type: 'FeatureCollection', features: [], error: 'SGC Volcánica unreachable' },
            { status: 200 }
        );
    }
}
