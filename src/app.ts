import express, { Express } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import path from 'path';
import { setupRoutes } from './routes';

/**
 * Creates and configures the Express application
 * @returns Configured Express application
 */
export function createApp(): Express {
  const app = express();
  
  // Parse JSON request bodies
  app.use(express.json());
  
  app.use(
    OpenApiValidator.middleware({
      apiSpec: path.join(__dirname, 'openapi/schema.yaml'),
      validateRequests: true,
      validateResponses: true
    })
  );
  
  // Set up routes
  setupRoutes(app);
  
  return app;
}
