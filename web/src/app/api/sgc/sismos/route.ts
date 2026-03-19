import { NextResponse } from 'next/server';

const SGC_BASE = 'https://services1.arcgis.com/Og2nrTKe5bptW02d/ArcGIS/rest/services';
const SERVICE_NAME = 'Sismos_Hist%C3%B3rico'; // Pre-encoded "Histórico"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const minMag = searchParams.get('minMag') || '3';
    const maxRecords = searchParams.get('maxRecords') || '150';
    const xmin = searchParams.get('xmin');
    const ymin = searchParams.get('ymin');
    const xmax = searchParams.get('xmax');
    const ymax = searchParams.get('ymax');

    // Build query parts manually to avoid double-encoding
    const parts: string[] = [
        `where=${encodeURIComponent(`Mw >= ${minMag}`)}`,
        'outFields=*',
        'outSR=4326',
        'f=json',
        `resultRecordCount=${maxRecords}`,
        `orderByFields=${encodeURIComponent('Mw DESC')}`,
    ];

    if (xmin && ymin && xmax && ymax) {
        // ArcGIS envelope format: xmin,ymin,xmax,ymax
        parts.push(`geometry=${xmin},${ymin},${xmax},${ymax}`);
        parts.push('geometryType=esriGeometryEnvelope');
        parts.push('spatialRel=esriSpatialRelIntersects');
        parts.push('inSR=4326');
    }

    const url = `${SGC_BASE}/${SERVICE_NAME}/FeatureServer/0/query?${parts.join('&')}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json({ features: [], error: `SGC ${res.status}` }, { status: 200 });
        }
        const data = await res.json();
        if (data.error) {
            return NextResponse.json({ features: [], error: data.error.message }, { status: 200 });
        }
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { features: [], error: 'SGC API unreachable' },
            { status: 200 }
        );
    }
}
