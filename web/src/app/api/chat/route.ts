import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres el "Director de Simulacro GRD" (Gestión del Riesgo de Desastres) del Observatorio de RiesGeoPereira.
Tu objetivo es guiar al usuario a través de simulaciones de emergencias reales para enseñarles sobre toma de decisiones, prevención y reacción.

Instrucciones:
1. Comienza saludando al usuario y preséntale 3 opciones de escenarios de riesgo típicos en la región andina colombiana (ej. Inundación súbita, Deslizamiento de tierra, Sismo).
2. Cuando el usuario elija un escenario, descríbelo detalladamente pero con urgencia. Dales parámetros de clima, hora y situación de la comunidad.
3. Luego, presenta un dilema o punto de decisión con 2 o 3 opciones claras.
4. Evalúa la opción que elija el usuario basándote en los principios de Gestión del Riesgo (prioridad a la vida, rutas de evacuación, calma). Si se equivocan, explícales por qué de manera educativa.
5. Continúa la simulación con 2 o 3 turnos más antes de dar una conclusión y un "Puntaje de Sobrevivencia y Liderazgo".
6. Mantén tus respuestas concisas (máximo 3-4 párrafos) y usa un tono profesional pero inmersivo.
`;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const contextualPrompt = context 
      ? `${SYSTEM_PROMPT}\n\nCONTEXTO ACTUAL DEL ENTORNO:\n${JSON.stringify(context, null, 2)}\n\nUsa este contexto para personalizar el inicio y los eventos de la simulación. El puntaje final debe valorar el conocimiento técnico (normativo) y la capacidad de liderazgo creativo.`
      : SYSTEM_PROMPT;

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: contextualPrompt,
      messages: messages,
      onFinish: (result) => {
        console.log("Chat Stream Finished:", {
          text: result.text.substring(0, 100) + "...",
          usage: result.usage,
          finishReason: result.finishReason
        });
      },
      onError: (err) => {
        console.error("Chat Stream Error:", err);
      }
    });

    const keys = Object.keys(result);
    // Also try to get prototype keys if it's a class instance
    let protoKeys: string[] = [];
    if (result && typeof result === 'object') {
      const proto = Object.getPrototypeOf(result);
      if (proto) {
        protoKeys = Object.getOwnPropertyNames(proto);
      }
    }
    console.log("STREAMTEXT RESULT TYPE:", typeof result, "CONSTRUCTOR:", result?.constructor?.name);
    console.log("STREAMTEXT RESULT KEYS:", keys);
    console.log("STREAMTEXT RESULT PROTO KEYS:", protoKeys);

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("AI Chat Error Detail:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(JSON.stringify({ 
      error: "Failed to process chat",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
