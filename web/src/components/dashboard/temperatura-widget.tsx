"use client";

import { useState, useEffect, useMemo } from 'react';
import { Thermometer, Droplets, Wind, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { fetchTemperatura, computeStats, fetchWeatherActual, type TempPoint, type WeatherActual } from '@/lib/meteo-service';

type Mode = 'temp' | 'rain' | 'wind';

const MODE_CONFIG = {
    temp: { label: 'Temperatura', unit: '°C', color: '#F97316', icon: Thermometer },
    rain: { label: 'Precipitación', unit: ' mm', color: '#3B82F6', icon: Droplets },
    wind: { label: 'Viento', unit: ' km/h', color: '#8B5CF6', icon: Wind },
} as const;

function Sparkline({ points, mode, color }: { points: TempPoint[]; mode: Mode; color: string }) {
    const W = 280, H = 70;
    const values = points.map(p =>
        mode === 'temp' ? p.temp :
            mode === 'rain' ? p.rain :
                p.wind
    );

    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 10;
    const range = max - min || 1;

    // Sample to max 120 points for performance
    const step = Math.max(1, Math.floor(values.length / 120));
    const sampled = values.filter((_, i) => i % step === 0);
    const sampledPoints = points.filter((_, i) => i % step === 0);

    const toX = (i: number) => (i / (sampled.length - 1)) * W;
    const toY = (v: number) => H - ((v - min) / range) * (H - 6) - 2;

    const pathD = sampled.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
    const areaD = `${pathD} L${W},${H} L0,${H} Z`;

    // Find max point
    const peakIdx = sampled.length > 0 ? sampled.indexOf(Math.max(...sampled)) : 0;

    if (sampled.length === 0) {
        return <div className="text-[10px] text-muted-foreground p-2">Sin datos suficientes para graficar</div>;
    }

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1="0" y1={toY(min + pct * range)} x2={W} y2={toY(min + pct * range)}
                    stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            ))}
            {/* Area fill */}
            <path d={areaD} fill={color} fillOpacity="0.12" />
            {/* Line */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Peak dot */}
            <circle cx={toX(peakIdx)} cy={toY(sampled[peakIdx])} r="3" fill={color} stroke="white" strokeWidth="1.5" />
            {/* Last value dot */}
            <circle cx={toX(sampled.length - 1)} cy={toY(sampled[sampled.length - 1])} r="2.5" fill={color} stroke="white" strokeWidth="1.5" />
            {/* Axis labels */}
            <text x="2" y={H - 2} fontSize="8" fill={color} fillOpacity="0.7">{min.toFixed(1)}</text>
            <text x="2" y="10" fontSize="8" fill={color} fillOpacity="0.7">{max.toFixed(1)}</text>
        </svg>
    );
}

export default function TemperaturaWidget() {
    const [points, setPoints] = useState<TempPoint[]>([]);
    const [actual, setActual] = useState<WeatherActual | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>('temp');

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [hist, live] = await Promise.all([
                fetchTemperatura(),
                fetchWeatherActual()
            ]);
            setPoints(hist);
            setActual(live);
        } catch (e: any) {
            setError(e.message ?? 'Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const stats = useMemo(() => computeStats(points), [points]);
    const cfg = MODE_CONFIG[mode];

    // Daily averages for the last 7 days (compact bar view)
    const dailyAvgs = useMemo(() => {
        const map: Record<string, number[]> = {};
        points.forEach(p => {
            if (p.temp === 0 && p.humidity === 0) return; // Skip null-padded API trailing data
            const day = p.time.slice(0, 10);
            if (!map[day]) map[day] = [];
            map[day].push(p.temp);
        });
        return Object.entries(map).slice(-7).map(([day, temps]) => ({
            day: new Date(day).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
            avg: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
        }));
    }, [points]);

    return (
        <div className="map-panel max-w-full text-xs">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-outfit font-bold text-foreground leading-none">Temperatura</p>
                        {actual && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-bold text-emerald-500 border border-emerald-500/20 animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                EN VIVO
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {actual ? `Actualmente ${actual.temp}°C · ${actual.description}` : 'Open-Meteo · Pereira · últimos 14 días'}
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="p-1.5 hover:bg-accent/20 rounded-lg transition-colors disabled:opacity-40">
                    <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && (
                <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-accent/30 animate-pulse" />
                    <div className="h-8 rounded-lg bg-accent/20 animate-pulse" />
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px]">{error}</div>
            )}

            {!loading && !error && stats && (
                <>
                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center">
                            <p className="text-[9px] text-orange-400 font-medium uppercase tracking-wide">Mínima</p>
                            <p className="text-sm font-bold text-orange-600">{stats.minTemp.toFixed(1)}°C</p>
                            <TrendingDown className="w-3 h-3 text-orange-400 mx-auto mt-0.5" />
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-center">
                            <p className="text-[9px] text-orange-500 font-medium uppercase tracking-wide">Promedio</p>
                            <p className="text-base font-bold text-orange-600">{stats.avgTemp}°C</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                            <p className="text-[9px] text-red-400 font-medium uppercase tracking-wide">Máxima</p>
                            <p className="text-sm font-bold text-red-600">{stats.maxTemp.toFixed(1)}°C</p>
                            <TrendingUp className="w-3 h-3 text-red-400 mx-auto mt-0.5" />
                        </div>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex rounded-lg overflow-hidden border border-border/40 mb-2">
                        {(Object.keys(MODE_CONFIG) as Mode[]).map(m => {
                            const c = MODE_CONFIG[m];
                            const Icon = c.icon;
                            return (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`flex-1 py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold transition-colors ${mode === m
                                        ? 'text-white'
                                        : 'text-muted-foreground hover:bg-accent/20'
                                        }`}
                                    style={mode === m ? { backgroundColor: c.color } : {}}
                                >
                                    <Icon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{c.label.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sparkline chart */}
                    <div className="rounded-xl bg-accent/10 border border-border/30 px-2 pt-1 pb-0.5 mb-3 overflow-hidden">
                        <p className="text-[9px] text-muted-foreground mb-1">{cfg.label} ({cfg.unit.trim()}) — {points.length} lecturas horarias</p>
                        <Sparkline points={points} mode={mode} color={cfg.color} />
                    </div>

                    {/* Daily micro-bars */}
                    <div className="mb-2">
                        <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide font-bold">Temperatura diaria promedio</p>
                        <div className="space-y-1">
                            {dailyAvgs.map(({ day, avg }) => {
                                const pct = Math.max(5, Math.round(((avg - 14) / (25 - 14)) * 100));
                                const barColor = avg > 22 ? '#DC2626' : avg > 19 ? '#F97316' : avg > 17 ? '#FBBF24' : '#60A5FA';
                                return (
                                    <div key={day} className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground w-14 flex-shrink-0">{day}</span>
                                        <div className="flex-1 h-3 rounded-full bg-accent/30 overflow-hidden">
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${pct}%`, backgroundColor: barColor }} />
                                        </div>
                                        <span className="text-[9px] font-bold w-10 text-right" style={{ color: barColor }}>
                                            {avg}°C
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Latest reading */}
                    {(actual || stats.latest) && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <span className="text-[10px] text-muted-foreground">Última lectura {actual ? '(En Vivo)' : '(Historial)'}</span>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground">
                                <span className="text-orange-500">{(actual?.temp ?? stats.latest.temp).toFixed(1)}°C</span>
                                <span className="text-blue-500">{(actual?.humidity ?? stats.latest.humidity)}%HR</span>
                                <span className="text-purple-500">{(actual?.wind ?? stats.latest.wind).toFixed(1)}km/h</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && !error && !stats && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Los datos climáticos históricos para Pereira aún no están disponibles en Open-Meteo.</span>
                </div>
            )}
        </div>
    );
}
