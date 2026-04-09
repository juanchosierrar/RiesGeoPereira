"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Waves, Mountain, Wind, CloudRain, Flame, CircleSlash,
  Activity, AlertTriangle, Twitter, Instagram, Facebook,
  TrendingUp, MessageSquare, RefreshCw, Share2
} from "lucide-react";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { SocialEventsChart } from "@/components/analytics/social-events-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSocialPosts,
  getAnalyticsStats,
  type SocialPost,
  type AnalyticsStats,
} from "@/lib/social-service";

const DISASTER_CONFIG = {
  flood:       { icon: Waves,         color: "text-blue-500",   label: "Inundación" },
  landslide:   { icon: Mountain,      color: "text-amber-600",  label: "Deslizamiento" },
  forestFire:  { icon: Flame,         color: "text-red-500",    label: "Incendio Forestal" },
  storm:       { icon: CloudRain,     color: "text-indigo-500", label: "Tormenta" },
  haze:        { icon: Wind,          color: "text-gray-400",   label: "Neblina" },
  earthquake:  { icon: Activity,      color: "text-orange-500", label: "Sismo" },
  other:       { icon: CircleSlash,   color: "text-zinc-400",   label: "Otro" },
} as const;

const SENTIMENT_COLORS = {
  Urgent:        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  Warning:       "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Informational: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
};

const SENTIMENT_LABELS: Record<string, string> = {
  urgent: "Urgente", warning: "Alerta", informational: "Informativo",
};

const PLATFORM_ICONS = {
  twitter:   <Twitter className="w-3.5 h-3.5 text-sky-500" />,
  instagram: <Instagram className="w-3.5 h-3.5 text-pink-500" />,
  facebook:  <Facebook className="w-3.5 h-3.5 text-blue-600" />,
};

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  return `Hace ${Math.floor(diff / 3600)} h`;
}

export default function AnaliticasRedesSocialesPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function loadData() {
    setLoading(true);
    const [p, s] = await Promise.all([getSocialPosts(), getAnalyticsStats()]);
    setPosts(p);
    setStats(s);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const trendData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const found = stats?.monthly_events?.find(e => e._id.month === i + 1);
      return { name, value: found?.total_events ?? 0 };
    });
  }, [stats]);

  const typeData = useMemo(() =>
    (stats?.type_counts ?? []).map(t => ({
      name: DISASTER_CONFIG[t.type as keyof typeof DISASTER_CONFIG]?.label ?? t.type,
      value: t.frequency,
    })), [stats]);

  const sentimentData = useMemo(() =>
    (stats?.sentiment_counts ?? []).map(s => ({
      name: SENTIMENT_LABELS[s.label.toLowerCase()] ?? s.label,
      value: s.frequency,
    })), [stats]);

  const totalPosts = useMemo(
    () => stats?.type_counts?.reduce((s, t) => s + t.frequency, 0) ?? 0, [stats]
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Header skeleton */}
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          {/* Cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Analítica Redes Sociales
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Monitoreo de eventos de riesgo en Pereira · Actualizado {lastUpdated.toLocaleTimeString("es-CO")}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard label="Total Reportes" value={totalPosts.toString()} icon={MessageSquare} iconColor="text-indigo-500" />
          <MetricsCard label="Urgentes" value={(stats?.sentiment_counts?.find(s => s.label === "Urgent")?.frequency ?? 0).toString()} icon={AlertTriangle} iconColor="text-red-500" />
          <MetricsCard label="Inundaciones" value={(stats?.type_counts?.find(t => t.type === "flood")?.frequency ?? 0).toString()} icon={Waves} iconColor="text-blue-500" />
          <MetricsCard label="Deslizamientos" value={(stats?.type_counts?.find(t => t.type === "landslide")?.frequency ?? 0).toString()} icon={Mountain} iconColor="text-amber-600" />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SocialEventsChart title="Tendencia Mensual de Reportes (2026)" data={trendData} type="area" color="#6366f1" />
          <SocialEventsChart title="Reportes por Tipo de Evento" data={typeData} type="bar" color="#3b82f6" />
          <SocialEventsChart title="Distribución por Sentimiento" data={sentimentData} type="bar" color="#f59e0b" />

          {/* Trending topics */}
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Tendencias · Palabras Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {(stats?.trending_topics ?? []).map((t, i) => (
                <div key={t.keyword} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 relative h-7 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/30 to-indigo-500/10 rounded-md transition-all duration-700"
                      style={{ width: `${(t.frequency / 100) * 100}%` }}
                    />
                    <span className="relative z-10 px-3 text-xs font-medium flex items-center h-full">
                      #{t.keyword}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">{t.frequency}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Live Feed ── */}
        <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Feed en Tiempo Real · Pereira
              </CardTitle>
              <span className="text-xs text-zinc-400">{posts.length} reportes recientes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {posts.map(post => {
              const cfg = DISASTER_CONFIG[post.category as keyof typeof DISASTER_CONFIG];
              const Icon = cfg?.icon ?? CircleSlash;
              const sentimentKey = post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1) as keyof typeof SENTIMENT_COLORS;
              return (
                <div
                  key={post.id}
                  className="flex gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:shadow-sm transition-shadow"
                >
                  <div className={`mt-0.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg?.color ?? "text-zinc-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {PLATFORM_ICONS[post.platform]}
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{post.author}</span>
                      {post.location && (
                        <span className="text-xs text-zinc-400 truncate">· {post.location.name}</span>
                      )}
                      <span className="ml-auto text-xs text-zinc-400 shrink-0">{timeAgo(post.timestamp)}</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-snug">{post.text}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${SENTIMENT_COLORS[sentimentKey] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {SENTIMENT_LABELS[post.sentiment] ?? post.sentiment}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
