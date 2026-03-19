import { NextResponse } from 'next/server';

const LAT = 4.816611143834595;
const LON = -75.69749264696267;

export async function GET() {
    // Definir el rango del 2021 según solicitud del usuario
    const start = '2021-01-01';
    const end = '2021-12-31';

    const url = `https://archive-api.open-meteo.com/v1/era5?` +
        `latitude=${LAT}&longitude=${LON}` +
        `&start_date=${start}&end_date=${end}` +
        `&hourly=temperature_2m`;

    try {
        const res = await fetch(url, { cache: 'force-cache' }); // Cachearlo ya que los datos históricos de 2021 no cambian
        if (!res.ok) {
            return NextResponse.json({ error: `Open-Meteo ERA5 ${res.status}` }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Meteo unreachable' }, { status: 502 });
    }
}
