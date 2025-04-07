import { jest } from '@jest/globals';
import { EmbeddingService } from '../services/embedding.service';
import { ChromaClient } from 'chromadb';

// Create a mock for the ollama module
jest.mock('ollama', () => {
  return {
    embeddings: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
      });
    })
  };
});

// Import ollama after mocking
import ollama from 'ollama';
describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let chromaClient: ChromaClient;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new ChromaClient for each test
    chromaClient = new ChromaClient();
    
    // Create embedding service with test environment flag
    embeddingService = new EmbeddingService(chromaClient, true);
    
    // Initialize the service
    await embeddingService.initialize();
    
    // Clear any existing data in the test collection
    await embeddingService.clearCollection();
  });

  afterAll(async () => {
    // Clean up the test collection after all tests
    if (embeddingService) {
      await embeddingService.clearCollection();
    }
  });

  test('should initialize successfully', () => {
    expect(embeddingService).toBeDefined();
  });

  test('should add ingredient and generate id', async () => {
    // Mock Date.now to return a consistent value
    const originalDateNow = Date.now;
    const mockTimestamp = 1234567890;
    Date.now = jest.fn(() => mockTimestamp);

    try {
      const recipeId = 'recipe123';
      const ingredients = 'tomatoes, cheese, basil';
      
      const id = await embeddingService.addIngredient(recipeId, ingredients);
      
      // Check that the ID matches the expected format
      expect(id).toBe(`ing_${mockTimestamp}`);
      
      // Check that ollama.embeddings was called with the right parameters
      expect(ollama.embeddings).toHaveBeenCalledWith({
        model: expect.any(String),
        prompt: ingredients
      });
    } finally {
      // Restore the original Date.now
      Date.now = originalDateNow;
    }
  });

  test('should delete ingredients by recipe ID', async () => {
    // Add some test ingredients
    await embeddingService.addIngredient('recipe_to_delete', 'tomatoes, cheese, basil');
    await embeddingService.addIngredient('recipe_to_delete', 'flour, eggs, sugar');
    await embeddingService.addIngredient('recipe_to_keep', 'tomatoes, onions, garlic');
    
    // Delete ingredients for recipe_to_delete
    const deletedCount = await embeddingService.deleteIngredientsByRecipeId('recipe_to_delete');
    
    // Verify that the correct number of items were deleted
    expect(deletedCount).toBe(2);
    
    // Verify that remaining recipe is still there
    const results = await embeddingService.searchSimilarIngredients('tomatoes', 10);
    const recipeIds = results.map(r => r.recipe_id);
    
    // Should contain recipe_to_keep but not recipe_to_delete
    expect(recipeIds).toContain('recipe_to_keep');
    expect(recipeIds).not.toContain('recipe_to_delete');
  });

  test('should return 0 when no ingredients match recipe ID for deletion', async () => {
    // Add some test ingredients
    await embeddingService.addIngredient('recipe1', 'tomatoes, cheese, basil');
    
    // Try to delete with a non-existent recipe ID
    const deletedCount = await embeddingService.deleteIngredientsByRecipeId('non_existent_recipe');
    
    // Should return 0 as no ingredients matched
    expect(deletedCount).toBe(0);
  });

  test('should find similar ingredients', async () => {
    // Add some test ingredients
    await embeddingService.addIngredient('recipe1', 'tomatoes, cheese, basil');
    await embeddingService.addIngredient('recipe2', 'flour, eggs, sugar');
    await embeddingService.addIngredient('recipe3', 'tomatoes, onions, garlic');
    
    // Search for similar ingredients
    const results = await embeddingService.searchSimilarIngredients('tomatoes', 2);
    
    // Verify we got the expected number of results
    expect(results.length).toBeLessThanOrEqual(2);
    
    // Check that the results have the expected structure
    results.forEach(result => {
      expect(result).toHaveProperty('recipe_id');
      expect(result).toHaveProperty('ingredients');
    });
    
    // Verify that ollama.embeddings was called for the search query
    expect(ollama.embeddings).toHaveBeenCalledWith({
      model: expect.any(String),
      prompt: 'tomatoes'
    });
  });

  test('should return empty array when no similar ingredients found', async () => {
    // Search with empty database
    const results = await embeddingService.searchSimilarIngredients('something', 3);
    
    // Verify we got an empty array
    expect(results).toEqual([]);
  });

  test('should limit results to the specified number', async () => {
    // Add several test ingredients
    await embeddingService.addIngredient('recipe1', 'tomatoes, cheese, basil');
    await embeddingService.addIngredient('recipe2', 'tomatoes, pasta, oregano');
    await embeddingService.addIngredient('recipe3', 'tomatoes, onions, garlic');
    await embeddingService.addIngredient('recipe4', 'tomatoes, bell peppers, olive oil');
    
    // Search with a limit of 2
    const results = await embeddingService.searchSimilarIngredients('tomatoes', 2);
    
    // Verify we got exactly 2 results
    expect(results.length).toBe(2);
  });
}); 