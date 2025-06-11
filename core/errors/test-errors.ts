// Test the error system
import { 
  FrameworkError,
  ValidationError,
  InvalidFieldTypeError,
  DatabaseError,
  EntityNotFoundError,
  ResponseBuilder,
  generateSuggestions,
  ErrorCode
} from './index.ts';

function testErrors() {
  console.log('🧪 Testing Framework Error System...\n');
  
  // Test 1: Basic FrameworkError
  console.log('Test 1: Basic FrameworkError');
  const basicError = new FrameworkError(
    ErrorCode.VALIDATION_FAILED,
    'Test validation error',
    { field: 'name', value: null }
  );
  console.log(`✅ Error: ${basicError.toString()}`);
  console.log(`   Code: ${basicError.code}`);
  console.log(`   Context: ${JSON.stringify(basicError.context)}`);
  console.log('');
  
  // Test 2: Specialized ValidationError
  console.log('Test 2: Specialized ValidationError');
  const validationError = new ValidationError(
    'Field validation failed',
    'email',
    'invalid-email',
    'Must be a valid email format'
  );
  const suggestions = generateSuggestions(validationError);
  console.log(`✅ Validation Error: ${validationError.message}`);
  console.log(`   Suggestions: ${suggestions.join(', ')}`);
  console.log('');
  
  // Test 3: InvalidFieldTypeError
  console.log('Test 3: InvalidFieldTypeError');
  const fieldTypeError = new InvalidFieldTypeError(
    'status',
    'invalid_type',
    ['string', 'number', 'boolean', 'date', 'enum', 'reference']
  );
  const fieldSuggestions = generateSuggestions(fieldTypeError);
  console.log(`✅ Field Type Error: ${fieldTypeError.message}`);
  console.log(`   Suggestions: ${fieldSuggestions.join(', ')}`);
  console.log('');
  
  // Test 4: DatabaseError
  console.log('Test 4: DatabaseError');
  const originalError = new Error('Connection timeout');
  const dbError = new DatabaseError(
    'select',
    originalError,
    'SELECT * FROM users WHERE id = ?',
    'users'
  );
  console.log(`✅ Database Error: ${dbError.message}`);
  console.log(`   Caused by: ${dbError.cause?.message}`);
  console.log('');
  
  // Test 5: EntityNotFoundError
  console.log('Test 5: EntityNotFoundError');
  const notFoundError = new EntityNotFoundError(
    'User',
    '12345',
    '/api/users/12345'
  );
  const notFoundSuggestions = generateSuggestions(notFoundError);
  console.log(`✅ Not Found Error: ${notFoundError.message}`);
  console.log(`   Suggestions: ${notFoundSuggestions.join(', ')}`);
  console.log('');
  
  // Test 6: ResponseBuilder success
  console.log('Test 6: ResponseBuilder success');
  const requestId = crypto.randomUUID();
  const responseBuilder = new ResponseBuilder(requestId);
  const successResponse = responseBuilder.success({ id: 1, name: 'Test User' });
  console.log(`✅ Success Response:`, JSON.stringify(successResponse, null, 2));
  console.log('');
  
  // Test 7: ResponseBuilder error
  console.log('Test 7: ResponseBuilder error');
  const errorResponse = responseBuilder.error(validationError);
  console.log(`✅ Error Response:`, JSON.stringify(errorResponse, null, 2));
  console.log('');
  
  // Test 8: ResponseBuilder convenience methods
  console.log('Test 8: ResponseBuilder convenience methods');
  const notFoundResponse = responseBuilder.notFound('Task', '999');
  console.log(`✅ Not Found Response:`, JSON.stringify(notFoundResponse, null, 2));
  console.log('');
  
  // Test 9: Error JSON serialization
  console.log('Test 9: Error JSON serialization');
  const jsonError = basicError.toJSON();
  console.log(`✅ Error JSON:`, JSON.stringify(jsonError, null, 2));
  console.log('');
  
  // Test 10: Error type checking
  console.log('Test 10: Error type checking');
  console.log(`✅ Is FrameworkError: ${FrameworkError.isFrameworkError(basicError)}`);
  console.log(`✅ Is FrameworkError (regular Error): ${FrameworkError.isFrameworkError(new Error('test'))}`);
  console.log(`✅ Error Code: ${FrameworkError.getErrorCode(basicError)}`);
  console.log('');
  
  console.log('🎉 Framework error system testing complete!');
}

// Run tests if this file is executed directly
if (import.meta.main) {
  testErrors();
}