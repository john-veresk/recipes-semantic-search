# Project structure 

This document outlines the organization of the recipes-ai project codebase.

## Root Directory
- `/src` - Main source code folder
- `/docs` - Project documentation
- `/dist` - Compiled JavaScript output
- `/coverage` - Test coverage reports
- `/node_modules` - External dependencies
- `.gitignore` - Git ignore configuration
- `jest.config.js` - Jest testing configuration
- `package.json` - Project metadata and dependencies
- `package-lock.json` - Locked dependency versions
- `tsconfig.json` - TypeScript configuration
- `README.md` - Project overview

## Source Code Organization
- `/src/index.ts` - Application entry point
- `/src/app.ts` - Express app configuration
- `/src/__tests__` - Test files for the application
- `/src/routes` - API routes and handlers
- `/src/openapi` - OpenAPI schema definitions
- `/src/services` - Business logic services
  - `/src/services/embedding.service.ts` - Handles text embedding functionality
- `/src/testUtils` - Utilities for testing
  - `/src/testUtils/stubs` - Stub implementations for testing

## Documentation
- `/docs/project-structure.md` - This file, explaining the codebase organization