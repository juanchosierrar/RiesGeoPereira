"use client";

import { useState, useEffect, useCallback } from 'react';
import { Radio, RefreshCw, ExternalLink, Clock, Wifi, WifiOff, AlertCircle, CheckCircle, Construction } from 'lucide-react';

interface PageResult {
    name: string;
    url: string;
    online: boolean;
    hasContent: boolean;
    matches: string[];
    latencyMs: number;
    httpCode: number;
    effectiveLength?: number;
    error?: string;
}

interface MonitorResult {
    source: string;
    checkedAt: string;
    siteOnline: boolean;
    siteStatus: 'content_detected' | 'under_construction';
    pages: PageResult[];
    allMatches: string[];
    pollIntervalMinutes: number;
}

const POLL_MS = 5 * 60 * 1000; // 5 min

export default function SatmaMonitor() {
    const [data, setData] = useState<MonitorResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCheck, setNextCheck] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState('5:00');
    const [checks, setChecks] = useState<Array<{ ts: string; status: string }>>([]);

    const runCheck = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/satma/monitor');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: MonitorResult = await res.json();
            setData(json);
            setNextCheck(new Date(Date.now() + POLL_MS));
            setChecks(prev => [
                { ts: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), status: json.siteStatus },
                ...prev.slice(0, 11),
            ]);
        } catch (e: unknown) {
            setError((e as Error).message ?? 'No se pudo conectar con el monitor');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        runCheck();
        const interval = setInterval(runCheck, POLL_MS);
        return () => clearInterval(interval);
    }, [runCheck]);

    // Countdown display
    useEffect(() => {
        if (!nextCheck) return;
        const tick = setInterval(() => {
            const diff = Math.max(0, nextCheck.getTime() - Date.now());
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(tick);
    }, [nextCheck]);

    const isContent = data?.siteStatus === 'content_detected';

    return (
        <div className="map-panel max-w-full text-xs">

            {/* ── Header ─────────────────────────────── */}
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isContent ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                    <Radio className={`w-4 h-4 ${isContent ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-outfit font-bold text-foreground leading-none">Monitor SATMA</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">CARDER · Risaralda · cada {(POLL_MS / 60000).toFixed(0)} min</p>
                </div>
                <button
                    onClick={runCheck}
                    disabled={loading}
                    className="p-1.5 hover:bg-accent/20 rounded-lg transition-colors disabled:opacity-40"
                    title="Verificar ahora"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ── Error state ────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="flex-1 text-[11px]">{error}</p>
                </div>
            )}

            {/* ── Main status banner ─────────────────── */}
            {data && !error && (
                <>
                    <div className={`flex items-start gap-2 p-3 rounded-xl border mb-3 ${isContent
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                        }`}>
                        {isContent
                            ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            : <Construction className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                            <p className={`font-bold text-[11px] ${isContent ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {isContent ? '¡Nuevo contenido publicado!' : 'Sitio en construcción'}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isContent ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {isContent
                                    ? `Se detectaron ${data.allMatches.length} señales de datos reales`
                                    : 'SATMA aún no ha publicado boletines o alertas'
                                }
                            </p>
                            {isContent && data.allMatches.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {data.allMatches.slice(0, 4).map((m, i) => (
                                        <span key={i} className="font-mono text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Per-page status ────────────────── */}
                    <div className="space-y-1 mb-3">
                        {data.pages.map(page => (
                            <div key={page.url} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors group">
                                {page.online
                                    ? <Wifi className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                    : <WifiOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                                }
                                <span className="text-foreground font-medium flex-1">{page.name}</span>
                                <span className="font-mono text-[9px] text-muted-foreground">{page.latencyMs}ms</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${page.hasContent ? 'bg-emerald-100 text-emerald-700'
                                    : page.online ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-600'
                                    }`}>
                                    {page.hasContent ? 'DATOS' : page.online ? 'VACÍO' : 'ERROR'}
                                </span>
                                <a href={page.url} target="_blank" rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* ── Footer: countdown + history ────── */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Próx. chequeo: <span className="font-mono font-bold text-foreground">{countdown}</span></span>
                        </div>
                        {/* History dots */}
                        <div className="flex items-center gap-1">
                            {checks.map((c, i) => (
                                <div
                                    key={i}
                                    title={`${c.ts}: ${c.status === 'content_detected' ? 'Con datos' : 'Vacío'}`}
                                    className={`w-2 h-2 rounded-full transition-colors ${c.status === 'content_detected' ? 'bg-emerald-400' : 'bg-amber-300'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Last checked time */}
                    <p className="text-[9px] text-muted-foreground mt-1.5 text-right">
                        Última verificación: {new Date(data.checkedAt).toLocaleTimeString('es-CO')}
                    </p>
                </>
            )}

            {/* ── Loading skeleton ───────────────────── */}
            {!data && !error && loading && (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-accent/30 rounded-lg animate-pulse" />
                    ))}
                </div>
            )}
        </div>
    );
}
