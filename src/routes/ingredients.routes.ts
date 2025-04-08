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
    
    const results = await embeddingService.searchSimilarIngredients(ingredients, limit);
    
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

// Route to delete ingredients by recipe_id
const deleteIngredients: RequestHandler = async (req, res) => {
  try {
    const recipe_id = req.query.recipe_id as string;
    
    if (!recipe_id || typeof recipe_id !== 'string') {
      res.status(400).json({ error: 'recipe_id query parameter is required and must be a string' });
      return;
    }
    
    const deletedCount = await embeddingService.deleteIngredientsByRecipeId(recipe_id);
    
    res.json({ 
      success: true, 
      message: `Ingredients for recipe ${recipe_id} deleted successfully`,
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting ingredients:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete ingredients' 
    });
  }
};

// Route to batch add ingredients
const addIngredientsBatch: RequestHandler = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records)) {
      res.status(400).json({ error: 'records must be an array of ingredient records' });
      return;
    }
    
    if (records.length === 0) {
      res.status(400).json({ error: 'records array cannot be empty' });
      return;
    }
    
    // Validate each record in the batch
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (!record.recipe_id || typeof record.recipe_id !== 'string') {
        res.status(400).json({ 
          error: `Invalid record at index ${i}: recipe_id is required and must be a string` 
        });
        return;
      }
      
      if (!record.ingredients || typeof record.ingredients !== 'string') {
        res.status(400).json({ 
          error: `Invalid record at index ${i}: ingredients is required and must be a string` 
        });
        return;
      }
    }
    
    const ids = await embeddingService.addIngredientsBatch(records);
    
    res.status(201).json({ 
      success: true, 
      message: `${ids.length} ingredient records added successfully`,
      ids
    });
  } catch (error) {
    console.error('Error adding ingredients batch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add ingredients batch' 
    });
  }
};

// Register routes
router.post('/', addIngredients);
router.post('/search', searchIngredients);
router.post('/batch', addIngredientsBatch);
router.delete('/', deleteIngredients);

export default router; 