import { Express } from 'express';
import ingredientsRoutes from './ingredients.routes';
import healthRoutes from './health';

/**
 * Sets up all application routes
 * @param app Express application
 */
export function setupRoutes(app: Express): void {
  // Mount the routes
  app.use('/ingredients', ingredientsRoutes);
  app.use('/health', healthRoutes);
  
  // Log routes that have been set up
  console.log('Routes registered:');
  console.log('- /ingredients (POST)');
  console.log('- /ingredients/search (POST)');
  console.log('- /health (GET)');
} 