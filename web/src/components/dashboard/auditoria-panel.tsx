"use client";

import React, { useState } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip,
} from 'recharts';
import {
    ShieldCheck, ShieldAlert, AlertTriangle, Info,
    ChevronDown, ChevronUp, Loader2, ScanSearch,
} from 'lucide-react';
import type { AuditResult, AuditData } from '@/lib/geo-audit-service';

// ---------------------------------------------------------------------------
// Demo fallback data (shown when no file loaded yet)
// ---------------------------------------------------------------------------
export const DEMO_AUDIT_DATA: AuditResult = {
    completitud_score:    0.82,
    topologia_score:      0.65,
    posicional_score:     0.45,
    tematica_score:       0.78,
    temporal_score:       0.35,
    is_normative_ok:      false,
    crs_detected:         'EPSG:4326 (WGS84)',
    estado:               'CUMPLE PARCIALMENTE',
    hallazgos: [
        'CRS: EPSG:4326 — requiere EPSG:9377 (IGAC Res. 471-2020)',
        '3 geometría(s) inválida(s) — self-intersection en anillo exterior',
        'Columna "fecha_captura": 12 nulos (14.6%)',
    ],
    invalidGeometryIndices: [],
    invalidGeojson: { type: 'FeatureCollection', features: [] },
    filename: 'demo-data.geojson',
    featureCount: 218,
    attributeColumns: ['id', 'nombre', 'categoria', 'fecha_captura', 'municipio'],
};

// ---------------------------------------------------------------------------
// Status styles
// ---------------------------------------------------------------------------
const STATUS_STYLES = {
    'CUMPLE':              { badge: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/40', dot: '#34d399' },
    'CUMPLE PARCIALMENTE': { badge: 'bg-amber-900/30  text-amber-400  border-amber-500/40',    dot: '#fbbf24' },
    'NO CUMPLE':           { badge: 'bg-red-900/30    text-red-400    border-red-500/40',       dot: '#f87171' },
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const RadarTooltipContent = ({
    active, payload, label,
}: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    const pct   = Math.round(payload[0].value * 100);
    const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
    return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs shadow-xl">
            <p className="text-slate-300 font-medium">{label}</p>
            <p className="font-bold text-sm" style={{ color }}>{pct}%</p>
        </div>
    );
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => {
    const pct   = Math.round(value * 100);
    const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
    return (
        <div className="flex items-center gap-2 text-[10px]">
            <span className="w-24 text-slate-400 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <span className="w-7 text-right font-mono font-bold shrink-0" style={{ color }}>{pct}</span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
        <p className="text-[11px] text-slate-400 font-medium">Analizando datos geoespaciales…</p>
        <p className="text-[10px] text-slate-600">ISO 19157 · IGAC Res. 471-2020</p>
    </div>
);

// ---------------------------------------------------------------------------
// Idle / no file state
// ---------------------------------------------------------------------------
const IdleState = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <ScanSearch className="w-7 h-7 text-slate-600" />
        <p className="text-[11px] text-slate-500 font-medium">Sin archivo cargado</p>
        <p className="text-[10px] text-slate-600 max-w-[180px] leading-relaxed">
            Sube un GeoJSON o SHP (.zip) para activar el diagnóstico ISO 19157
        </p>
    </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface AuditoriaPanelProps {
    data?:      AuditResult | null;
    loading?:   boolean;
    isDemo?:    boolean;
    defaultOpen?: boolean;
}

export const AuditoriaPanel = ({
    data,
    loading   = false,
    isDemo    = false,
    defaultOpen = true,
}: AuditoriaPanelProps) => {
    const [open, setOpen] = useState(defaultOpen);

    const displayData = data ?? (isDemo ? DEMO_AUDIT_DATA : null);
    const estado      = displayData?.estado ?? 'NO CUMPLE';
    const statusStyle = STATUS_STYLES[estado] ?? STATUS_STYLES['NO CUMPLE'];

    const chartData = displayData ? [
        { subject: 'Completitud', A: displayData.completitud_score, fullMark: 1.0 },
        { subject: 'Topología',   A: displayData.topologia_score,   fullMark: 1.0 },
        { subject: 'Posicional',  A: displayData.posicional_score,  fullMark: 1.0 },
        { subject: 'Temática',    A: displayData.tematica_score,    fullMark: 1.0 },
        { subject: 'Temporal',    A: displayData.temporal_score,    fullMark: 1.0 },
    ] : [];

    const avgScore = displayData
        ? Math.round(([
            displayData.completitud_score,
            displayData.topologia_score,
            displayData.posicional_score,
            displayData.tematica_score,
            displayData.temporal_score,
        ].reduce((a, b) => a + b, 0) / 5) * 100)
        : 0;

    return (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-2xl overflow-hidden">

            {/* ── Collapsible Header ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/50 hover:bg-slate-700/40 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {displayData?.is_normative_ok
                        ? <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        : <ShieldAlert  className="w-4 h-4 text-red-400" />
                    }
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                        Diagnóstico ISO 19157
                    </h3>
                    {isDemo && (
                        <span className="text-[8px] text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded">DEMO</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {displayData && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusStyle.badge}`}>
                            {estado}
                        </span>
                    )}
                    {open
                        ? <ChevronUp   className="w-3.5 h-3.5 text-slate-500" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    }
                </div>
            </button>

            {/* ── Collapsible Body ── */}
            {open && (
                <div className="p-4 space-y-4">
                    {loading ? (
                        <LoadingState />
                    ) : !displayData ? (
                        <IdleState />
                    ) : (
                        <>
                            {/* File meta */}
                            <div className="flex items-center justify-between text-[9px] text-slate-500">
                                <span className="truncate max-w-[160px]" title={displayData.filename}>
                                    📄 {displayData.filename}
                                </span>
                                <span>{displayData.featureCount.toLocaleString()} entidades</span>
                            </div>

                            {/* Radar Chart */}
                            <div className="h-56 w-full -mt-2 mb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                                        />
                                        <PolarRadiusAxis
                                            domain={[0, 1]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip content={<RadarTooltipContent />} />
                                        <Radar
                                            name="Calidad"
                                            dataKey="A"
                                            stroke="#22d3ee"
                                            fill="#22d3ee"
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                            dot={{ r: 3, fillOpacity: 1 }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Score Bars */}
                            <div className="space-y-1.5">
                                <ScoreBar label="Completitud" value={displayData.completitud_score} />
                                <ScoreBar label="Topología"   value={displayData.topologia_score} />
                                <ScoreBar label="Posicional"  value={displayData.posicional_score} />
                                <ScoreBar label="Temática"    value={displayData.tematica_score} />
                                <ScoreBar label="Temporal"    value={displayData.temporal_score} />
                            </div>

                            {/* Global Score */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Score Global</span>
                                <span
                                    className="text-xl font-black font-mono"
                                    style={{ color: avgScore >= 80 ? '#34d399' : avgScore >= 50 ? '#fbbf24' : '#f87171' }}
                                >
                                    {avgScore}<span className="text-xs text-slate-500">/100</span>
                                </span>
                            </div>

                            {/* Invalid geometries count */}
                            {displayData.invalidGeometryIndices.length > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                                    <div className="w-2 h-2 rounded-full bg-[#FF2D78] animate-pulse shrink-0" />
                                    <p className="text-[10px] text-red-200">
                                        <span className="font-bold">{displayData.invalidGeometryIndices.length}</span> geometría(s) inválida(s) resaltada(s) en el mapa
                                    </p>
                                </div>
                            )}

                            {/* CRS Alert */}
                            {!displayData.is_normative_ok && (
                                <div className="flex items-start gap-2 p-2.5 bg-red-900/20 border border-red-500/30 rounded-lg">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-200 leading-relaxed">
                                        <span className="font-bold text-red-300">{displayData.crs_detected}</span> — no cumple IGAC Res. 471/2020.
                                        {' '}Requiere <span className="font-bold text-red-300">EPSG:9377</span>.
                                    </p>
                                </div>
                            )}

                            {/* Hallazgos */}
                            {displayData.hallazgos && displayData.hallazgos.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Info className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hallazgos ({displayData.hallazgos.length})</span>
                                    </div>
                                    {displayData.hallazgos.slice(0, 6).map((h: string, i: number) => (
                                        <p key={i} className="text-[9px] text-slate-400 leading-relaxed pl-2 border-l border-slate-600">
                                            {h}
                                        </p>
                                    ))}
                                    {displayData.hallazgos.length > 6 && (
                                        <p className="text-[9px] text-slate-600 pl-2">
                                            +{displayData.hallazgos.length - 6} hallazogo(s) adicionales…
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
