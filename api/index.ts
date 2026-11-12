import type { Request, Response } from 'express';
import app from '../server.ts';

// Vercel Serverless Function entrypoint wrapping the Express app
export default function handler(req: Request, res: Response) {
  // If Vercel rewrites stripped the /api prefix or altered req.url, normalize it
  if (req.url && !req.url.startsWith('/api') && req.url.startsWith('/academic')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
