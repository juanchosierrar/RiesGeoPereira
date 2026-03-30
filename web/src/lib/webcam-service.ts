export interface WebcamFeature {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    description: string;
}

export const WEBCAMS: WebcamFeature[] = [
    {
        id: 'wc-001',
        name: 'Nevado del Ruíz - Quebrada Las Nereidas',
        latitude: 4.87888,
        longitude: -75.36639,
        imageUrl: 'https://www.worldcam.pl/images/webcams/840x472/nevado-del-ruiz-rzeka-nereidas-c.jpg?03',
        description: 'Visual de la Quebrada Las Nereidas en el costado occidental del volcán Nevado del Ruiz.'
    },
    {
        id: 'wc-002',
        name: 'Nevado del Ruíz - Guali creek',
        latitude: 4.94111,
        longitude: -75.34167,
        imageUrl: 'https://www.worldcam.pl/images/webcams/840x472/nevado-del-ruiz-guali-creek-prev.jpg?03',
        description: 'Monitoreo de la quebrada Gualí, zona de influencia del volcán.'
    },
    {
        id: 'wc-003',
        name: 'Nevado del Ruiz - Azufrado River Canyon',
        latitude: 4.92583,
        longitude: -75.29417,
        imageUrl: 'https://www.worldcam.pl/images/webcams/840x472/nevado-del-ruiz-azufrado-river-c.jpg?03',
        description: 'Cañón del río Azufrado, sector crítico por lahares.'
    },
    {
        id: 'wc-004',
        name: 'Manizales - Nevado del Ruiz',
        latitude: 5.07139,
        longitude: -75.52472,
        imageUrl: 'https://www.worldcam.pl/images/webcams/420x236/manizales-panorama-preview.jpg?03',
        description: 'Vista panorámica desde Manizales hacia el edificio volcánico.'
    }
];
