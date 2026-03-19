"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Shield, BookOpen, Search, GraduationCap, Map, Users, Lightbulb, LineChart, Globe, Bot, Info } from "lucide-react";
import { SimulationChat } from "@/components/observatorio/simulation-chat";
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";

export default function ObservatorioPage() {
    return (
        <div className="w-full h-full p-4 md:p-6 space-y-6 overflow-y-auto">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    <div>
                        <h1 className="text-2xl font-outfit font-bold tracking-tight text-foreground text-center md:text-left">Observatorio GRD</h1>
                        <p className="text-[11px] text-muted-foreground font-inter mt-1 text-center md:text-left italic">
                            Conocimiento y apropiación social del riesgo
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
                        <Search className="w-4 h-4" /> Conocimiento del Riesgo
                    </TabsTrigger>
                    <TabsTrigger value="educacion" className="flex items-center gap-2 py-2.5">
                        <GraduationCap className="w-4 h-4" /> Educación y Apropiación
                    </TabsTrigger>
                    <TabsTrigger value="simulaciones" className="flex items-center gap-2 py-2.5">
                        <Bot className="w-4 h-4" /> Simulaciones IA
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Conceptos Básicos */}
                <TabsContent value="conceptos" className="space-y-6 animate-in fade-in-50 duration-500">
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
                                    para la toma de decisiones, tanto a nivel gubernamental como comunitario, enfocándose 
                                    estratégicamente en el "Conocimiento del Riesgo".
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
                                    <li className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span><strong>Monitoreo Continuo:</strong> Seguimiento sistemático de fenómenos naturales y antrópicos.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span><strong>Análisis Espacial:</strong> Uso de SIG (Sistemas de Información Geográfica) para cartografiar niveles de riesgo.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span><strong>Centralización de Datos:</strong> Integración de información climática, hidrológica y geológica en una plataforma única.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span><strong>Alerta Temprana:</strong> Generación de boletines y avisos preventivos para la comunidad y autoridades.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <h3 className="text-xl font-outfit font-semibold mt-10 mb-4">Glosario Fundamental</h3>
                    <Accordion className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="px-6 hover:bg-muted/50 transition-colors">Amenaza (Peligro)</AccordionTrigger>
                            <AccordionContent className="px-6 prose prose-sm dark:prose-invert">
                                Probabilidad de que un evento físico, potencialmente perjudicial (natural o inducido por la acción humana), se presente en un lugar específico, con una cierta intensidad y en un período de tiempo determinado.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="px-6 hover:bg-muted/50 transition-colors">Vulnerabilidad</AccordionTrigger>
                            <AccordionContent className="px-6 prose prose-sm dark:prose-invert">
                                Susceptibilidad o fragilidad física, económica, social, ambiental o institucional que tiene una comunidad de ser afectada o de sufrir efectos adversos en caso de que un evento físico peligroso se presente.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="px-6 hover:bg-muted/50 transition-colors">Riesgo</AccordionTrigger>
                            <AccordionContent className="px-6 prose prose-sm dark:prose-invert">
                                Es la combinación de la probabilidad de que se produzca un evento y sus consecuencias negativas. Es el resultado de la interacción entre amenazas y condiciones de vulnerabilidad.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="px-6 hover:bg-muted/50 transition-colors">Resiliencia</AccordionTrigger>
                            <AccordionContent className="px-6 prose prose-sm dark:prose-invert">
                                Capacidad de un sistema, comunidad o sociedad expuestos a amenazas para resistir, absorber, adaptarse y recuperarse de sus efectos de manera oportuna y eficaz.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                {/* Tab 2: Conocimiento del Riesgo */}
                <TabsContent value="conocimiento" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 text-center max-w-4xl mx-auto">
                        <Lightbulb className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <h2 className="text-xl font-outfit font-semibold text-foreground mb-2">
                            El Pilar de la Gestión: Conocer para Prevenir
                        </h2>
                        <p className="text-muted-foreground font-inter">
                            El Conocimiento del Riesgo es el proceso estructurado y transversal de la GRD (Ley 1523 de 2012 en Colombia). 
                            Sin un conocimiento profundo y actualizado de los escenarios de riesgo, no es posible planificar intervenciones 
                            efectivas ni preparar a la comunidad.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "1. Identificación",
                                desc: "Reconocer las amenazas presentes (inundaciones, deslizamientos, sismos) en el territorio. Implica la participación activa de las comunidades, quienes conocen históricamente su entorno.",
                                icon: Search,
                                color: "text-amber-500",
                                bg: "bg-amber-100 dark:bg-amber-900/30"
                            },
                            {
                                title: "2. Análisis y Evaluación",
                                desc: "Estudiar la frecuencia, magnitud y vulnerabilidad (física y social). Aquí convergen los estudios científicos, técnicos y el modelamiento de datos geoespaciales.",
                                icon: LineChart,
                                color: "text-indigo-500",
                                bg: "bg-indigo-100 dark:bg-indigo-900/30"
                            },
                            {
                                title: "3. Comunicación",
                                desc: "Traducir los hallazggos técnicos a un lenguaje claro y accesible. El conocimiento que no es comprendido por la población expuesta no cumple su fin preventivo.",
                                icon: Users,
                                color: "text-emerald-500",
                                bg: "bg-emerald-100 dark:bg-emerald-900/30"
                            }
                        ].map((item, i) => (
                            <Card key={i} className="border-border/60 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20`}>
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

                {/* Tab 3: Educación */}
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
                                    de prevención a través de la apropiación social, un proceso donde la comunidad no solo recibe información, 
                                    sino que la comprende, la hace suya y la transforma en acción y organización.
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
                                        { title: "Educación Emocional", desc: "Aprender a manejar el trauma, la incertidumbre y el liderazgo comunitario antes, durante y después del desastre." }
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

                {/* Tab 4: Simulaciones IA */}
                <TabsContent value="simulaciones" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center max-w-4xl mx-auto mb-6">
                        <div className="inline-flex items-center justify-center p-3 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                            <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-outfit font-bold mb-3">Simulador Interactivo con IA</h2>
                        <p className="text-muted-foreground font-inter">
                            Pon a prueba tus conocimientos y capacidad de toma de decisiones. Nuestro "Director de Simulacro" 
                            (potenciado por Google Gemini) te guiará por escenarios de emergencia realistas. 
                            Responde como si estuvieras allí y evalúa tus instintos de gestión del riesgo.
                        </p>
                    </div>
                    
                    <SimulationChat />
                </TabsContent>

            </Tabs>
        </div>
    );
}
