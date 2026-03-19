export async function getLatestRadarUrl(): Promise<string | null> {
    try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!res.ok) throw new Error('Failed to fetch radar data');

        const data = await res.json();

        const host = data.host;
        const past = data.radar?.past;

        if (past && past.length > 0) {
            // Get the most recent timestamp path
            const latest = past[past.length - 1];

            // Format: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
            // Size: 256 or 512
            // Color: 2 (Universal Blue standard)
            // Options: 1_1 (Smooth_Snow) 
            return `${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
        }
        return null;
    } catch (err) {
        console.error("Error fetching RainViewer API:", err);
        return null;
    }
}
