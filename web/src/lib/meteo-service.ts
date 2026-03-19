/** Open-Meteo archive response for Pereira */
export interface MeteoHourly {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
}

export interface MeteoResponse {
    latitude: number;
    longitude: number;
    timezone: string;
    hourly: MeteoHourly;
    hourly_units: Record<string, string>;
}

/** A single processed data point for chart rendering */
export interface TempPoint {
    time: string;       // ISO datetime
    label: string;      // human-readable "dd/MM HH:mm"
    temp: number;       // °C
    humidity: number;   // %
    rain: number;       // mm
    wind: number;       // km/h
}

/** Fetch temperature and weather data from the local proxy */
export async function fetchTemperatura(opts?: {
    start?: string;
    end?: string;
}): Promise<TempPoint[]> {
    const params = new URLSearchParams();
    if (opts?.start) params.set('start', opts.start);
    if (opts?.end) params.set('end', opts.end);

    const res = await fetch(`/api/meteo/temperatura?${params.toString()}`);
    if (!res.ok) throw new Error(`Meteo proxy ${res.status}`);

    const data: MeteoResponse = await res.json();
    const h = data.hourly;

    return h.time.map((t, i) => ({
        time: t,
        label: new Date(t).toLocaleString('es-CO', {
            day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit',
            hour12: false,
        }),
        temp: h.temperature_2m[i] ?? 0,
        humidity: h.relative_humidity_2m[i] ?? 0,
        rain: h.precipitation[i] ?? 0,
        wind: h.wind_speed_10m[i] ?? 0,
    }));
}

/** Compute summary stats from a TempPoint array */
export function computeStats(points: TempPoint[]) {
    // Filter out points with zero-ish/null padding from the API
    const validPoints = points.filter(p => p.temp !== 0 || p.humidity !== 0);
    if (!validPoints.length) return null;

    const temps = validPoints.map(p => p.temp);
    const rains = validPoints.map(p => p.rain);
    return {
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgTemp: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
        totalRain: +(rains.reduce((a, b) => a + b, 0)).toFixed(1),
        latest: validPoints[validPoints.length - 1],
    };
}

/** Open-Meteo ERA5 response */
export interface Era5Response {
    latitude: number;
    longitude: number;
    timezone: string;
    hourly: {
        time: string[];
        temperature_2m: number[];
    };
}

export interface Era5Summary {
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    dataPoints: number;
}

/** Fetch historical ERA5 data from internal proxy */
export async function fetchEra5Data(): Promise<Era5Summary | null> {
    try {
        const res = await fetch('/api/meteo/era5');
        if (!res.ok) throw new Error(`Meteo ERA5 proxy ${res.status}`);

        const data: Era5Response = await res.json();
        const temps = data.hourly.temperature_2m.filter(t => t !== null && t !== undefined);

        if (!temps.length) return null;

        return {
            minTemp: Math.min(...temps),
            maxTemp: Math.max(...temps),
            avgTemp: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
            dataPoints: temps.length
        };
    } catch (err) {
        console.error("Error fetching ERA5 data:", err);
        return null;
    }
}

export interface WeatherActual {
    temp: number;
    humidity: number;
    wind: number;
    description: string;
    icon: string;
    timestamp: number;
    city: string;
}

/** Fetch real-time weather data from OpenWeatherMap proxy */
export async function fetchWeatherActual(): Promise<WeatherActual | null> {
    try {
        const res = await fetch('/api/meteo/actual');
        if (!res.ok) {
            console.warn(`Weather Actual proxy ${res.status}: Key might be pending activation (up to 2h).`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("Error fetching weather actual data:", err);
        return null;
    }
}
