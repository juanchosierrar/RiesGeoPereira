import MapCanvas from "@/components/map/map-canvas";
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";
import { RegistrarEventoDialog } from "@/components/dashboard/registrar-evento-dialog";

export default function DashboardPage() {
    return (
        <div className="w-full h-full p-4 md:p-6 flex flex-col space-y-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                <h1 className="text-2xl font-outfit font-semibold tracking-tight text-center md:text-left">Mapa Interactivo y Monitoreo</h1>
                
                <DashboardNav />
                
                <div className="flex items-center gap-3">
                    <RegistrarEventoDialog />

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
