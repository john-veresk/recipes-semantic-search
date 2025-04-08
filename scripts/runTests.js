/**
 * Runs all test scripts in the tests directory
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TESTS_DIR = path.join(__dirname, 'tests');

console.log('=== Running Recipes AI Tests ===');

// Ensure tests directory exists
if (!fs.existsSync(TESTS_DIR)) {
  console.log(`Creating tests directory: ${TESTS_DIR}`);
  fs.mkdirSync(TESTS_DIR, { recursive: true });
}

// Get all test files
const testFiles = fs.readdirSync(TESTS_DIR)
  .filter(file => file.endsWith('Test.js'));

console.log(`Found ${testFiles.length} test files to run`);

// Run each test file
let passedCount = 0;
let failedCount = 0;

for (const testFile of testFiles) {
  const testPath = path.join(TESTS_DIR, testFile);
  console.log(`\n=== Running ${testFile} ===`);
  
  try {
    execSync(`node ${testPath}`, { stdio: 'inherit' });
    console.log(`✅ ${testFile} completed successfully`);
    passedCount++;
  } catch (error) {
    console.error(`❌ ${testFile} failed with exit code: ${error.status}`);
    failedCount++;
  }
}

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${testFiles.length}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);

// Exit with appropriate code
process.exit(failedCount > 0 ? 1 : 0); 