// Simple test file for SafeExpressionParser
import { SafeExpressionParser } from './parser.ts';

function testExpressionParser() {
  const parser = new SafeExpressionParser();
  
  console.log('🧪 Testing SafeExpressionParser...\n');
  
  // Test cases
  const tests = [
    // Basic comparisons
    { expr: 'status == "active"', context: { status: 'active' }, expected: true },
    { expr: 'status != "inactive"', context: { status: 'active' }, expected: true },
    { expr: 'priority == "high"', context: { priority: 'low' }, expected: false },
    
    // Numeric comparisons
    { expr: 'age > 18', context: { age: 25 }, expected: true },
    { expr: 'score >= 90', context: { score: 90 }, expected: true },
    { expr: 'count < 10', context: { count: 15 }, expected: false },
    { expr: 'price <= 100', context: { price: 50 }, expected: true },
    
    // Boolean values
    { expr: 'isActive == true', context: { isActive: true }, expected: true },
    { expr: 'isDeleted != true', context: { isDeleted: false }, expected: true },
    { expr: 'enabled', context: { enabled: true }, expected: true },
    { expr: '!disabled', context: { disabled: false }, expected: true },
    
    // Logical operators
    { expr: 'status == "active" && priority == "high"', context: { status: 'active', priority: 'high' }, expected: true },
    { expr: 'status == "active" && priority == "low"', context: { status: 'active', priority: 'low' }, expected: true },
    { expr: 'status == "active" || priority == "high"', context: { status: 'inactive', priority: 'high' }, expected: true },
    { expr: 'status == "inactive" || priority == "low"', context: { status: 'inactive', priority: 'high' }, expected: true },
    
    // Dot notation
    { expr: 'user.role == "admin"', context: { user: { role: 'admin' } }, expected: true },
    { expr: 'config.debug == true', context: { config: { debug: false } }, expected: false },
    
    // Parentheses
    { expr: '(status == "active" || status == "pending") && priority == "high"', 
      context: { status: 'pending', priority: 'high' }, expected: true },
    { expr: '!(status == "inactive" && priority == "low")', 
      context: { status: 'active', priority: 'low' }, expected: true },
      
    // Complex workflow conditions
    { expr: 'priority == "high" && entity == "Task"', 
      context: { priority: 'high', entity: 'Task' }, expected: true },
    { expr: 'behavior == "completed" && data.status == "done"', 
      context: { behavior: 'completed', data: { status: 'done' } }, expected: true }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = parser.evaluate(test.expr, test.context);
    
    if (!result.success) {
      console.log(`❌ PARSE ERROR: ${test.expr}`);
      console.log(`   Error: ${result.error}`);
      failed++;
      continue;
    }
    
    if (result.value === test.expected) {
      console.log(`✅ PASS: ${test.expr} => ${result.value}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.expr}`);
      console.log(`   Expected: ${test.expected}, Got: ${result.value}`);
      console.log(`   Context: ${JSON.stringify(test.context)}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  // Test syntax validation
  console.log('\n🔍 Testing syntax validation...');
  
  const syntaxTests = [
    { expr: 'status == "active"', valid: true },
    { expr: 'status = "active"', valid: false }, // Single = should fail
    { expr: 'status == "unclosed string', valid: false }, // Unclosed string
    { expr: 'status == active"', valid: false }, // Malformed string
    { expr: '(status == "active"', valid: false }, // Unmatched parentheses
    { expr: 'status == "active" &&', valid: false }, // Incomplete expression
    { expr: '', valid: false }, // Empty expression
  ];
  
  for (const test of syntaxTests) {
    const result = parser.validate(test.expr);
    const symbol = result.success === test.valid ? '✅' : '❌';
    console.log(`${symbol} Syntax: "${test.expr}" => ${result.success ? 'valid' : 'invalid'}`);
    if (!result.success && test.valid) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n🎉 Expression parser testing complete!');
}

// Run tests if this file is executed directly
if (import.meta.main) {
  testExpressionParser();
}