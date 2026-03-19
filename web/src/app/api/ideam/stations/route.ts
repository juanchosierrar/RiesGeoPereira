import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const departamento = searchParams.get('departamento');

    const params = new URLSearchParams();
    if (departamento) params.set('departamento', departamento.toUpperCase());
    params.set('$limit', '5000');

    const url = `https://www.datos.gov.co/resource/57sv-p2fu.json?${params.toString()}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json({ error: `IDEAM Proxy Error: ${res.status}` }, { status: 200 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'IDEAM service unreachable' }, { status: 200 });
    }
}
