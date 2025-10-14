import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

import { GoogleAIFileManager, GoogleAIStudio } from './nexusAgent.js';
import { childSafetySystem } from './childSafety.js';
import { startAutoRefresh } from './core/forecastUpdater.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'dist')));

childSafetySystem.setBoundaries([
  'No bullying',
  'Respect privacy',
  'Seek help when unsafe'
]);

const apiKey = process.env.GEMINI_API_KEY;
let nexusFileManager = null;
let nexusStudio = null;
let ttsModel = null;

if (!apiKey) {
  console.warn(
    'Warning: GEMINI_API_KEY environment variable not set. Gemini-powered features are disabled.'
  );
} else {
  nexusFileManager = new GoogleAIFileManager(apiKey);
  nexusStudio = new GoogleAIStudio(apiKey);
  ttsModel = nexusStudio.getGenerativeModel({ model: 'gemini-1.5-flash-preview-tts' });
}

app.locals.nexusFileManager = nexusFileManager;
app.locals.nexusStudio = nexusStudio;

const refreshIntervalEnv = Number.parseInt(process.env.FORECAST_REFRESH_INTERVAL_MS ?? '', 10);
const refreshIntervalMs = Number.isFinite(refreshIntervalEnv)
  ? refreshIntervalEnv
  : 60 * 60 * 1000;

const resolveForecastPath = (envKey, defaultFile) => {
  const candidate = process.env[envKey]?.trim();
  if (candidate) {
    return path.isAbsolute(candidate)
      ? candidate
      : path.join(__dirname, candidate);
  }
  return path.join(__dirname, 'data', defaultFile);
};

const forecastConfig = {
  quantum: {
    forecastPath: resolveForecastPath(
      'QUANTUM_FORECAST_PATH',
      'quantum_weather_forecast_latest.json'
    ),
    feedPath: path.join(
      __dirname,
      'streams',
      'live_forecasts',
      'quantum_hourly_feed.json'
    ),
  },
  bioLinear: {
    forecastPath: resolveForecastPath(
      'BIO_LINEAR_FORECAST_PATH',
      'bio_linear_disaster_outlook_latest.json'
    ),
    feedPath: path.join(
      __dirname,
      'streams',
      'live_forecasts',
      'bio_linear_hourly_feed.json'
    ),
  },
};

if (process.env.DISABLE_FORECAST_AUTO_REFRESH !== 'true') {
  startAutoRefresh(
    forecastConfig,
    { logger: console, intervalMs: refreshIntervalMs }
  );
}

const toIsoString = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const readForecast = async (targetPath) => {
  try {
    const raw = await readFile(targetPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const enhanceForecast = (entries) => {
  if (!entries?.length) {
    return {
      entries: [],
      range: null,
      lastUpdated: null,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lastUpdated = sorted.reduce((latest, entry) => {
    const candidate =
      toIsoString(entry?.last_updated) ||
      toIsoString(entry?.validation?.last_synced_at);
    if (!candidate) {
      return latest;
    }
    if (!latest || new Date(candidate) > new Date(latest)) {
      return candidate;
    }
    return latest;
  }, null);

  return {
    entries: sorted,
    range: {
      start: sorted[0]?.date ?? null,
      end: sorted[sorted.length - 1]?.date ?? null,
    },
    lastUpdated,
  };
};

app.get('/api/forecasts', async (req, res) => {
  try {
    const [quantum, bioLinear] = await Promise.all([
      readForecast(forecastConfig.quantum.forecastPath),
      readForecast(forecastConfig.bioLinear.forecastPath),
    ]);

    res.json({
      quantum: enhanceForecast(quantum),
      bioLinear: enhanceForecast(bioLinear),
    });
  } catch (error) {
    console.error('Failed to load forecasts', error);
    res.status(500).json({ error: 'Unable to load forecast data.' });
  }
});

app.get('/api/forecasts/:type', async (req, res) => {
  const typeParam = req.params.type?.toLowerCase();
  const key =
    typeParam === 'bio-linear' || typeParam === 'biolinear'
      ? 'bioLinear'
      : typeParam === 'quantum'
        ? 'quantum'
        : null;

  if (!key || !forecastConfig[key]) {
    return res.status(404).json({ error: 'Unknown forecast type.' });
  }

  try {
    const entries = await readForecast(forecastConfig[key].forecastPath);
    res.json(enhanceForecast(entries));
  } catch (error) {
    console.error(`Failed to load ${key} forecast`, error);
    res.status(500).json({ error: 'Unable to load forecast data.' });
  }
});

app.get('/api/keys-status', (req, res) => {
  const KEYS = ["SUPABASE_URL","SUPABASE_ANON_KEY","NOAA_CDO_TOKEN","NASA_API_KEY","USGS_API_KEY"];
  const mask = (v) => v ? `${v.slice(0,4)}…${v.slice(-4)} (len=${v.length})` : "(missing)";
  const body = Object.fromEntries(
    KEYS.map(k => [k, { present: !!process.env[k], masked: mask(process.env[k]||"") }])
  );
  res.json(body);
});

app.post('/report-message', (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required.' });
  }
  const report = childSafetySystem.monitorMessage(userId, message);
  res.json(report);
});

app.get('/reports', (req, res) => {
  res.json(childSafetySystem.getReports());
});

app.post('/generate-speech', async (req, res) => {
  const { mantra } = req.body;

  if (!mantra) {
    return res.status(400).json({ error: 'Mantra text is required.' });
  }

  if (!ttsModel) {
    return res.status(503).json({
      error: 'Text-to-speech service is not configured. Set GEMINI_API_KEY to enable this endpoint.'
    });
  }

  try {
    const ttsPrompt = `Say in a calm, ethereal, and resonant voice: ${mantra}`;
    const result = await ttsModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: ttsPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        responseMimeType: 'audio/ogg; codecs=opus',
      },
    });

    const audioPart = result?.response?.candidates
      ?.flatMap(candidate => candidate?.content?.parts ?? [])
      ?.find(part => part?.inlineData?.mimeType?.startsWith('audio/'));

    if (audioPart?.inlineData?.data && audioPart.inlineData.mimeType) {
      const audioData = audioPart.inlineData.data;
      const mimeType = audioPart.inlineData.mimeType;
      res.setHeader('Content-Type', mimeType);
      res.send(Buffer.from(audioData, 'base64'));
    } else {

      throw new Error('No audio data returned from the Nexus agent.');
    }
  } catch (error) {
    console.error('Error generating speech:', {
      message: error?.message,
      status: error?.status || error?.code,
      details: error?.details || error?.response || null,
    });
    res.status(500).json({ error: 'Failed to generate speech.' });
  }
});

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Illumination Engine voice is listening on port ${port}`);
});
