import { Express } from 'express';
import healthRoutes from './health';

/**
 * Configure all application routes
 * @param app Express application instance
 */
export function setupRoutes(app: Express): void {
  app.use('/health', healthRoutes);
} 