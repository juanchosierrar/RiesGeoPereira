"use client";

import { useState, useEffect, useMemo } from 'react';
import { insforgeRequest } from '@/lib/insforge/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import QualityRadarChart from '@/components/dashboard/quality-radar';
import { TrendingUp, AlertTriangle, MapPin, Activity } from 'lucide-react';
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";

const COLORS = ['#1B365D', '#F57C00', '#D32F2F', '#2E7D32', '#FBC02D', '#7B1FA2'];
const SEVERITY_COLORS: Record<string, string> = {
    'Critica': '#EF4444',
    'Alta': '#F97316',
    'Media': '#FBBF24',
    'Baja': '#3B82F6',
};

const EVENT_COLORS: Record<string, string> = {
    'DESLIZAMIENTO': '#8B5CF6',       // Purple
    'INUNDACION': '#3B82F6',          // Blue
    'VENDAVAL': '#06b6d4',            // Cyan
    'INCENDIO': '#EF4444',            // Red
    'INCENDIO FORESTAL': '#dc6803',   // Dark Orange
    'INCENDIO ESTRUCTURAL': '#f59e0b',// Amber
    'COLAPSO ESTRUCTURAL': '#52525b', // Gray
    'SISMO': '#F97316',               // Orange
    'EXPLOSION': '#fbbf24',           // Yellow
    'OTRO': '#94A3B8',                // Slate
};

export default function AnaliticasPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetching historical DIGER data points
                const data = await insforgeRequest('/api/database/records/datos_diger?limit=5000');
                if (data && Array.isArray(data)) {
                    setEvents(data);
                }
            } catch (error) {
                console.error("Error fetching DIGER data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const {
        byType,
        bySeverity,
        impactStats,
        trendData,
        totalNeighborhoods,
        criticalEvents
    } = useMemo(() => {
        if (!events.length) return { byType: [], bySeverity: [], impactStats: [], trendData: [], totalNeighborhoods: 0, criticalEvents: 0 };

        const typeCount: Record<string, number> = {};
        const severityCount: Record<string, number> = { 'Critica': 0, 'Alta': 0, 'Media': 0, 'Baja': 0 };
        const neighborhoods = new Set<string>();
        
        const timeCount: Record<string, number> = {};

        let critical = 0;
        let viviendas = 0;
        let familias = 0;
        let fallecidos = 0;

        events.forEach(e => {
            // Type
            const tipo = e.evento || 'Desconocido';
            typeCount[tipo] = (typeCount[tipo] || 0) + 1;

            // Neighborhood
            if (e.barrver) neighborhoods.add(e.barrver);

            // Impact stats
            viviendas += Number(e.viv || 0);
            familias += Number(e.flia || 0);
            fallecidos += Number(e.fall || 0);

            // Estimate severity
            let severity = 'Baja';
            const famis = Number(e.flia || 0);
            const falls = Number(e.fall || 0);
            const leds = Number(e.les || 0);
            
            if (falls > 0 || famis >= 10 || leds > 0) {
                severity = 'Critica';
                critical++;
            } else if (famis >= 5) {
                severity = 'Alta';
            } else if (famis > 0 || Number(e.viv || 0) > 0) {
                severity = 'Media';
            }
            
            severityCount[severity]++;

            // Trend parsing (Group by Year)
            if (e.fecha) {
                const parts = e.fecha.split('-');
                if (parts.length >= 1) {
                    const year = parts[0];
                    if (year.length === 4) {
                        timeCount[year] = (timeCount[year] || 0) + 1;
                    }
                }
            }
        });

        const sortedTrend = Object.keys(timeCount)
            .sort() 
            .map(key => ({ mes: key, eventos: timeCount[key] }));

        const typeArray = Object.entries(typeCount)
            .map(([name, value]) => ({ 
                name, 
                value,
                color: EVENT_COLORS[name] || '#FBBF24'
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const severityArray = Object.entries(severityCount)
            .filter(([_, count]) => count > 0)
            .map(([name, count]) => ({
                name,
                count,
                color: SEVERITY_COLORS[name] || '#94A3B8'
            }));

        const impactArray = [
            { name: 'Viviendas', value: viviendas },
            { name: 'Familias', value: familias },
            { name: 'Fallecidos', value: fallecidos },
        ];

        return {
            byType: typeArray,
            bySeverity: severityArray,
            impactStats: impactArray,
            trendData: sortedTrend.length > 0 ? sortedTrend : [],
            totalNeighborhoods: neighborhoods.size,
            criticalEvents: critical
        };
    }, [events]);

    return (
        <div className="w-full h-full p-4 md:p-6 space-y-6 overflow-y-auto">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <div>
                    <h1 className="text-2xl font-outfit font-semibold tracking-tight text-foreground text-center md:text-left">Analíticas Geo</h1>
                    <p className="text-xs text-muted-foreground font-inter mt-1 text-center md:text-left italic">
                        Inteligencia espacial sobre Histórico DIGER
                    </p>
                </div>

                <DashboardNav />

                <div className="hidden md:block text-xs font-inter font-medium text-primary px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    {isLoading ? 'Cargando datos...' : 'Datos Históricos Sincronizados'}
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Eventos Reportados', value: isLoading ? '...' : events.length, icon: AlertTriangle, color: '#D32F2F', delta: 'Total Histórico' },
                    { label: 'Sectores Afectados', value: isLoading ? '...' : totalNeighborhoods, icon: MapPin, color: '#1B365D', delta: 'Barrios únicos' },
                    { label: 'Impactos Críticos', value: isLoading ? '...' : criticalEvents, icon: TrendingUp, color: '#F57C00', delta: 'Requieren atención focalizada' },
                    { label: 'Prom. Familias/Evento', value: isLoading ? '...' : events.length > 0 ? (impactStats[1].value / events.length).toFixed(1) : 0, icon: Activity, color: '#2E7D32', delta: 'Nivel promedio de impacto' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-inter uppercase tracking-wider truncate mr-1">{kpi.label}</span>
                            <kpi.icon className="w-4 h-4 flex-shrink-0" style={{ color: kpi.color }} />
                        </div>
                        <p className="text-3xl font-outfit font-bold text-foreground">{kpi.value}</p>
                        <p className="text-[10px] text-muted-foreground/70 font-inter mt-1">{kpi.delta}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend Area Chart */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-outfit font-semibold text-foreground mb-4">Cronología de Incidentes (Muestra Histórica)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1B365D" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#1B365D" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={20} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: 12 }} />
                            <Area type="monotone" dataKey="eventos" stroke="#1B365D" strokeWidth={2} fillOpacity={1} fill="url(#colorEventos)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Type Bar Chart */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-outfit font-semibold text-foreground mb-4">Frecuencia por Tipo de Evento</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={byType} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: 12 }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {byType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Severity Pie */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-outfit font-semibold text-foreground mb-4">Severidad Estimada (Histórica)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={bySeverity}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="count"
                                nameKey="name"
                            >
                                {bySeverity.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* State Pie -> Changed to Impact Distribution */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-outfit font-semibold text-foreground mb-4">Distribución Global de Afectaciones</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={impactStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                            >
                                {impactStats.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Quality Radar -> Replaced with simple stat summary or another relevant metric */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-outfit font-semibold text-foreground mb-4">Datos Consagrados (DIGER)</h3>
                    <div className="space-y-4 pt-2">
                        {impactStats.map((stat, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-border/50 pb-2">
                                <span className="text-xs font-inter text-muted-foreground">{stat.name} Total</span>
                                <span className="text-sm font-outfit font-bold">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-[10px] text-muted-foreground italic text-center text-balance flex items-center justify-center p-2 rounded-lg bg-secondary/50 border border-border">
                        Los registros mostrados representan la consolidación histórica base DIGER sin filtros del modelo.
                    </div>
                </div>
            </div>
        </div>
    );
}

