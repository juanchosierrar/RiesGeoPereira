"use client";

import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    PlusCircle, 
    AlertTriangle, 
    MapPin, 
    Users, 
    Info, 
    Calendar,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { geocodePereira } from '@/lib/geocoding';
import { cn } from "@/lib/utils";

const ENTIDADES = ["DIGER", "Bomberos", "Defensa Civil", "SAIAs", "Comunidad"];
const TIPOS_EVENTO = ["Deslizamiento", "Inundación", "Incendio", "Vendaval", "Sismo", "Otro"];
const ESTADOS_EVENTO = ["Activo", "Controlado", "En evolución"];
const CAUSAS_PROBABLES = ["Antrópica", "Natural", "Mixta"];

export function RegistrarEventoDialog() {
    const [step, setStep] = useState(1);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        entidad_reporta: "",
        tipo_evento: "",
        fecha_hora: new Date().toISOString().slice(0, 16),
        direccion: "",
        lat: 4.8133,
        lon: -75.6961,
        comuna: "",
        barrio: "",
        estado_evento: "",
        causa_probable: "",
        descripcion: "",
        viv_afectadas: 0,
        flia_afectadas: 0,
        ad_afectados: 0,
        men_afectados: 0,
        lesionados: 0,
        fallecidos: 0
    });

    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced Geocoding Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!formData.direccion && !formData.barrio && !formData.comuna) return;
            
            setIsGeocoding(true);
            try {
                const result = await geocodePereira(
                    formData.direccion, 
                    formData.barrio, 
                    formData.comuna
                );
                
                if (result) {
                    setFormData(prev => ({
                        ...prev,
                        lat: Number(result.lat.toFixed(6)),
                        lon: Number(result.lon.toFixed(6))
                    }));
                }
            } catch (error) {
                console.error("Geocoding failed:", error);
            } finally {
                setIsGeocoding(false);
            }
        }, 1200); // 1.2s debounce

        return () => clearTimeout(timer);
    }, [formData.direccion, formData.barrio, formData.comuna]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/diger/reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                // Notificar éxito (Podríamos usar un toast aquí)
                alert(`¡Reporte #${result.id} registrado exitosamente!`);
                setOpen(false);
                setStep(1);
                // Reset form
                setFormData({
                    entidad_reporta: "",
                    tipo_evento: "",
                    fecha_hora: new Date().toISOString().slice(0, 16),
                    direccion: "",
                    lat: 4.8133,
                    lon: -75.6961,
                    comuna: "",
                    barrio: "",
                    estado_evento: "",
                    causa_probable: "",
                    descripcion: "",
                    viv_afectadas: 0,
                    flia_afectadas: 0,
                    ad_afectados: 0,
                    men_afectados: 0,
                    lesionados: 0,
                    fallecidos: 0
                });
            } else {
                alert(`Error al guardar: ${result.error}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Error crítico al conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button 
                        className="bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:shadow-xl transition-all gap-2 px-4 py-2 rounded-xl border border-primary/20"
                    />
                }
            >
                <PlusCircle className="w-4 h-4" />
                Registrar Evento
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
                <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
                    <DialogTitle className="text-xl font-outfit font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Registro de Emergencia DIGER
                    </DialogTitle>
                    <DialogDescription className="font-inter text-xs">
                        Formulario oficial de reporte para la gestión del riesgo - Pereira
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Stepper indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                                    step >= s ? "bg-primary" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="entidad_reporta" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quién Diligencia</Label>
                                    <Select onValueChange={(v) => handleSelectChange('entidad_reporta', v)} value={formData.entidad_reporta}>
                                        <SelectTrigger className="rounded-xl bg-accent/20">
                                            <SelectValue placeholder="Seleccione Entidad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ENTIDADES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tipo_evento" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Evento</Label>
                                    <Select onValueChange={(v) => handleSelectChange('tipo_evento', v)} value={formData.tipo_evento}>
                                        <SelectTrigger className="rounded-xl bg-accent/20">
                                            <SelectValue placeholder="Seleccione Evento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_EVENTO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fecha_hora" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Fecha y Hora Exacta
                                </Label>
                                <Input 
                                    type="datetime-local" 
                                    name="fecha_hora" 
                                    className="rounded-xl bg-accent/20"
                                    value={formData.fecha_hora}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descripcion" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción General</Label>
                                <Textarea 
                                    name="descripcion"
                                    placeholder="Detalle la emergencia..."
                                    className="rounded-xl bg-accent/20 min-h-[100px]"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Dirección o Referencia
                                </Label>
                                <Input 
                                    name="direccion"
                                    placeholder="Ej: Carrera 10 # 14-20"
                                    className="rounded-xl bg-accent/20"
                                    value={formData.direccion}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="comuna" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comuna/Correg</Label>
                                    <Input 
                                        name="comuna"
                                        placeholder="Ej: Cuba"
                                        className="rounded-xl bg-accent/20"
                                        value={formData.comuna}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barrio" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Barrio/Vereda</Label>
                                    <Input 
                                        name="barrio"
                                        placeholder="Ej: Futuro Bajo"
                                        className="rounded-xl bg-accent/20"
                                        value={formData.barrio}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 relative">
                                {isGeocoding && (
                                    <div className="absolute -top-1 left-0 right-0 flex items-center justify-center gap-2 text-[10px] text-primary animate-pulse bg-background/50 z-10 py-1 rounded-md">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Georeferenciando punto...</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="lat" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Latitud</Label>
                                    <Input 
                                        type="number" step="0.000001" name="lat"
                                        className={cn("rounded-xl bg-accent/20 h-8 text-xs transition-colors", isGeocoding && "border-primary/50")}
                                        value={formData.lat}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lon" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Longitud</Label>
                                    <Input 
                                        type="number" step="0.000001" name="lon"
                                        className={cn("rounded-xl bg-accent/20 h-8 text-xs transition-colors", isGeocoding && "border-primary/50")}
                                        value={formData.lon}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estado_evento" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado del Evento</Label>
                                    <Select onValueChange={(v) => handleSelectChange('estado_evento', v)} value={formData.estado_evento}>
                                        <SelectTrigger className="rounded-xl bg-accent/20">
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ESTADOS_EVENTO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="causa_probable" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Causa Probable</Label>
                                    <Select onValueChange={(v) => handleSelectChange('causa_probable', v)} value={formData.causa_probable}>
                                        <SelectTrigger className="rounded-xl bg-accent/20">
                                            <SelectValue placeholder="Causa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CAUSAS_PROBABLES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-4 mb-4">
                                <Users className="w-8 h-8 text-primary/40" />
                                <div>
                                    <h4 className="text-sm font-bold text-primary">Censo de Afectación</h4>
                                    <p className="text-[10px] text-muted-foreground">Registre las cifras estimadas de impacto</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="viv_afectadas" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Viviendas</Label>
                                    <Input type="number" name="viv_afectadas" className="rounded-xl h-9" value={formData.viv_afectadas} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="flia_afectadas" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Familias</Label>
                                    <Input type="number" name="flia_afectadas" className="rounded-xl h-9" value={formData.flia_afectadas} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ad_afectados" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adultos</Label>
                                    <Input type="number" name="ad_afectados" className="rounded-xl h-9" value={formData.ad_afectados} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="men_afectados" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Menores</Label>
                                    <Input type="number" name="men_afectados" className="rounded-xl h-9" value={formData.men_afectados} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lesionados" className="text-[10px] font-bold uppercase tracking-widest text-red-500/80">Lesionados</Label>
                                    <Input type="number" name="lesionados" className="rounded-xl h-9 border-red-500/20" value={formData.lesionados} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="fallecidos" className="text-[10px] font-bold uppercase tracking-widest text-red-600 font-black">Fallecidos</Label>
                                    <Input type="number" name="fallecidos" className="rounded-xl h-9 border-red-600/30" value={formData.fallecidos} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-6 border-t border-border/50 gap-2 flex-col sm:flex-row">
                        {step > 1 && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl border-zinc-200"
                                onClick={prevStep}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                            </Button>
                        )}
                        
                        {step < 3 ? (
                            <Button 
                                type="button" 
                                className="flex-1 rounded-xl"
                                onClick={nextStep}
                                disabled={step === 1 && (!formData.tipo_evento || !formData.entidad_reporta)}
                            >
                                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button 
                                type="submit" 
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Finalizar Reporte
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
