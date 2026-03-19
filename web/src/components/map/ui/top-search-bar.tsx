import { Search, Map as MapIcon, Compass, Crosshair, Shield } from 'lucide-react';

export function TopSearchBar() {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
            <div className="siata-glass rounded-full h-12 flex items-center px-4 border border-white/10 shadow-2xl">
                {/* Brand */}
                <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-outfit font-bold text-sm text-white tracking-tight hidden sm:block">RiesGeoPereira</span>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar ubicación, estación o evento..."
                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-muted-foreground/60 w-full font-inter"
                    />
                </div>

                <div className="flex items-center gap-1 h-full py-2">
                    <div className="w-[1px] h-full bg-white/10 mx-1" />

                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white" title="Mi ubicación">
                        <Crosshair className="w-5 h-5" />
                    </button>

                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white" title="Tipo de mapa">
                        <MapIcon className="w-5 h-5" />
                    </button>

                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white" title="Norte">
                        <Compass className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
