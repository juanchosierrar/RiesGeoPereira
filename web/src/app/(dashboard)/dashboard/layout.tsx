"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Inbox, BarChart3, Shield, LogOut } from "lucide-react";
import { logout } from "@/lib/insforge/auth";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Mapa Interactivo", icon: Map },
    { href: "/dashboard/inbox", label: "Inbox Incidentes", icon: Inbox },
    { href: "/dashboard/analiticas", label: "Analíticas Geo", icon: BarChart3 },
    { href: "/dashboard/observatorio", label: "Observatorio GRD", icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
            {/* Main Content */}
            <main className="flex-1 h-full relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
