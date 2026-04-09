"use client";

import { useState } from 'react';
import { MOCK_EVENTOS, GRAVEDAD_COLORS, ESTADO_LABELS } from '@/lib/mock-data';
import { AlertTriangle, Droplets, Flame, Wind, Activity, Mountain, Search, Filter, ChevronRight, X, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { Gravedad, EstadoFlujo, EventoRiesgo } from '@/lib/insforge/types';
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";
import { RegistrarEventoDialog } from "@/components/dashboard/registrar-evento-dialog";

const ICON_MAP: Record<string, React.ElementType> = {
    Deslizamiento: Mountain,
    Inundación: Droplets,
    Incendio: Flame,
    Vendaval: Wind,
    Sismo: Activity,
    Otro: AlertTriangle,
};

export default function InboxPage() {
    const [filterGravedad, setFilterGravedad] = useState<Gravedad | 'Todas'>('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIncident, setSelectedIncident] = useState<(EventoRiesgo & { barrio: string }) | null>(null);

    const filtered = MOCK_EVENTOS
        .filter(e => filterGravedad === 'Todas' || e.gravedad === filterGravedad)
        .filter(e =>
            e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.barrio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

    const counts = {
        Critica: MOCK_EVENTOS.filter(e => e.gravedad === 'Critica').length,
        Alta: MOCK_EVENTOS.filter(e => e.gravedad === 'Alta').length,
        Media: MOCK_EVENTOS.filter(e => e.gravedad === 'Media').length,
        Baja: MOCK_EVENTOS.filter(e => e.gravedad === 'Baja').length,
    };

    return (
        <div className="w-full h-full p-4 md:p-6 flex flex-col space-y-4 overflow-y-auto">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <div>
                    <h1 className="text-2xl font-outfit font-semibold tracking-tight text-foreground text-center md:text-left">Inbox de Incidentes</h1>
                    <p className="text-[11px] text-muted-foreground font-inter mt-1 text-center md:text-left italic">
                        Gestión en tiempo real de eventos reportados
                    </p>
                </div>

                <DashboardNav />

                <div className="flex items-center gap-2">
                    <RegistrarEventoDialog />

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {(['Critica', 'Alta', 'Media', 'Baja'] as Gravedad[]).map(g => (
                        <button
                            key={g}
                            onClick={() => setFilterGravedad(prev => prev === g ? 'Todas' : g)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-inter font-bold border transition-all whitespace-nowrap ${filterGravedad === g
                                ? 'border-current shadow-sm'
                                : 'border-transparent hover:border-border'
                                }`}
                            style={{ color: GRAVEDAD_COLORS[g], backgroundColor: filterGravedad === g ? `${GRAVEDAD_COLORS[g]}15` : 'transparent' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GRAVEDAD_COLORS[g] }} />
                            {g} ({counts[g]})
                        </button>
                    ))}
                </div>
                </div>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por barrio, tipo de evento o descripción..."
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-inter text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            {/* Event Cards */}
            <div className="space-y-3 flex-1">
                {filtered.map(evt => {
                    const Icon = ICON_MAP[evt.tipo_evento] || AlertTriangle;
                    const color = GRAVEDAD_COLORS[evt.gravedad];
                    return (
                        <div
                            key={evt.id}
                            onClick={() => setSelectedIncident(evt)}
                            className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="p-3 rounded-xl flex-shrink-0"
                                    style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-outfit font-semibold text-foreground">{evt.tipo_evento}</h3>
                                        <span
                                            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
                                        >
                                            {evt.gravedad}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground ml-auto">{ESTADO_LABELS[evt.estado_flujo]}</span>
                                    </div>
                                    <p className="text-xs font-inter font-medium text-primary/80 mb-1">{evt.barrio}</p>
                                    <p className="text-xs font-inter text-muted-foreground leading-relaxed">{evt.descripcion}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-[10px] text-muted-foreground/60 font-inter">
                                            {new Date(evt.fecha_hora).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 font-inter">
                                            📍 {evt.coordenadas_lat.toFixed(4)}, {evt.coordenadas_lng.toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground font-inter">
                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No se encontraron incidentes con los filtros actuales.</p>
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            {selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2.5 rounded-xl"
                                    style={{
                                        backgroundColor: `${GRAVEDAD_COLORS[selectedIncident.gravedad]}15`,
                                        color: GRAVEDAD_COLORS[selectedIncident.gravedad],
                                        border: `1px solid ${GRAVEDAD_COLORS[selectedIncident.gravedad]}30`
                                    }}
                                >
                                    {(() => {
                                        const Icon = ICON_MAP[selectedIncident.tipo_evento] || AlertTriangle;
                                        return <Icon className="w-5 h-5" />;
                                    })()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-outfit font-bold text-foreground leading-tight">
                                        {selectedIncident.tipo_evento}
                                    </h2>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1"
                                        style={{
                                            backgroundColor: `${GRAVEDAD_COLORS[selectedIncident.gravedad]}15`,
                                            color: GRAVEDAD_COLORS[selectedIncident.gravedad]
                                        }}
                                    >
                                        Prioridad {selectedIncident.gravedad}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <h3 className="text-xs font-inter font-bold text-muted-foreground uppercase tracking-wider mb-2">Descripción del Evento</h3>
                                <p className="text-sm font-inter text-foreground leading-relaxed bg-accent/30 p-3 rounded-xl border border-border/50 shadow-inner">
                                    {selectedIncident.descripcion}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 p-3 rounded-xl bg-accent/20 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-xs font-inter font-medium">Ubicación</span>
                                    </div>
                                    <p className="text-sm font-inter font-medium text-foreground">{selectedIncident.barrio}</p>
                                    <p className="text-xs font-inter text-muted-foreground">Lat: {selectedIncident.coordenadas_lat.toFixed(6)}</p>
                                    <p className="text-xs font-inter text-muted-foreground">Lng: {selectedIncident.coordenadas_lng.toFixed(6)}</p>
                                </div>
                                <div className="space-y-1.5 p-3 rounded-xl bg-accent/20 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-inter font-medium">Fecha y Hora</span>
                                    </div>
                                    <p className="text-sm font-inter font-medium text-foreground">
                                        {new Date(selectedIncident.fecha_hora).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(selectedIncident.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Status */}
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-inter font-bold text-muted-foreground uppercase tracking-wider">Estado Actual</h3>
                                    <span className="text-xs font-inter font-semibold text-primary/80 px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
                                        {ESTADO_LABELS[selectedIncident.estado_flujo]}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-inter font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        onClick={() => {
                                            alert('Funcionalidad de gestión en desarrollo.');
                                            setSelectedIncident(null);
                                        }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Gestionar Incidente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
