import request from 'supertest';
import express from 'express';
import ingredientsRoutes from '../routes/ingredients.routes';
import embeddingService from '../services/embedding.service';

// Mock the embedding service
jest.mock('../services/embedding.service', () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  addIngredient: jest.fn().mockImplementation((recipe_id, ingredients) => {
    return Promise.resolve(`mock_id_${Date.now()}`);
  }),
  searchSimilarIngredients: jest.fn().mockImplementation((query, limit) => {
    return Promise.resolve([
      { 
        recipe_id: 'recipe123', 
        ingredients: 'flour, sugar, eggs, butter'
      },
      { 
        recipe_id: 'recipe456', 
        ingredients: 'pasta, tomato sauce, cheese, basil'
      }
    ].slice(0, limit || 3));
  })
}));

describe('Ingredients API Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ingredients', ingredientsRoutes);
    
    // Reset mock call counts before each test
    jest.clearAllMocks();
  });

  describe('POST /ingredients', () => {
    it('should add ingredients successfully', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          recipe_id: 'recipe123',
          ingredients: 'flour, sugar, eggs, butter'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added successfully');
      expect(response.body.id).toBeDefined();
      expect(embeddingService.addIngredient).toHaveBeenCalledWith(
        'recipe123', 
        'flour, sugar, eggs, butter'
      );
    });

    it('should return 400 when recipe_id is missing', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          ingredients: 'flour, sugar, eggs, butter'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('recipe_id is required');
      expect(embeddingService.addIngredient).not.toHaveBeenCalled();
    });

    it('should return 400 when ingredients are missing', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          recipe_id: 'recipe123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ingredients is required');
      expect(embeddingService.addIngredient).not.toHaveBeenCalled();
    });
  });

  describe('POST /ingredients/search', () => {
    it('should search for ingredients successfully', async () => {
      const response = await request(app)
        .post('/ingredients/search')
        .send({
          ingredients: 'flour, eggs',
          limit: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].recipe_id).toBe('recipe123');
      expect(embeddingService.searchSimilarIngredients).toHaveBeenCalledWith(
        'flour, eggs', 
        2
      );
    });

    it('should return 400 when ingredients query is missing', async () => {
      const response = await request(app)
        .post('/ingredients/search')
        .send({
          limit: 2
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ingredients query is required');
      expect(embeddingService.searchSimilarIngredients).not.toHaveBeenCalled();
    });

  });
}); 