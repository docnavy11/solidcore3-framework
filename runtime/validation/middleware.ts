// Validation middleware for API routes

import { Context, Next } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { ValidationSchema } from '../../core/validation/types.ts';
import { RuntimeDataValidator } from './validator.ts';

export function validationMiddleware(schema: ValidationSchema) {
  const validator = new RuntimeDataValidator();

  return async (c: Context, next: Next) => {
    try {
      // Get request data
      const contentType = c.req.header('content-type') || '';
      let data: Record<string, any> = {};

      if (contentType.includes('application/json')) {
        data = await c.req.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.formData();
        data = Object.fromEntries(formData.entries());
      }

      // Validate the data
      const result = await validator.validate(data, schema);

      if (!result.isValid) {
        return c.json({
          success: false,
          message: 'Validation failed',
          errors: result.errors
        }, 400);
      }

      // Store validated and sanitized data for use in handlers
      c.set('validatedData', result.sanitizedData);
      c.set('originalData', data);

      await next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return c.json({
        success: false,
        message: 'Validation error',
        error: error.message
      }, 500);
    }
  };
}

// Create validation middleware for specific entity operations
export function createEntityValidationMiddleware(entityName: string, operation: 'create' | 'update') {
  return (schema: ValidationSchema) => {
    return validationMiddleware(schema);
  };
}

// Validation middleware for query parameters
export function queryValidationMiddleware(allowedParams: string[], requiredParams: string[] = []) {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const errors: Array<{field: string, message: string, code: string}> = [];

    // Check required parameters
    for (const param of requiredParams) {
      if (!query[param]) {
        errors.push({
          field: param,
          message: `Query parameter '${param}' is required`,
          code: 'REQUIRED'
        });
      }
    }

    // Check for invalid parameters
    for (const param of Object.keys(query)) {
      if (!allowedParams.includes(param)) {
        errors.push({
          field: param,
          message: `Unknown query parameter '${param}'`,
          code: 'UNKNOWN_PARAM'
        });
      }
    }

    if (errors.length > 0) {
      return c.json({
        success: false,
        message: 'Invalid query parameters',
        errors
      }, 400);
    }

    c.set('validatedQuery', query);
    await next();
  };
}