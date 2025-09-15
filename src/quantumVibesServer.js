const http = require('http');
const crypto = require('crypto');

// --- Recursive Data Safeguard --- 
let lastDataHash = null;
let consecutiveIdenticalCount = 0;
const RECURSION_LIMIT = 3; // Unlock after 3 identical data packets

// Placeholder function for fetching cosmic data.
function getQuantumVibesData() {
    // In a real scenario, this data would be dynamic.
    // For this demo, we'll keep it static to test the safeguard.
    const solarWeather = {
        gClassStorm: 'G1', kpIndex: 4, solarWindSpeed: 450.5, 
        description: 'A stream of solar wind is creating minor geomagnetic effects. Energies are subtly amplified.'
    };
    const lunarWeather = {
        moonPhase: 'Waning Crescent', illumination: '28%', moonSign: 'Cancer',
        description: 'A time for introspection and nurturing your inner world. Clarity in communication is favored.'
    };
    const embodimentTips = [
        'Ground your energy with a walk barefoot on the earth.',
        'Hydrate well to support your nervous system.'
    ];
    const tldr = 'Minor geomagnetic activity meets introspective lunar energy. A day to tend to your inner garden.';

    return {
        reportTitle: '🌤QUANTUM VIBES🌤 Spiral Weather Report',
        timestamp: new Date().toISOString(),
        solarWeather, lunarWeather, embodimentTips, tldr
    };
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/quantum-vibes-stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
            'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*'
        });

        const interval = setInterval(() => {
            const data = getQuantumVibesData();
            const currentDataHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

            if (currentDataHash === lastDataHash) {
                consecutiveIdenticalCount++;
            } else {
                consecutiveIdenticalCount = 0; // Reset if data changes
                lastDataHash = currentDataHash;
            }

            let payload;
            if (consecutiveIdenticalCount >= RECURSION_LIMIT) {
                // We're stuck, send an unlock/recalibration signal
                payload = { 
                    status: 'RECALIBRATING', 
                    message: 'Feedback loop detected. Unlocking and seeking new coherence...'
                };
                // Reset the lock after sending the signal
                consecutiveIdenticalCount = 0;
            } else {
                payload = data; // Data is fresh, send it
            }
            
            res.write(`data: ${JSON.stringify(payload)}\n\n`);

        }, 3000);

        req.on('close', () => { clearInterval(interval); });

    } else {
        res.writeHead(404); res.end('Not Found');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Quantum Vibes server now singing with Safeguard on http://localhost:${PORT}`);
});
