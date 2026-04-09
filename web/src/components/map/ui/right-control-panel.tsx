'use client';

import React, { useState } from 'react';
import {
    Layers,
    Info,
    ChevronRight,
    ChevronLeft,
    FileUp,
    AlertTriangle,
    Eye,
    EyeOff,
    Trash2,
    CloudRain,
    Thermometer,
    Zap,
    Wind,
    Activity,
    ExternalLink
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
    socialVisible: boolean; toggleSocial: () => void;
    hashtagVisible: boolean; toggleHashtag: () => void;
    hashtagLoading?: boolean;
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
    amenazaVisible: boolean; toggleAmenaza: () => void;
    amenazaLoading?: boolean;
    microzonificacionVisible: boolean; toggleMicrozonificacion: () => void;
    microzonificacionLoading?: boolean;
    simulacion1999Visible: boolean; toggleSimulacion1999: () => void;
    simulacion1999Loading?: boolean;
    simulacion1961Visible: boolean; toggleSimulacion1961: () => void;
    simulacion1961Loading?: boolean;
    simulacionCustomVisible: boolean; toggleSimulacionCustom: () => void;
    simulacionCustomMag: number; setSimulacionCustomMag: (val: number) => void;
    simulacionCustomProf: number; setSimulacionCustomProf: (val: number) => void;
    simulacionCustomDist: number; setSimulacionCustomDist: (val: number) => void;
    activeSidebarSection: string;
    // Radar New Props
    ideamRadarVisible: boolean;
    ideamRadarLoading: boolean;
    toggleIdeamRadar: () => void;
    siataRadarVisible: boolean;
    siataRadarLoading: boolean;
    toggleSiataRadar: () => void;
    barriosLoading?: boolean;
    comunasLoading?: boolean;
    perimetroLoading?: boolean;
    reportesDigerVisible: boolean;
    toggleReportesDiger: () => void;
    reportesDigerLoading?: boolean;
    children?: React.ReactNode;
}

export function RightControlPanel(props: RightControlPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'capas' | 'info' | 'analisis'>('capas');

    const isWeatherSection = props.activeSidebarSection === 'weather';
    const isRiskSection = props.activeSidebarSection === 'risk';
    const isSeismicSection = props.activeSidebarSection === 'seismic';
    const isSocialSection = props.activeSidebarSection === 'social';
    const isMonitoringSection = props.activeSidebarSection === 'monitoring';

    // Auto-switch tab based on sidebar section
    React.useEffect(() => {
        if (props.activeSidebarSection === 'weather') {
            setActiveTab('info');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'risk') {
            setActiveTab('info');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'seismic') {
            setActiveTab('info');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'layers') {
            setActiveTab('capas');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'analytics') {
            setActiveTab('analisis');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'social') {
            setActiveTab('capas');
            setIsOpen(true);
        } else if (props.activeSidebarSection === 'monitoring') {
            setActiveTab('capas');
            setIsOpen(true);
        }
    }, [props.activeSidebarSection]);

    // Pre-calculate header data to improve reconciliation stability
    const { headerIcon: HeaderIcon, headerTitle } = (() => {
        if (isSocialSection && activeTab === 'capas') return { headerIcon: Activity, headerTitle: 'Monitor Redes Sociales' };
        if (activeTab === 'capas') return { headerIcon: Layers, headerTitle: 'Capas de Información' };
        if (isWeatherSection && activeTab === 'info') return { headerIcon: CloudRain, headerTitle: 'Panel de Clima' };
        if (isRiskSection && activeTab === 'info') return { headerIcon: AlertTriangle, headerTitle: 'Panel de Riesgos' };
        if (isSeismicSection && activeTab === 'info') return { headerIcon: Activity, headerTitle: 'Panel de Sismos' };
        if (isMonitoringSection && activeTab === 'capas') return { headerIcon: Zap, headerTitle: 'Panel de Monitoreo' };
        return { headerIcon: Info, headerTitle: 'Información y Leyendas' };
    })();

    const infoTabLabel = isWeatherSection ? 'Clima' : (isRiskSection ? 'Riesgos' : (isSeismicSection ? 'Sismos' : 'Info'));

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

    return (
        <div className="absolute right-4 top-20 bottom-24 w-[320px] siata-glass rounded-2xl flex flex-col z-50 border border-white/10 overflow-hidden shadow-2xl font-inter">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HeaderIcon className={cn("w-4 h-4", (isRiskSection || isSeismicSection) && activeTab === 'info' && (isRiskSection ? "text-red-400" : "text-purple-400"))} />
                    <span>{headerTitle}</span>
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-white/5">
                <button
                    onClick={() => setActiveTab('capas')}
                    className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'capas' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60")}
                >
                    Capas
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'info' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60")}
                >
                    {infoTabLabel}
                </button>
                <button
                    onClick={() => setActiveTab('analisis')}
                    className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'analisis' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60")}
                >
                    Análisis
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto siata-scrollbar">
                <div className="p-4 space-y-6">
                    {activeTab === 'capas' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             {/* KML Section */}
                            <div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Archivos Externos</span>
                                <button
                                    onClick={props.onUploadClick}
                                    className="w-full py-2.5 px-3 bg-white/5 border border-dashed border-white/20 text-white/80 text-[11px] font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 mb-2"
                                >
                                    <FileUp className="w-3.5 h-3.5" />
                                    Importar KML / SHP / CSV
                                </button>
                                {props.kmlLayers.length > 0 && (
                                    <div className="space-y-1.5">
                                        {props.kmlLayers.map(layer => (
                                            <div key={layer.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 group">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                                                <span className="text-[11px] font-medium text-white/80 truncate flex-1">{layer.name}</span>
                                                <button onClick={() => props.toggleLayerVisibility(layer.id)} className="p-1 hover:bg-white/10 rounded">
                                                    {layer.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-white/20" />}
                                                </button>
                                                <button onClick={() => props.removeLayer(layer.id)} className="p-1 hover:bg-red-500/20 rounded">
                                                    <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {isSocialSection && (
                                    <LayerCategory label="Redes Sociales" defaultOpen={true}>
                                        <LayerToggle
                                            label="Posts Georreferenciados"
                                            color="#38BDF8"
                                            active={props.socialVisible}
                                            onClick={props.toggleSocial}
                                        />
                                        <LayerToggle
                                            label="#EmergenciaPEI / PERE"
                                            color="#0EA5E9"
                                            active={props.hashtagVisible}
                                            onClick={props.toggleHashtag}
                                            loading={props.hashtagLoading}
                                        />
                                        {(props.socialVisible || props.hashtagVisible) && (
                                            <div className="pl-2 pt-1 space-y-1.5">
                                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Sentimiento</p>
                                                <LegendItem color="#EF4444" label="Urgente" />
                                                <LegendItem color="#F59E0B" label="Advertencia" />
                                                <LegendItem color="#10B981" label="Informativo" />
                                            </div>
                                        )}
                                    </LayerCategory>
                                )}
                                {isMonitoringSection && (
                                    <LayerCategory label="Monitoreo Técnico" defaultOpen={true}>
                                        <LayerToggle
                                            label="Reportes DIGER"
                                            color="#F43F5E"
                                            active={props.reportesDigerVisible}
                                            onClick={props.toggleReportesDiger}
                                            loading={props.reportesDigerLoading}
                                        />
                                        {props.reportesDigerVisible && (
                                            <div className="pl-2 pt-1 space-y-1.5 border-l border-white/10 ml-1.5 my-2">
                                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Categorización</p>
                                                <LegendItem color="#3B82F6" label="Inundación" />
                                                <LegendItem color="#EF4444" label="Incendio" />
                                                <LegendItem color="#D97706" label="Deslizamiento" />
                                                <LegendItem color="#8B5CF6" label="Sismo" />
                                                <LegendItem color="#06B6D4" label="Vendaval" />
                                                <LegendItem color="#71717A" label="Otros" />
                                            </div>
                                        )}
                                        <LayerToggle label="Monitor SATMA" lucideIcon={Zap} lucideColor="#FBBF24" active={true} onClick={() => {}} />
                                        <LayerToggle label="Sensores Remotos" lucideIcon={Activity} lucideColor="#10B981" active={false} onClick={() => {}} />
                                    </LayerCategory>
                                )}
                                <LayerCategory label="Gestión del Riesgo" defaultOpen={!isSocialSection}>
                                    <LayerToggle label="Sismos SGC" color="#8B5CF6" active={props.sismosVisible} onClick={props.toggleSismos} loading={props.sismosLoading} count={props.sismosCount} />
                                    <LayerToggle label="USGS Histórico" color="#F97316" active={props.usgsVisible} onClick={props.toggleUsgs} loading={props.usgsLoading} count={props.usgsCount} />
                                    <LayerToggle label="Historial DIGER" color="#FBBF24" active={props.digerVisible} onClick={props.toggleDiger} />
                                    <LayerToggle label="Amenaza Urbano/Exp." color="#B45309" active={props.amenazaVisible} onClick={props.toggleAmenaza} loading={props.amenazaLoading} />
                                    <LayerToggle label="Microzonificación Sísmica" color="#BE123C" active={props.microzonificacionVisible} onClick={props.toggleMicrozonificacion} loading={props.microzonificacionLoading} />
                                    <LayerToggle label="Vulnerabilidad IDEAM" color="#3B82F6" active={props.ideamLayersVisible[0]} onClick={() => props.toggleIdeamLayer(0)} loading={props.ideamMapLoading[0]} />
                                </LayerCategory>

                                <LayerCategory label="Simuladores Sísmicos" defaultOpen={true}>
                                    <LayerToggle label="Simulación Histórica 1999" color="#E31A1C" active={props.simulacion1999Visible} onClick={props.toggleSimulacion1999} loading={props.simulacion1999Loading} />
                                    <LayerToggle label="Simulación Histórica 1961" color="#8B5CF6" active={props.simulacion1961Visible} onClick={props.toggleSimulacion1961} loading={props.simulacion1961Loading} />
                                    <LayerToggle label="Simulador Interactivo" color="#EC4899" active={props.simulacionCustomVisible} onClick={props.toggleSimulacionCustom} />
                                    
                                    {props.simulacionCustomVisible && (
                                        <div className="pt-2 pb-1 space-y-4 px-1">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-medium text-white/80 uppercase tracking-widest pl-1">
                                                    <span>Magnitud ($M_w$)</span>
                                                    <span>{props.simulacionCustomMag.toFixed(1)}</span>
                                                </div>
                                                <input 
                                                    type="range" min="4" max="9" step="0.1" 
                                                    value={props.simulacionCustomMag}
                                                    onChange={(e) => props.setSimulacionCustomMag(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-medium text-white/80 uppercase tracking-widest pl-1">
                                                    <span>Profundidad</span>
                                                    <span>{props.simulacionCustomProf} km</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="150" step="5" 
                                                    value={props.simulacionCustomProf}
                                                    onChange={(e) => props.setSimulacionCustomProf(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-medium text-white/80 uppercase tracking-widest pl-1">
                                                    <span>Proximidad</span>
                                                    <span>{props.simulacionCustomDist} km</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="100" step="5" 
                                                    value={props.simulacionCustomDist}
                                                    onChange={(e) => props.setSimulacionCustomDist(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </LayerCategory>

                                <LayerCategory label="Clima" defaultOpen={true}>
                                    <LayerToggle 
                                        label="Radar Quibdó (IDEAM)" 
                                        lucideIcon={Zap} 
                                        lucideColor="#22D3EE" 
                                        active={props.ideamRadarVisible} 
                                        onClick={props.ideamRadarVisible ? props.toggleIdeamRadar : props.toggleIdeamRadar} 
                                        loading={props.ideamRadarLoading} 
                                    />
                                    <LayerToggle 
                                        label="Radar Sta. Elena (SIATA)" 
                                        lucideIcon={Zap} 
                                        lucideColor="#FBBF24" 
                                        active={props.siataRadarVisible} 
                                        onClick={props.siataRadarVisible ? props.toggleSiataRadar : props.toggleSiataRadar} 
                                        loading={props.siataRadarLoading} 
                                    />
                                    <LayerToggle label="Monitor SATMA" lucideIcon={Zap} lucideColor="#FBBF24" active={true} onClick={() => {}} />
                                    <LayerToggle label="Mapa de Temperatura" lucideIcon={Thermometer} lucideColor="#EF4444" active={props.temperatureMapVisible} onClick={props.toggleTemperatureMap} />
                                    <LayerToggle label="Estaciones IDEAM" color="#10B981" active={props.ideamVisible} onClick={props.toggleIdeam} count={props.ideamCount} loading={props.ideamLoading} />
                                </LayerCategory>

                                <LayerCategory label="Nivel Municipal">
                                    <LayerToggle label="Barrios" color="#94A3B8" active={props.barriosVisible} onClick={props.toggleBarrios} loading={props.barriosLoading} />
                                    <LayerToggle label="Comunas" color="#94A3B8" active={props.comunasVisible} onClick={props.toggleComunas} loading={props.comunasLoading} />
                                    <LayerToggle label="Perímetro Urbano" color="#94A3B8" active={props.perimetroVisible} onClick={props.togglePerimetro} loading={props.perimetroLoading} />
                                </LayerCategory>
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {isRiskSection && (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2">Controles de Riesgo</span>
                                        <LayerToggle label="Sismos SGC" color="#8B5CF6" active={props.sismosVisible} onClick={props.toggleSismos} loading={props.sismosLoading} count={props.sismosCount} />
                                        <LayerToggle label="USGS Histórico" color="#F97316" active={props.usgsVisible} onClick={props.toggleUsgs} loading={props.usgsLoading} count={props.usgsCount} />
                                        <LayerToggle label="Historial DIGER" color="#FBBF24" active={props.digerVisible} onClick={props.toggleDiger} />
                                        <LayerToggle label="Amenaza Urbano/Exp." color="#B45309" active={props.amenazaVisible} onClick={props.toggleAmenaza} loading={props.amenazaLoading} />
                                        <LayerToggle label="Microzonificación Sísmica" color="#BE123C" active={props.microzonificacionVisible} onClick={props.toggleMicrozonificacion} loading={props.microzonificacionLoading} />
                                        <LayerToggle label="Vulnerabilidad IDEAM" color="#3B82F6" active={props.ideamLayersVisible[0]} onClick={() => props.toggleIdeamLayer(0)} loading={props.ideamMapLoading[0]} />
                                    </div>

                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-2">Simuladores Sísmicos</span>
                                        <LayerToggle label="Simulación Histórica 1999" color="#E31A1C" active={props.simulacion1999Visible} onClick={props.toggleSimulacion1999} loading={props.simulacion1999Loading} />
                                        <LayerToggle label="Simulación Histórica 1961" color="#8B5CF6" active={props.simulacion1961Visible} onClick={props.toggleSimulacion1961} loading={props.simulacion1961Loading} />
                                        <LayerToggle label="Simulador Interactivo" color="#EC4899" active={props.simulacionCustomVisible} onClick={props.toggleSimulacionCustom} />
                                        
                                        {props.simulacionCustomVisible && (
                                            <div className="pt-2 pb-1 space-y-4 px-1">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-medium text-white/80">
                                                        <span>Magnitud ($M_w$)</span>
                                                        <span>{props.simulacionCustomMag.toFixed(1)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="4" max="9" step="0.1" 
                                                        value={props.simulacionCustomMag}
                                                        onChange={(e) => props.setSimulacionCustomMag(Number(e.target.value))}
                                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-medium text-white/80">
                                                        <span>Profundidad Epicentral</span>
                                                        <span>{props.simulacionCustomProf} km</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0" max="150" step="5" 
                                                        value={props.simulacionCustomProf}
                                                        onChange={(e) => props.setSimulacionCustomProf(Number(e.target.value))}
                                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-medium text-white/80">
                                                        <span>Proximidad Epicentral</span>
                                                        <span>{props.simulacionCustomDist} km</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0" max="100" step="5" 
                                                        value={props.simulacionCustomDist}
                                                        onChange={(e) => props.setSimulacionCustomDist(Number(e.target.value))}
                                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-3">Leyendas de Riesgo</span>
                                        <div className="space-y-2">
                                            <LegendItem color="#8B5CF6" label="Sismo Reciente (SGC)" />
                                            <LegendItem color="#F97316" label="Evento Histórico USGS" />
                                            <LegendItem color="#FBBF24" label="Historial DIGER (Eventos)" />
                                            <LegendItem color="#3B82F6" label="Zona Vulnerable IDEAM" />
                                            {props.amenazaVisible && (
                                                <>
                                                    <div className="pt-1.5 pb-0.5">
                                                        <span className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest">Amenaza Urbano / Expansión</span>
                                                    </div>
                                                    <LegendItem color="#92400E" label="Alta — Remoción en masa" />
                                                    <LegendItem color="#B45309" label="Media — Remoción en masa" />
                                                    <LegendItem color="#D97706" label="Baja — Remoción en masa" />
                                                    <LegendItem color="#1D4ED8" label="Alta — Inundación" />
                                                    <LegendItem color="#60A5FA" label="Media — Inundación" />
                                                    <LegendItem color="#93C5FD" label="Baja — Inundación" />
                                                </>
                                            )}
                                            {props.microzonificacionVisible && (
                                                <>
                                                    <div className="pt-1.5 pb-0.5">
                                                        <span className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest">Densidad de Vulnerabilidad (‰)</span>
                                                    </div>
                                                    <LegendItem color="#fef0d9" label="0 - 5 (Muy Baja)" />
                                                    <LegendItem color="#fdcc8a" label="5 - 12 (Baja-Media)" />
                                                    <LegendItem color="#fc8d59" label="12 - 20 (Media-Alta)" />
                                                    <LegendItem color="#e34a33" label="20 - 30 (Alta)" />
                                                    <LegendItem color="#b30000" label="> 30 (Crítica)" />
                                                </>
                                            )}
                                            {props.simulacion1999Visible && (
                                                <>
                                                    <div className="pt-1.5 pb-0.5">
                                                        <span className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest">Impacto Sismo 1999</span>
                                                    </div>
                                                    <LegendItem color="#33A02C" label="Estable (Daño <= 0.6)" />
                                                    <LegendItem color="#FB9A99" label="Moderado (0.6 - 1.2)" />
                                                    <LegendItem color="#E31A1C" label="Crítico (Daño > 1.2)" />
                                                </>
                                            )}
                                            {props.simulacion1961Visible && (
                                                <>
                                                    <div className="pt-1.5 pb-0.5">
                                                        <span className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest">Impacto Sismo 1961</span>
                                                    </div>
                                                    <LegendItem color="#33A02C" label="Estable (Daño <= 0.6)" />
                                                    <LegendItem color="#FB9A99" label="Moderado (0.6 - 1.2)" />
                                                    <LegendItem color="#E31A1C" label="Crítico (Daño > 1.2)" />
                                                </>
                                            )}
                                            {props.simulacionCustomVisible && (
                                                <>
                                                    <div className="pt-1.5 pb-0.5">
                                                        <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest">Impacto Personalizado</span>
                                                    </div>
                                                    <LegendItem color="#33A02C" label="Estable (Daño <= 0.6)" />
                                                    <LegendItem color="#FB9A99" label="Moderado (0.6 - 1.2)" />
                                                    <LegendItem color="#E31A1C" label="Crítico (Daño > 1.2)" />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}

                            {isSeismicSection && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-2">Controles Sísmicos</span>
                                        <LayerToggle label="Sismos SGC" color="#8B5CF6" active={props.sismosVisible} onClick={props.toggleSismos} loading={props.sismosLoading} count={props.sismosCount} />
                                        <LayerToggle label="USGS Histórico" color="#F97316" active={props.usgsVisible} onClick={props.toggleUsgs} loading={props.usgsLoading} count={props.usgsCount} />
                                        <LayerToggle label="Vulnerabilidad IDEAM" color="#3B82F6" active={props.ideamLayersVisible[0]} onClick={() => props.toggleIdeamLayer(0)} loading={props.ideamMapLoading[0]} />
                                    </div>
                                    
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-3">Leyenda Sísmica</span>
                                        <div className="space-y-2">
                                            <LegendItem color="#8B5CF6" label="Sismo Reciente (SGC)" />
                                            <LegendItem color="#F97316" label="Evento Histórico USGS" />
                                            <LegendItem color="#3B82F6" label="Zona Vulnerable" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isWeatherSection && (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Controles de Radar</span>
                                        <LayerToggle 
                                            label="Radar Quibdó (IDEAM)" 
                                            lucideIcon={Zap} 
                                            lucideColor="#22D3EE" 
                                            active={props.ideamRadarVisible} 
                                            onClick={props.toggleIdeamRadar} 
                                            loading={props.ideamRadarLoading} 
                                        />
                                        <LayerToggle 
                                            label="Radar Sta. Elena (SIATA)" 
                                            lucideIcon={Zap} 
                                            lucideColor="#FBBF24" 
                                            active={props.siataRadarVisible} 
                                            onClick={props.toggleSiataRadar} 
                                            loading={props.siataRadarLoading} 
                                        />
                                        <div className="pt-2 border-t border-white/5" />
                                        <LayerToggle label="Mapa de Temperatura" lucideIcon={Thermometer} lucideColor="#EF4444" active={props.temperatureMapVisible} onClick={props.toggleTemperatureMap} />
                                        <LayerToggle label="Mapa de Precipitación" lucideIcon={CloudRain} lucideColor="#3B82F6" active={props.precipitationVisible} onClick={props.togglePrecipitation} />
                                    </div>
                                    <TemperaturaWidget />
                                    <SatmaMonitor />
                                </div>
                            )}

                            {!isWeatherSection && !isRiskSection && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-3">Leyenda General</span>
                                    <div className="space-y-2">
                                        <LegendItem color="#EF4444" label="Riesgo Crítico" />
                                        <LegendItem color="#FBBF24" label="Históricos DIGER" />
                                        <LegendItem color="#8B5CF6" label="Sismos Recientes" />
                                        <LegendItem color="#3B82F6" label="Categoría SZH" />
                                        <LegendItem color="#10B981" label="Estación IDEAM Activa" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analisis' && (
                        <div className="animate-in fade-in duration-300">
                            {props.children}
                        </div>
                    )}
                </div>
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

function LayerToggle({ label, color, active, onClick, loading, count, icon, lucideIcon: LucideIcon, lucideColor }: { label: string, color?: string, active: boolean, onClick: () => void, loading?: boolean, count?: number, icon?: string, lucideIcon?: React.ElementType, lucideColor?: string }) {
    return (
        <div
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <div className="flex items-center gap-2">
                {LucideIcon ? (
                    <LucideIcon className="w-4 h-4" style={{ color: lucideColor }} />
                ) : icon ? (
                    <span className="text-sm">{icon}</span>
                ) : (
                    <div
                        className="w-2.5 h-2.5 rounded-full transition-shadow"
                        style={{
                            backgroundColor: color,
                            boxShadow: active ? `0 0 10px ${color}` : 'none'
                        }}
                    />
                )}
                <span className="text-[11px] text-white/90 font-medium">
                    {label}
                    {count !== undefined && <span className="ml-1 text-[9px] text-white/40">({count})</span>}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {loading && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                <div className={cn(
                    "w-7 h-3.5 rounded-full relative transition-colors duration-200",
                    active ? "bg-blue-500" : "bg-white/10"
                )}>
                    <div className={cn(
                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all duration-200",
                        active ? "left-4" : "left-0.5"
                    )} />
                </div>
            </div>
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
