import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const role = (req.headers['x-role'] as string) || 'viewer';
    console.info(
      `[${new Date().toISOString()}] [INFO] [http] ${req.method} ${req.path} ${res.statusCode} ${duration}ms role=${role}`
    );
  });

  next();
}
