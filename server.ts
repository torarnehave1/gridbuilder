import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for Gemini Magic Write / Content Generation
app.post('/api/generate-content', async (req, res) => {
  try {
    const { prompt, blockType, styleHint } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY environment variable is missing. Please configure it in your secrets.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert web copywriter and HTML/Markdown page content generator.
Generate clean, engaging Markdown formatted text suitable for a ${
      blockType || 'webpage card'
    }.
Style hint: ${styleHint || 'professional, crisp, and high-impact'}.
Use standard Markdown syntax (#, ##, ###, **, *, lists, blockquotes, links, code blocks).
Return ONLY the raw markdown text without markdown code block backticks wrappers around the entire response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nTask/Prompt: ${prompt}` }] },
      ],
    });

    const text = response.text || '';
    return res.json({ result: text });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate content with Gemini AI',
    });
  }
});

// Vegvisr Auth Proxy Endpoints
app.post('/api/auth/proxy/send-magic', async (req, res) => {
  try {
    const response = await fetch('https://cookie.vegvisr.org/login/magic/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error proxying magic link send' });
  }
});

app.get('/api/auth/proxy/verify-magic', async (req, res) => {
  try {
    const token = (req.query.token as string) || '';
    const response = await fetch(`https://cookie.vegvisr.org/login/magic/verify?token=${encodeURIComponent(token)}`);
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error proxying magic verify' });
  }
});

app.get('/api/auth/proxy/get-auth-token', async (req, res) => {
  try {
    const email = ((req.headers['x-email'] || req.query.email) as string) || '';
    const response = await fetch('https://api.vegvisr.org/get-auth-token', {
      method: 'GET',
      headers: { 'X-Email': email },
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error proxying auth token' });
  }
});

app.get('/api/auth/proxy/get-role', async (req, res) => {
  try {
    const email = (req.query.email as string) || '';
    const response = await fetch(`https://dashboard.vegvisr.org/get-role?email=${encodeURIComponent(email)}`);
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error proxying user role' });
  }
});

// Vegvisr Knowledge Graphs API Proxy Endpoints
const VEGVISR_BASE_URL = 'https://knowledge.vegvisr.org';
const VEGVISR_DEFAULT_TOKEN = 'vgvsr_2f390889b0373a8c846c5c795a4deea3f86fe022240622bf';

function getVegvisrToken() {
  return process.env.VEGVISR_API_TOKEN || VEGVISR_DEFAULT_TOKEN;
}

// Fetch all knowledge graphs
app.get('/api/vegvisr/knowgraphs', async (req, res) => {
  try {
    const token = getVegvisrToken();
    const response = await fetch(`${VEGVISR_BASE_URL}/getknowgraphs`, {
      method: 'GET',
      headers: {
        'X-API-Token': token,
        'Accept': 'application/json',
      },
    });

    const status = response.status;
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(status).json({
        error: data.message || `Vegvisr API error (Status ${status})`,
        status,
        details: data,
      });
    }

    return res.json(data);
  } catch (err: any) {
    console.error('Vegvisr API Proxy Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to communicate with Vegvisr Knowledge Graphs API',
    });
  }
});

// Proxy arbitrary endpoints to Vegvisr Knowledge Graphs API
app.all('/api/vegvisr/proxy/*', async (req, res) => {
  try {
    const subPath = req.params[0] || '';
    const token = getVegvisrToken();
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const baseUrl = subPath.startsWith('recordings/')
      ? 'https://realtimevideos.vegvisr.org'
      : VEGVISR_BASE_URL;
    const url = `${baseUrl}/${subPath}${queryString}`;

    const headers: Record<string, string> = {
      'X-API-Token': token,
      'Accept': 'application/json',
    };

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const status = response.status;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return res.status(status).json(data);
    } else {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      return res.status(status).send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.error('Vegvisr Proxy Endpoint Error:', err);
    return res.status(500).json({
      error: err.message || 'Proxy error connecting to Vegvisr Knowledge Graphs API',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
