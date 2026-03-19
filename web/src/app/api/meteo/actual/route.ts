import { NextResponse } from 'next/server';

const LAT = 4.8166;
const LON = -75.6975;
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

export async function GET() {
    if (!API_KEY) {
        return NextResponse.json({ error: 'OpenWeather API Key not configured' }, { status: 500 });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: `OpenWeather Error: ${errorData.message || res.statusText}` }, { status: res.status });
        }
        const data = await res.json();
        
        // Transform to a clean format for our frontend
        const weather = {
            temp: data.main.temp,
            humidity: data.main.humidity,
            wind: data.wind.speed * 3.6, // Convert m/s to km/h
            description: data.weather[0]?.description || 'N/A',
            icon: data.weather[0]?.icon || '',
            timestamp: data.dt * 1000,
            city: data.name
        };

        return NextResponse.json(weather);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Weather service unreachable' }, { status: 502 });
    }
}
