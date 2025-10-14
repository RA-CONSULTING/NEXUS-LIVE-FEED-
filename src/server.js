import http from 'http';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sampleMetrics } from './metrics.js';
import { findAndNeutralizeImbalance } from './latticeHarmonizer.js';
import { generateContent } from './geminiClient.js'; // Import the new Gemini client
import { loadForecastSummary } from '../core/forecastAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const serveFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(res);
  });

  stream.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to read requested asset.' }));
  });
};

const serveAppAsset = (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const absolutePath = path.join(DIST_DIR, requestedPath);
  const normalizedPath = path.normalize(absolutePath);

  if (!normalizedPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, normalizedPath);
      return;
    }

    const fallbackPath = path.join(DIST_DIR, 'index.html');
    fs.stat(fallbackPath, (fallbackErr) => {
      if (fallbackErr) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
      }

      serveFile(res, fallbackPath);
    });
  });
};

dotenv.config();

const KEY_NAMES = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NOAA_CDO_TOKEN',
  'NASA_API_KEY',
  'USGS_API_KEY',
];

const maskValue = (value) =>
  value ? `${value.slice(0, 4)}…${value.slice(-4)} (len=${value.length})` : '(missing)';

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
        const chartPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public', 'celestial_chart.png');
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
  } else if (req.url === '/bio-resonance-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const pythonProcess = spawn('python', ['./bio_resonance_sensor.py']);

    pythonProcess.stdout.on('data', (data) => {
      res.write(data);
    });

    req.on('close', () => {
      pythonProcess.kill();
    });
  } else if (req.url === '/harmonize-bio-resonance') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Bio-resonance harmonization initiated.' }));

  } else if (req.url === '/api/keys-status') {
    const status = Object.fromEntries(
      KEY_NAMES.map((name) => {
        const value = process.env[name] || '';
        return [name, { present: Boolean(value), masked: maskValue(value) }];
      })
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  } else if (req.method === 'GET' && req.url?.startsWith('/api/forecasts')) {
    try {
      const payload = await loadForecastSummary();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to load forecast summary', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unable to load forecast window.' }));
    }
  } else if (req.method === 'GET') {
    serveAppAsset(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Nexus Live Feed listening on ${PORT}`);

  // Activate the Harmonic Nexus Core on startup
  // const pythonExecutable = 'python';
  // const scriptPath = './activate_harmonic_nexus_core.py';

  // console.log('Activating Harmonic Nexus Core...');
  // const process = spawn(pythonExecutable, [scriptPath]);

  // process.stdout.on('data', (data) => {
  //   console.log(`[Activation] stdout: ${data}`);
  // });

  // process.stderr.on('data', (data) => {
  //   console.error(`[Activation] stderr: ${data}`);
  // });

  // process.on('close', (code) => {
  //   console.log(`Harmonic Nexus Core activation process exited with code ${code}`);
  // });
});
