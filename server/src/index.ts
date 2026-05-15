import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { healthRouter } from './routes/health';
import { contentRouter } from './routes/content';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Minimal security headers — equivalent of helmet's most useful defaults
// without taking on the dependency.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
// 32kb cap defends against oversized payloads that would otherwise bloat
// the Gemini prompt and run up token costs.
app.use(express.json({ limit: '32kb' }));

app.use('/api/health', healthRouter);
app.use('/api/content', contentRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
