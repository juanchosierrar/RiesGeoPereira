import { NextResponse } from 'next/server';


// Pereira area known locations for text-based geocoding
const PEREIRA_LOCATIONS: Record<string, { lat: number; lng: number }> = {
    // Comunas / Barrios
    'cuba': { lat: 4.7870, lng: -75.7231 },
    'dosquebradas': { lat: 4.8395, lng: -75.6694 },
    'la virginia': { lat: 4.8966, lng: -75.8850 },
    'cartago': { lat: 4.7455, lng: -75.9115 },
    'viaducto': { lat: 4.8157, lng: -75.6885 },
    'cesar gaviria': { lat: 4.8157, lng: -75.6885 },
    'avenida del río': { lat: 4.8143, lng: -75.6881 },
    'avenida 30 de agosto': { lat: 4.8050, lng: -75.6940 },
    'maraya': { lat: 4.8050, lng: -75.6940 },
    'centro': { lat: 4.8133, lng: -75.6961 },
    'plaza de bolívar': { lat: 4.8133, lng: -75.6961 },
    'la florida': { lat: 4.7700, lng: -75.6400 },
    'condina': { lat: 4.7800, lng: -75.7100 },
    'aeropuerto': { lat: 4.8122, lng: -75.7330 },
    'matecaña': { lat: 4.8122, lng: -75.7330 },
    'ukumarí': { lat: 4.8210, lng: -75.7600 },
    'galicia': { lat: 4.8210, lng: -75.7600 },
    'la esneda': { lat: 4.8080, lng: -75.6800 },
    'boston': { lat: 4.8176, lng: -75.6897 },
    'pinares': { lat: 4.8090, lng: -75.7120 },
    'álamos': { lat: 4.8167, lng: -75.7020 },
    'laureles': { lat: 4.8201, lng: -75.7001 },
    'villavicencio': { lat: 4.8067, lng: -75.7200 },
    'san jorge': { lat: 4.8009, lng: -75.6972 },
    'nacederos': { lat: 4.8309, lng: -75.6823 },
    'otún': { lat: 4.8157, lng: -75.6580 },
    'consotá': { lat: 4.7980, lng: -75.7080 },
    'futuro': { lat: 4.7932, lng: -75.7251 },
    'kennedy': { lat: 4.7950, lng: -75.7150 },
    'libertad': { lat: 4.7889, lng: -75.7090 },
    'el jardín': { lat: 4.8233, lng: -75.7010 },
    'perla del otún': { lat: 4.8310, lng: -75.6607 },
    'cerritos': { lat: 4.8350, lng: -75.7480 },
    'tribunas': { lat: 4.7500, lng: -75.6833 },
    'quimbaya': { lat: 4.6244, lng: -75.7657 },
    'santa rosa': { lat: 4.8691, lng: -75.6126 },
    'marsella': { lat: 4.9386, lng: -75.7369 },
    'pereira': { lat: 4.8133, lng: -75.6961 },
};

// Enhanced mock tweets based on real Pereira emergency events
const MOCK_HASHTAG_POSTS = [
    {
        id: 'ht_001',
        text: '#EmergenciaPereira 🚨 Deslizamiento registrado en el sector de La Esneda sobre la vía Pereira-Dosquebradas. Dos viviendas afectadas. @DigerPereira atiende el llamado.',
        author: '@AlertaCiudadana',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        sentiment: 'urgent',
        category: 'landslide',
        hashtags: ['#EmergenciaPereira', '#Deslizamiento', '#Dosquebradas'],
        location_text: 'La Esneda, Dosquebradas',
        location: { lat: 4.8080, lng: -75.6800, name: 'La Esneda, Dosquebradas' },
        likes: 47, retweets: 23,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_002',
        text: '#EmergenciaPereira ⚠️ Inundación en el barrio Cuba sector Futuro Bajo. El nivel del agua ha subido más de 40cm. Vecinos evacuando. #Inundacion #Cuba',
        author: '@InfoCubaPereira',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
        sentiment: 'urgent',
        category: 'flood',
        hashtags: ['#EmergenciaPereira', '#Inundacion', '#Cuba'],
        location_text: 'Cuba, Futuro Bajo, Pereira',
        location: { lat: 4.7932, lng: -75.7251, name: 'Futuro Bajo, Cuba' },
        likes: 89, retweets: 64,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_003',
        text: '🔴 #EmergenciaPereira Árbol caído bloqueando la Avenida 30 de Agosto sector Maraya. Vía completamente cerrada. @MovilidadPereira informa desvíos por carrera 20.',
        author: '@TraficoEjeCafetero',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        sentiment: 'warning',
        category: 'storm',
        hashtags: ['#EmergenciaPereira', '#Trafico', '#Maraya'],
        location_text: 'Avenida 30 de Agosto, Maraya, Pereira',
        location: { lat: 4.8050, lng: -75.6940, name: 'Av. 30 de Agosto, Maraya' },
        likes: 34, retweets: 18,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_004',
        text: '#EmergenciaPereira Sismo de magnitud 3.8 fue sentido con fuerza en el centro de Pereira y Dosquebradas hace minutos. @SGColombia confirma epicentro en Salento, Quindío. Sin víctimas reportadas.',
        author: '@SismologicoCol',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        sentiment: 'warning',
        category: 'earthquake',
        hashtags: ['#EmergenciaPereira', '#Sismo', '#SGC'],
        location_text: 'Centro, Pereira',
        location: { lat: 4.8133, lng: -75.6961, name: 'Centro de Pereira' },
        likes: 201, retweets: 156,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_005',
        text: '#EmergenciaPereira 🌊 Desbordamiento del Río Consotá en el sector de Nacederos. @AlcaldiaPereira declara alerta naranja para los barrios cercanos. Mantenerse alejados de la ronda hídrica.',
        author: '@RiesgoRisaralda',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
        sentiment: 'urgent',
        category: 'flood',
        hashtags: ['#EmergenciaPereira', '#Consotá', '#Nacederos'],
        location_text: 'Nacederos, Pereira',
        location: { lat: 4.8309, lng: -75.6823, name: 'Nacederos - Río Consotá' },
        likes: 312, retweets: 198,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_006',
        text: 'Incendio forestal en las laderas del sector Tribunas-Cócora. El fuego avanza hacia zonas residenciales #EmergenciaPereira. Bomberos Pereira en el lugar con 3 unidades. #IncendioForestal',
        author: '@BomberosPereira',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        sentiment: 'urgent',
        category: 'forestFire',
        hashtags: ['#EmergenciaPereira', '#IncendioForestal', '#Tribunas'],
        location_text: 'Tribunas, Pereira',
        location: { lat: 4.7500, lng: -75.6833, name: 'Tribunas - Zona forestal' },
        likes: 445, retweets: 287,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_007',
        text: '#EmergenciaPereira ℹ️ Simulacro de evacuación hoy 10am en el barrio Pinares y El Jardín. Participación ciudadana obligatoria. @AlcaldiaPereira recuerda respetar rutas de evacuación.',
        author: '@AlcaldiaPereira',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        sentiment: 'informational',
        category: 'other',
        hashtags: ['#EmergenciaPereira', '#Simulacro', '#Preparacion'],
        location_text: 'Pinares, Pereira',
        location: { lat: 4.8090, lng: -75.7120, name: 'Pinares, Pereira' },
        likes: 78, retweets: 42,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_008',
        text: '⚠️ #EmergenciaPereira Agrietamiento en vía principal del corregimiento La Florida después de las lluvias. Riesgo de deslizamiento. Vía en un solo carril. #LaFlorida #ViasPereira',
        author: '@ComunidadLaFlorida',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
        sentiment: 'warning',
        category: 'landslide',
        hashtags: ['#EmergenciaPereira', '#LaFlorida', '#Via'],
        location_text: 'La Florida, Pereira',
        location: { lat: 4.7700, lng: -75.6400, name: 'Corregimiento La Florida' },
        likes: 56, retweets: 29,
        postUrl: 'https://twitter.com/search?q=%23EmergenciaPereira',
    },
    {
        id: 'ht_009',
        text: '#emergenciapei 🔴 Fuertes lluvias causan taponamiento de alcantarillado en el barrio Boston. Vehículos varados en la calle 14. #Lluvias #BostonPereira',
        author: '@BostonComunitario',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        sentiment: 'warning',
        category: 'flood',
        hashtags: ['#emergenciapei', '#Lluvias', '#BostonPereira'],
        location_text: 'Boston, Pereira',
        location: { lat: 4.8176, lng: -75.6897, name: 'Barrio Boston, Pereira' },
        likes: 18, retweets: 9,
        postUrl: 'https://twitter.com/search?q=%23emergenciapei',
    },
    {
        id: 'ht_010',
        text: '#emergenciapereira ⚡ Transformador explotó en el sector de Pinares dejando sin luz a más de 800 viviendas. @EPMColombia atiende el evento. ETA: 3 horas.',
        author: '@PinaresOnline',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        sentiment: 'warning',
        category: 'other',
        hashtags: ['#emergenciapereira', '#Pinares', '#EPM'],
        location_text: 'Pinares, Pereira',
        location: { lat: 4.8090, lng: -75.7120, name: 'Pinares, Pereira' },
        likes: 41, retweets: 27,
        postUrl: 'https://twitter.com/search?q=%23emergenciapereira',
    },
    {
        id: 'ht_011',
        text: '🚨 #emergenciapei Derrumbe parcial en vía Cerritos-Pereira km 3. Un camión volcado. @InviasCOL y bomberos en el lugar. Evitar sector.',
        author: '@TransitoRisaralda',
        platform: 'twitter',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        sentiment: 'urgent',
        category: 'landslide',
        hashtags: ['#emergenciapei', '#Cerritos', '#Vias'],
        location_text: 'Cerritos, Pereira',
        location: { lat: 4.8350, lng: -75.7480, name: 'Vía Cerritos km 3' },
        likes: 93, retweets: 74,
        postUrl: 'https://twitter.com/search?q=%23emergenciapei',
    },
];

/**
 * Geocode a tweet text using known Pereira locations dictionary.
 * Returns coordinates and place name if a match is found.
 */
function geocodeFromText(text: string): { lat: number; lng: number; name: string } | null {
    const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Sort by string length desc to match more specific places first
    const sortedLocations = Object.entries(PEREIRA_LOCATIONS).sort(
        ([a], [b]) => b.length - a.length
    );
    
    for (const [place, coords] of sortedLocations) {
        const normalizedPlace = place.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (lower.includes(normalizedPlace)) {
            return { ...coords, name: place.charAt(0).toUpperCase() + place.slice(1) };
        }
    }
    
    return null;
}

/**
 * Twitter v2 query — busca los 3 hashtags con OR (se excluyen retweets, solo español)
 */
const HASHTAG_QUERY = '(#EmergenciaPereira OR #emergenciapereira OR #emergenciapei) -is:retweet lang:es';

/**
 * Try to fetch real tweets using Twitter v2 API (if bearer token is configured).
 */
async function fetchRealTweets(bearerToken: string) {
    const query = encodeURIComponent(HASHTAG_QUERY);
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at,geo,author_id,entities,public_metrics&expansions=author_id,geo.place_id&user.fields=name,username,profile_image_url&place.fields=geo,place_type,name,full_name`;
    
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        next: { revalidate: 120 } // cache 2 min
    });
    
    if (!res.ok) throw new Error(`Twitter API ${res.status}`);
    
    const data = await res.json();
    const users: Record<string, { name: string; username: string }> = {};
    
    // Build user lookup map
    (data.includes?.users || []).forEach((u: any) => {
        users[u.id] = { name: u.name, username: u.username };
    });
    
    // Build place lookup map
    const places: Record<string, { lat: number; lng: number; name: string }> = {};
    (data.includes?.places || []).forEach((p: any) => {
        if (p.geo?.bbox) {
            const [w, s, e, n] = p.geo.bbox;
            places[p.id] = {
                lat: (s + n) / 2,
                lng: (w + e) / 2,
                name: p.full_name || p.name
            };
        }
    });
    
    return (data.data || []).map((tweet: any) => {
        const user = users[tweet.author_id] || {};
        
        // Determine location: geo > place > text extraction
        let location = null;
        if (tweet.geo?.coordinates) {
            const [lng, lat] = tweet.geo.coordinates.coordinates;
            location = { lat, lng, name: 'Ubicación del tweet' };
        } else if (tweet.geo?.place_id && places[tweet.geo.place_id]) {
            location = places[tweet.geo.place_id];
        } else {
            location = geocodeFromText(tweet.text);
        }
        
        // Determine sentiment from text keywords
        const urgentKeywords = ['urgente', 'emergencia', 'evacuación', 'víctimas', 'muertos', 'heridos', 'incendio', 'inundación', 'desbordamiento'];
        const warningKeywords = ['precaución', 'alerta', 'riesgo', 'cerrada', 'deslizamiento', 'sismo'];
        const textLower = tweet.text.toLowerCase();
        const sentiment = urgentKeywords.some(k => textLower.includes(k))
            ? 'urgent'
            : warningKeywords.some(k => textLower.includes(k))
                ? 'warning'
                : 'informational';
        
        return {
            id: `tw_${tweet.id}`,
            text: tweet.text,
            author: `@${user.username || 'usuario'}`,
            platform: 'twitter',
            timestamp: tweet.created_at || new Date().toISOString(),
            sentiment,
            category: 'other',
            hashtags: (tweet.entities?.hashtags || []).map((h: any) => `#${h.tag}`),
            location_text: location?.name || 'Pereira, Colombia',
            location: location || { lat: 4.8133, lng: -75.6961, name: 'Pereira, Colombia' },
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            postUrl: `https://twitter.com/i/web/status/${tweet.id}`,
            source: 'live',
        };
    }).filter((post: any) => post.location !== null);
}

export async function GET() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    // Try real Twitter API first
    if (bearerToken) {
        try {
            const livePosts = await fetchRealTweets(bearerToken);
            if (livePosts.length > 0) {
                return NextResponse.json({
                    posts: livePosts,
                    source: 'live',
                    hashtag: '#EmergenciaPereira',
                    count: livePosts.length,
                });
            }
        } catch (err) {
            console.warn('[Hashtag API] Twitter API no disponible, usando datos simulados:', err);
        }
    }
    
    // Fallback: Use Gemini to enrich mock posts geocoding if needed
    // Return enriched mock data
    const postsWithGeocoding = MOCK_HASHTAG_POSTS.map(post => {
        // Try text-based geocoding as secondary validation
        const textLocation = geocodeFromText(post.text);
        return {
            ...post,
            location: post.location || textLocation || { lat: 4.8133, lng: -75.6961, name: 'Pereira' },
            source: bearerToken ? 'fallback' : 'demo',
        };
    });
    
    return NextResponse.json({
        posts: postsWithGeocoding,
        source: 'demo',
        hashtag: '#EmergenciaPereira',
        count: postsWithGeocoding.length,
        note: 'Datos de simulación. Configure TWITTER_BEARER_TOKEN en .env.local para datos en tiempo real.',
    });
}
