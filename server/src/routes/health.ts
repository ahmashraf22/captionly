import { Router, Request, Response } from 'express';

export const healthRouter = Router();

/** Returns server health status */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
