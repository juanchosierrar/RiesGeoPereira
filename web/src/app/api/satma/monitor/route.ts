import { NextResponse } from 'next/server';

/**
 * SATMA Monitor — scrapes satma.co pages and detects when
 * real bulletin/alert content appears beyond the construction boilerplate.
 *
 * Strategy:
 *  1. Fetch raw HTML (static shell from next.js SSR)
 *  2. Strip all boilerplate markers precisely
 *  3. Look for SPECIFIC bulletin structures (dates, IDs, amounts)
 *  4. Return structured result usable by the UI widget
 */

const SATMA_PAGES = [
    { name: 'Boletines', url: 'https://satma.co/bulletins' },
    { name: 'Inicio', url: 'https://satma.co/' },
    { name: 'Dashboards', url: 'https://satma.co/dashboards' },
];

// Exact boilerplate phrases that appear in EVERY page (even empty ones)
const BOILERPLATE = [
    'sitio en desarrollo',
    'proceso de actualización',
    'no representa la versión final',
    'cargando boletines',
    'este sitio web se encuentra',
    'financiado por la carder',
];

// Strong signals that REAL content has been published
const REAL_CONTENT_PATTERNS = [
    /boletin[- ]?\d{2,}/i,           // "Boletin-01", "boletin 23"
    /\d{2}[\/\-]\d{2}[\/\-]\d{4}/,   // Date: 15/02/2026
    /nivel\s+(alto|medio|bajo)/i,     // "Nivel Alto"
    /alerta\s+(roja|naranja|amarilla)/i, // "Alerta Roja"
    /caudal[:\s]+[\d.]+\s*m/i,        // "Caudal: 12.3 m3"
    /estacion[:\s]+[A-Z]/i,           // "Estacion: PEREIRA"
    /descargar\s+boletin/i,           // Download button text
    /pdf|descargar/i,                 // PDF download link (after content appears)
];

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function detectRealContent(text: string): { found: boolean; matches: string[] } {
    const lower = text.toLowerCase();

    // Remove all boilerplate from analysis
    let cleaned = lower;
    for (const bp of BOILERPLATE) {
        cleaned = cleaned.replaceAll(bp, '');
    }

    // Check for strong real-content patterns
    const matches: string[] = [];
    for (const pattern of REAL_CONTENT_PATTERNS) {
        const match = cleaned.match(pattern);
        if (match) matches.push(match[0]);
    }

    return { found: matches.length > 0, matches };
}

async function fetchPage(name: string, url: string) {
    const start = Date.now();
    try {
        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'RiesGeoPereira-Monitor/1.0',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(10000),
        });

        const latency = Date.now() - start;

        if (!res.ok) {
            return { name, url, online: false, hasContent: false, matches: [], latencyMs: latency, httpCode: res.status };
        }

        const html = await res.text();
        const text = stripHtml(html);
        const { found, matches } = detectRealContent(text);

        // Extract useful length metric (content length beyond boilerplate)
        const boilerplateLength = BOILERPLATE.join(' ').length * 3;
        const effectiveLength = Math.max(0, text.length - boilerplateLength);

        return {
            name,
            url,
            online: true,
            hasContent: found,
            matches,
            latencyMs: latency,
            httpCode: res.status,
            effectiveLength,
            lastChecked: new Date().toISOString(),
        };
    } catch (err: any) {
        return {
            name,
            url,
            online: false,
            hasContent: false,
            matches: [],
            latencyMs: Date.now() - start,
            httpCode: 0,
            error: err?.message?.slice(0, 80) ?? 'timeout',
        };
    }
}

export async function GET() {
    const results = await Promise.all(
        SATMA_PAGES.map(p => fetchPage(p.name, p.url))
    );

    const allOnline = results.every(r => r.online);
    const anyContent = results.some(r => r.hasContent);
    const allMatches = results.flatMap(r => r.matches);

    return NextResponse.json({
        source: 'SATMA — Sistema de Alertas Tempranas y Monitoreo Ambiental (CARDER Risaralda)',
        checkedAt: new Date().toISOString(),
        siteOnline: allOnline,
        siteStatus: anyContent ? 'content_detected' : 'under_construction',
        pages: results,
        allMatches,
        pollIntervalMinutes: 5,
    });
}
