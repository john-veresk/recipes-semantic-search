/**
 * This script fetches the OpenAPI spec and saves it to the docs directory
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OPENAPI_URL = 'http://localhost:3000/openapi.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'recipes-api.json');

async function fetchOpenApiSpec() {
  try {
    const response = await axios.get(OPENAPI_URL);
    
    // Ensure the docs directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Write the OpenAPI spec to a file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(response.data, null, 2));
    console.log(`OpenAPI spec saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error fetching or saving OpenAPI spec:');
    console.error(error.message);
    process.exit(1);
  }
}

fetchOpenApiSpec(); 