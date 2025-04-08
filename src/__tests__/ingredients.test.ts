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
  addIngredientsBatch: jest.fn().mockImplementation((records: Array<{recipe_id: string, ingredients: string}>) => {
    return Promise.resolve(records.map((_: {recipe_id: string, ingredients: string}, index: number) => `mock_batch_id_${Date.now()}_${index}`));
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
  }),
  deleteIngredientsByRecipeId: jest.fn().mockImplementation((recipe_id) => {
    return Promise.resolve(2); // Mock deleting 2 items
  }),
  clearCollection: jest.fn().mockImplementation(() => {
    return Promise.resolve(5); // Mock clearing 5 items
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

  describe('DELETE /ingredients', () => {
    it('should delete ingredients by recipe_id successfully', async () => {
      const response = await request(app)
        .delete('/ingredients')
        .query({ recipe_id: 'recipe123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('recipe123 deleted successfully');
      expect(response.body.deletedCount).toBe(2);
      expect(embeddingService.deleteIngredientsByRecipeId).toHaveBeenCalledWith('recipe123');
      expect(embeddingService.clearCollection).not.toHaveBeenCalled();
    });

    it('should delete all ingredients when recipe_id is "*"', async () => {
      const response = await request(app)
        .delete('/ingredients')
        .query({ recipe_id: '*' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All ingredients deleted successfully');
      expect(response.body.deletedCount).toBe(5);
      expect(embeddingService.clearCollection).toHaveBeenCalled();
      expect(embeddingService.deleteIngredientsByRecipeId).not.toHaveBeenCalled();
    });

    it('should return 400 when recipe_id is missing', async () => {
      const response = await request(app)
        .delete('/ingredients');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('recipe_id query parameter is required');
      expect(embeddingService.deleteIngredientsByRecipeId).not.toHaveBeenCalled();
      expect(embeddingService.clearCollection).not.toHaveBeenCalled();
    });
  });

  describe('POST /ingredients/batch', () => {
    it('should add ingredients batch successfully', async () => {
      const response = await request(app)
        .post('/ingredients/batch')
        .send({
          records: [
            {
              recipe_id: 'recipe123',
              ingredients: 'flour, sugar, eggs, butter'
            },
            {
              recipe_id: 'recipe456',
              ingredients: 'pasta, tomato sauce, cheese, basil'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added successfully');
      expect(response.body.ids).toHaveLength(2);
      expect(embeddingService.addIngredientsBatch).toHaveBeenCalledWith([
        {
          recipe_id: 'recipe123',
          ingredients: 'flour, sugar, eggs, butter'
        },
        {
          recipe_id: 'recipe456',
          ingredients: 'pasta, tomato sauce, cheese, basil'
        }
      ]);
    });

    it('should return 400 when records is not an array', async () => {
      const response = await request(app)
        .post('/ingredients/batch')
        .send({
          records: 'not an array'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('records must be an array');
      expect(embeddingService.addIngredientsBatch).not.toHaveBeenCalled();
    });

    it('should return 400 when records array is empty', async () => {
      const response = await request(app)
        .post('/ingredients/batch')
        .send({
          records: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('records array cannot be empty');
      expect(embeddingService.addIngredientsBatch).not.toHaveBeenCalled();
    });

    it('should return 400 when a record has missing recipe_id', async () => {
      const response = await request(app)
        .post('/ingredients/batch')
        .send({
          records: [
            {
              ingredients: 'flour, sugar, eggs, butter'
            },
            {
              recipe_id: 'recipe456',
              ingredients: 'pasta, tomato sauce, cheese, basil'
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('recipe_id is required');
      expect(embeddingService.addIngredientsBatch).not.toHaveBeenCalled();
    });

    it('should return 400 when a record has missing ingredients', async () => {
      const response = await request(app)
        .post('/ingredients/batch')
        .send({
          records: [
            {
              recipe_id: 'recipe123',
              ingredients: 'flour, sugar, eggs, butter'
            },
            {
              recipe_id: 'recipe456'
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ingredients is required');
      expect(embeddingService.addIngredientsBatch).not.toHaveBeenCalled();
    });
  });
}); 