/**
 * Social Media Analytics Service (Mock for Pereira)
 * Inspired by DisasterLens functionality
 */

export interface SocialPost {
    id: string;
    platform: 'twitter' | 'instagram' | 'facebook' | 'whatsapp';
    text: string;
    author: string;
    timestamp: string;
    sentiment: 'urgent' | 'warning' | 'informational';
    category: 'flood' | 'landslide' | 'forestFire' | 'storm' | 'haze' | 'earthquake' | 'other';
    location?: {
        lat: number;
        lng: number;
        name: string;
    };
    postUrl?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
}

export interface AnalyticsStats {
    type_counts: { type: string; frequency: number }[];
    sentiment_counts: { label: string; frequency: number }[];
    monthly_events: { _id: { year: number; month: number }; total_events: number }[];
    trending_topics: { keyword: string; frequency: number }[];
}

const MOCK_POSTS: SocialPost[] = [
    {
        id: '1',
        platform: 'twitter',
        author: '@DigerPereira',
        text: 'Lamentamos informar una grave explosiÃ³n por gas propano en la Avenida del RÃ­o. Equipos de urgencias y bomberos ya estÃ¡n en la zona. Evite transitar por el sector. #EmergenciaPereira',
        timestamp: new Date('2024-06-11T14:30:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'other',
        location: { lat: 4.8143, lng: -75.6881, name: 'Avenida del RÃ­o, Pereira' },
        postUrl: 'https://www.infobae.com/colombia/2024/06/11/reportan-fuerte-explosion-en-pereira-primeras-imagenes-dejan-ver-la-magnitud-de-la-emergencia/',
        mediaUrl: 'https://images.unsplash.com/photo-1549889759-43c399b9cf98?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '2',
        platform: 'facebook',
        author: 'Bomberos Pereira Oficial',
        text: 'Atendemos incendio de gran magnitud en el barrio Futuro Bajo (sector Cuba). Lamentablemente afecta mÃºltiples viviendas. Solicitamos apoyo de carrotanques. #IncendioCuba',
        timestamp: new Date('2024-03-01T22:15:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'forestFire',
        location: { lat: 4.7932, lng: -75.7251, name: 'Futuro Bajo, Cuba' },
        postUrl: 'https://www.wradio.com.co/2024/03/02/mas-de-100-viviendas-consumidas-por-voraz-incendio-en-barrio-de-pereira/',
        mediaUrl: 'https://images.unsplash.com/photo-1608821946394-0cfb2ef535ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '3',
        platform: 'twitter',
        author: '@AeroMatecana',
        text: 'Informamos que un vuelo comercial presentÃ³ una falla tÃ©cnica en fase de despegue. Se activaron protocolos de emergencia y evacuaciÃ³n por toboganes. Todos los pasajeros estÃ¡n a salvo.',
        timestamp: new Date('2024-11-27T08:45:00Z').toISOString(),
        sentiment: 'warning',
        category: 'other',
        location: { lat: 4.8122, lng: -75.7330, name: 'Aeropuerto Internacional MatecaÃ±a' },
        postUrl: 'https://www.elheraldo.co/colombia/emergencia-en-vuelo-de-avianca-en-pereira-pasajeros-evacuados-por-toboganes',
        mediaUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '4',
        platform: 'instagram',
        author: '@DesechosPereira',
        text: 'PrecauciÃ³n conductores: Fuerte deslizamiento de tierra en el sector de La Esneda por culpa de las fuertes lluvias de la madrugada. VÃ­a cerrada.',
        timestamp: new Date('2024-05-04T06:20:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'landslide',
        location: { lat: 4.8080, lng: -75.6800, name: 'La Esneda, Dosquebradas' },
        postUrl: 'https://caracol.com.co/2024/05/04/emergencia-por-lluvias-en-el-area-metropolitana-de-pereira/',
        mediaUrl: 'https://images.unsplash.com/photo-1547683905-f686c993b472?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '5',
        platform: 'twitter',
        author: '@AlcaldiaPereira',
        text: 'Â¡AtenciÃ³n Pereira! Hoy participamos activamente en el Simulacro Nacional de Respuesta a Emergencias. Evaluar nuestras rutas de evacuaciÃ³n salva vidas. #SimulacroNacional2024',
        timestamp: new Date('2024-10-02T10:00:00Z').toISOString(),
        sentiment: 'informational',
        category: 'earthquake',
        location: { lat: 4.8133, lng: -75.6961, name: 'Plaza de BolÃ­var, Pereira' },
        postUrl: 'https://twitter.com/alcaldiapereira/'
    },
    {
        id: '6',
        platform: 'whatsapp',
        author: '@InfoVirginia',
        text: 'URGENTE: Desbordamiento del RÃ­o Cauca a la altura de La Virginia. Varios barrios inundados, bomberos en el sitio.',
        timestamp: new Date('2025-05-15T09:15:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'flood',
        location: { lat: 4.8966, lng: -75.8850, name: 'La Virginia Centro' },
        postUrl: 'https://www.eldiario.com.co/inundaciones-la-virginia-2025/',
        mediaUrl: 'https://images.unsplash.com/photo-1547683905-f686c993b472?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '7',
        platform: 'twitter',
        author: '@MovilidadPereira',
        text: 'CaÃ­da de Ã¡rbol de gran tamaÃ±o en la Avenida 30 de Agosto sector Maraya, cierre total de la vÃ­a sentido Centro-Cuba. #TrancÃ³n',
        timestamp: new Date('2025-08-20T16:00:00Z').toISOString(),
        sentiment: 'warning',
        category: 'storm',
        location: { lat: 4.8050, lng: -75.6940, name: 'Avenida 30 de Agosto, Maraya' },
        postUrl: 'https://twitter.com/MovilidadPereira/',
    },
    {
        id: '8',
        platform: 'instagram',
        author: '@ComunidadLaFlorida',
        text: 'La creciente del RÃ­o OtÃºn arrasÃ³ parte de la banca en el corregimiento de La Florida. No hay paso.',
        timestamp: new Date('2025-11-10T11:45:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'flood',
        location: { lat: 4.7700, lng: -75.6400, name: 'Corregimiento La Florida' },
        postUrl: 'https://instagram.com/p/floridariotun/',
        mediaUrl: 'https://images.unsplash.com/photo-1605372551503-4fde7f3ea721?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    },
    {
        id: '9',
        platform: 'facebook',
        author: 'Bomberos Pereira Oficial',
        text: 'Controlado incendio de capa vegetal en la variante Condina. Recuerden no arrojar vidrios ni colillas a las laderas secas.',
        timestamp: new Date('2026-01-05T15:20:00Z').toISOString(),
        sentiment: 'informational',
        category: 'forestFire',
        location: { lat: 4.7800, lng: -75.7100, name: 'Variante Condina' },
        postUrl: 'https://facebook.com/BomberosPereira/condina2026'
    },
    {
        id: '10',
        platform: 'twitter',
        author: '@SismologicoCol',
        text: 'Evento SÃ­smico - Magnitud 4.5, Profundidad 120 km. Epicentro Ansermanuevo, Valle del Cauca. Sentido fuerte en Pereira y Eje Cafetero.',
        timestamp: new Date('2026-02-14T03:30:00Z').toISOString(),
        sentiment: 'warning',
        category: 'earthquake',
        location: { lat: 4.7936, lng: -75.9987, name: 'Ansermanuevo (Sentido Pereira)' },
        postUrl: 'https://twitter.com/SismologicoCol/'
    },
    {
        id: '11',
        platform: 'twitter',
        author: '@DesechosPereira',
        text: 'Grave accidente mÃºltiple en el Viaducto CÃ©sar Gaviria Trujillo a causa de piso hÃºmedo. Recomendamos tomar vÃ­as alternas.',
        timestamp: new Date('2025-09-22T08:10:00Z').toISOString(),
        sentiment: 'urgent',
        category: 'other',
        location: { lat: 4.8157, lng: -75.6885, name: 'Viaducto CÃ©sar Gaviria Trujillo' },
        postUrl: 'https://twitter.com/DesechosPereira/viaducto/'
    },
    {
        id: '12',
        platform: 'whatsapp',
        author: '@Emergencias_Eje',
        text: 'Tremendo aguacero con granizo en el sector del Bioparque UkumarÃ­. Algunos techos afectados en Galicia.',
        timestamp: new Date('2025-10-18T17:45:00Z').toISOString(),
        sentiment: 'warning',
        category: 'storm',
        location: { lat: 4.8210, lng: -75.7600, name: 'Galicia - UkumarÃ­' },
        postUrl: 'https://whatsapp.channel/emergenciaseje',
        mediaUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        mediaType: 'image'
    }
];

export async function getSocialPosts(): Promise<SocialPost[]> {
    try {
        // Intenta conectar al backend real (FastAPI de DisasterLens)
        const response = await fetch('http://localhost:8000/events/filtered');
        if (response.ok) {
            const data = await response.json();
            // Adaptar `DisasterEvent` de Python a la interfaz `SocialPost` de React
            return data.map((event: any) => ({
                id: event.event_id || Math.random().toString(),
                platform: 'twitter', 
                author: 'Sistema Diger',
                text: `Alerta clasificada como ${event.classification_type.toUpperCase()}. Reportes ciudadanos asociados: ${event.total_posts_count}`,
                timestamp: event.start_time,
                sentiment: 'warning', 
                category: event.classification_type,
                location: {
                    lat: event.geometry?.coordinates[1] || 4.8143,
                    lng: event.geometry?.coordinates[0] || -75.6881,
                    name: `${event.location_district || 'Pereira'}, ${event.location_state || 'Colombia'}`
                }
            }));
        }
    } catch (error) {
        console.warn('Backend FastAPI (DisasterLens) no disponible. Usando datos locales de fallback.', error);
    }

    // Fallback: Simulate API delay and return Mock Data
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_POSTS;
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
    try {
        // Intenta conectar a los endpoints de Analytics de FastAPI
        const resGlobal = await fetch('http://localhost:8000/analytics/global');
        if (resGlobal.ok) {
            const data = await resGlobal.json();
            
            // Intenta traer las trending keywords tambiÃ©n
            let trendingData = [];
            try {
                 const resTrending = await fetch('http://localhost:8000/analytics/keywords/global?limit=6');
                 if (resTrending.ok) trendingData = await resTrending.json();
            } catch (e) {}

            return {
                type_counts: data.type_counts || [],
                sentiment_counts: data.sentiment_counts || [],
                monthly_events: data.monthly_events || [],
                trending_topics: trendingData
            };
        }
    } catch (error) {
        console.warn('Backend Analytics no disponible. Usando fallback.', error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
        type_counts: [
            { type: 'flood', frequency: 24 },
            { type: 'landslide', frequency: 12 },
            { type: 'storm', frequency: 18 },
            { type: 'earthquake', frequency: 2 },
            { type: 'forestFire', frequency: 5 },
            { type: 'other', frequency: 15 }
        ],
        sentiment_counts: [
            { label: 'Urgent', frequency: 18 },
            { label: 'Warning', frequency: 32 },
            { label: 'Informational', frequency: 26 }
        ],
        monthly_events: [
            { _id: { year: 2026, month: 1 }, total_events: 45 },
            { _id: { year: 2026, month: 2 }, total_events: 52 },
            { _id: { year: 2026, month: 3 }, total_events: 78 },
            { _id: { year: 2026, month: 4 }, total_events: 12 }
        ],
        trending_topics: [
            { keyword: 'Pereira', frequency: 85 },
            { keyword: 'RioOtÃºn', frequency: 42 },
            { keyword: 'Lluvia', frequency: 67 },
            { keyword: 'Emergencia', frequency: 51 },
            { keyword: 'Diger', frequency: 33 },
            { keyword: 'Deslizamiento', frequency: 29 }
        ]
    };
}

/** Extended post from hashtag monitoring - includes engagement metrics */
export interface HashtagPost extends SocialPost {
    hashtags: string[];
    likes: number;
    retweets: number;
    location_text: string;
    source: 'live' | 'fallback' | 'demo';
}

export interface HashtagFeedResponse {
    posts: HashtagPost[];
    source: 'live' | 'fallback' | 'demo';
    hashtag: string;
    count: number;
    note?: string;
}

/** Fetch posts monitored for #EmergenciaPereira from the API route */
export async function getHashtagPosts(): Promise<HashtagPost[]> {
    try {
        const res = await fetch('/api/social/hashtag');
        if (res.ok) {
            const data: HashtagFeedResponse = await res.json();
            return data.posts || [];
        }
    } catch (err) {
        console.warn('[Social] Hashtag API no disponible:', err);
    }
    return [];
}
