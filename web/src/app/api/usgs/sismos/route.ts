import { NextResponse } from 'next/server';

// USGS FDSN Web Service — public API, no key required
const USGS_BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// Pereira / Eje Cafetero region bounding box
const DEFAULTS = {
    minlatitude: '4.2',
    maxlatitude: '5.4',
    minlongitude: '-76.3',
    maxlongitude: '-75.1',
    starttime: '1990-01-01',
    minmagnitude: '2.5',
    orderby: 'magnitude',
    limit: '300',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const params = new URLSearchParams({
        format: 'geojson',
        minlatitude: searchParams.get('minlat') || DEFAULTS.minlatitude,
        maxlatitude: searchParams.get('maxlat') || DEFAULTS.maxlatitude,
        minlongitude: searchParams.get('minlng') || DEFAULTS.minlongitude,
        maxlongitude: searchParams.get('maxlng') || DEFAULTS.maxlongitude,
        starttime: searchParams.get('start') || DEFAULTS.starttime,
        endtime: searchParams.get('end') || new Date().toISOString().split('T')[0],
        minmagnitude: searchParams.get('minMag') || DEFAULTS.minmagnitude,
        orderby: searchParams.get('orderby') || DEFAULTS.orderby,
        limit: searchParams.get('limit') || DEFAULTS.limit,
    });

    const url = `${USGS_BASE}?${params.toString()}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json(
                { type: 'FeatureCollection', features: [], error: `USGS ${res.status}` },
                { status: 200 }
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { type: 'FeatureCollection', features: [], error: 'USGS API unreachable' },
            { status: 200 }
        );
    }
}
