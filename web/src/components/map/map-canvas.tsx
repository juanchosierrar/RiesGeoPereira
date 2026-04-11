"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, FullscreenControl, GeolocateControl, Marker, Popup, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Compass, ActivitySquare, BarChart3, AlertTriangle, Upload, X, Eye, EyeOff, FileUp, Trash2, Activity, ChevronRight, ChevronLeft, CloudRain, ExternalLink, Wind, Thermometer } from 'lucide-react';
import QualityRadarChart from '@/components/dashboard/quality-radar';
import EventTimeline from '@/components/dashboard/event-timeline';
import SatmaMonitor from '@/components/dashboard/satma-monitor';
import TemperaturaWidget from '@/components/dashboard/temperatura-widget';
import { AuditoriaPanel } from '@/components/dashboard/auditoria-panel';
import type { AuditResult } from '@/lib/geo-audit-service';
import { MOCK_EVENTOS, GRAVEDAD_COLORS } from '@/lib/mock-data';
import { parseKmlFile, parseShapefileZip, parseKmzFile, type KmlLayer } from '@/lib/kml-parser';
import { fetchSismosHistoricos, magnitudeToSize, magnitudeToColor, PEREIRA_BBOX, type SismoFeature } from '@/lib/sgc-service';
import { fetchUSGSSismos, type UsgsFeature } from '@/lib/usgs-service';
import { getLatestRadarUrl } from '@/lib/rainviewer-service';
import { fetchEra5Data, type Era5Summary } from '@/lib/meteo-service';
import { fetchIdeamStations, type IdeamFeature, fetchIdeamLayer, IDEAM_LAYERS } from '@/lib/ideam-service';
import { calculateBBox } from '@/lib/geo-utils';
import { fetchPereiraBoundaries, fetchUrbanPerimeter } from '@/lib/osm-service';
import type { EventoRiesgo, Gravedad } from '@/lib/insforge/types';
import { insforgeRequest, insforgeFetchAll } from '@/lib/insforge/client';
import type { FillLayerSpecification, LineLayerSpecification, CircleLayerSpecification, SourceSpecification } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { MapSidebar } from './ui/map-sidebar';
import { TopSearchBar } from './ui/top-search-bar';
import { RightControlPanel } from './ui/right-control-panel';
import { parseCsvFile, parseExcelFile } from '@/lib/geo-parser';
import { AnalyticsPanel } from './panels/analytics-panel';
import { getSocialPosts, getHashtagPosts, type SocialPost, type HashtagPost } from '@/lib/social-service';
import { MessageCircle, Hash } from 'lucide-react';

// ---------------------------------------------------------------------------
// Safe JSON fetch — never throws SyntaxError when server returns HTML
// ---------------------------------------------------------------------------
async function safeJsonFetch<T = unknown>(url: string, init?: RequestInit): Promise<T | null> {
    try {
        const res = await fetch(url, init);
        const text = await res.text();
        if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) return null;
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

// --- Pluviosidad por altitud (proxy IDEAM/OMM para Risaralda) ---
// Fuente: Atlas Climatológico IDEAM 2015
type RainfallLevel = { label: string; mmYear: string; iconBg: string; iconBorder: string; iconText: string; glow: string; pulse: string; };
function getRainfallLevel(altitudeStr: string): RainfallLevel {
    const alt = parseFloat(altitudeStr) || 0;
    if (alt < 1300) return {
        label: 'Alta', mmYear: '>2500 mm/año',
        iconBg: '#1D4ED8', iconBorder: '#1E40AF', iconText: '#BFDBFE', glow: '#3B82F660', pulse: '#1D4ED8',
    };
    if (alt < 1700) return {
        label: 'Media-Alta', mmYear: '2000–2500 mm/año',
        iconBg: '#0EA5E9', iconBorder: '#0284C7', iconText: '#BAE6FD', glow: '#38BDF860', pulse: '#0EA5E9',
    };
    if (alt < 2200) return {
        label: 'Media', mmYear: '1500–2000 mm/año',
        iconBg: '#10B981', iconBorder: '#059669', iconText: '#A7F3D0', glow: '#34D39960', pulse: '#10B981',
    };
    return {
        label: 'Baja', mmYear: '<1500 mm/año',
        iconBg: '#F59E0B', iconBorder: '#D97706', iconText: '#FDE68A', glow: '#FBBF2460', pulse: '#F59E0B',
    };
}

export default function MapCanvas() {
    const [viewState, setViewState] = useState({
        longitude: -75.60, // Shifted east to include the rural/mountainous area
        latitude: 4.77,    // Centered vertically to show the whole municipality
        zoom: 10.5,        // Zoomed out to fit the wider municipal boundary
        pitch: 0,
        bearing: 0
    });

    const [activeSidebarSection, setActiveSidebarSection] = useState('risk');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<MapRef>(null);

    const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

    // ESRI World Imagery + Labels
    const SATELLITE_STYLE = {
        version: 8,
        sources: {
            'esri-satellite': {
                type: 'raster',
                tiles: [
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                ],
                tileSize: 256,
                maxzoom: 18,
                attribution: '© Esri, Maxar, Earthstar Geographics',
            },
            'esri-labels': {
                type: 'raster',
                tiles: [
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                ],
                tileSize: 256,
                maxzoom: 18,
            }
        },
        layers: [
            {
                id: 'esri-satellite-layer',
                type: 'raster',
                source: 'esri-satellite',
                minzoom: 0,
                maxzoom: 22,
            },
            {
                id: 'esri-labels-layer',
                type: 'raster',
                source: 'esri-labels',
                minzoom: 0,
                maxzoom: 22,
            }
        ],
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const [mapStyle, setMapStyle] = useState<any>(SATELLITE_STYLE);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeStyle, setActiveStyle] = useState<'claro' | 'oscuro' | 'satelite'>('satelite');
    const [selectedEvent, setSelectedEvent] = useState<(EventoRiesgo & { barrio: string }) | null>(null);
    const [kmlLayers, setKmlLayers] = useState<KmlLayer[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Layer visibility
    const [eventosVisible, setEventosVisible] = useState(false);
    const [vulnerabilidadVisible, setVulnerabilidadVisible] = useState(false);

    // SGC Seismic data
    const [sismos, setSismos] = useState<SismoFeature[]>([]);
    const [sismosVisible, setSismosVisible] = useState(false);
    const [sismosLoading, setSismosLoading] = useState(true);
    const [selectedSismo, setSelectedSismo] = useState<SismoFeature | null>(null);

    // USGS historical seismic data
    const [usgsQuakes, setUsgsQuakes] = useState<UsgsFeature[]>([]);
    const [usgsLoading, setUsgsLoading] = useState(true);
    const [usgsVisible, setUsgsVisible] = useState(false);
    const [selectedUsgs, setSelectedUsgs] = useState<UsgsFeature | null>(null);

    // Volcanic hazard zones (SGC AmenazasVolcanicasCOLOMBIA)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [volcanicZones, setVolcanicZones] = useState<any>(null);
    const [volcanicVisible, setVolcanicVisible] = useState(false);
    const [volcanicLoading, setVolcanicLoading] = useState(true);

    // Municipal layers (Barrios, Comunas, POT, Perímetro Urbano)
    const [comunasVisible, setComunasVisible] = useState(false);
    const [comunasData, setComunasData] = useState<FeatureCollection | null>(null);
    const [comunasLoading, setComunasLoading] = useState(false);

    const [barriosVisible, setBarriosVisible] = useState(false);
    const [barriosData, setBarriosData] = useState<FeatureCollection | null>(null);
    const [barriosLoading, setBarriosLoading] = useState(false);

    const [perimetroVisible, setPerimetroVisible] = useState(false);
    const [perimetroData, setPerimetroData] = useState<FeatureCollection | null>(null);
    const [perimetroLoading, setPerimetroLoading] = useState(false);

    const [amenazaVisible, setAmenazaVisible] = useState(false);
    const [amenazaData, setAmenazaData] = useState<FeatureCollection | null>(null);
    const [amenazaLoading, setAmenazaLoading] = useState(false);

    const [microzonificacionVisible, setMicrozonificacionVisible] = useState(false);
    const [microzonificacionData, setMicrozonificacionData] = useState<FeatureCollection | null>(null);
    const [microzonificacionLoading, setMicrozonificacionLoading] = useState(false);

    const [simulacion1999Visible, setSimulacion1999Visible] = useState(false);
    const [simulacion1999Data, setSimulacion1999Data] = useState<FeatureCollection | null>(null);
    const [simulacion1999Loading, setSimulacion1999Loading] = useState(false);

    const [simulacion1961Visible, setSimulacion1961Visible] = useState(false);
    const [simulacion1961Data, setSimulacion1961Data] = useState<FeatureCollection | null>(null);
    const [simulacion1961Loading, setSimulacion1961Loading] = useState(false);

    const [simulacionCustomVisible, setSimulacionCustomVisible] = useState(false);
    const [simulacionCustomMag, setSimulacionCustomMag] = useState<number>(6.0);
    const [simulacionCustomProf, setSimulacionCustomProf] = useState<number>(30);
    const [simulacionCustomDist, setSimulacionCustomDist] = useState<number>(10);

    const [potVisible, setPotVisible] = useState(false);
    const [digerVisible, setDigerVisible] = useState(false);
    const [digerData, setDigerData] = useState<FeatureCollection | null>(null);

    // New persistent reports (Real-time)
    const [reportesDigerVisible, setReportesDigerVisible] = useState(true); // On by default
    const [reportesDigerData, setReportesDigerData] = useState<FeatureCollection | null>(null);
    const [reportesDigerLoading, setReportesDigerLoading] = useState(false);
    const [selectedReporteDiger, setSelectedReporteDiger] = useState<any>(null);

    // Social Media Analytics
    const [socialVisible, setSocialVisible] = useState(false);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPost | null>(null);

    // Hashtag #EmergenciaPereira layer
    const [hashtagVisible, setHashtagVisible] = useState(false);
    const [hashtagPosts, setHashtagPosts] = useState<HashtagPost[]>([]);
    const [hashtagLoading, setHashtagLoading] = useState(false);
    const [selectedHashtagPost, setSelectedHashtagPost] = useState<HashtagPost | null>(null);


    // RainViewer Radar layer
    const [radarVisible, setRadarVisible] = useState(false);
    const [radarUrl, setRadarUrl] = useState<string | null>(null);
    const [radarLoading, setRadarLoading] = useState(true);

    // Open-Meteo ERA5 historical data layer
    const [era5Visible, setEra5Visible] = useState(false);
    const [era5Data, setEra5Data] = useState<Era5Summary | null>(null);
    const [era5Loading, setEra5Loading] = useState(true);
    const [selectedEra5, setSelectedEra5] = useState(false);

    // IDEAM Stations
    const [ideamStations, setIdeamStations] = useState<IdeamFeature[]>([]);
    const [ideamVisible, setIdeamVisible] = useState(false);
    const [ideamLoading, setIdeamLoading] = useState(true);
    const [selectedIdeam, setSelectedIdeam] = useState<IdeamFeature | null>(null);
    
    // AWS IDEAM Radar
    const [ideamRadarVisible, setIdeamRadarVisible] = useState(false);
    const [ideamRadarData, setIdeamRadarData] = useState<{ image_base64?: string; bounds: any } | null>(null);
    const [ideamRadarLoading, setIdeamRadarLoading] = useState(false);

    // Radar SIATA (Santa Elena)
    const [siataRadarVisible, setSiataRadarVisible] = useState(false);
    const [siataRadarData, setSiataRadarData] = useState<{ image_url?: string; bounds: any } | null>(null);
    const [siataRadarLoading, setSiataRadarLoading] = useState(false);

    // Geospatial Audit
    const [auditData, setAuditData] = useState<AuditResult | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);

    // OpenWeatherMap Raster Layers
    const [precipitationVisible, setPrecipitationVisible] = useState(false);
    const [cloudsVisible, setCloudsVisible] = useState(false);
    const [temperatureMapVisible, setTemperatureMapVisible] = useState(false);

    // Right panel toggle (Analytics & Timeline)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // IDEAM MapServer Layers
    const [ideamMapLayerData, setIdeamMapLayerData] = useState<Record<number, FeatureCollection | null>>({});
    const [ideamLayersVisible, setIdeamLayersVisible] = useState<Record<number, boolean>>({});
    const [ideamMapLoading, setIdeamMapLoading] = useState<Record<number, boolean>>({});

    const [selectedKmlFeature, setSelectedKmlFeature] = useState<{ properties: any; lngLat: { lng: number; lat: number }; layerName: string } | null>(null);

    // OpenWeatherMap Click State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [owmClickedData, setOwmClickedData] = useState<{ lngLat: { lng: number; lat: number }; data: any } | null>(null);
    const [owmLoading, setOwmLoading] = useState(false);

    // Fetch earthquakes on mount
    useEffect(() => {
        fetchSismosHistoricos({ bbox: PEREIRA_BBOX, minMagnitude: 0, maxRecords: 200 })
            .then(data => setSismos(data))
            .catch(err => console.error('SGC fetch error:', err))
            .finally(() => setSismosLoading(false));

        // Load USGS historical catalog
        fetchUSGSSismos({ minMag: 2.5, limit: 300 })
            .then(data => setUsgsQuakes(data))
            .catch(err => console.error('USGS fetch error:', err))
            .finally(() => setUsgsLoading(false));

        // Load SGC Volcanic Hazard Zones
        safeJsonFetch('/api/sgc/volcanica')
            .then(data => { if (data) setVolcanicZones(data); })
            .catch(err => console.error('SGC Volcanic fetch error:', err))
            .finally(() => setVolcanicLoading(false));

        // Load RainViewer Radar URL
        getLatestRadarUrl()
            .then(url => setRadarUrl(url))
            .finally(() => setRadarLoading(false));

        // Load Open-Meteo ERA5 Data
        fetchEra5Data()
            .then(data => setEra5Data(data))
            .catch(err => console.error('ERA5 error:', err))
            .finally(() => setEra5Loading(false));

        // Load IDEAM Stations
        fetchIdeamStations({ departamento: 'Risaralda' })
            .then(data => setIdeamStations(data))
            .catch(err => console.error('IDEAM fetch error:', err))
            .finally(() => setIdeamLoading(false));

        // Load ALL DIGER Data from InsForge Backend (with automatic pagination)
        insforgeFetchAll<any>('/api/database/records/datos_diger')
            .then(data => {
                if (data && Array.isArray(data)) {
                    const geojson: FeatureCollection = {
                        type: 'FeatureCollection',
                        features: data.map(record => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [record.lon, record.lat]
                            },
                            properties: record
                        }))
                    };
                    setDigerData(geojson);
                }
            })
            .catch(err => console.error('InsForge DIGER fetch error:', err));

        // Load Amenaza Data from InsForge
        setAmenazaLoading(true);
        insforgeFetchAll<any>('/api/database/records/areas_amenaza')
            .then(data => {
                if (data && Array.isArray(data)) {
                    const features = data.map(record => {
                        try {
                            const geom = JSON.parse(record.geometry_json);
                            return {
                                type: 'Feature',
                                geometry: geom,
                                properties: {
                                    fid: record.fid,
                                    nombre: record.nombre,
                                    amenaza: record.amenaza,
                                    subcategor: record.subcategor,
                                    fuente: record.fuente
                                }
                            };
                        } catch (e) {
                            console.error('Error parsing geometry for amenaza:', record.id, e);
                            return null;
                        }
                    }).filter(Boolean) as any[];

                    setAmenazaData({
                        type: 'FeatureCollection',
                        features
                    });
                }
            })
            .catch(err => console.error('InsForge Amenaza fetch error:', err))
            .finally(() => setAmenazaLoading(false));
            
        // Load Microzonificacion Sismica Data from InsForge
        setMicrozonificacionLoading(true);
        insforgeFetchAll<any>('/api/database/records/microzonificacion_sismica')
            .then(data => {
                if (data && Array.isArray(data)) {
                    const features = data.map(record => {
                        try {
                            const geomStr = record.geometry_json || record.geom_geojson || record.geom;
                            const geom = typeof geomStr === 'string' ? JSON.parse(geomStr) : geomStr;
                            return {
                                type: 'Feature',
                                geometry: geom,
                                properties: { ...record, geometry_json: undefined, geom_geojson: undefined, geom: undefined }
                            };
                        } catch (e) {
                            console.error('Error parsing geometry for microzonificacion:', record.id, e);
                            return null;
                        }
                    }).filter(Boolean) as any[];

                    setMicrozonificacionData({
                        type: 'FeatureCollection',
                        features
                    });
                }
            })
            .catch(err => console.error('InsForge Microzonificacion fetch error:', err))
            .finally(() => setMicrozonificacionLoading(false));
            
        // Load Simulacion 1999
        setSimulacion1999Loading(true);
        safeJsonFetch('/Geodata/simulacion_1999.geojson')
            .then(data => { if (data) setSimulacion1999Data(data as any); })
            .catch(err => console.error('Simulacion 1999 fetch error:', err))
            .finally(() => setSimulacion1999Loading(false));
            
        // Load Simulacion 1961
        setSimulacion1961Loading(true);
        safeJsonFetch('/Geodata/simulacion_1961.geojson')
            .then(data => { if (data) setSimulacion1961Data(data as any); })
            .catch(err => console.error('Simulacion 1961 fetch error:', err))
            .finally(() => setSimulacion1961Loading(false));
            
        // Load Social Posts
        getSocialPosts()
            .then(data => setSocialPosts(data))
            .catch(err => console.error('Social Posts fetch error:', err));

        // Load Hashtag #EmergenciaPereira posts
        setHashtagLoading(true);
        getHashtagPosts()
            .then(data => setHashtagPosts(data))
            .catch(err => console.error('Hashtag posts fetch error:', err))
            .finally(() => setHashtagLoading(false));
    }, []);

    // ── Polling de Redes Sociales cada 20 segundos ──
    const SOCIAL_POLL_MS = 20_000;
    useEffect(() => {
        if (!socialVisible && !hashtagVisible) return; // solo si alguna capa está activa

        const poll = async () => {
            try {
                if (socialVisible) {
                    const data = await getSocialPosts();
                    setSocialPosts(data);
                }
                if (hashtagVisible) {
                    const data = await getHashtagPosts();
                    setHashtagPosts(data);
                }
            } catch (err) {
                console.warn('[Social Polling] Error en la actualización:', err);
            }
        };

        const id = setInterval(poll, SOCIAL_POLL_MS);
        return () => clearInterval(id);
    }, [socialVisible, hashtagVisible]);
    
    // Polling for real-time DIGER reports
    useEffect(() => {
        const fetchReportes = async () => {
            try {
                setReportesDigerLoading(true);
                const response = await fetch('/api/diger/reporte');
                const text = await response.text();
                const data = JSON.parse(text);
                setReportesDigerData(data);
            } catch (err) {
                console.error('Error fetching real-time DIGER reports:', err);
            } finally {
                setReportesDigerLoading(false);
            }
        };

        fetchReportes();
        const interval = setInterval(fetchReportes, 30000); // Polling cada 30s

        // Listen for manual reload trigger after form submission
        const onNewReport = () => fetchReportes();
        window.addEventListener('diger:reload', onNewReport);

        return () => {
            clearInterval(interval);
            window.removeEventListener('diger:reload', onNewReport);
        };
    }, []);

    // Effect to fetch IDEAM MapServer layers when toggled

    useEffect(() => {
        Object.entries(ideamLayersVisible).forEach(([id, visible]) => {
            const layerId = parseInt(id);
            if (visible && !ideamMapLayerData[layerId] && !ideamMapLoading[layerId]) {
                setIdeamMapLoading(prev => ({ ...prev, [layerId]: true }));
                fetchIdeamLayer(layerId)
                    .then(data => {
                        setIdeamMapLayerData(prev => ({ ...prev, [layerId]: data }));
                    })
                    .catch(err => {
                        console.error(`Error loading IDEAM layer ${layerId}:`, err);
                    })
                    .finally(() => {
                        setIdeamMapLoading(prev => ({ ...prev, [layerId]: false }));
                    });
            }
        });
    }, [ideamLayersVisible]); // Solo re-ejecutar cuando cambia la visibilidad, no cuando cambia el estado de carga


    // Effect to fetch AWS IDEAM Radar when toggled
    useEffect(() => {
        if (ideamRadarVisible && !ideamRadarData && !ideamRadarLoading) {
            setIdeamRadarLoading(true);
            safeJsonFetch<any>('http://127.0.0.1:8000/api/v1/weather/radar?station=Quibdo')
                .then(data => {
                    if (data?.image_base64 && data?.bounds) {
                        setIdeamRadarData({ image_base64: data.image_base64, bounds: data.bounds });
                    }
                })
                .catch(err => console.error('Error fetching radar:', err))
                .finally(() => setIdeamRadarLoading(false));
        }
    }, [ideamRadarVisible, ideamRadarData, ideamRadarLoading]);

    // Efecto para Radar SIATA
    useEffect(() => {
        if (siataRadarVisible && !siataRadarData && !siataRadarLoading) {
            setSiataRadarLoading(true);
            safeJsonFetch<any>('http://127.0.0.1:8000/api/v1/weather/radar/siata')
                .then(data => {
                    if (data?.image_url && data?.bounds) setSiataRadarData(data);
                })
                .catch(err => console.error('Error fetching SIATA radar:', err))
                .finally(() => setSiataRadarLoading(false));
        }
    }, [siataRadarVisible, siataRadarData, siataRadarLoading]);

    // Effect to fetch OSM Municipal Layers
    useEffect(() => {
        if (comunasVisible && !comunasData && !comunasLoading) {
            setComunasLoading(true);
            fetchPereiraBoundaries(9)
                .then(setComunasData)
                .finally(() => setComunasLoading(false));
        }
    }, [comunasVisible, comunasData, comunasLoading]);

    useEffect(() => {
        if (barriosVisible && !barriosData && !barriosLoading) {
            setBarriosLoading(true);
            fetchPereiraBoundaries(10)
                .then(setBarriosData)
                .finally(() => setBarriosLoading(false));
        }
    }, [barriosVisible, barriosData, barriosLoading]);

    useEffect(() => {
        if (perimetroVisible && !perimetroData && !perimetroLoading) {
            setPerimetroLoading(true);
            fetchUrbanPerimeter()
                .then(setPerimetroData)
                .finally(() => setPerimetroLoading(false));
        }
    }, [perimetroVisible, perimetroData, perimetroLoading]);

    const simulacionCustomData = useMemo(() => {
        if (!simulacionCustomVisible || !microzonificacionData) return null;
        
        // Cálculo abstracto de daño para pedagogía
        const magBase = Math.max(0, simulacionCustomMag - 4);
        const distAtenuacion = Math.max(0, 1 - (simulacionCustomDist / 100)); // Atenúa hasta 100km
        const profAtenuacion = Math.max(0, 1 - (simulacionCustomProf / 150)); // Atenúa hasta 150km
        
        // Aceleración base proporcional
        const factor_pga = magBase * 0.15 * distAtenuacion * profAtenuacion; 
        
        const features = microzonificacionData.features.map((feature: any) => {
            const row = feature.properties;
            const pcr_tasa = parseFloat(row.pcr_tasa || "0.0");
            const mamp_tasa = parseFloat(row.mamp_tasa || "0.0");
            
            // Simplificación: sismos superficiales afectan rígidos (mampostería), sismos profundos resuenan en esbeltos (pórticos)
            const danio = (mamp_tasa * factor_pga * (simulacionCustomProf < 50 ? 1.5 : 0.8)) + 
                          (pcr_tasa * factor_pga * (simulacionCustomProf >= 50 ? 1.5 : 0.8));
                          
            let color, estado;
            if (danio > 1.2) {
                color = "#E31A1C"; estado = "CRÍTICO";
            } else if (danio > 0.6) {
                color = "#FB9A99"; estado = "MODERADO";
            } else {
                color = "#33A02C"; estado = "ESTABLE";
            }
            
            const isNoCoverage = pcr_tasa === 0 && mamp_tasa === 0;

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    danio_index: danio,
                    estado_riesgo: estado,
                    fill: isNoCoverage ? "transparent" : color,
                    "fill-opacity": isNoCoverage ? 0 : 0.7,
                    stroke: isNoCoverage ? "transparent" : "#000000",
                    "stroke-width": isNoCoverage ? 0 : 1
                }
            };
        });
        
        return {
            type: "FeatureCollection",
            features
        } as FeatureCollection;
    }, [microzonificacionData, simulacionCustomVisible, simulacionCustomMag, simulacionCustomProf, simulacionCustomDist]);

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;
        setUploadError(null);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const name = file.name.toLowerCase();
            const isKml = name.endsWith('.kml');
            const isKmz = name.endsWith('.kmz');
            const isZip = name.endsWith('.zip');
            const isCsv = name.endsWith('.csv');
            const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

            if (!isKml && !isKmz && !isZip && !isCsv && !isExcel) {
                setUploadError(`"${file.name}" no es soportado. Sube .kml, .kmz, .zip (Shapefile), .csv o .xlsx`);
                continue;
            }
            try {
                let geojson;
                let layerName = file.name.replace(/\.[^/.]+$/, "");

                if (isKml) {
                    const layer = await parseKmlFile(file);
                    geojson = layer.geojson;
                    setKmlLayers(prev => [...prev, layer]);
                } else if (isKmz) {
                    const layer = await parseKmzFile(file);
                    geojson = layer.geojson;
                    setKmlLayers(prev => [...prev, layer]);
                } else if (isZip) {
                    const layer = await parseShapefileZip(file);
                    geojson = layer.geojson;
                    setKmlLayers(prev => [...prev, layer]);
                } else if (isCsv) {
                    geojson = await parseCsvFile(file);
                    const layer: KmlLayer = {
                        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        name: layerName,
                        filename: file.name,
                        geojson,
                        visible: true,
                        color: '#3B82F6',
                        addedAt: new Date(),
                    };
                    setKmlLayers(prev => [...prev, layer]);
                } else if (isExcel) {
                    geojson = await parseExcelFile(file);
                    const layer: KmlLayer = {
                        id: `xlsx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        name: layerName,
                        filename: file.name,
                        geojson,
                        visible: true,
                        color: '#10B981',
                        addedAt: new Date(),
                    };
                    setKmlLayers(prev => [...prev, layer]);
                }

                // Automatic zoom to layer
                if (geojson) {
                    const bbox = calculateBBox(geojson);
                    if (bbox) {
                        const [minLng, minLat, maxLng, maxLat] = bbox;
                        if (mapRef.current) {
                            if (minLng === maxLng && minLat === maxLat) {
                                mapRef.current.flyTo({ center: [minLng, minLat], zoom: 15, duration: 1000 });
                            } else {
                                mapRef.current.fitBounds(
                                    [
                                        [minLng, minLat], // southwestern corner of the bounds
                                        [maxLng, maxLat]  // northeastern corner of the bounds
                                    ],
                                    { padding: 40, duration: 1000 }
                                );
                            }
                        }
                    }
                }

                // Trigger geospatial audit
                if (geojson) {
                    setAuditLoading(true);
                    import('@/lib/geo-audit-service').then(({ auditGeoJSON }) => {
                        try {
                            const result = auditGeoJSON(geojson, file.name);
                            setAuditData(result);
                        } catch (e) {
                            console.error('Audit error:', e);
                        } finally {
                            setAuditLoading(false);
                        }
                    });
                }
            } catch (err) {
                setUploadError(err instanceof Error ? err.message : 'Error desconocido');
            }
        }
    }, [setViewState]);

    const toggleLayerVisibility = (id: string) => {
        setKmlLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    };

    const removeLayer = (id: string) => {
        setKmlLayers(prev => prev.filter(l => l.id !== id));
    };

    // Drag & Drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, [handleFileUpload]);

    // Compute interactive layer IDs for KML/SHP and IDEAM layers
    const interactiveLayerIds = [
        ...kmlLayers.filter(l => l.visible).flatMap(l => [`${l.id}-fill`, `${l.id}-line`, `${l.id}-points`]),
        ...IDEAM_LAYERS.filter(l => ideamLayersVisible[l.id]).flatMap(l => [`ideam-${l.id}-fill`, `ideam-${l.id}-line`]),
        'barrios-fill', 'comunas-fill', 'pot-fill', 'perimetro-line', 'diger-points', 'amenaza-fill', 'microzonificacion-fill', 'simulacion1999-fill', 'simulacion1961-fill', 'simulacionCustom-fill'
    ];

    return (
        <div
            className="relative w-full h-full min-h-[600px] sm:min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden shadow-lg border border-border"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <FileUp className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
                        <p className="text-lg font-outfit font-bold text-primary">Soltar archivo KML aquí</p>
                        <p className="text-sm text-primary/70 font-inter">Se agregará como nueva capa al mapa</p>
                    </div>
                </div>
            )}

            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={mapStyle}
                maxZoom={22}
                attributionControl={false}
                interactiveLayerIds={interactiveLayerIds}
                onClick={e => {
                    if (e.features && e.features.length > 0) {
                        const feature = e.features[0];
                        // Find the layer name
                        let layerName = 'Capa';
                        if (feature.layer.id === 'diger-points') {
                            layerName = 'Histórico DIGER';
                        } else if (feature.layer.id === 'amenaza-fill') {
                            layerName = 'Amenaza Urbano/Expansión';
                        } else if (feature.layer.id === 'microzonificacion-fill') {
                            layerName = 'Microzonificación Sísmica';
                        } else if (feature.layer.id.startsWith('ideam-')) {
                            const ideamId = parseInt(feature.layer.id.split('-')[1]);
                            layerName = IDEAM_LAYERS.find(l => l.id === ideamId)?.name || 'IDEAM';
                        } else {
                            const layerInfo = kmlLayers.find(l => feature.layer.id.startsWith(l.id));
                            layerName = layerInfo?.name || 'Capa';
                        }
                        
                        setSelectedKmlFeature({
                            properties: feature.properties,
                            lngLat: e.lngLat,
                            layerName: layerName
                        });
                        return;
                    }
                    
                    setSelectedEvent(null);
                    setSelectedSismo(null);
                    setSelectedUsgs(null);
                    setSelectedEra5(false);
                    setSelectedIdeam(null);
                    setSelectedKmlFeature(null);
                    setSelectedSocialPost(null);

                    if ((temperatureMapVisible || precipitationVisible) && OPENWEATHER_API_KEY) {
                        setOwmLoading(true);
                        setOwmClickedData({ lngLat: e.lngLat, data: null });
                        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${e.lngLat.lat}&lon=${e.lngLat.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`)
                            .then(res => res.json())
                            .then(data => {
                                setOwmClickedData({ lngLat: e.lngLat, data });
                            })
                            .catch(err => {
                                console.error('OWM fetch error:', err);
                                setOwmClickedData(null);
                            })
                            .finally(() => {
                                setOwmLoading(false);
                            });
                    } else {
                        setOwmClickedData(null);
                    }
                }}
            >
                <GeolocateControl position="top-right" />
                <FullscreenControl position="top-right" />
                <NavigationControl position="top-right" />

                {/* ── Radares Meteorológicos ── */}
                
                {/* Capa de Radar IDEAM (Quibdó) */}
                {ideamRadarVisible && ideamRadarData && (
                    <Source
                        id="ideam-radar"
                        type="image"
                        url={ideamRadarData.image_base64!}
                        coordinates={ideamRadarData.bounds}
                    >
                        <Layer
                            id="ideam-radar-layer"
                            type="raster"
                            paint={{ 'raster-opacity': 0.6 }}
                        />
                    </Source>
                )}

                {/* Capa de Radar SIATA (Santa Elena) */}
                {siataRadarVisible && siataRadarData && (
                    <Source
                        id="siata-radar"
                        type="image"
                        url={siataRadarData.image_url!}
                        coordinates={siataRadarData.bounds}
                    >
                        <Layer
                            id="siata-radar-layer"
                            type="raster"
                            paint={{ 'raster-opacity': 0.6 }}
                        />
                    </Source>
                )}

                {/* ── Capas Municipales (OSM) ── */}

                {/* Perímetro Urbano */}
                {perimetroVisible && perimetroData && (
                    <Source id="perimetro-urbano" type="geojson" data={perimetroData}>
                        <Layer
                            id="perimetro-line"
                            type="line"
                            paint={{
                                'line-color': '#94A3B8',
                                'line-width': 2.5,
                                'line-dasharray': [2, 1],
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Comunas */}
                {comunasVisible && comunasData && (
                    <Source id="comunas-pereira" type="geojson" data={comunasData}>
                        <Layer
                            id="comunas-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#3B82F6',
                                'fill-opacity': 0.15,
                                'fill-outline-color': '#2563EB'
                            }}
                        />
                        <Layer
                            id="comunas-line"
                            type="line"
                            paint={{
                                'line-color': '#2563EB',
                                'line-width': 1.5,
                                'line-opacity': 0.6
                            }}
                        />
                    </Source>
                )}

                {/* Barrios */}
                {barriosVisible && barriosData && (
                    <Source id="barrios-pereira" type="geojson" data={barriosData}>
                        <Layer
                            id="barrios-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#10B981',
                                'fill-opacity': 0.1,
                                'fill-outline-color': '#059669'
                            }}
                        />
                        <Layer
                            id="barrios-line"
                            type="line"
                            paint={{
                                'line-color': '#059669',
                                'line-width': 1,
                                'line-opacity': 0.4
                            }}
                        />
                    </Source>
                )}

                {/* Microzonificación Sísmica */}
                {microzonificacionVisible && microzonificacionData && (
                    <Source id="microzonificacion-sismica" type="geojson" data={microzonificacionData}>
                        <Layer
                            id="microzonificacion-fill"
                            type="fill"
                            paint={{
                                'fill-color': [
                                    "interpolate",
                                    ["linear"],
                                    ["get", "todos_tasa"],
                                    0, "#fef0d9",
                                    5, "#fdcc8a",
                                    12, "#fc8d59",
                                    20, "#e34a33",
                                    30, "#b30000"
                                ],
                                'fill-opacity': 0.6,
                                'fill-outline-color': '#9F1239'
                            }}
                        />
                        <Layer
                            id="microzonificacion-line"
                            type="line"
                            paint={{
                                'line-color': '#9F1239',
                                'line-width': 1.5,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Simulacion 1999 */}
                {simulacion1999Visible && simulacion1999Data && (
                    <Source id="simulacion-1999" type="geojson" data={simulacion1999Data}>
                        <Layer
                            id="simulacion1999-fill"
                            type="fill"
                            paint={{
                                'fill-color': ["get", "fill"],
                                'fill-opacity': ["get", "fill-opacity"]
                            }}
                        />
                        <Layer
                            id="simulacion1999-line"
                            type="line"
                            paint={{
                                'line-color': ["get", "stroke"],
                                'line-width': ["get", "stroke-width"],
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Simulacion 1961 */}
                {simulacion1961Visible && simulacion1961Data && (
                    <Source id="simulacion-1961" type="geojson" data={simulacion1961Data}>
                        <Layer
                            id="simulacion1961-fill"
                            type="fill"
                            paint={{
                                'fill-color': ["get", "fill"],
                                'fill-opacity': ["get", "fill-opacity"]
                            }}
                        />
                        <Layer
                            id="simulacion1961-line"
                            type="line"
                            paint={{
                                'line-color': ["get", "stroke"],
                                'line-width': ["get", "stroke-width"],
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Simulacion Custom Interactiva */}
                {simulacionCustomVisible && simulacionCustomData && (
                    <Source id="simulacion-custom" type="geojson" data={simulacionCustomData}>
                        <Layer
                            id="simulacionCustom-fill"
                            type="fill"
                            paint={{
                                'fill-color': ["get", "fill"],
                                'fill-opacity': ["get", "fill-opacity"]
                            }}
                        />
                        <Layer
                            id="simulacionCustom-line"
                            type="line"
                            paint={{
                                'line-color': ["get", "stroke"],
                                'line-width': ["get", "stroke-width"],
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* IDEAM Station Markers — colored by rainfall level (altitude proxy) */}
                {ideamVisible && ideamStations.map((station) => {
                    const rf = getRainfallLevel(station.properties.altitude?.toString() || "0");
                    return (
                        <Marker
                            key={`ideam-${station.properties.id}`}
                            longitude={station.geometry.coordinates[0]}
                            latitude={station.geometry.coordinates[1]}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedIdeam(station);
                                setSelectedEvent(null);
                                setSelectedSismo(null);
                                setSelectedUsgs(null);
                                setSelectedEra5(false);
                            }}
                        >
                            <div className="group relative cursor-pointer" title={`${station.properties.name} — Pluviosidad ${rf.label}`}>
                                {/* Halo animado */}
                                <div
                                    className="absolute inset-0 w-8 h-8 -translate-x-1/4 -translate-y-1/4 rounded-full animate-pulse opacity-25 group-hover:opacity-50"
                                    style={{ backgroundColor: rf.pulse }}
                                />
                                {/* Ícono con color dinámico */}
                                <div
                                    className="relative flex items-center justify-center rounded-lg p-1 shadow-md group-hover:scale-110 transition-transform"
                                    style={{
                                        backgroundColor: rf.iconBg,
                                        border: `1.5px solid ${rf.iconBorder}`,
                                        boxShadow: `0 0 8px ${rf.glow}`,
                                    }}
                                >
                                    <CloudRain className="w-3.5 h-3.5" style={{ color: rf.iconText }} />
                                </div>
                            </div>
                        </Marker>
                    );
                })}

                {/* IDEAM Popup — con nivel de pluviosidad */}
                {ideamVisible && selectedIdeam && (() => {
                    const rf = getRainfallLevel(selectedIdeam.properties.altitude?.toString() || "0");
                    return (
                        <Popup
                            longitude={selectedIdeam.geometry.coordinates[0]}
                            latitude={selectedIdeam.geometry.coordinates[1]}
                            anchor="bottom"
                            onClose={() => setSelectedIdeam(null)}
                            closeOnClick={false}
                        >
                            <div className="p-1.5 max-w-[290px] font-inter">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                    <CloudRain className="w-4 h-4" style={{ color: rf.iconBg }} />
                                    <span className="text-sm font-bold" style={{ color: rf.iconBg }}>Estación IDEAM</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${
                                        selectedIdeam.properties.status === 'Activa'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {selectedIdeam.properties.status}
                                    </span>
                                </div>

                                <p className="text-[11px] font-bold text-gray-800 leading-tight mb-2">{selectedIdeam.properties.name}</p>

                                {/* Rainfall level badge */}
                                <div
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 mb-2"
                                    style={{ backgroundColor: `${rf.iconBg}18`, border: `1px solid ${rf.iconBorder}40` }}
                                >
                                    <CloudRain className="w-3.5 h-3.5 shrink-0" style={{ color: rf.iconBg }} />
                                    <div>
                                        <p className="text-[10px] font-bold" style={{ color: rf.iconBg }}>
                                            Pluviosidad {rf.label}
                                        </p>
                                        <p className="text-[9px] text-gray-500">{rf.mmYear} (estimado)</p>
                                    </div>
                                </div>

                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                    <div className="text-[10px] flex flex-col">
                                        <span className="text-gray-400 font-medium">Categoría</span>
                                        <span className="text-gray-700 font-medium">{selectedIdeam.properties.category}</span>
                                    </div>
                                    <div className="text-[10px] flex flex-col">
                                        <span className="text-gray-400 font-medium">Altitud</span>
                                        <span className="text-gray-700 font-medium">{selectedIdeam.properties.altitude} m</span>
                                    </div>
                                    <div className="text-[10px] flex flex-col">
                                        <span className="text-gray-400 font-medium">Municipio</span>
                                        <span className="text-gray-700 font-medium">{selectedIdeam.properties.municipality}</span>
                                    </div>
                                    <div className="text-[10px] flex flex-col">
                                        <span className="text-gray-400 font-medium">Código</span>
                                        <span className="text-gray-700 font-mono font-medium">{selectedIdeam.properties.id}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">{selectedIdeam.properties.department}</span>
                                    <a
                                        href={`https://www.datos.gov.co/resource/cqmv-a99d.json?codigo=${selectedIdeam.properties.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] hover:underline flex items-center gap-1"
                                        style={{ color: rf.iconBg }}
                                    >
                                        Ver JSON <ExternalLink className="w-2 h-2" />
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    );
                })()}

                {/* Risk Event Markers */}
                {eventosVisible && MOCK_EVENTOS.map((evt) => {
                    const color = GRAVEDAD_COLORS[evt.gravedad];
                    const isCritical = evt.gravedad === 'Critica';
                    return (
                        <Marker
                            key={evt.id}
                            longitude={evt.coordenadas_lng}
                            latitude={evt.coordenadas_lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedEvent(evt);
                                setSelectedSismo(null);
                            }}
                        >
                            <div className="cursor-pointer group relative">
                                <div
                                    className={`w-7 h-7 rounded-full border-[2.5px] border-white transition-all duration-200 group-hover:scale-130 ${isCritical ? 'scale-110' : ''}`}
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: `0 0 ${isCritical ? '14' : '8'}px ${color}90, 0 2px 6px rgba(0,0,0,0.2)`,
                                    }}
                                />
                                {isCritical && (
                                    <div
                                        className="absolute inset-0 w-7 h-7 rounded-full animate-ping opacity-30"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </div>
                        </Marker>
                    );
                })}

                {/* Social Posts Markers */}
                {socialVisible && socialPosts.filter(p => p.location).map((post) => {
                    const color = post.sentiment === 'urgent' ? '#EF4444' : post.sentiment === 'warning' ? '#F59E0B' : '#10B981';
                    return (
                        <Marker
                            key={`social-${post.id}`}
                            longitude={post.location!.lng}
                            latitude={post.location!.lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedSocialPost(post);
                                setSelectedEvent(null);
                                setSelectedSismo(null);
                                setSelectedIdeam(null);
                            }}
                        >
                            <div className="cursor-pointer group relative">
                                <div className="absolute inset-0 w-8 h-8 -translate-x-1/4 -translate-y-1/4 rounded-full animate-ping opacity-25" style={{ backgroundColor: color }} />
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: color }}>
                                    <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </Marker>
                    );
                })}

                {/* Social Posts Popup */}
                {socialVisible && selectedSocialPost && selectedSocialPost.location && (
                    <Popup
                        longitude={selectedSocialPost.location.lng}
                        latitude={selectedSocialPost.location.lat}
                        anchor="bottom"
                        onClose={() => setSelectedSocialPost(null)}
                        closeOnClick={false}
                    >
                        <div className="p-2 max-w-[280px] font-inter">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                <MessageCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-gray-800 capitalize">Reporte {selectedSocialPost.platform}</span>
                            </div>
                            
                            {selectedSocialPost.mediaUrl && (
                                <div className="mb-2 rounded-md overflow-hidden bg-gray-100">
                                    {selectedSocialPost.mediaType === 'video' ? (
                                        <video src={selectedSocialPost.mediaUrl} controls className="w-full h-auto max-h-[160px] object-cover" />
                                    ) : (
                                        <img src={selectedSocialPost.mediaUrl} alt="Report media" className="w-full h-auto max-h-[160px] object-cover" />
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-gray-700 italic mb-2">"{selectedSocialPost.text}"</p>
                            
                            <div className="flex justify-between items-center text-[10px] mb-1">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-white ${
                                    selectedSocialPost.sentiment === 'urgent' ? 'bg-red-500'
                                    : selectedSocialPost.sentiment === 'warning' ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}>
                                    {selectedSocialPost.sentiment.toUpperCase()}
                                </span>
                                <span className="text-gray-400">{new Date(selectedSocialPost.timestamp).toLocaleString()}</span>
                            </div>

                            {selectedSocialPost.postUrl && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <a
                                        href={selectedSocialPost.postUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end gap-1 font-bold"
                                    >
                                        Ver original <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </Popup>
                )}

                {/* ── Capa Hashtag #EmergenciaPereira ── */}
                {hashtagVisible && hashtagPosts.filter(p => p.location).map((post) => {
                    const color = post.sentiment === 'urgent' ? '#EF4444'
                        : post.sentiment === 'warning' ? '#F59E0B'
                        : '#38BDF8';
                    return (
                        <Marker
                            key={`hashtag-${post.id}`}
                            longitude={post.location!.lng}
                            latitude={post.location!.lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedHashtagPost(post);
                                setSelectedSocialPost(null);
                                setSelectedEvent(null);
                                setSelectedSismo(null);
                            }}
                        >
                            <div className="cursor-pointer group relative">
                                {/* Pulsating ring */}
                                <div
                                    className="absolute inset-0 w-10 h-10 -translate-x-[25%] -translate-y-[25%] rounded-full animate-ping opacity-30"
                                    style={{ backgroundColor: color }}
                                />
                                {/* Main marker — squircle shape with Hash icon */}
                                <div
                                    className="relative flex items-center justify-center w-10 h-10 rounded-xl border-2 border-white shadow-xl group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                >
                                    <Hash className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </Marker>
                    );
                })}

                {/* Hashtag Post Popup */}
                {hashtagVisible && selectedHashtagPost && selectedHashtagPost.location && (
                    <Popup
                        longitude={selectedHashtagPost.location.lng}
                        latitude={selectedHashtagPost.location.lat}
                        anchor="bottom"
                        onClose={() => setSelectedHashtagPost(null)}
                        closeOnClick={false}
                    >
                        <div className="p-2 max-w-[300px] font-inter">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                <Hash className="w-4 h-4 text-sky-500" />
                                <span className="text-sm font-bold text-gray-800">EmergenciaPereira</span>
                                <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                                    selectedHashtagPost.source === 'live' ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}>
                                    {selectedHashtagPost.source === 'live' ? '🟢 EN VIVO' : '📋 DEMO'}
                                </span>
                            </div>

                            {/* Tweet text */}
                            <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                                {selectedHashtagPost.text}
                            </p>

                            {/* Hashtags */}
                            <div className="flex flex-wrap gap-1 mb-2">
                                {selectedHashtagPost.hashtags?.slice(0, 4).map(tag => (
                                    <span key={tag} className="text-[9px] text-sky-600 font-medium bg-sky-50 px-1.5 py-0.5 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center justify-between text-[10px] mb-2">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-white ${
                                    selectedHashtagPost.sentiment === 'urgent' ? 'bg-red-500'
                                    : selectedHashtagPost.sentiment === 'warning' ? 'bg-amber-500'
                                    : 'bg-sky-500'
                                }`}>
                                    {selectedHashtagPost.sentiment.toUpperCase()}
                                </span>
                                <span className="text-gray-400">{new Date(selectedHashtagPost.timestamp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>

                            {/* Engagement stats */}
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2 bg-gray-50 rounded p-1.5">
                                <span>📍 {selectedHashtagPost.location_text}</span>
                                <span className="ml-auto">❤️ {selectedHashtagPost.likes}</span>
                                <span>🔁 {selectedHashtagPost.retweets}</span>
                            </div>

                            {/* Author + Link */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 font-medium">{selectedHashtagPost.author}</span>
                                {selectedHashtagPost.postUrl && (
                                    <a href={selectedHashtagPost.postUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 font-bold">
                                        Ver tweet <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}

                {/* OpenWeatherMap Raster Layers */}
                {precipitationVisible && OPENWEATHER_API_KEY && (
                    <Source id="owm-precipitation" type="raster" tiles={[`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`]} tileSize={256}>
                        <Layer id="owm-precipitation-layer" type="raster" paint={{
                            'raster-opacity': 0.5,
                            'raster-saturation': 1.0,
                            'raster-contrast': 0.4,
                            'raster-brightness-min': 0.1,
                        }} />
                    </Source>
                )}
                {cloudsVisible && OPENWEATHER_API_KEY && (
                    <Source id="owm-clouds" type="raster" tiles={[`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`]} tileSize={256}>
                        <Layer id="owm-clouds-layer" type="raster" paint={{ 'raster-opacity': 0.6 }} />
                    </Source>
                )}
                {temperatureMapVisible && OPENWEATHER_API_KEY && (
                    <Source id="owm-temperature" type="raster" tiles={[`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`]} tileSize={256}>
                        <Layer id="owm-temperature-layer" type="raster" paint={{
                            'raster-opacity': 0.5,
                            'raster-saturation': 1.0,
                            'raster-contrast': 0.5,
                            'raster-brightness-min': 0.1,
                        }} />
                    </Source>
                )}

                {/* Open-Meteo ERA5 Historical Marker */}
                {era5Visible && era5Data && (
                    <Marker longitude={-75.6974} latitude={4.8166} anchor="center"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setSelectedEra5(true);
                            setSelectedEvent(null);
                            setSelectedSismo(null);
                            setSelectedUsgs(null);
                        }}
                    >
                        <div className="relative cursor-pointer group" title="Datos Históricos ERA5 (2021)">
                            <div className="absolute inset-0 w-10 h-10 -translate-x-1/4 -translate-y-1/4 rounded-full bg-blue-400 animate-ping opacity-20" />
                            <div className="relative flex items-center gap-1 bg-white/90 backdrop-blur border border-blue-300 rounded-full px-2 py-1 shadow-md hover:bg-blue-50 transition-colors"
                                style={{ boxShadow: '0 0 12px #3B82F640' }}>
                                <span className="text-sm leading-none">📊</span>
                                <span className="text-[10px] font-bold text-blue-600 font-mono">Open-Meteo</span>
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Open-Meteo ERA5 Popup */}
                {era5Visible && selectedEra5 && era5Data && (
                    <Popup
                        longitude={-75.6974}
                        latitude={4.8166}
                        anchor="bottom"
                        onClose={() => setSelectedEra5(false)}
                        closeOnClick={false}
                    >
                        <div className="p-1.5 max-w-[260px] font-inter">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                <span className="text-sm">📊</span>
                                <span className="text-sm font-bold text-blue-600">Histórico ERA5 (2021)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                <div className="text-[10px] flex flex-col">
                                    <span className="text-gray-400 font-medium">Temp Máxima</span>
                                    <span className="text-red-500 font-bold text-sm">{era5Data.maxTemp}°C</span>
                                </div>
                                <div className="text-[10px] flex flex-col">
                                    <span className="text-gray-400 font-medium">Temp Mínima</span>
                                    <span className="text-blue-500 font-bold text-sm">{era5Data.minTemp}°C</span>
                                </div>
                                <div className="text-[10px] flex flex-col">
                                    <span className="text-gray-400 font-medium">Temp Promedio</span>
                                    <span className="text-gray-700 font-bold text-xs">{era5Data.avgTemp}°C</span>
                                </div>
                                <div className="text-[10px] flex flex-col">
                                    <span className="text-gray-400 font-medium">Registros</span>
                                    <span className="text-gray-700 font-bold text-xs">{era5Data.dataPoints?.toLocaleString() ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}

                {/* Invalid Geometry Highlight Layer — Neon Red */}
                {auditData && auditData.invalidGeojson.features.length > 0 && (
                    <Source
                        id="invalid-geom-source"
                        type="geojson"
                        data={auditData.invalidGeojson}
                    >
                        <Layer
                            id="invalid-geom-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#FF2D78',
                                'fill-opacity': 0.35,
                            } as FillLayerSpecification['paint']}
                        />
                        <Layer
                            id="invalid-geom-line"
                            type="line"
                            paint={{
                                'line-color': '#FF2D78',
                                'line-width': 2.5,
                                'line-opacity': 0.9,
                            } as LineLayerSpecification['paint']}
                        />
                        <Layer
                            id="invalid-geom-points"
                            type="circle"
                            filter={['==', ['geometry-type'], 'Point']}
                            paint={{
                                'circle-radius': 7,
                                'circle-color': '#FF2D78',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                                'circle-blur': 0.3,
                            } as CircleLayerSpecification['paint']}
                        />
                    </Source>
                )}

                {/* RainViewer Radar Layer */}
                {radarVisible && radarUrl && (
                    <>
                        <Source
                            id="rainviewer-coverage-source"
                            type="raster"
                            tiles={["https://tilecache.rainviewer.com/v2/coverage/0/256/{z}/{x}/{y}/0/0_0.png"]}
                            tileSize={256}
                            maxzoom={7}
                        >
                            <Layer
                                id="rainviewer-coverage-layer"
                                type="raster"
                                paint={{
                                    'raster-opacity': 0.2,
                                    'raster-fade-duration': 0
                                }}
                            />
                        </Source>

                        <Source
                            id="rainviewer-radar-source"
                            type="raster"
                            tiles={[radarUrl]}
                            tileSize={256}
                            maxzoom={7}
                        >
                            <Layer
                                id="rainviewer-radar-layer"
                                type="raster"
                                paint={{
                                    'raster-opacity': 0.65,
                                    'raster-fade-duration': 0
                                }}
                            />
                        </Source>
                    </>
                )}

                {/* Volcanic Hazard Zones (SGC AmenazasVolcanicasCOLOMBIA) */}
                {volcanicVisible && volcanicZones?.features?.length > 0 && (
                    <Source id="volcanic-zones" type="geojson" data={volcanicZones}>
                        {/* Fill colored by threat level */}
                        <Layer
                            id="volcanic-fill"
                            type="fill"
                            paint={{
                                'fill-color': [
                                    'match',
                                    ['get', 'GRADO_AMENAZA'],
                                    'Amenaza Alta', '#EF4444',
                                    'Amenaza Media', '#F97316',
                                    'Amenaza Baja', '#FBBF24',
                                    '#8B5CF6'
                                ],
                                'fill-opacity': 0.28,
                            } as FillLayerSpecification['paint']}
                        />
                        {/* Outline border */}
                        <Layer
                            id="volcanic-outline"
                            type="line"
                            paint={{
                                'line-color': [
                                    'match',
                                    ['get', 'GRADO_AMENAZA'],
                                    'Amenaza Alta', '#DC2626',
                                    'Amenaza Media', '#EA580C',
                                    'Amenaza Baja', '#D97706',
                                    '#7C3AED'
                                ],
                                'line-width': 1.5,
                                'line-opacity': 0.7,
                            } as LineLayerSpecification['paint']}
                        />
                    </Source>
                )}

                {/* Amenaza Urbano/Expansión (Desde InsForge) - Temática por Subcategoría */}
                {amenazaVisible && amenazaData && (
                    <Source id="amenaza-source" type="geojson" data={amenazaData}>
                        {/* Relleno temático por subcategoría */}
                        <Layer
                            id="amenaza-fill"
                            type="fill"
                            paint={{
                                'fill-color': [
                                    'match',
                                    ['get', 'subcategor'],
                                    'Amenaza alta por fenómenos de remoción en masa', '#92400E',
                                    'Amenaza alta por inundación',                    '#1D4ED8',
                                    'Amenaza media por inundación',                   '#60A5FA',
                                    'Amenaza baja por inundación',                    '#93C5FD',
                                    'Amenaza media por fenómenos de remoción en masa','#B45309',
                                    'Amenaza baja por fenómenos de remoción en masa', '#D97706',
                                    /* color por defecto para subcategorías no mapeadas */
                                    '#6B7280'
                                ],
                                'fill-opacity': 0.78
                            } as any}
                        />
                        {/* Borde contorno semántico por subcategoría */}
                        <Layer
                            id="amenaza-outline"
                            type="line"
                            paint={{
                                'line-color': [
                                    'match',
                                    ['get', 'subcategor'],
                                    'Amenaza alta por fenómenos de remoción en masa', '#78350F',
                                    'Amenaza alta por inundación',                    '#1E40AF',
                                    'Amenaza media por inundación',                   '#3B82F6',
                                    'Amenaza baja por inundación',                    '#BFDBFE',
                                    'Amenaza media por fenómenos de remoción en masa','#92400E',
                                    'Amenaza baja por fenómenos de remoción en masa', '#B45309',
                                    '#9CA3AF'
                                ],
                                'line-width': 2,
                                'line-opacity': 1.0
                            } as any}
                        />
                    </Source>
                )}


                {/* KML GeoJSON Layers */}
                {kmlLayers.filter(l => l.visible).map((layer) => (
                    <Source key={layer.id} id={layer.id} type="geojson" data={layer.geojson}>
                        {/* Polygon fill */}
                        <Layer
                            id={`${layer.id}-fill`}
                            type="fill"
                            filter={['==', ['geometry-type'], 'Polygon']}
                            paint={{
                                'fill-color': layer.color,
                                'fill-opacity': 0.25,
                            } as FillLayerSpecification['paint']}
                        />
                        {/* Lines & polygon outlines */}
                        <Layer
                            id={`${layer.id}-line`}
                            type="line"
                            paint={{
                                'line-color': layer.color,
                                'line-width': 2.5,
                                'line-opacity': 0.85,
                            } as LineLayerSpecification['paint']}
                        />
                        {/* Points */}
                        <Layer
                            id={`${layer.id}-points`}
                            type="circle"
                            filter={['==', ['geometry-type'], 'Point']}
                            paint={{
                                'circle-radius': 6,
                                'circle-color': layer.color,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                            } as CircleLayerSpecification['paint']}
                        />
                    </Source>
                ))}

                {/* DIGER Historical Points */}
                {digerVisible && digerData && (
                    <Source id="diger-source" type="geojson" data={digerData}>
                        <Layer
                            id="diger-points"
                            type="circle"
                            paint={{
                                'circle-radius': 5,
                                'circle-color': [
                                    'match',
                                    ['get', 'evento'],
                                    'DESLIZAMIENTO', '#8B5CF6',
                                    'INUNDACION', '#3B82F6',
                                    'AVENIDA TORRENCIAL', '#0ea5e9',
                                    'VENDAVAL', '#06b6d4',
                                    'INCENDIO', '#EF4444',
                                    'SISMO', '#F97316',
                                    'COLAPSO ESTRUCTURAL', '#52525B',
                                    '#FBBF24' // default
                                ],
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#ffffff',
                                'circle-opacity': 0.8,
                            } as CircleLayerSpecification['paint']}
                        />
                    </Source>
                )}

                {/* Real-time DIGER Reports (Categorizada Temáticamente) */}
                {reportesDigerVisible && reportesDigerData && (
                    <Source id="reportes-diger-source" type="geojson" data={reportesDigerData}>
                        <Layer
                            id="reportes-diger-points"
                            type="circle"
                            paint={{
                                'circle-radius': [
                                    'interpolate', ['linear'], ['zoom'],
                                    10, 6,
                                    15, 12
                                ],
                                'circle-color': [
                                    'match',
                                    ['get', 'tipo'],
                                    'Inundación', '#3B82F6',   // Blue
                                    'Incendio', '#EF4444',     // Red
                                    'Deslizamiento', '#D97706', // Orange/Brown
                                    'Sismo', '#8B5CF6',         // Purple
                                    'Vendaval', '#06B6D4',      // Cyan/Light Blue
                                    '#FBBF24'                   // Yellow for Others
                                ],
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                                'circle-opacity': 0.9,
                            } as CircleLayerSpecification['paint']}
                        />
                        <Layer
                            id="reportes-diger-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'tipo'],
                                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                'text-size': 10,
                                'text-offset': [0, 1.5],
                                'text-anchor': 'top',
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(0,0,0,0.8)',
                                'text-halo-width': 1.5
                            }}
                        />
                    </Source>
                )}

                {/* IDEAM MapServer GeoJSON Layers */}
                {IDEAM_LAYERS.map(layer => (
                    ideamLayersVisible[layer.id] && ideamMapLayerData[layer.id] && (
                        <Source key={`ideam-source-${layer.id}`} id={`ideam-source-${layer.id}`} type="geojson" data={ideamMapLayerData[layer.id]!}>
                                <Layer
                                    id={`ideam-${layer.id}-fill`}
                                    type="fill"
                                    filter={['==', ['geometry-type'], 'Polygon']}
                                    paint={{
                                        'fill-color': layer.id === 0 ? '#3b82f6' : (layer.id === 1 ? '#06b6d4' : '#ef4444'),
                                        'fill-opacity': layer.id === 0 ? 0.3 : 0.5,
                                    } as FillLayerSpecification['paint']}
                                />
                            <Layer
                                id={`ideam-${layer.id}-line`}
                                type="line"
                                paint={{
                                    'line-color': layer.id === 0 ? '#2563eb' : (layer.id === 1 ? '#0891b2' : '#dc2626'),
                                    'line-width': 1.5,
                                    'line-opacity': 0.8,
                                } as LineLayerSpecification['paint']}
                            />
                        </Source>
                    )
                ))}

                {/* SGC Earthquake Markers */}
                {sismosVisible && sismos.map((s) => {
                    const color = magnitudeToColor(s.attributes.Mw);
                    const size = magnitudeToSize(s.attributes.Mw);
                    const isStrong = s.attributes.Mw >= 6;
                    return (
                        <Marker
                            key={`sismo-${s.attributes.FID}`}
                            longitude={s.geometry.x}
                            latitude={s.geometry.y}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedSismo(s);
                                setSelectedEvent(null);
                            }}
                        >
                            <div className="cursor-pointer group relative" title={`Mw ${s.attributes.Mw}`}>
                                {/* Diamond marker */}
                                <div
                                    style={{
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        transform: 'rotate(45deg)',
                                        backgroundColor: color,
                                        border: '3px solid white',
                                        borderRadius: '4px',
                                        boxShadow: `0 0 ${isStrong ? '16' : '10'}px ${color}, 0 2px 8px rgba(0,0,0,0.3)`,
                                        transition: 'transform 0.2s',
                                    }}
                                    className="group-hover:scale-130"
                                />
                                {/* Pulse on strong earthquakes */}
                                {isStrong && (
                                    <div
                                        className="absolute animate-ping opacity-30"
                                        style={{
                                            width: `${size}px`,
                                            height: `${size}px`,
                                            top: 0,
                                            left: 0,
                                            transform: 'rotate(45deg)',
                                            backgroundColor: color,
                                            borderRadius: '4px',
                                        }}
                                    />
                                )}
                            </div>
                        </Marker>
                    );
                })}

                {/* USGS Historical Earthquake Markers */}
                {usgsVisible && usgsQuakes.map((q) => {
                    const mag = q.properties.mag || 0;
                    const [lng, lat] = q.geometry.coordinates;
                    const size = magnitudeToSize(mag);
                    // Orange/amber family — distinct from SGC purple and risk red
                    const color =
                        mag >= 6 ? '#DC2626' :
                            mag >= 5 ? '#EA580C' :
                                mag >= 4 ? '#F97316' :
                                    mag >= 3 ? '#FB923C' :
                                        '#FCD34D';
                    return (
                        <Marker
                            key={`usgs-${q.id}`}
                            longitude={lng}
                            latitude={lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedUsgs(q);
                                setSelectedEvent(null);
                                setSelectedSismo(null);
                            }}
                        >
                            <div className="cursor-pointer group relative" title={`Mw ${mag} — ${q.properties.place}`}>
                                <div
                                    style={{
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        backgroundColor: color,
                                        border: '2.5px solid white',
                                        borderRadius: '50%',
                                        boxShadow: `0 0 ${mag >= 5 ? '14' : '8'}px ${color}90, 0 2px 6px rgba(0,0,0,0.2)`,
                                        transition: 'transform 0.2s',
                                    }}
                                    className="group-hover:scale-125"
                                />
                                {mag >= 5.5 && (
                                    <div
                                        className="absolute animate-ping opacity-25"
                                        style={{
                                            width: `${size}px`, height: `${size}px`,
                                            top: 0, left: 0,
                                            backgroundColor: color,
                                            borderRadius: '50%',
                                        }}
                                    />
                                )}
                            </div>
                        </Marker>
                    );
                })}

                {/* USGS popup */}
                {selectedUsgs && (() => {
                    const [lng, lat] = selectedUsgs.geometry.coordinates;
                    const mag = selectedUsgs.properties.mag || 0;
                    const depth = selectedUsgs.geometry.coordinates[2];
                    const date = selectedUsgs.properties.time
                        ? new Date(selectedUsgs.properties.time).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })
                        : '?';
                    return (
                        <Popup longitude={lng} latitude={lat} anchor="bottom" onClose={() => setSelectedUsgs(null)} closeOnClick={false}>
                            <div className="p-1.5 max-w-[280px] font-inter">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Activity className="w-4 h-4 text-orange-500" />
                                    <span className="text-base font-bold text-orange-500">Mw {mag.toFixed(1)}</span>
                                    <span className="text-[9px] bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full font-bold">USGS</span>
                                </div>
                                <p className="text-[11px] text-gray-700 font-medium leading-tight">{selectedUsgs.properties.place}</p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                                    <div className="text-[10px] text-gray-500"><span className="text-gray-400">Fecha:</span> {date}</div>
                                    <div className="text-[10px] text-gray-500"><span className="text-gray-400">Profundidad:</span> {depth?.toFixed(1) ?? '?'} km</div>
                                    <div className="text-[10px] text-gray-500"><span className="text-gray-400">Tipo:</span> {selectedUsgs.properties.magType || '?'}</div>
                                    <div className="text-[10px] text-gray-500"><span className="text-gray-400">Red:</span> {selectedUsgs.properties.net || '?'}</div>
                                </div>
                            </div>
                        </Popup>
                    );
                })()}

                {/* Event popup */}
                {selectedEvent && (
                    <Popup
                        longitude={selectedEvent.coordenadas_lng}
                        latitude={selectedEvent.coordenadas_lat}
                        anchor="bottom"
                        onClose={() => setSelectedEvent(null)}
                        closeOnClick={false}
                    >
                        <div className="p-1 max-w-[260px] font-inter">
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                    style={{
                                        backgroundColor: `${GRAVEDAD_COLORS[selectedEvent.gravedad]}20`,
                                        color: GRAVEDAD_COLORS[selectedEvent.gravedad],
                                        border: `1px solid ${GRAVEDAD_COLORS[selectedEvent.gravedad]}40`
                                    }}
                                >
                                    {selectedEvent.gravedad}
                                </span>
                                <span className="text-xs font-semibold text-gray-800">{selectedEvent.tipo_evento}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium">{selectedEvent.barrio}</p>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{selectedEvent.descripcion}</p>
                            <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-400 uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3" />
                                {selectedEvent.estado_flujo} · {new Date(selectedEvent.fecha_hora).toLocaleDateString('es-CO')}
                            </div>
                        </div>
                    </Popup>
                )}

                {/* Sismo popup */}
                {selectedSismo && (
                    <Popup
                        longitude={selectedSismo.geometry.x}
                        latitude={selectedSismo.geometry.y}
                        anchor="bottom"
                        onClose={() => setSelectedSismo(null)}
                        closeOnClick={false}
                    >
                        <div className="p-1.5 max-w-[280px] font-inter">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Activity className="w-4 h-4" style={{ color: magnitudeToColor(selectedSismo.attributes.Mw) }} />
                                <span className="text-base font-bold" style={{ color: magnitudeToColor(selectedSismo.attributes.Mw) }}>
                                    Mw {selectedSismo.attributes.Mw.toFixed(1)}
                                </span>
                                <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full uppercase">SGC</span>
                            </div>
                            <p className="text-[11px] text-gray-700 font-medium">
                                {selectedSismo.attributes.Field9 || 'Ubicación no disponible'}
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                                <div className="text-[10px] text-gray-500">
                                    <span className="text-gray-400">Profundidad:</span> {selectedSismo.attributes.Prof_ || '?'} km
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    <span className="text-gray-400">Imáx:</span> {selectedSismo.attributes.Imax || '?'}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    <span className="text-gray-400">Fecha:</span> {selectedSismo.attributes.Fecha ? new Date(selectedSismo.attributes.Fecha).toLocaleDateString('es-CO') : '?'}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    <span className="text-gray-400">Hora:</span> {selectedSismo.attributes.Hora || '?'}
                                </div>
                            </div>
                            {selectedSismo.attributes.Fuente && (
                                <p className="text-[9px] text-gray-400 mt-2 border-t border-gray-100 pt-1">
                                    Fuente: {selectedSismo.attributes.Fuente}
                                    {selectedSismo.attributes.Tipo_falla?.trim() ? ` (${selectedSismo.attributes.Tipo_falla})` : ''}
                                </p>
                            )}
                        </div>
                    </Popup>
                )}

                {/* KML/SHP/DIGER Attribute Popup */}
                {selectedKmlFeature && (
                    <Popup
                        longitude={selectedKmlFeature.lngLat.lng}
                        latitude={selectedKmlFeature.lngLat.lat}
                        anchor="bottom"
                        onClose={() => setSelectedKmlFeature(null)}
                        closeOnClick={false}
                        className="z-50"
                    >
                        {selectedKmlFeature.layerName === 'Histórico DIGER' ? (
                            <div className="p-2 max-w-[280px] font-inter bg-white rounded-lg shadow-xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                    <ActivitySquare className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">Históricos de la DIGER</span>
                                    <span className="ml-auto text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">EVENTO</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-900 leading-tight">
                                        {(selectedKmlFeature.properties as any).evento || 'Evento sin nombre'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {[
                                            (selectedKmlFeature.properties as any).sector, 
                                            (selectedKmlFeature.properties as any).barrver, 
                                            (selectedKmlFeature.properties as any).sectcomun
                                        ].filter(Boolean).join(' - ')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-50">
                                        <div className="text-[9px]">
                                            <span className="text-gray-400 block uppercase font-bold">Fecha</span>
                                            <span className="text-gray-700 font-medium">{(selectedKmlFeature.properties as any).fecha}</span>
                                        </div>
                                        <div className="text-[9px]">
                                            <span className="text-gray-400 block uppercase font-bold">Comuna/Correg</span>
                                            <span className="text-gray-700 font-medium">{(selectedKmlFeature.properties as any).comcorr}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Impacto / Afectados */}
                                    <div className="mt-2 pt-2 border-t border-gray-50">
                                        <span className="text-[9px] text-gray-400 block uppercase font-bold mb-1.5">Impacto / Afectados</span>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {([
                                                { label: 'Viv.', key: 'viv' },
                                                { label: 'Flias.', key: 'flia' },
                                                { label: 'Adultos', key: 'ad' },
                                                { label: 'Menores', key: 'men' },
                                                { label: 'Lesion.', key: 'les' },
                                                { label: 'Fallec.', key: 'fall' },
                                                { label: 'Perm.', key: 'perm' },
                                                { label: 'Trans.', key: 'trans' },
                                            ] as const).map(({label, key}) => {
                                                const val = (selectedKmlFeature.properties as any)[key];
                                                if (val === undefined || val === null || val === '') return null;
                                                return (
                                                    <div key={key} className="bg-gray-50 rounded p-1 text-center border border-gray-100/50">
                                                        <div className="text-[8.5px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-1">{label}</div>
                                                        <div className="text-[11px] text-gray-800 font-semibold leading-none">{val}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : selectedKmlFeature.layerName === 'Amenaza Urbano/Expansión' ? (
                            <div className="p-2.5 max-w-[280px] font-inter bg-white rounded-xl shadow-xl border border-red-100">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-50">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">Zona de Amenaza</span>
                                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                                        (selectedKmlFeature.properties as any).amenaza === 'Alta' ? 'bg-red-500' :
                                        (selectedKmlFeature.properties as any).amenaza === 'Media' ? 'bg-amber-500' : 'bg-yellow-500'
                                    }`}>
                                        {(selectedKmlFeature.properties as any).amenaza}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Nombre de la Zona</p>
                                        <p className="text-xs font-bold text-gray-900 leading-tight">{(selectedKmlFeature.properties as any).nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Subcategoría</p>
                                        <p className="text-[11px] text-gray-700">{(selectedKmlFeature.properties as any).subcategor}</p>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center italic">
                                        <span className="text-[9px] text-gray-400">Fuente: {(selectedKmlFeature.properties as any).fuente}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 max-w-[300px] max-h-[400px] overflow-y-auto siata-scrollbar font-inter bg-white rounded-lg">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                                        {selectedKmlFeature.layerName}
                                    </span>
                                </div>
                                <div className="space-y-0.5 border border-gray-100 rounded overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <tbody>
                                            {Object.entries(selectedKmlFeature.properties).map(([key, value]) => {
                                                // Skip internal mapbox/maplibre properties or empty values
                                                if (key.startsWith('mapbox_') || key === 'id' || key === 'OBJECTID') return null;
                                                const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                                if (displayValue === 'null' || displayValue === 'undefined' || !displayValue.trim()) return null;

                                                return (
                                                    <tr key={key} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                        <th className="py-1.5 px-2 text-[9px] text-gray-400 font-bold uppercase tracking-tight w-1/3 bg-gray-50/50">
                                                            {key.replace(/_/g, ' ')}
                                                        </th>
                                                        <td className="py-1.5 px-2 text-[10px] text-gray-700 font-medium break-words">
                                                            {displayValue}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {Object.keys(selectedKmlFeature.properties).filter(k => !k.startsWith('mapbox_') && k !== 'id' && k !== 'OBJECTID').length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-[10px] text-gray-400 italic">No hay atributos disponibles</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Popup>
                )}

                {/* OpenWeatherMap Popup */}
                {(owmClickedData || owmLoading) && (() => {
                    const lat = owmClickedData?.lngLat.lat || 0;
                    const lng = owmClickedData?.lngLat.lng || 0;
                    const data = owmClickedData?.data;

                    return (
                        <Popup
                            longitude={lng}
                            latitude={lat}
                            anchor="bottom"
                            onClose={() => { setOwmClickedData(null); setOwmLoading(false); }}
                            closeOnClick={false}
                            className="z-50"
                        >
                            <div className="p-2 w-[220px] font-inter bg-white rounded-lg">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                    <CloudRain className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                                        Clima Actual
                                    </span>
                                </div>
                                {owmLoading ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : data ? (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px] text-gray-700">
                                            <span className="text-gray-400 font-bold uppercase">Ubicación</span>
                                            <span className="font-medium text-right">{data.name || 'Desconocido'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-gray-700 bg-gray-50 p-1 rounded">
                                            <span className="text-gray-400 font-bold uppercase flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-400" /> Temp</span>
                                            <span className="font-bold text-lg">{Math.round(data.main?.temp)}°C</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-gray-700">
                                            <span className="text-gray-400 font-bold uppercase">Sensación</span>
                                            <span className="font-medium">{Math.round(data.main?.feels_like)}°C</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-gray-700">
                                            <span className="text-gray-400 font-bold uppercase">Humedad</span>
                                            <span className="font-medium">{data.main?.humidity}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-gray-700">
                                            <span className="text-gray-400 font-bold uppercase flex items-center gap-1"><Wind className="w-3 h-3 text-gray-400" /> Viento</span>
                                            <span className="font-medium">{data.wind?.speed} m/s</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-gray-700">
                                            <span className="text-gray-400 font-bold uppercase">Condición</span>
                                            <span className="font-medium capitalize">{data.weather?.[0]?.description}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 italic">No hay datos disponibles</p>
                                )}
                            </div>
                        </Popup>
                    );
                })()}

                {/* Real-time DIGER Report Popup */}
                {selectedReporteDiger && (() => {
                    const props = selectedReporteDiger.properties;
                    const coords = selectedReporteDiger.geometry.coordinates;
                    const color = 
                        props.tipo === 'Inundación' ? '#3B82F6' :
                        props.tipo === 'Incendio' ? '#EF4444' :
                        props.tipo === 'Deslizamiento' ? '#D97706' :
                        props.tipo === 'Sismo' ? '#8B5CF6' :
                        props.tipo === 'Vendaval' ? '#06B6D4' : '#FBBF24';

                    return (
                        <Popup
                            longitude={coords[0]}
                            latitude={coords[1]}
                            anchor="bottom"
                            onClose={() => setSelectedReporteDiger(null)}
                            closeOnClick={false}
                        >
                            <div className="p-2.5 max-w-[280px] font-inter bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                                {/* Header Temático */}
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{props.tipo}</span>
                                    <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">DIGER</span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Descripción</p>
                                        <p className="text-xs text-gray-700 leading-snug">{props.descripcion || 'Sin descripción detallada'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Fecha Reporte</p>
                                            <p className="text-[10px] font-medium text-gray-600">{new Date(props.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Estado</p>
                                            <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">{props.estado}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Censo Resumido (Si se implementa el fetching de recursos luego) */}
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Impacto Reportado</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600 italic leading-tight">Click en el panel de incidentes para censo detallado</p>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    );
                })()}
            </Map>

            {/* SIATA UI Components */}
            <MapSidebar
                activeSection={activeSidebarSection}
                onSectionChange={setActiveSidebarSection}
            />

            <TopSearchBar />

            <RightControlPanel
                kmlLayers={kmlLayers}
                toggleLayerVisibility={toggleLayerVisibility}
                removeLayer={removeLayer}
                onUploadClick={() => fileInputRef.current?.click()}
                uploadError={uploadError}
                setUploadError={setUploadError}
                eventosVisible={eventosVisible} toggleEventos={() => setEventosVisible(!eventosVisible)}
                sismosVisible={sismosVisible} toggleSismos={() => setSismosVisible(!sismosVisible)}
                usgsVisible={usgsVisible} toggleUsgs={() => setUsgsVisible(!usgsVisible)}
                volcanicVisible={volcanicVisible} toggleVolcanic={() => setVolcanicVisible(!volcanicVisible)}
                radarVisible={radarVisible} toggleRadar={() => setRadarVisible(!radarVisible)}
                temperatureMapVisible={temperatureMapVisible} toggleTemperatureMap={() => setTemperatureMapVisible(!temperatureMapVisible)}
                precipitationVisible={precipitationVisible} togglePrecipitation={() => setPrecipitationVisible(!precipitationVisible)}
                era5Visible={era5Visible} toggleEra5={() => setEra5Visible(!era5Visible)}
                vulnerabilidadVisible={vulnerabilidadVisible} toggleVulnerabilidad={() => setVulnerabilidadVisible(!vulnerabilidadVisible)}
                ideamVisible={ideamVisible} toggleIdeam={() => setIdeamVisible(!ideamVisible)}
                ideamLayersVisible={ideamLayersVisible} 
                toggleIdeamLayer={(id: number) => setIdeamLayersVisible(prev => ({ ...prev, [id]: !prev[id] }))}
                ideamMapLoading={ideamMapLoading}
                // Municipal
                barriosVisible={barriosVisible} toggleBarrios={() => setBarriosVisible(!barriosVisible)}
                comunasVisible={comunasVisible} toggleComunas={() => setComunasVisible(!comunasVisible)}
                potVisible={potVisible} togglePot={() => setPotVisible(!potVisible)}
                perimetroVisible={perimetroVisible} togglePerimetro={() => setPerimetroVisible(!perimetroVisible)}
                digerVisible={digerVisible} toggleDiger={() => setDigerVisible(!digerVisible)}
                amenazaVisible={amenazaVisible} toggleAmenaza={() => setAmenazaVisible(!amenazaVisible)}
                amenazaLoading={amenazaLoading}
                microzonificacionVisible={microzonificacionVisible} toggleMicrozonificacion={() => setMicrozonificacionVisible(!microzonificacionVisible)}
                microzonificacionLoading={microzonificacionLoading}
                simulacion1999Visible={simulacion1999Visible} toggleSimulacion1999={() => setSimulacion1999Visible(!simulacion1999Visible)}
                simulacion1999Loading={simulacion1999Loading}
                simulacion1961Visible={simulacion1961Visible} toggleSimulacion1961={() => setSimulacion1961Visible(!simulacion1961Visible)}
                simulacion1961Loading={simulacion1961Loading}
                simulacionCustomVisible={simulacionCustomVisible}
                toggleSimulacionCustom={() => setSimulacionCustomVisible(!simulacionCustomVisible)}
                simulacionCustomMag={simulacionCustomMag} setSimulacionCustomMag={setSimulacionCustomMag}
                simulacionCustomProf={simulacionCustomProf} setSimulacionCustomProf={setSimulacionCustomProf}
                simulacionCustomDist={simulacionCustomDist} setSimulacionCustomDist={setSimulacionCustomDist}
                socialVisible={socialVisible} toggleSocial={() => { setSocialVisible(v => { if (v) setSelectedSocialPost(null); return !v; }); }}
                hashtagVisible={hashtagVisible} toggleHashtag={() => { setHashtagVisible(v => { if (v) setSelectedHashtagPost(null); return !v; }); }}
                hashtagLoading={hashtagLoading}

                sismosLoading={sismosLoading}
                usgsLoading={usgsLoading}
                volcanicLoading={volcanicLoading}
                radarLoading={radarLoading}
                era5Loading={era5Loading}
                ideamLoading={ideamLoading}
                sismosCount={sismos.length}
                usgsCount={usgsQuakes.length}
                volcanicCount={volcanicZones?.features?.length ?? 0}
                ideamCount={ideamStations.length}
                activeSidebarSection={activeSidebarSection}
                ideamRadarVisible={ideamRadarVisible}
                ideamRadarLoading={ideamRadarLoading}
                toggleIdeamRadar={() => {
                    if (ideamRadarVisible) {
                        setIdeamRadarVisible(false);
                        setIdeamRadarData(null);
                    } else {
                        setIdeamRadarVisible(true);
                    }
                }}
                siataRadarVisible={siataRadarVisible}
                siataRadarLoading={siataRadarLoading}
                toggleSiataRadar={() => {
                    if (siataRadarVisible) {
                        setSiataRadarVisible(false);
                        setSiataRadarData(null);
                    } else {
                        setSiataRadarVisible(true);
                    }
                }}
                barriosLoading={barriosLoading}
                comunasLoading={comunasLoading}
                perimetroLoading={perimetroLoading}
                reportesDigerVisible={reportesDigerVisible}
                toggleReportesDiger={() => setReportesDigerVisible(!reportesDigerVisible)}
                reportesDigerLoading={reportesDigerLoading}
            >
                {/* Analytics Content for the "Análisis" tab */}
                {activeSidebarSection === 'analytics' ? (
                    <AnalyticsPanel />
                ) : (
                    <div className="siata-scrollbar overflow-y-auto pr-1 space-y-4">
                        {/* ISO 19157 Audit Panel — auto-triggers on file upload */}
                        <AuditoriaPanel
                            data={auditData}
                            loading={auditLoading}
                            isDemo={!auditData && !auditLoading}
                            defaultOpen={true}
                        />

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[300px] overflow-y-auto siata-scrollbar">
                            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0F172A] z-10 py-1">
                                <div className="flex items-center gap-2">
                                    <ActivitySquare className="w-4 h-4 text-destructive" />
                                    <h3 className="text-xs font-bold text-white uppercase tracking-tight">Eventos Recientes</h3>
                                </div>
                                <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded font-bold">{MOCK_EVENTOS.length}</span>
                            </div>
                            <EventTimeline />
                        </div>

                        <TemperaturaWidget />
                        <SatmaMonitor />
                    </div>
                )}
            </RightControlPanel>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".kml,.zip,.geojson,.csv,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
            />
        </div>
    );
}
