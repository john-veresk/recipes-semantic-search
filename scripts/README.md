# Recipes Scripts

This directory contains utility scripts for the Recipes AI application.

## Available Scripts

### Import Recipes to AI

Imports recipes from the recipes API (localhost:3000) to the Recipes AI service (localhost:3100).

```bash
node importRecipesToAI.js
```

This script will:
1. Fetch recipes from the recipes API (in batches of 50)
2. Extract recipe IDs and ingredients
3. Upload them to the Recipes AI service for vector embedding (in chunks of 10)
4. Provide execution statistics

#### Features:
- Pagination support (fetches all available recipes)
- Chunked uploads to avoid overwhelming the AI service
- Error handling with retries
- Validation of recipe data
- Detailed logging

### Check AI Service Status

Checks the status of the recipe-ai service and tests its search functionality.

```bash
node checkAIStatus.js
```

This script will:
1. Verify the health of the recipe-ai service
2. Run sample searches with different ingredient combinations
3. Display search results

### Delete All Ingredients

Deletes all ingredients from the recipe-ai service. Use with caution!

```bash
node deleteAllIngredients.js
```

This script will:
1. Confirm the deletion operation with the user
2. Delete all ingredients from the recipe-ai service
3. Display the number of deleted entries

### Fetch OpenAPI Spec

Fetches the OpenAPI specification from the recipes API and saves it to the docs directory.

```bash
node fetchRecipesSpec.js
```

## Testing

To run all tests:

```bash
node runTests.js
```

To run a specific test:

```bash
node tests/importRecipesTest.js
```

## Requirements

These scripts require the following dependencies:
- axios
- node.js v14+ (for modern JavaScript features)

Make sure the services are running before executing the scripts:
- Recipes API on http://localhost:3000
- Recipes AI service on http://localhost:3100 