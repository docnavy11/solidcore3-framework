// Test the configuration system
import { ConfigManager } from './manager.ts';
import { developmentTemplate, productionTemplate } from './templates.ts';

async function testConfigManager() {
  console.log('🧪 Testing Configuration Management System...\n');
  
  // Test 1: Initialize configuration manager
  console.log('Test 1: Initialize ConfigManager');
  const configManager = new ConfigManager();
  
  try {
    const config = await configManager.initialize();
    console.log('✅ Configuration initialized successfully');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   Database: ${config.database.type} (${config.database.url})`);
    console.log(`   Server: ${config.server.host}:${config.server.port}`);
    console.log(`   Log Level: ${config.logging.level}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to initialize configuration:', error);
    return;
  }
  
  // Test 2: Get configuration values
  console.log('Test 2: Get configuration values');
  try {
    const dbType = configManager.get('database.type');
    const serverPort = configManager.get('server.port');
    const logLevel = configManager.get('logging.level');
    
    console.log('✅ Configuration values retrieved');
    console.log(`   database.type: ${dbType}`);
    console.log(`   server.port: ${serverPort}`);
    console.log(`   logging.level: ${logLevel}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to get configuration values:', error);
  }
  
  // Test 3: Set configuration values
  console.log('Test 3: Set configuration values');
  try {
    configManager.set('server.port', 9000);
    configManager.set('logging.level', 'warn');
    
    const newPort = configManager.get('server.port');
    const newLogLevel = configManager.get('logging.level');
    
    console.log('✅ Configuration values updated');
    console.log(`   New server.port: ${newPort}`);
    console.log(`   New logging.level: ${newLogLevel}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to set configuration values:', error);
  }
  
  // Test 4: Validate configuration
  console.log('Test 4: Validate configuration');
  try {
    const validationResult = configManager.validate();
    console.log(`✅ Configuration validation completed`);
    console.log(`   Valid: ${validationResult.isValid}`);
    console.log(`   Errors: ${validationResult.errors.length}`);
    console.log(`   Warnings: ${validationResult.warnings.length}`);
    
    if (validationResult.errors.length > 0) {
      console.log('   Error details:');
      validationResult.errors.slice(0, 3).forEach(error => {
        console.log(`     ${error.path}: ${error.message}`);
      });
    }
    
    if (validationResult.warnings.length > 0) {
      console.log('   Warning details:');
      validationResult.warnings.slice(0, 3).forEach(warning => {
        console.log(`     ${warning.path}: ${warning.message}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to validate configuration:', error);
  }
  
  // Test 5: Test configuration change listeners
  console.log('Test 5: Configuration change listeners');
  try {
    let changeCount = 0;
    configManager.addChangeListener((event) => {
      changeCount++;
      console.log(`   📢 Config change: ${event.path} = ${event.newValue} (from ${event.source})`);
    });
    
    configManager.set('development.debugMode', false);
    configManager.set('server.host', '0.0.0.0');
    
    console.log(`✅ Change listeners working (${changeCount} changes detected)`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to test change listeners:', error);
  }
  
  // Test 6: Export configuration
  console.log('Test 6: Export configuration');
  try {
    await configManager.export('./test-export-config.json', 'json');
    await configManager.export('./test-export-config.ts', 'ts');
    
    console.log('✅ Configuration exported successfully');
    console.log('   Files: test-export-config.json, test-export-config.ts');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to export configuration:', error);
  }
  
  // Test 7: Test templates
  console.log('Test 7: Configuration templates');
  try {
    console.log('Development template keys:', Object.keys(developmentTemplate));
    console.log('Production template keys:', Object.keys(productionTemplate));
    
    console.log('✅ Configuration templates available');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to test templates:', error);
  }
  
  console.log('🎉 Configuration management system testing complete!');
}

// Clean up test files
async function cleanup() {
  try {
    await Deno.remove('./test-export-config.json').catch(() => {});
    await Deno.remove('./test-export-config.ts').catch(() => {});
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  try {
    await testConfigManager();
  } finally {
    await cleanup();
  }
}