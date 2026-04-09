'use client';

import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogPanel 
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
import { MapPin, Camera, Save, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NuevoRegistroDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    coords?: { lat: number; lng: number };
    onSelectOnMap: () => void;
    isSelectingOnMap: boolean;
}

interface FormData {
    entidad: string;
    tipo_evento: string;
    descripcion: string;
    gravedad: string;
    clasificacion: string;
    id_registro: string;
    fecha: string;
}

export function NuevoRegistroDialog({ 
    isOpen, 
    onClose, 
    onSubmit, 
    coords, 
    onSelectOnMap,
    isSelectingOnMap
}: NuevoRegistroDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        entidad: 'DIGER',
        tipo_evento: 'Deslizamiento',
        descripcion: '',
        gravedad: 'Media',
        clasificacion: 'Actividad',
        id_registro: `REG-${Math.floor(Math.random() * 10000)}`,
        fecha: new Date().toISOString().split('T')[0]
    });

    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 2);
            setFiles(newFiles);
        }
    };

    const handleSave = () => {
        onSubmit({
            ...formData,
            coordenadas: coords,
            fotos: files
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-[#0F172A] border-white/10 text-white shadow-2xl overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        Nuevo Registro de Evento
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Ingresa la información técnica del evento para el observatorio de Gestión del Riesgo.
                    </DialogDescription>
                </DialogHeader>

                <DialogPanel className="p-6 space-y-6 siata-scrollbar max-h-[70vh] overflow-y-auto">
                    {/* Header Info Icons */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">ID Registro</Label>
                            <Input 
                                value={formData.id_registro} 
                                readOnly 
                                className="bg-white/5 border-white/10 text-white/90 font-mono text-xs focus:ring-red-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fecha del Evento</Label>
                            <Input 
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                                className="bg-white/5 border-white/10 text-white focus:ring-red-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Entidad Responsable</Label>
                            <Select 
                                value={formData.entidad} 
                                onValueChange={(val) => { if(val) setFormData({...formData, entidad: val}) }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-red-500/50">
                                    <SelectValue placeholder="Selecciona entidad" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-white/10 text-white">
                                    <SelectItem value="DIGER">DIGER (Pereira)</SelectItem>
                                    <SelectItem value="Bomberos">Bomberos Oficiales</SelectItem>
                                    <SelectItem value="CARDER">CARDER</SelectItem>
                                    <SelectItem value="Cruz Roja">Cruz Roja</SelectItem>
                                    <SelectItem value="SAIA">SAIA / Alcaldía</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tipo de Amenaza</Label>
                            <Select 
                                value={formData.tipo_evento} 
                                onValueChange={(val) => { if(val) setFormData({...formData, tipo_evento: val}) }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-red-500/50">
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-white/10 text-white">
                                    <SelectItem value="Deslizamiento">Deslizamiento (Mov. Masa)</SelectItem>
                                    <SelectItem value="Inundación">Inundación / Crecida</SelectItem>
                                    <SelectItem value="Incendio">Incendio Forestal</SelectItem>
                                    <SelectItem value="Vendaval">Vendaval / Vientos</SelectItem>
                                    <SelectItem value="Sismo">Daño por Sismo</SelectItem>
                                    <SelectItem value="Otro">Otro Evento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Georreferenciación Section */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Georreferenciación</Label>
                            {coords ? (
                                <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-bold">✓ Ubicación Capturada</span>
                            ) : (
                                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-bold">Pendiente</span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] text-white/30 uppercase">Latitud</Label>
                                <div className="text-sm font-mono text-white/90 bg-black/20 p-2 rounded-lg border border-white/5">
                                    {coords?.lat.toFixed(6) || '0.000000'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] text-white/30 uppercase">Longitud</Label>
                                <div className="text-sm font-mono text-white/90 bg-black/20 p-2 rounded-lg border border-white/5">
                                    {coords?.lng.toFixed(6) || '0.000000'}
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="button"
                            onClick={onSelectOnMap}
                            variant="secondary"
                            className={cn(
                                "w-full gap-2 rounded-xl transition-all duration-300",
                                isSelectingOnMap ? "bg-amber-500 text-white animate-pulse" : "bg-white/10 text-white hover:bg-white/20"
                            )}
                        >
                            <MapPin className="w-4 h-4" />
                            {isSelectingOnMap ? "Haz clic en el mapa para marcar..." : "Ubicar en el Mapa"}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Observaciones y Detalles</Label>
                        <Textarea 
                            placeholder="Describe el evento, afectaciones y acciones inmediatas..."
                            value={formData.descripcion}
                            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                            className="bg-white/5 border-white/10 text-white min-h-[100px] rounded-xl focus:ring-red-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Gravedad</Label>
                            <Select 
                                value={formData.gravedad} 
                                onValueChange={(val) => { if(val) setFormData({...formData, gravedad: val}) }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-white/10 text-white">
                                    <SelectItem value="Baja">Baja</SelectItem>
                                    <SelectItem value="Media">Media</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Critica">Crítica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Clasificación de Acción</Label>
                            <Select 
                                value={formData.clasificacion} 
                                onValueChange={(val) => { if(val) setFormData({...formData, clasificacion: val}) }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-white/10 text-white">
                                    <SelectItem value="Actividad">Actividad Realizada</SelectItem>
                                    <SelectItem value="Visita">Visita Técnica</SelectItem>
                                    <SelectItem value="Mitigado">Riesgo Mitigado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Evidencia Fotográfica (Max 2)</Label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <Camera className="w-8 h-8 text-white/20 group-hover:text-red-400 transition-colors mb-2" />
                                <span className="text-[10px] text-white/40">Subir fotos del sitio</span>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                            {files.length > 0 && (
                                <div className="flex gap-2">
                                    {Array.from(files).map((f, i) => (
                                        <div key={i} className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center relative border border-white/10">
                                            <div className="text-[10px] text-white/50 truncate w-12 text-center">{f.name}</div>
                                            <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white">
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogPanel>

                <DialogFooter className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl px-6"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold gap-2 shadow-lg shadow-red-500/20"
                    >
                        <Save className="w-4 h-4" />
                        Guardar Registro en InfoGis
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
