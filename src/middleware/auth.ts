import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = (req.headers['x-role'] as Role) || 'viewer';

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${role}' does not have access to this resource`,
          status: 403,
        },
      });
      return;
    }

    (req as unknown as Record<string, unknown>).userRole = role;
    next();
  };
}
