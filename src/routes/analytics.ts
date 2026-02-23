import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { requireRole } from '../middleware/auth';

const router = Router();

router.get('/analytics/summary', requireRole('viewer', 'responder', 'admin'), (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = analyticsService.getSummary();

    res.json({
      success: true,
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/timeline', requireRole('viewer', 'responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = '7d', granularity = 'day' } = req.query;

    const validPeriods = ['24h', '7d', '30d'];
    const validGranularities = ['hour', 'day'];

    const periodStr = validPeriods.includes(period as string) ? (period as string) : '7d';
    const granularityStr = validGranularities.includes(granularity as string) ? (granularity as string) : 'day';

    const result = analyticsService.getTimeline(periodStr, granularityStr);

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
