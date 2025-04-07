import { Router, RequestHandler } from 'express';
import embeddingService from '../services/embedding.service';

const router = Router();

// Route to add ingredients
const addIngredients: RequestHandler = async (req, res) => {
  try {
    const { recipe_id, ingredients } = req.body;
    
    if (!recipe_id || typeof recipe_id !== 'string') {
      res.status(400).json({ error: 'recipe_id is required and must be a string' });
      return;
    }
    
    if (!ingredients || typeof ingredients !== 'string') {
      res.status(400).json({ error: 'ingredients is required and must be a string' });
      return;
    }
    
    const id = await embeddingService.addIngredient(recipe_id, ingredients);
    
    res.status(201).json({ 
      success: true, 
      message: 'Ingredients added successfully',
      id
    });
  } catch (error) {
    console.error('Error adding ingredients:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add ingredients' 
    });
  }
};

// Route to search for matching ingredients
const searchIngredients: RequestHandler = async (req, res) => {
  try {
    const { ingredients, limit } = req.body;
    
    if (!ingredients || typeof ingredients !== 'string') {
      res.status(400).json({ error: 'ingredients query is required and must be a string' });
      return;
    }
    
    const results = await embeddingService.searchSimilarIngredients(ingredients, limit || 3);
    
    res.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search ingredients' 
    });
  }
};

// Register routes
router.post('/', addIngredients);
router.post('/search', searchIngredients);

export default router; 