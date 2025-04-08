/**
 * This script checks the status of the recipe-ai service and retrieves statistics
 * about imported ingredients.
 */
const axios = require('axios');

// Configuration
const RECIPES_AI_URL = 'http://localhost:3100';

/**
 * Formats a number with commas for better readability
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Checks the health status of the recipe-ai service
 * @returns {Promise<Object>} Health status object
 */
async function checkHealth() {
  try {
    console.log('Checking recipe-ai service health...');
    const response = await axios.get(`${RECIPES_AI_URL}/health`);
    console.log('✅ Recipe-AI service is healthy');
    return response.data;
  } catch (error) {
    console.error(`❌ Recipe-AI service health check failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Performs a sample search to test the recipe-ai service functionality
 * @param {string} query - Ingredients to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Search results
 */
async function testSearch(query, limit = 5) {
  try {
    console.log(`Testing search with query: "${query}" (limit: ${limit})...`);
    const response = await axios.post(`${RECIPES_AI_URL}/ingredients/search`, {
      ingredients: query,
      limit
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.results)) {
      console.log(`✅ Search returned ${response.data.results.length} results`);
      return response.data.results;
    } else {
      console.error('❌ Search response has unexpected format');
      return [];
    }
  } catch (error) {
    console.error(`❌ Search failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Main function to check AI service status
 */
async function checkAIStatus() {
  console.log('===== Recipe-AI Service Status Check =====');
  
  try {
    // Check health
    const healthStatus = await checkHealth();
    console.log(`Service time: ${new Date(healthStatus.timestamp).toLocaleString()}`);
    
    // Sample searches to verify functionality
    const searchQueries = [
      'chicken, garlic, lemon',
      'flour, sugar, eggs',
      'tomato, basil, mozzarella',
    ];
    
    console.log('\n===== Testing Search Functionality =====');
    for (const query of searchQueries) {
      const results = await testSearch(query);
      
      if (results.length > 0) {
        console.log(`\nTop results for "${query}":`);
        results.forEach((result, index) => {
          console.log(`${index + 1}. Recipe ID: ${result.recipe_id}`);
          // Truncate ingredients if too long
          const ingredients = result.ingredients.length > 100 
            ? result.ingredients.substring(0, 100) + '...' 
            : result.ingredients;
          console.log(`   Ingredients: ${ingredients}`);
        });
      } else {
        console.log(`No results found for "${query}"`);
      }
    }
    
    console.log('\n===== Status Check Complete =====');
    console.log('✅ Recipe-AI service is operational');
    
  } catch (error) {
    console.error('\n❌ Status check failed');
    process.exit(1);
  }
}

// Run the status check if this is the main module
if (require.main === module) {
  checkAIStatus();
}

// Export functions for reuse in other scripts
module.exports = {
  checkHealth,
  testSearch
}; 