import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const apiKey = process.env.AIzaSyAwVn8GGUlnW3jMZB3E-EFRj60WVtE5nGw;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in the environment');
}

export async function generateContent(prompt) {
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API request failed: ${res.status} ${errText}`);
  }

  return res.json();
}
