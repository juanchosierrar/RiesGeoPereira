"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Map as MapIcon, BarChart3, Eye, AlertTriangle } from "lucide-react";

/**
 * Navigation items for the dashboard.
 * Each item has a name, href, and icon.
 */
const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Mapa", href: "/dashboard", icon: MapIcon },
    { name: "Analíticas", href: "/dashboard/analiticas", icon: BarChart3 },
    { name: "Observatorio", href: "/dashboard/observatorio", icon: Eye },
    { name: "Incidentes", href: "/dashboard/inbox", icon: AlertTriangle },
];

/**
 * DashboardNav component.
 * Renders a horizontal navigation bar with links to different dashboard sections.
 * Highlights the active link based on the current pathname.
 */
export function DashboardNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1 md:gap-1.5 bg-muted/30 p-1 md:p-1.5 rounded-xl border border-border/40 shadow-sm transition-all duration-300 overflow-x-auto no-scrollbar max-w-[90vw] md:max-w-none">
            {navItems.map((item) => {
                // Check if the current pathname matches the item href.
                const isActive = item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href);
                
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-2 px-2.5 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden whitespace-nowrap",
                            isActive 
                                ? "bg-white dark:bg-slate-900 text-primary shadow-sm border border-border/50 translate-y-[-0.5px]" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        {/* Subtle background glow for active item */}
                        {isActive && (
                            <div className="absolute inset-0 bg-primary/5 blur-md" />
                        )}
                        
                        <item.icon className={cn(
                            "w-4 h-4 transition-transform duration-300 group-hover:scale-110", 
                            isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        
                        <span className="relative z-10">{item.name}</span>
                        
                        {/* Active indicator dot */}
                        {isActive && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/20" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
