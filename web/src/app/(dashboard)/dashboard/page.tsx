import MapCanvas from "@/components/map/map-canvas";
import { DashboardNav } from "@/components/layout/header/components/dashboard-nav";
import { RegistrarEventoDialog } from "@/components/dashboard/registrar-evento-dialog";
import { Facebook, Instagram, Youtube, Twitter, Mail, Search } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
    return (
        <div className="w-full h-full p-4 md:p-6 flex flex-col space-y-4">
            <header className="flex flex-col xl:flex-row justify-between items-center gap-4 pb-4 border-b border-border/50">
                {/* Left Section: Title and Nav */}
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-outfit font-semibold tracking-tight hidden lg:block">Mapa Interactivo</h1>
                    <DashboardNav />
                </div>
                
                {/* Right Section: SIATA-style Social & Logos Bar + Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    
                    {/* Search Bar (Optional addition inspired by SIATA) */}
                    <div className="hidden lg:flex items-center bg-white border border-border/40 rounded-full px-4 py-1.5 shadow-sm overflow-hidden">
                        <input type="text" placeholder="Buscar ubicación..." className="bg-transparent border-none outline-none text-sm w-32 xl:w-48 placeholder:text-muted-foreground" />
                        <Search className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* SIATA-like Dark Pill for Social & Logos */}
                    <div className="flex items-center bg-[#0B162C] text-white rounded-r-3xl rounded-l-full shadow-md overflow-hidden border border-[#1A2A47]">
                        
                        {/* Social Icons */}
                        <div className="flex items-center gap-3 px-5 py-2">
                            <a href="#" className="hover:text-blue-400 transition-colors"><Facebook className="w-4 h-4" /></a>
                            <a href="#" className="hover:text-pink-400 transition-colors"><Instagram className="w-4 h-4" /></a>
                            <a href="#" className="hover:text-red-500 transition-colors"><Youtube className="w-4 h-4" /></a>
                            <a href="#" className="hover:text-blue-300 transition-colors"><Twitter className="w-4 h-4" /></a>
                            <a href="#" className="hover:text-gray-300 transition-colors"><Mail className="w-4 h-4" /></a>
                        </div>

                        <div className="w-[1px] h-6 bg-white/20"></div>

                        {/* Official Logos Placeholders */}
                        <div className="flex items-center gap-4 px-5 py-2 bg-[#122240] h-full">
                            {/* DIGER Logo Text Version Placeholder */}
                            <div className="flex flex-col items-center justify-center">
                                <span className="font-outfit font-bold text-[10px] tracking-widest text-primary-foreground/90">DIGER</span>
                                <span className="font-outfit text-[8px] text-primary-foreground/60 uppercase">Pereira</span>
                            </div>
                            
                            {/* Generic Emblem Placeholder */}
                            <div className="flex flex-col items-center justify-center border-l border-white/10 pl-4">
                                <span className="font-serif italic text-[11px] font-semibold text-white">RiesGeo</span>
                                <span className="font-inter text-[8px] text-white/70">Observatorio</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <RegistrarEventoDialog />

                    <div className="text-sm font-inter font-medium text-success px-3 py-1 bg-success/10 border border-success/20 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="hidden sm:inline">En Vivo</span>
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
