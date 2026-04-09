"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    Shield, BookOpen, Search, GraduationCap,
    Map, Users, Lightbulb, LineChart, Globe,
    Bot, Info, Activity, Waves, Mountain, Flame,
    AlertTriangle, TrendingUp, Radar
} from "lucide-react";
import { SimulationChat } from "@/components/observatorio/simulation-chat";
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";
import Image from "next/image";

// --- Datos extraídos directamente de NotebookLM / Tesis MGRD CAP III ---
const PEREIRA_STATS = [
    { value: "27", label: "Sismos Históricos", desc: "Significativos registrados", icon: Activity, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
    { value: "105", label: "Laderas Monitoreadas", desc: "Red RedH activa", icon: Radar, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { value: "29", label: "Sensores Activos", desc: "Monitoreo en tiempo real", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { value: "7", label: "Sectores Críticos", desc: "Zonas de inundación", icon: Waves, color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
];

const AMENAZAS_PEREIRA = [
    {
        title: "Amenaza Volcánica",
        subtitle: "Nevado de Santa Isabel",
        desc: "Pereira se encuentra en zona de amenaza MEDIA por caída de ceniza. Las riberas del Río Campoalegre están bajo amenaza ALTA por flujos de lodo (lahares). Fuente: POT Anexo XIII.",
        icon: Flame,
        color: "text-red-600",
        bg: "bg-red-100 dark:bg-red-900/30",
        badge: "Amenaza Alta · Río Campoalegre",
        badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        items: ["Ceniza: Amenaza Media en Pereira", "Lahares: Amenaza Alta en Río Campoalegre", "Origen: Nevado de Santa Isabel", "Referencia: POT Pereira – Anexo XIII"],
    },
    {
        title: "Amenaza Sísmica",
        subtitle: "NSR-10 + Mapa 31 POT",
        desc: "Pereira se clasifica en Zona de Amenaza Sísmica Alta según la Norma NSR-10. Se han documentado 27 sismos históricos significativos. La Microzonificación Sísmica (Mapa 31 del POT) cartografía la respuesta dinámica por sectores.",
        icon: Activity,
        color: "text-violet-600",
        bg: "bg-violet-100 dark:bg-violet-900/30",
        badge: "27 sismos históricos · Alta Amenaza",
        badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        items: ["Zona de Amenaza Sísmica Alta (NSR-10)", "27 sismos históricos significativos", "Microzonificación: Mapa 31 POT", "Integración con Red SGC y USGS"],
    },
    {
        title: "Inundaciones y Deslizamientos",
        subtitle: "7 sectores críticos · RedH",
        desc: "Siete sectores con alta vulnerabilidad hídrica: Caracol La Curva, Rocío Bajo, La Dulcera, Caimalito, Brisas del Consotá, La Playita y San Gregorio. La RedH de Pereira opera 105 laderas monitoreadas con 29 sensores activos.",
        icon: Waves,
        color: "text-cyan-600",
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        badge: "RedH: 105 laderas · 29 sensores",
        badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
        items: [
            "Caracol La Curva · Rocío Bajo · La Dulcera",
            "Caimalito · Brisas del Consotá · La Playita",
            "San Gregorio (zona crítica)",
            "Datos homologados estándar DesInventar",
        ],
    },
];

const SECTORES_INUNDACION = [
    "Caracol La Curva", "Rocío Bajo", "La Dulcera",
    "Caimalito", "Brisas del Consotá", "La Playita", "San Gregorio"
];

export default function ObservatorioPage() {
    return (
        <div className="w-full h-full p-4 md:p-6 space-y-6 overflow-y-auto">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    <div>
                        <h1 className="text-2xl font-outfit font-bold tracking-tight text-foreground text-center md:text-left">Observatorio GRD</h1>
                        <p className="text-[11px] text-muted-foreground font-inter mt-1 text-center md:text-left italic">
                            Conocimiento y apropiación social del riesgo · Pereira, Risaralda
                        </p>
                    </div>
                </div>
                <DashboardNav />
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-emerald-600 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                    <Info className="w-3 h-3" />
                    Espacio Educativo
                </div>
            </header>

            <Tabs defaultValue="conceptos" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-8 h-auto p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="conceptos" className="flex items-center gap-2 py-2.5">
                        <BookOpen className="w-4 h-4" /> Conceptos Básicos
                    </TabsTrigger>
                    <TabsTrigger value="conocimiento" className="flex items-center gap-2 py-2.5">
                        <Search className="w-4 h-4" /> Amenazas del Territorio
                    </TabsTrigger>
                    <TabsTrigger value="educacion" className="flex items-center gap-2 py-2.5">
                        <GraduationCap className="w-4 h-4" /> Educación y Apropiación
                    </TabsTrigger>
                    <TabsTrigger value="simulaciones" className="flex items-center gap-2 py-2.5">
                        <Bot className="w-4 h-4" /> Simulaciones IA
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════ TAB 1: Conceptos Básicos ══ */}
                <TabsContent value="conceptos" className="space-y-8 animate-in fade-in-50 duration-500">

                    {/* Imagen ilustrativa GRD */}
                    <div className="relative w-full rounded-2xl overflow-hidden border border-border/60 shadow-lg">
                        <Image
                            src="/images/grd-infografia-nb.png"
                            alt="Ilustración de Gestión del Riesgo de Desastres en Pereira"
                            width={1200}
                            height={600}
                            className="w-full object-cover"
                            priority
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <p className="text-white text-xs font-inter">
                                Ilustración: Sistema integrado de amenazas geofísicas en el territorio de Pereira · Fuente: TESIS MGRD CAP III
                            </p>
                        </div>
                    </div>

                    {/* Cards principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="p-2 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <CardTitle className="text-xl">¿Qué es un Observatorio de GRD?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground font-inter leading-relaxed">
                                <p>
                                    Un Observatorio de Gestión del Riesgo de Desastres (GRD) funciona como un centro neurálgico
                                    para la recopilación, análisis y difusión de información crítica relacionada con amenazas,
                                    vulnerabilidades y capacidades del territorio.
                                </p>
                                <p className="mt-4">
                                    Su principal propósito es transformar los datos técnicos y científicos en conocimiento útil
                                    para la toma de decisiones, enfocándose estratégicamente en el <strong>"Conocimiento del Riesgo"</strong> (Ley 1523 de 2012).
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="p-2 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                                    <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-xl">Funciones Principales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 font-inter text-muted-foreground">
                                    {[
                                        { label: "Monitoreo Continuo", desc: "Seguimiento sistemático de fenómenos naturales y antrópicos." },
                                        { label: "Análisis Espacial", desc: "Uso de SIG para cartografiar niveles de riesgo." },
                                        { label: "Centralización de Datos", desc: "Integración de información climática, hidrológica y geológica." },
                                        { label: "Alerta Temprana", desc: "Generación de boletines y avisos preventivos." },
                                    ].map((f, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span><strong>{f.label}:</strong> {f.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Métricas de Pereira — datos de NotebookLM */}
                    <div>
                        <h3 className="text-lg font-outfit font-semibold mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Pereira en Cifras · Gestión del Riesgo
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 font-inter italic">
                            Fuente: TESIS MGRD CAP III · POT Pereira · DesInventar · NSR-10
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PEREIRA_STATS.map((stat, i) => (
                                <div key={i} className="rounded-2xl border border-border/60 p-4 text-center hover:shadow-md transition-shadow bg-card">
                                    <div className={`p-2 w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <p className={`text-3xl font-outfit font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">{stat.label}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 font-inter">{stat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Glosario */}
                    <div>
                        <h3 className="text-xl font-outfit font-semibold mb-4">Glosario Fundamental</h3>
                        <Accordion className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                            {[
                                { t: "Amenaza (Peligro)", c: "Probabilidad de que un evento físico, potencialmente perjudicial (natural o inducido por la acción humana), se presente en un lugar específico, con una cierta intensidad y en un período de tiempo determinado." },
                                { t: "Vulnerabilidad", c: "Susceptibilidad o fragilidad física, económica, social, ambiental o institucional que tiene una comunidad de ser afectada o de sufrir efectos adversos en caso de que un evento físico peligroso se presente." },
                                { t: "Riesgo", c: "Es la combinación de la probabilidad de que se produzca un evento y sus consecuencias negativas. Es el resultado de la interacción entre amenazas y condiciones de vulnerabilidad." },
                                { t: "Resiliencia", c: "Capacidad de un sistema, comunidad o sociedad expuestos a amenazas para resistir, absorber, adaptarse y recuperarse de sus efectos de manera oportuna y eficaz." },
                                { t: "Lahar", c: "Flujo de lodo volcánico originado por la mezcla de agua (lluvia, nieve o glaciar derretido) con material volcánico suelto. En Pereira, el Río Campoalegre está en zona de amenaza alta por lahares del Nevado de Santa Isabel." },
                                { t: "Microzonificación Sísmica", c: "Estudio que divide un territorio en zonas con comportamiento sísmico diferenciado, considerando la respuesta dinámica del suelo. En Pereira, el Mapa 31 del POT define estas zonas para la planificación urbana (NSR-10)." },
                            ].map((item, i) => (
                                <AccordionItem key={i} value={`item-${i + 1}`}>
                                    <AccordionTrigger className="px-6 hover:bg-muted/50 transition-colors">{item.t}</AccordionTrigger>
                                    <AccordionContent className="px-6 prose prose-sm dark:prose-invert">{item.c}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </TabsContent>

                {/* ═══════════════════════════════ TAB 2: Amenazas del Territorio ══ */}
                <TabsContent value="conocimiento" className="space-y-8 animate-in fade-in-50 duration-500">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 flex gap-4 items-start">
                        <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-outfit font-semibold text-foreground mb-1">El Pilar de la Gestión: Conocer para Prevenir</h4>
                            <p className="text-sm text-muted-foreground font-inter leading-relaxed">
                                El Conocimiento del Riesgo es el proceso estructurado y transversal de la GRD (Ley 1523 de 2012).
                                Esta sección utiliza datos de la TESIS MGRD, el POT de Pereira y la norma NSR-10.
                            </p>
                        </div>
                    </div>

                    {/* Cards de amenazas específicas de Pereira */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {AMENAZAS_PEREIRA.map((item, i) => (
                            <Card key={i} className="border-border/60 shadow-sm relative overflow-hidden group flex flex-col">
                                <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                                    <item.icon className={`w-28 h-28 ${item.color}`} />
                                </div>
                                <CardHeader className="relative z-10 pb-2">
                                    <div className={`p-2 w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground font-inter">{item.subtitle}</p>
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor} w-fit mt-1`}>
                                        {item.badge}
                                    </span>
                                </CardHeader>
                                <CardContent className="relative z-10 text-sm text-muted-foreground font-inter leading-relaxed flex-1">
                                    <p className="mb-3">{item.desc}</p>
                                    <ul className="space-y-1.5 border-t border-border/40 pt-3">
                                        {item.items.map((it, j) => (
                                            <li key={j} className="flex items-start gap-2">
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.color.replace('text-', 'bg-')}`} />
                                                <span className="text-[11px]">{it}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Sectores críticos de inundación */}
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                    <Waves className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <CardTitle>Sectores Críticos de Inundación en Pereira</CardTitle>
                                    <p className="text-xs text-muted-foreground font-inter mt-0.5">Identificados en el POT · 7 zonas de alta vulnerabilidad hídrica</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {SECTORES_INUNDACION.map((sector, i) => (
                                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800/30">
                                        <div className="w-6 h-6 rounded-full bg-cyan-200 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <span className="text-xs font-medium text-foreground">{sector}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground font-inter">
                                <strong className="text-foreground">Red de Monitoreo (RedH):</strong> Pereira cuenta con 105 laderas monitoreadas y 29 sensores activos que cruzan datos de precipitación con riesgo de deslizamiento en tiempo real.
                                Los registros históricos se homologan al estándar internacional <strong>DesInventar</strong> (Landslide / Debris Flow).
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mapa de procesos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "1. Identificación", desc: "Reconocer las amenazas presentes (inundaciones, deslizamientos, sismos) en el territorio. Implica la participación activa de las comunidades.", icon: Search, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
                            { title: "2. Análisis y Evaluación", desc: "Estudiar la frecuencia, magnitud y vulnerabilidad. Convergen estudios científicos y modelamiento de datos geoespaciales del POT.", icon: LineChart, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
                            { title: "3. Comunicación", desc: "Traducir los hallazgos técnicos a lenguaje claro. El conocimiento que no comprende la población expuesta no cumple su fin preventivo.", icon: Users, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
                        ].map((item, i) => (
                            <Card key={i} className="border-border/60 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                                    <item.icon className={`w-24 h-24 ${item.color}`} />
                                </div>
                                <CardHeader className="relative z-10 pb-2">
                                    <div className={`p-2 w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10 text-muted-foreground font-inter text-sm leading-relaxed">
                                    {item.desc}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ═══════════════════════════════ TAB 3: Educación ══ */}
                <TabsContent value="educacion" className="space-y-6 animate-in fade-in-50 duration-500">
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-8 lg:bg-muted/20 flex flex-col justify-center">
                                <div className="p-3 w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                                    <GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h2 className="text-2xl font-outfit font-bold mb-4">Apropiación Social del Conocimiento</h2>
                                <p className="text-muted-foreground font-inter mb-4 leading-relaxed">
                                    La educación no debe limitarse a entregar cartillas o manuales. El verdadero objetivo es generar una cultura
                                    de prevención a través de la apropiación social: la comunidad no solo recibe información,
                                    sino que la comprende, la hace suya y la transforma en acción colectiva.
                                </p>
                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mt-2">
                                    Del asistencialismo al empoderamiento
                                </p>
                            </div>
                            <div className="p-8 border-t lg:border-t-0 lg:border-l border-border/60">
                                <h3 className="text-lg font-outfit font-semibold mb-6">Estrategias Clave de Educación</h3>
                                <div className="space-y-6">
                                    {[
                                        { title: "Diálogo de Saberes", desc: "Integrar el conocimiento técnico/científico con los saberes empíricos, indígenas o tradicionales de la comunidad sobre su territorio." },
                                        { title: "Herramientas Interactivas", desc: "El uso de visores geográficos, mapas participativos y aplicaciones (como RiesGeoPereira) acercan el dato complejo a la vivencia diaria." },
                                        { title: "Simulacros Comunitarios", desc: "La experimentación práctica de rutas de evacuación y roles durante emergencias solidifica el conocimiento teórico." },
                                        { title: "Educación Emocional", desc: "Aprender a manejar el trauma, la incertidumbre y el liderazgo comunitario antes, durante y después del desastre." },
                                    ].map((est, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm">{est.title}</h4>
                                                <p className="text-muted-foreground text-sm mt-1">{est.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-card border border-border/60 rounded-xl p-6 text-center shadow-sm">
                        <Users className="w-8 h-8 mx-auto text-primary mb-3" />
                        <h4 className="text-lg font-outfit font-semibold mb-2">Misión del Observatorio Educativo</h4>
                        <p className="text-muted-foreground text-sm max-w-2xl mx-auto font-inter">
                            Crear herramientas para que las comunidades lean su territorio, comprendan las dinámicas hidrometeorológicas
                            (precipitación, alertas) y construyan planes comunitarios de gestión del riesgo basados en evidencia
                            accesible.
                        </p>
                    </div>
                </TabsContent>

                {/* ═══════════════════════════════ TAB 4: Simulaciones IA ══ */}
                <TabsContent value="simulaciones" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center max-w-4xl mx-auto mb-6">
                        <div className="inline-flex items-center justify-center p-3 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                            <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-outfit font-bold mb-3">Simulador Interactivo con IA</h2>
                        <p className="text-muted-foreground font-inter">
                            Pon a prueba tus conocimientos y capacidad de toma de decisiones. Nuestro &quot;Director de Simulacro&quot;
                            (potenciado por Google Gemini) te guiará por escenarios de emergencia realistas basados en las
                            amenazas reales del territorio de Pereira y Risaralda.
                        </p>
                    </div>
                    <SimulationChat />
                </TabsContent>

            </Tabs>
        </div>
    );
}
