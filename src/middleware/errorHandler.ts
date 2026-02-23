import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[${new Date().toISOString()}] [ERROR] [${code}] ${err.message}`, {
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      status: statusCode,
    },
  });
}
