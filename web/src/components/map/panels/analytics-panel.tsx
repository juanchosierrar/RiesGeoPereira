import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { MOCK_EVENTOS, GRAVEDAD_COLORS } from '@/lib/mock-data';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

export function AnalyticsPanel() {
    // Process data for charts
    const eventosPorTipo = MOCK_EVENTOS.reduce((acc, evt) => {
        acc[evt.tipo_evento] = (acc[evt.tipo_evento] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(eventosPorTipo).map(([name, value]) => ({ name, value }));
    const PIE_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#3B82F6', '#6366F1', '#EC4899'];

    const eventosPorGravedad = MOCK_EVENTOS.reduce((acc, evt) => {
        acc[evt.gravedad] = (acc[evt.gravedad] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = Object.entries(eventosPorGravedad).map(([name, value]) => ({ name, value }));

    // Mock trend data
    const trendData = [
        { month: 'Ene', eventos: 12 },
        { month: 'Feb', eventos: 15 },
        { month: 'Mar', eventos: 18 },
        { month: 'Abr', eventos: 22 },
        { month: 'May', eventos: 25 },
        { month: 'Jun', eventos: 30 },
    ];

    return (
        <div className="siata-scrollbar pr-1 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-8">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-tight">Analíticas de Riesgo</h3>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-1">Total Eventos</span>
                    <span className="text-2xl font-bold text-white">{MOCK_EVENTOS.length}</span>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-destructive/80 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Críticos
                    </span>
                    <span className="text-2xl font-bold text-destructive">
                        {MOCK_EVENTOS.filter(e => e.gravedad === 'Critica').length}
                    </span>
                </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-3">Tendencia Mensual</h4>
                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#ffffff40" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="eventos" stroke="#22D3EE" fillOpacity={1} fill="url(#colorEventos)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Pie Chart */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-3">Distribución por Tipo</h4>
                <div className="h-[140px] w-full flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="w-[80px] flex flex-col justify-center space-y-1">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                <span className="text-[9px] text-white/70 truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Severity Bar Chart */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-3">Nivel de Gravedad</h4>
                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#ffffff40" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#ffffff40" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRAVEDAD_COLORS[entry.name as keyof typeof GRAVEDAD_COLORS] || '#94A3B8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
