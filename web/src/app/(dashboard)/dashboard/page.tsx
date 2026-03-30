'use client';
import dynamic from 'next/dynamic';
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";
import { Plus } from 'lucide-react';

// Dynamic import to prevent maplibre-gl SSR compilation hang
const MapCanvas = dynamic(() => import("@/components/map/map-canvas"), {
    ssr: false,
    loading: () => (
        <div className="flex-1 w-full rounded-xl overflow-hidden shadow-lg border border-border bg-muted/20 flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground font-inter">Cargando mapa interactivo...</p>
            </div>
        </div>
    ),
});

export default function DashboardPage() {
    return (
        <div className="w-full h-full p-4 md:p-6 flex flex-col space-y-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <h1 className="text-2xl font-outfit font-semibold tracking-tight text-center md:text-left">Mapa Interactivo y Monitoreo</h1>
                
                <DashboardNav />

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-nuevo-registro'))}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-bold uppercase tracking-tight whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        Nuevo Registro
                    </button>

                    <div className="text-sm font-inter font-medium text-success px-3 py-1 bg-success/10 border border-success/20 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        En Vivo
                    </div>
                </div>
            </header>

            {/* MapLibre Canvas Container */}
            <div className="flex-1 w-full relative">
                <MapCanvas />
            </div>
        </div>
    );
}
