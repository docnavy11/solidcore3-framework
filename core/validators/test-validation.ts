// Test the truth file validation system
import { TruthFileValidator } from './truth-validator.ts';
import { AppDefinition } from '../types/index.ts';

function testValidation() {
  console.log('🧪 Testing Truth File Validation System...\n');
  
  const validator = new TruthFileValidator();
  
  // Test 1: Valid truth file
  console.log('Test 1: Valid truth file');
  const validApp: AppDefinition = {
    name: 'TestApp',
    entities: {
      Task: {
        fields: {
          id: { type: 'string', auto: true, unique: true },
          title: { type: 'string', required: true },
          status: { type: 'enum', options: ['todo', 'done'], default: 'todo' },
          priority: { type: 'enum', options: ['low', 'medium', 'high'] },
          createdAt: { type: 'date', auto: true }
        },
        permissions: {
          create: 'true',
          read: 'true',
          update: 'user.role == "admin" || user.id == entityId',
          delete: 'user.role == "admin"'
        },
        behaviors: {
          complete: {
            type: 'update',
            fields: { status: 'done' }
          }
        }
      }
    },
    views: {
      TaskList: {
        type: 'list',
        entity: 'Task',
        route: '/tasks'
      },
      CreateTask: {
        type: 'form',
        entity: 'Task',
        route: '/tasks/new',
        mode: 'create'
      }
    },
    workflows: {
      notifyCompletion: {
        trigger: 'Task.complete',
        condition: 'priority == "high"',
        actions: [
          { type: 'email', to: 'admin@example.com', message: 'High priority task completed' }
        ]
      }
    }
  };
  
  const result1 = validator.validate(validApp);
  console.log(`✅ Valid app result: ${result1.isValid ? 'PASS' : 'FAIL'}`);
  console.log(`   Errors: ${result1.errors.length}, Warnings: ${result1.warnings.length}`);
  if (result1.warnings.length > 0) {
    console.log(`   Sample warning: ${result1.warnings[0].message}`);
  }
  console.log('');
  
  // Test 2: Invalid truth file - missing app name
  console.log('Test 2: Invalid truth file - missing app name');
  const invalidApp1: any = {
    entities: {
      Task: {
        fields: {
          id: { type: 'string' }
        }
      }
    }
  };
  
  const result2 = validator.validate(invalidApp1);
  console.log(`❌ Invalid app result: ${result2.isValid ? 'FAIL' : 'PASS'}`);
  console.log(`   Errors: ${result2.errors.length}, Warnings: ${result2.warnings.length}`);
  if (result2.errors.length > 0) {
    console.log(`   Sample error: [${result2.errors[0].code}] ${result2.errors[0].message}`);
    console.log(`   Suggestion: ${result2.errors[0].suggestion}`);
  }
  console.log('');
  
  // Test 3: Invalid field types
  console.log('Test 3: Invalid field types');
  const invalidApp2: AppDefinition = {
    name: 'TestApp',
    entities: {
      User: {
        fields: {
          id: { type: 'string' },
          name: { type: 'invalid_type' as any },
          age: { type: 'number', min: 100, max: 50 }, // Invalid range
          status: { type: 'enum', options: [] }, // Empty enum
          profileRef: { type: 'reference' } // Missing entity
        }
      }
    }
  };
  
  const result3 = validator.validate(invalidApp2);
  console.log(`❌ Invalid fields result: ${result3.isValid ? 'FAIL' : 'PASS'}`);
  console.log(`   Errors: ${result3.errors.length}, Warnings: ${result3.warnings.length}`);
  if (result3.errors.length > 0) {
    console.log(`   Field errors found:`);
    result3.errors.slice(0, 3).forEach(error => {
      console.log(`     [${error.code}] ${error.path}: ${error.message}`);
    });
  }
  console.log('');
  
  // Test 4: Invalid workflow syntax
  console.log('Test 4: Invalid workflow syntax');
  const invalidApp3: AppDefinition = {
    name: 'TestApp',
    entities: {
      Task: {
        fields: {
          id: { type: 'string' },
          status: { type: 'string' }
        }
      }
    },
    workflows: {
      badWorkflow: {
        trigger: 'InvalidEntity.someAction',
        condition: 'status == unclosed string',
        actions: [
          { type: 'email' } // Missing required 'to' field
        ]
      }
    }
  };
  
  const result4 = validator.validate(invalidApp3);
  console.log(`❌ Invalid workflow result: ${result4.isValid ? 'FAIL' : 'PASS'}`);
  console.log(`   Errors: ${result4.errors.length}, Warnings: ${result4.warnings.length}`);
  if (result4.errors.length > 0) {
    console.log(`   Workflow errors found:`);
    result4.errors.slice(0, 3).forEach(error => {
      console.log(`     [${error.code}] ${error.path}: ${error.message}`);
    });
  }
  console.log('');
  
  // Test 5: Performance test
  console.log('Test 5: Performance test');
  const startTime = Date.now();
  for (let i = 0; i < 100; i++) {
    validator.validate(validApp);
  }
  const endTime = Date.now();
  console.log(`✅ 100 validations completed in ${endTime - startTime}ms (avg: ${(endTime - startTime) / 100}ms)`);
  console.log('');
  
  console.log('🎉 Truth file validation testing complete!');
}

// Run tests if this file is executed directly
if (import.meta.main) {
  testValidation();
}