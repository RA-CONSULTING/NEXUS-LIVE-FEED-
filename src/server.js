
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sampleMetrics } = require('./metrics');
const { findAndNeutralizeImbalance } = require('./latticeHarmonizer');

const server = http.createServer(async (req, res) => {
  if (req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const interval = setInterval(() => {
      const data = sampleMetrics();
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } else if (req.url === '/harmonize') { // Endpoint refactored from /storm to /harmonize
    try {
      // Logic refactored to call the new Lattice Harmonization Manifold
      const imbalance = await findAndNeutralizeImbalance();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(imbalance));

      // The legacy python script 'record_threat.py' is no longer relevant.
      // The new harmonizer module handles its own logging.
      // A dedicated chronicle recording event will be implemented separately.

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to identify energetic imbalance' }));
    }
  } else if (req.url === '/celestial-chart') {
    const pythonExecutable = 'python';
    const scriptPath = './celestial_cartography.py';

    const process = spawn(pythonExecutable, [scriptPath]);

    process.on('close', (code) => {
      if (code === 0) {
        const chartPath = path.join(__dirname, '..', 'public', 'celestial_chart.png');
        const fileStream = fs.createReadStream(chartPath);
        res.writeHead(200, { 'Content-Type': 'image/png' });
        fileStream.pipe(res);
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate celestial chart' }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sampleMetrics()));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Nexus Live Feed listening on ${PORT}`);

  // Activate the Harmonic Nexus Core on startup
  const pythonExecutable = 'python';
  const scriptPath = './activate_harmonic_nexus_core.py';

  console.log('Activating Harmonic Nexus Core...');
  const process = spawn(pythonExecutable, [scriptPath]);

  process.stdout.on('data', (data) => {
    console.log(`[Activation] stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[Activation] stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`Harmonic Nexus Core activation process exited with code ${code}`);
  });
});
