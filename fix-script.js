// Quick fix script to replace all ApiError patterns
// This will be used to systematically fix all route files

import fs from 'fs';
import path from 'path';

const routeDir = './server/routes';
const files = [
  'assignments-events-comprehensive.ts',
  'batches-comprehensive.ts', 
  'classrooms-comprehensive.ts',
  'database-verification.ts',
  'departments.ts',
  'faculty-comprehensive.ts',
  'scheduled-classes-comprehensive.ts',
  'subjects-comprehensive.ts'
];

// Patterns to fix
const fixes = [
  // Add imports
  {
    search: /^(import.*from "@shared\/supabase";)$/m,
    replace: '$1\nimport { createEnhancedApiError, createPaginatedResponse } from "@shared/error-utils";'
  },
  
  // Fix ApiError patterns
  {
    search: /\{\s*error:\s*(['"].*?['"])\s*,\s*message:\s*(.*?)\s*,\s*status:\s*(\d+)\s*\}\s*as\s*ApiError/g,
    replace: 'createEnhancedApiError($1.replace(/[\'\"]/g, "").toUpperCase().replace(/\s+/g, "_"), $2)'
  },
  
  // Fix ApiError with details
  {
    search: /\{\s*error:\s*(['"].*?['"])\s*,\s*message:\s*(.*?)\s*,\s*status:\s*(\d+)\s*,\s*details:\s*(.*?)\s*\}\s*as\s*ApiError/g,
    replace: 'createEnhancedApiError($1.replace(/[\'\"]/g, "").toUpperCase().replace(/\s+/g, "_"), $2, $4)'
  }
];

console.log('This is a reference script for fixing patterns. Manual fixes needed.');