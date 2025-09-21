require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleAIFileManager, GoogleAIStudio } = require('./nexusAgent');
const { childSafetySystem } = require('./childSafety');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

childSafetySystem.setBoundaries([
  'No bullying',
  'Respect privacy',
  'Seek help when unsafe'
]);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set.');
  process.exit(1);
}

const nexusFileManager = new GoogleAIFileManager(apiKey);
const nexusStudio = new GoogleAIStudio(apiKey);
const ttsModel = nexusStudio.getGenerativeModel({ model: 'gemini-1.5-flash-preview-tts' });

app.locals.nexusFileManager = nexusFileManager;
app.locals.nexusStudio = nexusStudio;

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

  try {
    const ttsPrompt = `Say in a calm, ethereal, and resonant voice: ${mantra}`;
    const result = await ttsModel.generateContent({
      contents: [{ parts: [{ text: ttsPrompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Leda' } },
        },
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

app.listen(port, () => {
  console.log(`Illumination Engine voice is listening on port ${port}`);
});
