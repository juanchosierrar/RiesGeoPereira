"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, RefreshCcw, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchSismosHistoricos, fetchVolcanes, PEREIRA_BBOX } from "@/lib/sgc-service";

interface EnvContext {
  clima: unknown;
  sismosRecientes: Array<{
    magnitud: number | string;
    ubicacion: string;
    fecha: string;
  }>;
  volcanesCercanos: Array<{
    nombre: string;
    estado: string;
    distancia?: string;
  }>;
}

interface LocalMessage {
  id: string;
  role: string;
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
}

export function SimulationChat() {
  const [envContext, setEnvContext] = useState<EnvContext | null>(null);
  const [input, setInput] = useState("");


  useEffect(() => {
    async function loadContext() {
      try {
        const [weatherRes, sismos, volcanes] = await Promise.all([
          fetch("/api/meteo/actual").then(res => res.ok ? res.json() : null),
          fetchSismosHistoricos({ bbox: PEREIRA_BBOX, maxRecords: 5 }),
          fetchVolcanes()
        ]);

        setEnvContext({
          clima: weatherRes,
          sismosRecientes: sismos.map(s => ({
            magnitud: s.attributes.Mw,
            ubicacion: s.attributes.Field9,
            fecha: new Date(s.attributes.Fecha).toLocaleString()
          })),
          volcanesCercanos: (volcanes.features || []).slice(0, 3).map((v: any) => ({
            nombre: v.properties.nombre || "Desconocido",
            estado: v.properties.estado || "Activo/Estable",
          }))
        });
      } catch (err) {
        console.warn("Failed to load environment context for simulation", err);
      }
    }
    loadContext();
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    api: "/api/chat",
    body: { context: envContext },
    initialMessages: [
      {
        id: "intro",
        role: "assistant",
        content: "¡Hola! Soy el Director de Simulacro del Observatorio GRD. Estoy aquí para poner a prueba tus capacidades de decisión en situaciones de emergencia reales de nuestra región.\n\nPara empezar, por favor elige a qué escenario te gustaría enfrentarte:\n1. 🌊 **Inundación Súbita** en zona ribereña.\n2. ⛰️ **Deslizamiento de Tierra** por fuertes lluvias.\n3. 💥 **Sismo Fuerte** durante horario laboral.",
      }
    ]
  } as any);

  const isLoading = (status as string) === 'loading' || (status as string) === 'streaming';

  // Ensure initial messages are set if empty (insurance for hydration)
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "intro",
          role: "assistant",
          content: "¡Hola! Soy el Director de Simulacro del Observatorio GRD. Estoy aquí para poner a prueba tus capacidades de decisión en situaciones de emergencia reales de nuestra región.\n\nPara empezar, por favor elige a qué escenario te gustaría enfrentarte:\n1. 🌊 **Inundación Súbita** en zona ribereña.\n2. ⛰️ **Deslizamiento de Tierra** por fuertes lluvias.\n3. 💥 **Sismo Fuerte** durante horario laboral.",
        }
      ] as any);
    }
  }, [messages.length, setMessages]);

  // Debugging
  useEffect(() => {
    console.log("Current messages in SimulationChat:", messages);
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const onCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (sendMessage) {
        sendMessage({ text: input });
      }
      setInput("");
    }
  };


  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReset = () => {
    setMessages([
      {
        id: "intro",
        role: "assistant",
        content: "¡Simulacro reiniciado! Soy el Director de Simulacro del Observatorio GRD.\n\nPara empezar, por favor elige a qué escenario te gustaría enfrentarte:\n1. 🌊 **Inundación Súbita** en zona ribereña.\n2. ⛰️ **Deslizamiento de Tierra** por fuertes lluvias.\n3. 💥 **Sismo Fuerte** durante horario laboral.",
      }
    ] as any);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto border-border bg-card shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-foreground">Simulador de Emergencias GRD</h3>
            <p className="text-xs text-muted-foreground font-inter">Potenciado por IA (Gemini)</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="h-8 gap-2"
          disabled={isLoading || messages.length <= 1}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reiniciar Simulacro</span>
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground italic">
            No hay mensajes para mostrar.
          </div>
        )}
        {messages?.map((m: any) => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div 
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm font-inter leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted/50 text-foreground border border-border/50 rounded-tl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {m.content}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 w-20 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-transparent border-t border-border">
        <form onSubmit={onCustomSubmit} className="relative flex items-center w-full">

          <input
            value={input}
            onChange={handleInputChange}

            placeholder="Escribe tu decisión o respuesta aquí..."
            className="w-full pl-5 pr-14 py-4 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-sm font-inter transition-all shadow-sm"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || !input.trim()} 
            className="absolute right-2 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4 text-primary-foreground ml-0.5" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-3 font-inter">
          Las simulaciones son generadas por IA y pueden contener inexactitudes. Sigue siempre los protocolos oficiales de tu entidad.
        </p>
      </div>
    </Card>
  );
}
