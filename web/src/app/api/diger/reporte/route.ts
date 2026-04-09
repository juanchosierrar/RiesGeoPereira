import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

// Initialize the official SDK
const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_API_KEY!
});

/**
 * GET: Obtener todos los incidentes para el mapa
 */
export async function GET() {
    try {
        const { data, error } = await insforge.database
            .from('datos_diger')
            .select('*')
            .limit(1000); // Podemos ajustar paginación más adelante

        if (error) throw error;

        // Transformar a GeoJSON para el mapa
        const features = (data || []).filter(inc => inc.lat && inc.lon).map(inc => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [inc.lon, inc.lat]
            },
            properties: {
                id: inc.fid,
                tipo: inc.evento,
                descripcion: inc.sector || '',
                fecha: inc.fecha,
                gravedad: (inc.viv > 0 || inc.les > 0 || inc.fall > 0) ? 'Alta' : 'Media',
                estado: 'Reportado'
            }
        }));

        return NextResponse.json({
            type: 'FeatureCollection',
            features
        });
    } catch (error) {
        console.error('Error fetching DIGER incidents:', error);
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
    }
}

/**
 * POST: Registrar un nuevo incidente DIGER
 */
export async function POST(req: Request) {
    try {
        const data = await req.json();
        
        // 1. Mapear datos del formulario exactamente al esquema plano de datos_diger
        // fid es SERIAL/autoincremental, id parece también serlo pero la doc muestra que fid es la clave principal real.
        const rowData = {
            fecha: data.fecha_hora,
            evento: data.tipo_evento,
            sector: data.descripcion || '',
            comcorr: data.comuna || '',
            barrver: data.barrio || '',
            viv: Number(data.viv_afectadas) || 0,
            flia: Number(data.flia_afectadas) || 0,
            ad: Number(data.ad_afectados) || 0,
            men: Number(data.men_afectados) || 0,
            les: Number(data.lesionados) || 0,
            fall: Number(data.fallecidos) || 0,
            lat: Number(data.lat),
            lon: Number(data.lon)
        };

        // 2. Guardar en Insforge usando el SDK
        const { data: savedEvent, error } = await insforge.database
            .from('datos_diger')
            .insert(rowData)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ 
            success: true, 
            id: savedEvent?.fid || savedEvent?.id || Date.now()
        });

    } catch (error: any) {
        console.error('Error saving DIGER report:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error interno al guardar en Insforge' 
        }, { status: 500 });
    }
}
