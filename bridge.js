const http = require('http');
const https = require('https');

const PORT = 7130;
const REMOTE_HOST = 'dt7mf4ie.us-west.insforge.app';
const API_KEY = 'ik_856278a86e9f74e10d0a5c348cf0b2a2';

const server = http.createServer((req, res) => {
    console.log(`[Bridge] ${req.method} ${req.url}`);

    const options = {
        hostname: REMOTE_HOST,
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            'host': REMOTE_HOST,
            'X-API-Key': API_KEY,
            'Authorization': `Bearer ${API_KEY}` // Some endpoints might use Bearer
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });

    proxyReq.on('error', (err) => {
        console.error(`[Bridge Error] ${err.message}`);
        res.writeHead(500);
        res.end(`Bridge error: ${err.message}`);
    });
});

server.listen(PORT, () => {
    console.log(`[Bridge] InsForge local MCP bridge listening on http://localhost:${PORT}`);
});
