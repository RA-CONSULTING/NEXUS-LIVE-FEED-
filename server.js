import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { GoogleAIFileManager, GoogleAIStudio } from './nexusAgent.js';
import { childSafetySystem } from './childSafety.js';

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
