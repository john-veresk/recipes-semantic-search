/**
 * This script fetches recipes from recipes API and imports ingredients to the recipe-ai service
 */
const axios = require('axios');

// Configuration
const RECIPES_API_URL = 'http://localhost:3000';
const RECIPES_AI_URL = 'http://localhost:3100';
const BATCH_SIZE = 50;
const AI_UPLOAD_CHUNK_SIZE = 10; // Number of records to upload at once to AI service
const MAX_RETRIES = 3; // Maximum number of retries for failed API calls
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after the delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates that a recipe has valid ingredients
 * @param {Object} recipe - Recipe object to validate
 * @returns {boolean} Whether the recipe has valid ingredients
 */
function hasValidIngredients(recipe) {
  return recipe && 
         recipe.ingredients && 
         Array.isArray(recipe.ingredients) && 
         recipe.ingredients.length > 0;
}

/**
 * Fetches all recipes from the source API using pagination
 * @param {number} batchSize - Number of recipes to fetch in one request
 * @returns {Promise<Array>} Array of all recipes
 */
async function fetchAllRecipes(batchSize) {
  const allRecipes = [];
  let hasMore = true;
  let cursor = null;
  let fetchCount = 0;
  
  console.log(`Starting to fetch recipes in batches of ${batchSize}...`);
  
  while (hasMore) {
    fetchCount++;
    
    // Add retry logic for fetch calls
    let retries = 0;
    let success = false;
    let recipeResult;
    
    while (!success && retries < MAX_RETRIES) {
      try {
        recipeResult = await fetchRecipesBatch(batchSize, cursor);
        success = true;
      } catch (error) {
        retries++;
        console.error(`Fetch attempt ${retries} failed. ${retries < MAX_RETRIES ? 'Retrying...' : 'Max retries reached.'}`);
        
        if (retries < MAX_RETRIES) {
          await sleep(RETRY_DELAY * retries); // Exponential backoff
        } else {
          throw new Error(`Failed to fetch recipes after ${MAX_RETRIES} attempts: ${error.message}`);
        }
      }
    }
    
    const { recipes, nextCursor, hasMoreRecipes } = recipeResult;
    
    if (recipes.length > 0) {
      allRecipes.push(...recipes);
      console.log(`Batch ${fetchCount}: Added ${recipes.length} recipes (Total: ${allRecipes.length})`);
    } else {
      console.log(`Batch ${fetchCount}: No recipes returned`);
    }
    
    cursor = nextCursor;
    hasMore = hasMoreRecipes;
  }
  
  console.log(`Completed fetching ${allRecipes.length} recipes in ${fetchCount} batches`);
  return allRecipes;
}

/**
 * Fetches a batch of recipes from the source API
 * @param {number} batchSize - Number of recipes to fetch
 * @param {string|null} cursor - Pagination cursor
 * @returns {Promise<Object>} Object containing recipes, nextCursor and hasMore flag
 */
async function fetchRecipesBatch(batchSize, cursor) {
  try {
    const params = { limit: batchSize };
    if (cursor) {
      params.cursor = cursor;
    }
    
    console.log(`Fetching recipes batch${cursor ? ' with cursor ' + cursor : ''}...`);
    const response = await axios.get(`${RECIPES_API_URL}/recipes`, { params });
    
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid response format from recipes API');
    }
    
    const recipes = response.data.data;
    const nextCursor = response.data.pagination?.next_cursor;
    const hasMoreRecipes = response.data.pagination?.has_more || false;
    
    console.log(`Fetched ${recipes.length} recipes, has more: ${hasMoreRecipes}`);
    return { recipes, nextCursor, hasMoreRecipes };
  } catch (error) {
    console.error(`Error fetching recipes: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Prepares ingredient records for the AI service
 * @param {Array} recipes - Array of recipe objects
 * @returns {Array} Array of formatted ingredient records
 */
function prepareIngredientRecords(recipes) {
  console.log(`Preparing ingredient records for ${recipes.length} recipes...`);
  
  // Filter recipes that have valid ingredients
  const validRecipes = recipes.filter(hasValidIngredients);
  
  if (validRecipes.length < recipes.length) {
    console.warn(`Filtered out ${recipes.length - validRecipes.length} recipes without valid ingredients`);
  }
  
  return validRecipes.map(recipe => ({
    recipe_id: recipe.id.toString(),
    ingredients: recipe.ingredients.join(', ')
  }));
}

/**
 * Splits an array into chunks of specified size
 * @param {Array} array - Array to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array} Array of arrays (chunks)
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Uploads a single chunk of ingredient records to the AI service
 * @param {Array} chunk - Chunk of ingredient records
 * @param {number} chunkIndex - Index of the current chunk
 * @returns {Promise<Object>} Response from the AI service
 */
async function uploadChunkToAI(chunk, chunkIndex) {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Uploading chunk ${chunkIndex + 1} with ${chunk.length} records (attempt ${retries + 1})...`);
      const response = await axios.post(`${RECIPES_AI_URL}/ingredients/batch`, {
        records: chunk
      });
      
      if (!response.data || !response.data.ids || !Array.isArray(response.data.ids)) {
        throw new Error('Invalid response format from AI service');
      }
      
      console.log(`Successfully uploaded chunk ${chunkIndex + 1}. Received ${response.data.ids.length} IDs`);
      return response.data;
    } catch (error) {
      retries++;
      console.error(`Error uploading chunk ${chunkIndex + 1} (attempt ${retries}): ${error.message}`);
      
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying chunk ${chunkIndex + 1} in ${RETRY_DELAY * retries}ms...`);
        await sleep(RETRY_DELAY * retries);
      } else {
        console.error(`Failed to upload chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts`);
        throw error;
      }
    }
  }
}

/**
 * Uploads all ingredient records to the AI service in smaller chunks
 * @param {Array} records - All ingredient records
 * @returns {Promise<Object>} Combined response with all IDs
 */
async function uploadIngredientsToAI(records) {
  console.log(`Processing ${records.length} records in chunks of ${AI_UPLOAD_CHUNK_SIZE}...`);
  
  if (records.length === 0) {
    console.warn('No valid records to upload');
    return { ids: [], successCount: 0, totalChunks: 0 };
  }
  
  // Split records into chunks
  const chunks = chunkArray(records, AI_UPLOAD_CHUNK_SIZE);
  console.log(`Split into ${chunks.length} chunks`);
  
  const allIds = [];
  let successCount = 0;
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    try {
      const result = await uploadChunkToAI(chunks[i], i);
      allIds.push(...result.ids);
      successCount++;
    } catch (error) {
      console.error(`Failed to upload chunk ${i + 1}. Continuing with next chunk...`);
    }
    
    // Add a small delay between chunks to avoid overwhelming the API
    if (i < chunks.length - 1) {
      await sleep(200);
    }
  }
  
  console.log(`Upload complete. Successfully uploaded ${successCount} of ${chunks.length} chunks.`);
  return { ids: allIds, successCount, totalChunks: chunks.length };
}

/**
 * Main function to import recipes to AI service
 */
async function importRecipesToAI() {
  console.log('Starting import process...');
  const startTime = Date.now();
  
  try {
    // Check if APIs are available
    try {
      await axios.get(`${RECIPES_API_URL}/health`);
      console.log('✅ Recipes API is available');
    } catch (error) {
      console.error(`❌ Recipes API is not available: ${error.message}`);
      process.exit(1);
    }
    
    try {
      await axios.get(`${RECIPES_AI_URL}/health`);
      console.log('✅ Recipes AI API is available');
    } catch (error) {
      console.error(`❌ Recipes AI API is not available: ${error.message}`);
      process.exit(1);
    }
    
    // Fetch all recipes from source API with pagination
    const recipes = await fetchAllRecipes(BATCH_SIZE);
    
    // Skip process if no recipes found
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found to import');
      return;
    }
    
    // Prepare ingredient records
    const records = prepareIngredientRecords(recipes);
    
    // Upload to recipe-ai service in chunks
    const result = await uploadIngredientsToAI(records);
    
    // Calculate and log stats
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n======= IMPORT SUMMARY =======');
    console.log(`Total recipes processed: ${recipes.length}`);
    console.log(`Total ingredients uploaded: ${result.ids.length}`);
    console.log(`Chunks: ${result.successCount}/${result.totalChunks} successful`);
    console.log(`Execution time: ${duration.toFixed(2)} seconds`);
    console.log(`Average time per recipe: ${(duration / recipes.length).toFixed(3)} seconds`);
    console.log('==============================');
    
  } catch (error) {
    console.error(`❌ Import process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the import process if this is the main module
if (require.main === module) {
  importRecipesToAI();
}

// Export functions for testing
module.exports = {
  fetchAllRecipes,
  prepareIngredientRecords,
  uploadIngredientsToAI,
  chunkArray,
  hasValidIngredients
}; 