import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { healthRouter } from './routes/health';
import { contentRouter } from './routes/content';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/content', contentRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
