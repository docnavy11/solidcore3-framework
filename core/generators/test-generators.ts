// Test the simplified generator pattern
import { APIGenerator, UIGenerator, DashboardGenerator, Generator, GeneratorError } from './index.ts';
import { AppDefinition } from '../types/index.ts';

// Test generator with the simplified pattern
class TestGenerator implements Generator<string> {
  constructor(private app: AppDefinition, private testData: string) {}

  async generate(): Promise<string> {
    console.log(`[TestGenerator] Generating test for ${this.app.name}`);
    
    if (!this.testData) {
      throw new GeneratorError('TestGenerator', 'No test data provided');
    }

    console.log('[TestGenerator] Done');
    return `Generated: ${this.testData}`;
  }
}

async function testGenerators() {
  console.log('🧪 Testing Generator Pattern...\n');

  // Create a minimal app definition for testing
  const testApp: AppDefinition = {
    name: 'TestApp',
    entities: {
      Task: {
        fields: {
          id: { type: 'string', auto: true, unique: true },
          title: { type: 'string', required: true }
        },
        permissions: {
          create: 'true',
          read: 'true',
          update: 'true',
          delete: 'true'
        }
      }
    }
  };

  // Test 1: Custom test generator
  console.log('Test 1: Custom test generator');
  try {
    const testGen = new TestGenerator(testApp, 'test-data');
    const result = await testGen.generate();
    console.log('✅ Test generator succeeded:', result);
    console.log('');
  } catch (error) {
    console.error('❌ Test generator failed:', error);
  }

  // Test 2: API Generator
  console.log('Test 2: API Generator');
  try {
    const apiGen = new APIGenerator(testApp);
    const api = await apiGen.generate();
    console.log('✅ API generator succeeded, routes created');
    console.log('');
  } catch (error) {
    console.error('❌ API generator failed:', error);
  }

  // Test 3: UI Generator  
  console.log('Test 3: UI Generator');
  try {
    const uiGen = new UIGenerator(testApp);
    const pages = await uiGen.generate();
    console.log('✅ UI generator succeeded, pages created:', Object.keys(pages));
    console.log('');
  } catch (error) {
    console.error('❌ UI generator failed:', error);
  }

  // Test 4: Dashboard Generator
  console.log('Test 4: Dashboard Generator');
  try {
    const dashGen = new DashboardGenerator(testApp);
    const dashboard = await dashGen.generate();
    console.log('✅ Dashboard generator succeeded, pages created:', Object.keys(dashboard));
    console.log('');
  } catch (error) {
    console.error('❌ Dashboard generator failed:', error);
  }

  // Test 5: Error handling
  console.log('Test 5: Error handling');
  try {
    const emptyApp: AppDefinition = { name: 'EmptyApp' };
    const apiGen = new APIGenerator(emptyApp);
    await apiGen.generate();
    console.log('❌ Should have thrown an error');
  } catch (error) {
    if (error instanceof GeneratorError) {
      console.log('✅ Error handling works:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }

  console.log('\n🎉 Generator pattern testing complete!');
}

// Run tests if this file is executed directly
if (import.meta.main) {
  testGenerators();
}