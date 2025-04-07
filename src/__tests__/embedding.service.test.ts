import { jest } from '@jest/globals';
import { EmbeddingService } from '../services/embedding.service';
import { ChromaClientStub } from '../testUtils/stubs/chroma.stub';

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
  let chromaClientStub: ChromaClientStub;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new stub client for each test
    chromaClientStub = new ChromaClientStub();
    
    // Create embedding service with the stub client
    embeddingService = new EmbeddingService(chromaClientStub as any);
    
    // Initialize the service
    await embeddingService.initialize();
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