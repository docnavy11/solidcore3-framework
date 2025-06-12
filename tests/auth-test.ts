#!/usr/bin/env -S deno run --allow-all

/**
 * Simple authentication system test
 * This tests the core authentication functionality without external dependencies
 */

import AuthService from '../runtime/auth/service.ts';
import PermissionEvaluator from '../runtime/auth/permission-evaluator.ts';
import { AuthUser } from '../runtime/auth/middleware.ts';

// Mock database for testing
class MockDatabase {
  private users: any[] = [];
  private nextId = 1;

  async execute(sql: string, params: any[] = []): Promise<any> {
    console.log(`Mock DB Query: ${sql}`, params);
    
    if (sql.includes('INSERT INTO user')) {
      const user = {
        id: params[0],
        email: params[1],
        password: params[2],
        name: params[3],
        role: params[4],
        is_active: params[5],
        created_at: params[6],
        updated_at: params[7]
      };
      this.users.push(user);
      return { changes: 1 };
    }
    
    if (sql.includes('SELECT') && sql.includes('user')) {
      if (sql.includes('WHERE email = ?')) {
        const email = params[0];
        const user = this.users.find(u => u.email === email);
        return { rows: user ? [user] : [] };
      }
      
      if (sql.includes('WHERE id = ?')) {
        const id = params[0];
        const user = this.users.find(u => u.id === id);
        return { rows: user ? [user] : [] };
      }
    }
    
    if (sql.includes('UPDATE user SET last_login_at')) {
      return { changes: 1 };
    }
    
    return { rows: [], changes: 0 };
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return fn(this);
  }
}

async function testAuthService() {
  console.log('\n🧪 Testing Authentication Service...\n');
  
  // Mock the database client
  const mockDb = new MockDatabase();
  
  // Override the getDatabase function for testing
  const originalGetDatabase = globalThis.getDatabase;
  globalThis.getDatabase = () => mockDb;
  
  try {
    const authService = new AuthService();
    
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerResult = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user'
    });
    
    console.log('Registration result:', registerResult.success ? '✅ SUCCESS' : '❌ FAILED');
    if (registerResult.error) {
      console.log('Error:', registerResult.error);
    } else {
      console.log('User created:', registerResult.user?.name);
      console.log('Token received:', !!registerResult.tokens?.accessToken);
    }
    
    // Test 2: Login with correct credentials
    console.log('\n2️⃣ Testing user login...');
    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login result:', loginResult.success ? '✅ SUCCESS' : '❌ FAILED');
    if (loginResult.error) {
      console.log('Error:', loginResult.error);
    } else {
      console.log('User logged in:', loginResult.user?.name);
      console.log('Token received:', !!loginResult.tokens?.accessToken);
    }
    
    // Test 3: Login with wrong credentials
    console.log('\n3️⃣ Testing login with wrong password...');
    const wrongLoginResult = await authService.login({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    console.log('Wrong login result:', !wrongLoginResult.success ? '✅ CORRECTLY FAILED' : '❌ SHOULD HAVE FAILED');
    if (wrongLoginResult.error) {
      console.log('Expected error:', wrongLoginResult.error);
    }
    
    // Test 4: Duplicate registration
    console.log('\n4️⃣ Testing duplicate registration...');
    const duplicateResult = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Another User',
      role: 'user'
    });
    
    console.log('Duplicate registration result:', !duplicateResult.success ? '✅ CORRECTLY FAILED' : '❌ SHOULD HAVE FAILED');
    if (duplicateResult.error) {
      console.log('Expected error:', duplicateResult.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Restore original function
    globalThis.getDatabase = originalGetDatabase;
  }
}

function testPermissionEvaluator() {
  console.log('\n🧪 Testing Permission Evaluator...\n');
  
  const evaluator = new PermissionEvaluator();
  
  // Test users
  const adminUser: AuthUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true
  };
  
  const regularUser: AuthUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    isActive: true
  };
  
  // Test entity
  const testTask = {
    id: 'task-1',
    title: 'Test Task',
    createdBy: 'user-1',
    status: 'todo'
  };
  
  // Test cases
  const testCases = [
    {
      name: 'Admin can delete any task',
      expression: 'user.role == "admin"',
      user: adminUser,
      entity: testTask,
      expected: true
    },
    {
      name: 'User can only delete own tasks',
      expression: 'user.role == "admin" || user.id == entity.createdBy',
      user: regularUser,
      entity: testTask,
      expected: true
    },
    {
      name: 'User cannot delete others tasks',
      expression: 'user.role == "admin" || user.id == entity.createdBy',
      user: regularUser,
      entity: { ...testTask, createdBy: 'other-user' },
      expected: false
    },
    {
      name: 'Authenticated users can read',
      expression: 'authenticated',
      user: regularUser,
      entity: testTask,
      expected: true
    },
    {
      name: 'Unauthenticated users cannot read',
      expression: 'authenticated',
      user: null,
      entity: testTask,
      expected: false
    },
    {
      name: 'Complex role-based permission',
      expression: 'authenticated && (user.role == "admin" || user.role == "manager")',
      user: { ...regularUser, role: 'manager' },
      entity: testTask,
      expected: true
    }
  ];
  
  console.log('Running permission evaluation tests...\n');
  
  testCases.forEach((testCase, index) => {
    const result = evaluator.hasPermission(
      testCase.expression,
      testCase.user,
      testCase.entity,
      'test'
    );
    
    const passed = result === testCase.expected;
    console.log(`${index + 1}️⃣ ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passed) {
      console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
      console.log(`   Expression: ${testCase.expression}`);
      console.log(`   User: ${testCase.user?.role || 'unauthenticated'}`);
    }
  });
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Authentication System Tests\n');
  
  await testAuthService();
  testPermissionEvaluator();
  
  console.log('\n✅ Authentication system tests completed!\n');
  console.log('To test the full system:');
  console.log('1. Start the server: deno run --allow-all runtime/server/main.ts');
  console.log('2. Register: POST /api/auth/register');
  console.log('3. Login: POST /api/auth/login');
  console.log('4. Test authenticated endpoints: GET /api/tasks (with Authorization header)');
}

if (import.meta.main) {
  runTests().catch(console.error);
}