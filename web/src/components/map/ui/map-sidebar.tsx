import React from 'react';
import {
    Layers,
    CloudRain,
    Activity,
    Thermometer,
    Shield,
    Info,
    Settings,
    AlertTriangle,
    Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface MapSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const SIDEBAR_ITEMS = [
    { id: 'risk', icon: AlertTriangle, label: 'Riesgos', color: 'text-red-500', href: '/dashboard' },
    { id: 'seismic', icon: Activity, label: 'Sismos', color: 'text-purple-500', href: '/dashboard' },
    { id: 'weather', icon: CloudRain, label: 'Clima', color: 'text-blue-500', href: '/dashboard' },
    { id: 'monitoring', icon: Shield, label: 'Monitoreo', color: 'text-emerald-500', href: '/dashboard' },
    { id: 'layers', icon: Layers, label: 'Capas', color: 'text-amber-500', href: '/dashboard' },
    { id: 'inbox', icon: AlertTriangle, label: 'Incidentes', color: 'text-rose-400', href: '/dashboard/inbox' },
    { id: 'analytics', icon: Activity, label: 'Analíticas', color: 'text-cyan-400', href: '/dashboard' },
    { id: 'social', icon: Share2, label: 'Redes', color: 'text-sky-400', href: '/dashboard' },
];

export function MapSidebar({ activeSection, onSectionChange }: MapSidebarProps) {
    const pathname = usePathname();
    return (
        <div className="absolute left-0 top-0 bottom-0 w-16 siata-glass flex flex-col items-center py-4 z-50 border-r border-white/10">
            <div className="flex-1 w-full space-y-1">
                {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isPageActive = pathname === item.href;
                    const isSectionActive = activeSection === item.id && pathname === '/dashboard';
                    const isActive = isPageActive || isSectionActive;

                    const content = (
                        <>
                            <Icon className={cn(
                                "w-5 h-5 transition-transform group-hover:scale-110",
                                isActive ? "text-white" : item.color
                            )} />
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                isActive ? "text-white" : "text-muted-foreground"
                            )}>
                                {item.label}
                            </span>
                        </>
                    );

                    if (item.href !== pathname) {
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    "siata-sidebar-item group",
                                    isActive ? "active" : "inactive"
                                )}
                                onClick={() => {
                                    if (item.href === '/dashboard') {
                                        onSectionChange(item.id);
                                    }
                                }}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={cn(
                                "siata-sidebar-item group",
                                isActive ? "active" : "inactive"
                            )}
                            title={item.label}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto w-full space-y-1">
                <button className="siata-sidebar-item opacity-60 hover:opacity-100">
                    <Info className="w-5 h-5 text-white" />
                </button>
                <button className="siata-sidebar-item opacity-60 hover:opacity-100">
                    <Settings className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
}
