/**
 * This script deletes all ingredients from the recipe-ai service.
 * Use with caution! This will remove all data from the vector database.
 */
const axios = require('axios');
const readline = require('readline');

// Configuration
const RECIPES_AI_URL = 'http://localhost:3100';

/**
 * Creates a readline interface for user input
 * @returns {readline.Interface} Readline interface
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Asks the user for confirmation before proceeding
 * @param {string} message - Message to display to the user
 * @returns {Promise<boolean>} Whether the user confirmed or not
 */
async function confirmAction(message) {
  const rl = createInterface();
  
  return new Promise(resolve => {
    rl.question(`${message} (yes/no): `, answer => {
      rl.close();
      const normalizedAnswer = answer.toLowerCase().trim();
      resolve(normalizedAnswer === 'yes' || normalizedAnswer === 'y');
    });
  });
}

/**
 * Deletes all ingredients from the recipe-ai service
 * @returns {Promise<Object>} API response
 */
async function deleteAllIngredients() {
  try {
    console.log('Deleting all ingredients from the recipe-ai service...');
    const response = await axios.delete(`${RECIPES_AI_URL}/ingredients`, {
      params: {
        recipe_id: '*'  // Special value to delete all ingredients
      }
    });
    
    if (response.data && response.data.success) {
      console.log(`✅ Successfully deleted ${response.data.deletedCount} ingredients`);
      return response.data;
    } else {
      throw new Error('Invalid response format from recipe-ai service');
    }
  } catch (error) {
    console.error(`❌ Failed to delete ingredients: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Main function to run the delete operation
 */
async function runDeleteOperation() {
  console.log('===== Recipe-AI Ingredient Deletion =====');
  console.log('WARNING: This will delete ALL ingredients from the recipe-ai service.');
  console.log('This operation cannot be undone.');
  
  try {
    // Check if API is available
    try {
      await axios.get(`${RECIPES_AI_URL}/health`);
      console.log('✅ Recipe-AI service is available');
    } catch (error) {
      console.error(`❌ Recipe-AI service is not available: ${error.message}`);
      process.exit(1);
    }
    
    // Ask for confirmation
    const confirmed = await confirmAction('Are you sure you want to delete ALL ingredients?');
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }
    
    // Double-check for production environments
    if (process.env.NODE_ENV === 'production') {
      const doubleConfirmed = await confirmAction('⚠️ You are in PRODUCTION environment. Really proceed with deletion?');
      
      if (!doubleConfirmed) {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    // Proceed with deletion
    const result = await deleteAllIngredients();
    
    console.log('\n===== Operation Complete =====');
    console.log(`Deleted ${result.deletedCount} ingredients`);
    console.log(`Message: ${result.message}`);
    
  } catch (error) {
    console.error('\n❌ Delete operation failed');
    process.exit(1);
  }
}

// Run the delete operation if this is the main module
if (require.main === module) {
  runDeleteOperation();
}

// Export functions for reuse in other scripts
module.exports = {
  deleteAllIngredients,
  confirmAction
}; 