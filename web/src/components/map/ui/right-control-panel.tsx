'use client';

import React, { useState, useEffect } from 'react';
import {
    Layers,
    Info,
    X,
    ChevronRight,
    ChevronLeft,
    FileUp,
    AlertTriangle,
    Eye,
    EyeOff,
    Trash2,
    CloudRain,
    Thermometer,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TemperaturaWidget from '@/components/dashboard/temperatura-widget';
import SatmaMonitor from '@/components/dashboard/satma-monitor';

interface RightControlPanelProps {
    // KML
    kmlLayers: { id: string; name: string; color: string; visible: boolean }[];
    toggleLayerVisibility: (id: string) => void;
    removeLayer: (id: string) => void;
    onUploadClick: () => void;
    uploadError: string | null;
    setUploadError: (val: string | null) => void;
    // Visibilities
    eventosVisible: boolean; toggleEventos: () => void;
    sismosVisible: boolean; toggleSismos: () => void;
    usgsVisible: boolean; toggleUsgs: () => void;
    volcanicVisible: boolean; toggleVolcanic: () => void;
    radarVisible: boolean; toggleRadar: () => void;
    temperatureMapVisible: boolean; toggleTemperatureMap: () => void;
    precipitationVisible: boolean; togglePrecipitation: () => void;
    era5Visible: boolean; toggleEra5: () => void;
    vulnerabilidadVisible: boolean; toggleVulnerabilidad: () => void;
    ideamVisible: boolean; toggleIdeam: () => void;
    // Loading states
    sismosLoading: boolean;
    usgsLoading: boolean;
    volcanicLoading: boolean;
    radarLoading: boolean;
    era5Loading: boolean;
    ideamLoading: boolean;
    ideamLayersVisible: Record<number, boolean>;
    toggleIdeamLayer: (id: number) => void;
    ideamMapLoading: Record<number, boolean>;
    // Counts
    sismosCount: number;
    usgsCount: number;
    volcanicCount: number;
    ideamCount: number;
    perimetroVisible: boolean; togglePerimetro: () => void;
    barriosVisible: boolean; toggleBarrios: () => void;
    comunasVisible: boolean; toggleComunas: () => void;
    potVisible: boolean; togglePot: () => void;
    digerVisible: boolean; toggleDiger: () => void;
    activeSidebarSection: string;
    children?: React.ReactNode;
}

export function RightControlPanel(props: RightControlPanelProps & { children?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'capas' | 'info' | 'analisis'>('capas');

    const [prevSidebarSection, setPrevSidebarSection] = useState(props.activeSidebarSection);

    if (props.activeSidebarSection !== prevSidebarSection) {
        setPrevSidebarSection(props.activeSidebarSection);
        if (props.activeSidebarSection === 'weather') {
            setActiveTab('info');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'layers') {
            setActiveTab('capas');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'analytics') {
            setActiveTab('analisis');
            setIsOpen(true);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute right-0 top-20 w-8 h-12 siata-glass rounded-l-lg flex items-center justify-center z-50 hover:bg-white/10"
            >
                <ChevronLeft className="w-5 h-5 text-white" />
            </button>
        );
    }

    const isWeatherSection = props.activeSidebarSection === 'weather';

    return (
        <div className="absolute right-4 top-20 bottom-24 w-[320px] siata-glass rounded-2xl flex flex-col z-50 border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {activeTab === 'capas' ? <Layers className="w-4 h-4" /> : (isWeatherSection ? <CloudRain className="w-4 h-4" /> : <Info className="w-4 h-4" />)}
                    {activeTab === 'capas' ? 'Capas de Información' : (isWeatherSection ? 'Panel de Clima' : 'Información y Leyendas')}
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('capas')}
                    className={cn("flex-1 siata-tab font-inter", activeTab === 'capas' ? "active" : "inactive")}
                >
                    Capas
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn("flex-1 siata-tab font-inter uppercase tracking-tighter", activeTab === 'info' ? "active" : "inactive")}
                >
                    {isWeatherSection ? 'Clima' : 'Info'}
                </button>
                <button
                    onClick={() => setActiveTab('analisis')}
                    className={cn("flex-1 siata-tab font-inter uppercase tracking-tighter", activeTab === 'analisis' ? "active" : "inactive")}
                >
                    Análisis
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto siata-scrollbar p-4 space-y-6">
                {activeTab === 'capas' ? (
                    <>
                        {/* KML Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Archivos Externos</span>
                            </div>
                            <button
                                onClick={props.onUploadClick}
                                className="w-full py-2 px-3 bg-white/5 border border-dashed border-white/20 text-white text-[11px] font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <FileUp className="w-3.5 h-3.5" />
                                Importar KML / KMZ / SHP / CSV / XLS
                            </button>

                            {props.uploadError && (
                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-400">{props.uploadError}</p>
                                </div>
                            )}

                            {props.kmlLayers.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {props.kmlLayers.map(layer => (
                                        <div key={layer.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 group">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: layer.color }} />
                                            <span className="text-[11px] font-medium text-white truncate flex-1">{layer.name}</span>
                                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => props.toggleLayerVisibility(layer.id)} className="p-1 hover:bg-white/10 rounded">
                                                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => props.removeLayer(layer.id)} className="p-1 hover:bg-red-500/20 rounded group">
                                                    <Trash2 className="w-3.5 h-3.5 text-white group-hover:text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Data Layers Section (Hierarchical) */}
                        <div className="space-y-2">
                            <LayerCategory label="Nivel Municipal">
                                <LayerToggle
                                    label="Perímetro Urbano"
                                    color="#94A3B8"
                                    active={props.perimetroVisible}
                                    onClick={props.togglePerimetro}
                                />
                                <LayerToggle
                                    label="Barrios"
                                    color="#94A3B8"
                                    active={props.barriosVisible}
                                    onClick={props.toggleBarrios}
                                />
                                <LayerToggle
                                    label="Comunas"
                                    color="#94A3B8"
                                    active={props.comunasVisible}
                                    onClick={props.toggleComunas}
                                />
                                <LayerToggle
                                    label="POT"
                                    color="#94A3B8"
                                    active={props.potVisible}
                                    onClick={props.togglePot}
                                />
                            </LayerCategory>

                            <LayerCategory label="Gestión del Riesgo" defaultOpen>
                                <LayerToggle
                                    label="Eventos de Riesgo"
                                    color="#EF4444"
                                    active={props.eventosVisible}
                                    onClick={props.toggleEventos}
                                />
                                <LayerToggle
                                    label="Sismos SGC"
                                    color="#6D28D9"
                                    active={props.sismosVisible}
                                    onClick={props.toggleSismos}
                                    loading={props.sismosLoading}
                                    count={props.sismosCount}
                                />
                                <LayerToggle
                                    label="USGS Histórico"
                                    color="#F97316"
                                    active={props.usgsVisible}
                                    onClick={props.toggleUsgs}
                                    loading={props.usgsLoading}
                                    count={props.usgsCount}
                                />
                                <LayerToggle
                                    label="Amenaza Volcánica"
                                    color="#EF4444"
                                    shape="diamond"
                                    active={props.volcanicVisible}
                                    onClick={props.toggleVolcanic}
                                    loading={props.volcanicLoading}
                                    count={props.volcanicCount}
                                />
                                <LayerToggle
                                    label="Histórico DIGER"
                                    color="#FBBF24"
                                    active={props.digerVisible}
                                    onClick={props.toggleDiger}
                                />
                            </LayerCategory>

                            {/* IDEAM MapServer Layers */}
                            <LayerCategory label="IDEAM - Vulnerabilidad">
                                <LayerToggle
                                    label="Categorización SZH"
                                    color="#3B82F6"
                                    active={props.ideamLayersVisible[0]}
                                    onClick={() => props.toggleIdeamLayer(0)}
                                    loading={props.ideamMapLoading[0]}
                                />
                                <LayerToggle
                                    label="Inundación"
                                    color="#06B6D4"
                                    active={props.ideamLayersVisible[1]}
                                    onClick={() => props.toggleIdeamLayer(1)}
                                    loading={props.ideamMapLoading[1]}
                                />
                                <LayerToggle
                                    label="Deslizamientos"
                                    color="#EF4444"
                                    active={props.ideamLayersVisible[2]}
                                    onClick={() => props.toggleIdeamLayer(2)}
                                    loading={props.ideamMapLoading[2]}
                                />
                            </LayerCategory>

                            <LayerCategory label="Clima">
                                <LayerToggle
                                    label="Radar de Lluvia"
                                    lucideIcon={CloudRain}
                                    lucideColor="#0EA5E9"
                                    active={props.radarVisible}
                                    onClick={props.toggleRadar}
                                    loading={props.radarLoading}
                                />
                                <LayerToggle
                                    label="Mapa de Temperatura"
                                    lucideIcon={Thermometer}
                                    lucideColor="#EF4444"
                                    active={props.temperatureMapVisible}
                                    onClick={props.toggleTemperatureMap}
                                />
                                <LayerToggle
                                    label="Open-Meteo"
                                    icon="📊"
                                    active={props.era5Visible}
                                    onClick={props.toggleEra5}
                                    loading={props.era5Loading}
                                />
                                <LayerToggle
                                    label="Estaciones IDEAM"
                                    color="#10B981"
                                    active={props.ideamVisible}
                                    onClick={props.toggleIdeam}
                                    loading={props.ideamLoading}
                                    count={props.ideamCount}
                                />
                            </LayerCategory>

                            <LayerCategory label="Académicos">
                                <LayerToggle
                                    label="Vulnerabilidad"
                                    color="#3B82F6"
                                    active={props.vulnerabilidadVisible}
                                    onClick={props.toggleVulnerabilidad}
                                />
                                <div className="p-2 text-[10px] text-white/40 italic">Otras capas disponibles próximamente</div>
                            </LayerCategory>
                        </div>
                    </>
                ) : activeTab === 'info' ? (
                    <div className="space-y-6">
                        {isWeatherSection && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Controles de Clima</span>
                                    <LayerToggle
                                        label="Radar de Lluvia"
                                        lucideIcon={CloudRain}
                                        lucideColor="#0EA5E9"
                                        active={props.radarVisible}
                                        onClick={props.toggleRadar}
                                        loading={props.radarLoading}
                                    />
                                    <LayerToggle
                                        label="Monitor SATMA"
                                        lucideIcon={Zap}
                                        lucideColor="#FBBF24"
                                        active={true}
                                        onClick={() => { }} // Widget constant
                                    />
                                    <LayerToggle
                                        label="Mapa de Temperatura"
                                        lucideIcon={Thermometer}
                                        lucideColor="#EF4444"
                                        active={props.temperatureMapVisible}
                                        onClick={props.toggleTemperatureMap}
                                    />
                                    <LayerToggle
                                        label="Mapa de Precipitación"
                                        lucideIcon={CloudRain}
                                        lucideColor="#3B82F6"
                                        active={props.precipitationVisible}
                                        onClick={props.togglePrecipitation}
                                    />
                                    <LayerToggle
                                        label="Estaciones IDEAM"
                                        color="#10B981"
                                        active={props.ideamVisible}
                                        onClick={props.toggleIdeam}
                                        loading={props.ideamLoading}
                                        count={props.ideamCount}
                                    />
                                </div>

                                <TemperaturaWidget />
                                <SatmaMonitor />
                                <div className="pt-4 border-t border-white/10" />
                            </div>
                        )}
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-tight">Sobre esta plataforma</h4>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                RiesGeoPereira es un sistema de monitoreo geoespacial avanzado diseñado para la gestión del riesgo en la región de Pereira y Risaralda.
                            </p>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Leyenda General</span>
                            <div className="space-y-2">
                                <LegendItem color="#EF4444" label="Riesgo Crítico (Incendio/Inundación)" />
                                <LegendItem color="#F97316" label="Riesgo Alto" />
                                <LegendItem color="#FBBF24" label="Históricos DIGER / Riesgo Medio" />
                                <LegendItem color="#6D28D9" label="Sismos SGC" />
                                <LegendItem color="#3B82F6" label="Cuencas SZH (IDEAM)" />
                                <LegendItem color="#06B6D4" label="Inundación (IDEAM)" />
                                <LegendItem color="#10B981" label="Estación IDEAM Activa" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 text-[10px] text-muted-foreground text-center italic">
                            Versión Beta 2.1.0 · 2026
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {props.children}
                    </div>
                )}
            </div>
        </div>
    );
}

function LayerCategory({ label, children, defaultOpen = false }: { label: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors group"
            >
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-300", isOpen ? "rotate-90 text-white" : "")} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[500px] opacity-100 p-2 pt-0 space-y-1" : "max-h-0 opacity-0"
            )}>
                {children}
            </div>
        </div>
    );
}

function LayerToggle({ label, color, active, onClick, loading, count, icon, lucideIcon: LucideIcon, lucideColor, shape }: { label: string, color?: string, active: boolean, onClick: () => void, loading?: boolean, count?: number, icon?: string, lucideIcon?: React.ElementType, lucideColor?: string, shape?: string }) {
    return (
        <div
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                {LucideIcon ? (
                    <LucideIcon className="w-4 h-4" style={{ color: lucideColor }} />
                ) : icon ? (
                    <span className="text-sm">{icon}</span>
                ) : (
                    <div
                        className={cn(
                            "w-3 h-3 transition-shadow",
                            shape === 'diamond' ? "rotate-45" : "rounded-full"
                        )}
                        style={{
                            backgroundColor: color,
                            boxShadow: active ? `0 0 10px ${color}` : 'none'
                        }}
                    />
                )}
                <span className="text-[11px] text-white/90 font-medium">
                    {label}
                    {loading ? (
                        <span className="ml-1 text-[9px] text-white/40 animate-pulse">...</span>
                    ) : count !== undefined ? (
                        <span className="ml-1 text-[9px] text-white/40">({count})</span>
                    ) : null}
                </span>
            </div>
            <div className={cn("toggle-layer scale-75 origin-right", active ? "active" : "")} />
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-white/70">{label}</span>
        </div>
    );
}
