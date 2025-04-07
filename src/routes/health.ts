import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * @returns Health status of the service
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router; 