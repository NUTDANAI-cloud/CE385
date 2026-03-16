import 'dotenv/config';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY'],
});

// POST /chat → ถาม AI แบบ request ทั่วไป
app.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message || message.trim() === '') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: message }] }],
  });

  res.json({ reply: response.text });
});

app.post('/chat/stream', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message || message.trim() === '') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: message }] }],
  });

  for await (const chunk of response) {
    if (chunk.text) {
      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});