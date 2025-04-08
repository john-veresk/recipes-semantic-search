/**
 * Test script for import recipes functionality
 */
const { 
  chunkArray, 
  hasValidIngredients, 
  prepareIngredientRecords 
} = require('../importRecipesToAI');

// Test recipe data
const mockRecipes = [
  {
    id: 1,
    title: 'Chocolate Cake',
    ingredients: ['flour', 'sugar', 'cocoa powder']
  },
  {
    id: 2,
    title: 'Chicken Soup',
    ingredients: ['chicken', 'carrots', 'celery']
  },
  {
    id: 3,
    title: 'Invalid Recipe',
    ingredients: []
  },
  {
    id: 4,
    title: 'Another Invalid Recipe',
    ingredients: null
  },
  {
    id: 5,
    title: 'Valid Recipe',
    ingredients: ['salt', 'pepper']
  }
];

/**
 * Simple test runner
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
function runTest(name, testFn) {
  try {
    console.log(`Running test: ${name}`);
    testFn();
    console.log(`✅ Test passed: ${name}`);
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(error);
  }
}

// Test chunkArray function
runTest('chunkArray should split array into equal chunks', () => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const chunks = chunkArray(array, 3);
  
  if (chunks.length !== 4) {
    throw new Error(`Expected 4 chunks, got ${chunks.length}`);
  }
  
  if (chunks[0].length !== 3 || chunks[1].length !== 3 || chunks[2].length !== 3 || chunks[3].length !== 1) {
    throw new Error('Chunks have incorrect sizes');
  }
});

// Test hasValidIngredients function
runTest('hasValidIngredients should identify valid recipes', () => {
  if (!hasValidIngredients(mockRecipes[0])) {
    throw new Error('Failed to identify valid recipe: ' + JSON.stringify(mockRecipes[0]));
  }
  
  if (hasValidIngredients(mockRecipes[2])) {
    throw new Error('Incorrectly identified empty ingredients as valid');
  }
  
  if (hasValidIngredients(mockRecipes[3])) {
    throw new Error('Incorrectly identified null ingredients as valid');
  }
});

// Test prepareIngredientRecords function
runTest('prepareIngredientRecords should format and filter recipes', () => {
  const records = prepareIngredientRecords(mockRecipes);
  
  if (records.length !== 3) {
    throw new Error(`Expected 3 records after filtering, got ${records.length}`);
  }
  
  if (records[0].recipe_id !== '1' || records[0].ingredients !== 'flour, sugar, cocoa powder') {
    throw new Error('First record has incorrect format: ' + JSON.stringify(records[0]));
  }
});

console.log('\nAll tests completed.'); 