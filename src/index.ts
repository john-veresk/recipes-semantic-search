import express from 'express';
import path from 'path';
import * as OpenApiValidator from 'express-openapi-validator';
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import ingredientsRoutes from './routes/ingredients.routes';
import healthRoutes from './routes/health';
import embeddingService from './services/embedding.service';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Load the OpenAPI document
// The path needs to be absolute and point to the actual file
const openApiPath = path.resolve(process.cwd(), 'src/openapi/schema.yaml');
console.log(`Loading OpenAPI schema from: ${openApiPath}`);

try {
  const openApiYaml = fs.readFileSync(openApiPath, 'utf8');
  const openApiDocument = yaml.load(openApiYaml) as swaggerUi.JsonObject;

  // OpenAPI Swagger UI - must be set up BEFORE the validator
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    explorer: true
  }));
  console.log('Swagger UI configured successfully at /api-docs');
  
  // OpenAPI validation - exclude Swagger UI paths
  app.use(
    OpenApiValidator.middleware({
      apiSpec: openApiPath,
      validateRequests: true,
      validateResponses: true,
      // Skip validation for swagger-ui paths
      ignorePaths: /^\/api-docs.*/
    })
  );
} catch (error) {
  console.error('Failed to load OpenAPI schema:', error);
}

// Initialize embedding service
(async () => {
  try {
    await embeddingService.initialize();
    console.log('Embedding service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize embedding service:', error);
    process.exit(1);
  }
})();

// Mount routes
app.use('/ingredients', ingredientsRoutes);
app.use('/health', healthRoutes);

// Debug route to confirm server is working
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ingredients API is running', 
    endpoints: [
      '/ingredients (POST)',
      '/ingredients/search (POST)',
      '/health (GET)',
      '/api-docs (GET) - Swagger UI'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`View available endpoints at: http://localhost:${PORT}/`);
  console.log(`API documentation available at: http://localhost:${PORT}/api-docs`);
}); 