import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Project Review Hub API',
    timestamp: new Date().toISOString(),
  });
});

export default router;
