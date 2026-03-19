import { NextResponse } from 'next/server';

const LAT = 4.816611143834595;
const LON = -75.69749264696267;

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    // Default: last 14 days up to yesterday (archive needs at least 5-day lag)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 13);

    const start = searchParams.get('start') ?? formatDate(startDate);
    const end = searchParams.get('end') ?? formatDate(endDate);

    const url = `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${LAT}&longitude=${LON}` +
        `&start_date=${start}&end_date=${end}` +
        `&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m` +
        `&timezone=America%2FBogota`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json({ error: `Open-Meteo ${res.status}` }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Meteo unreachable' }, { status: 502 });
    }
}
