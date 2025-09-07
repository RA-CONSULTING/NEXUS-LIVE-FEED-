
const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sampleMetrics } = require('./metrics');
const { findAndNeutralizeImbalance } = require('./latticeHarmonizer');
const { generateContent } = require('./geminiClient'); // Import the new Gemini client

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
  } else if (req.url === '/harmonize') {
    try {
      const imbalance = await findAndNeutralizeImbalance();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(imbalance));
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
  } else if (req.url === '/generate-narrative' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Prompt is required' }));
        }

        const result = await generateContent(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate narrative' }));
      }
    });
  } else if (req.url === '/generate-threat-assessment' && req.method === 'GET') {
    exec('git diff --shortstat', async (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to execute git diff' }));
      }

      const prompt = `Analyze the following git diff summary and generate a threat assessment: ${stdout}`;

      try {
        const result = await generateContent(prompt);
        const assessment = result.candidates[0].content.parts[0].text;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ assessment }));
      } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate threat assessment' }));
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
