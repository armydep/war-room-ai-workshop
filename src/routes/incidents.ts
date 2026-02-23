import { Router, Request, Response, NextFunction } from 'express';
import { incidentService } from '../services/incidentService';
import { requireRole } from '../middleware/auth';
import { AppError } from '../types';

const router = Router();

router.get('/incidents', requireRole('viewer', 'responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, status, source, sort = 'created_at', order = 'desc', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

    const result = incidentService.getIncidents({
      severity: severity as string | undefined,
      status: status as string | undefined,
      source: source as string | undefined,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/incidents/:id', requireRole('viewer', 'responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const err = new Error('Invalid incident id') as AppError;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const incident = incidentService.getIncidentById(id);

    res.json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/incidents', requireRole('responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, source, severity, assigned_to } = req.body;

    if (!title || !source) {
      const err = new Error('title and source are required') as AppError;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const validSources = ['monitoring', 'user_report', 'automated', 'external'];
    if (!validSources.includes(source)) {
      const err = new Error(`source must be one of: ${validSources.join(', ')}`) as AppError;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (severity) {
      const validSeverities = ['critical', 'high', 'medium', 'low'];
      if (!validSeverities.includes(severity)) {
        const err = new Error(`severity must be one of: ${validSeverities.join(', ')}`) as AppError;
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }
    }

    const incident = incidentService.createIncident({ title, description, source, severity, assigned_to });

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:created', incident);
    }

    res.status(201).json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/incidents/:id', requireRole('responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const err = new Error('Invalid incident id') as AppError;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const { status, severity, assigned_to, description } = req.body;
    const actor = (req.headers['x-role'] as string) || 'system';

    const incident = incidentService.updateIncident(id, { status, severity, assigned_to, description }, actor);

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:updated', incident);
    }

    res.json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
