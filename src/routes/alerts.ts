import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection';
import { requireRole } from '../middleware/auth';
import { AlertConfig, AppError } from '../types';

const router = Router();

router.get('/alert-configs', requireRole('responder', 'admin'), (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const configs = db.prepare('SELECT * FROM alert_configs ORDER BY created_at DESC').all() as AlertConfig[];

    res.json({
      success: true,
      data: { configs },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/alert-configs', requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, severity, threshold, window_minutes, enabled } = req.body;

    if (!name || !severity || threshold === undefined || window_minutes === undefined) {
      const err = new Error('name, severity, threshold, and window_minutes are required') as AppError;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO alert_configs (name, severity, threshold, window_minutes, enabled)
      VALUES (@name, @severity, @threshold, @window_minutes, @enabled)
    `).run({
      name,
      severity,
      threshold,
      window_minutes,
      enabled: enabled === false ? 0 : 1,
    });

    const config = db.prepare('SELECT * FROM alert_configs WHERE id = ?').get(result.lastInsertRowid) as AlertConfig;

    res.status(201).json({
      success: true,
      data: config,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
