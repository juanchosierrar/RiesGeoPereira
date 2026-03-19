"use client";

import { AlertTriangle, Droplets, Flame, Wind, Activity, Mountain } from "lucide-react";
import { MOCK_EVENTOS, GRAVEDAD_COLORS, ESTADO_LABELS } from "@/lib/mock-data";

const ICON_MAP: Record<string, React.ElementType> = {
    Deslizamiento: Mountain,
    Inundación: Droplets,
    Incendio: Flame,
    Vendaval: Wind,
    Sismo: Activity,
    Otro: AlertTriangle,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

export default function EventTimeline() {
    const sorted = [...MOCK_EVENTOS].sort(
        (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
    );

    return (
        <div className="space-y-3">
            {sorted.map((evt, i) => {
                const Icon = ICON_MAP[evt.tipo_evento] || AlertTriangle;
                const color = GRAVEDAD_COLORS[evt.gravedad];
                const isLast = i === sorted.length - 1;

                return (
                    <div key={evt.id} className="flex items-start gap-3 pb-3 border-b border-border/30 last:border-0 relative">
                        {/* Connector line */}
                        {!isLast && (
                            <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-border/50" />
                        )}

                        {/* Icon */}
                        <div
                            className="p-2 rounded-full border z-10 flex-shrink-0"
                            style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-outfit font-medium text-foreground truncate">
                                    {evt.tipo_evento}
                                </p>
                                <span
                                    className="text-[9px] font-inter font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                                    style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
                                >
                                    {evt.gravedad}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {evt.barrio} — {evt.descripcion}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                                    {timeAgo(evt.fecha_hora)}
                                </span>
                                <span className="text-[10px] text-muted-foreground/80">
                                    {ESTADO_LABELS[evt.estado_flujo]}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
