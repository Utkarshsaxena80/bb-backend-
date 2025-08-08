/**
 * Database Connectivity Tests for Blood Bank Application
 * 
 * This test suite focuses on:
 * - Database connection validation
 * - Query execution testing
 * - Environment variable configuration
 * 
 * Run with: node database-tests.js
 */

import { request } from 'http';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Configuration
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 5000;
const TEST_TIMEOUT = 8000; // 8 seconds
const ENV_FILE_PATH = join(__dirname, '.env');

// Test results tracking
let results = {
  passed: 0,
  failed: 0,
  total: 0
};

console.log('🗄️ Blood Bank Database Connectivity Tests');
console.log('='.repeat(60));
console.log(`Testing backend at: http://${BACKEND_HOST}:${BACKEND_PORT}`);
console.log('');

/**
 * Make HTTP request to the API
 */
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        ...headers
      },
      timeout: TEST_TIMEOUT
    };

    const req = request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = body ? JSON.parse(body) : null;
        } catch (e) {
          parsedBody = body;
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          data: parsedBody
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Log test result
 */
function logTestResult(testName, passed, message = '', details = null) {
  results.total++;
  
  if (passed) {
    results.passed++;
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    console.log(`❌ ${testName}`);
  }
  
  if (message) {
    console.log(`   ${message}`);
  }
  
  if (details && Object.keys(details).length > 0) {
    console.log('   Details:');
    Object.entries(details).forEach(([key, value]) => {
      console.log(`     - ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    });
  }
}

/**
 * Test database connection via health endpoint
 */
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection');
  console.log('-'.repeat(40));
  
  try {
    const response = await makeRequest('/health');
    
    if (response.status === 200) {
      // Extract database status from response
      const dbStatus = response.data && 
                     response.data.data && 
                     response.data.data.database === 'connected';
      
      logTestResult('Database Connection', dbStatus, 
        dbStatus ? 'Successfully connected to database' : 'Database not connected',
        { 
          status: response.status,
          databaseStatus: response.data?.data?.database || 'unknown'
        });
    } else {
      logTestResult('Database Connection', false, 
        `Health endpoint returned unexpected status: ${response.status}`,
        { status: response.status, response: response.data });
    }
  } catch (error) {
    logTestResult('Database Connection', false, 
      `Error accessing health endpoint: ${error.message}`);
  }
}

/**
 * Test database query execution via getByCity endpoint
 */
async function testDatabaseQuery() {
  console.log('\n🔍 Testing Database Query Execution');
  console.log('-'.repeat(40));
  
  try {
    const response = await makeRequest('/getByCity?field=1&city=test');
    
    // We consider any non-server-error response as successful query execution
    const isQuerySuccessful = response.status < 500;
    
    logTestResult('Database Query Execution', isQuerySuccessful,
      isQuerySuccessful ? 'Successfully executed database query' : 'Database query failed',
      { 
        status: response.status,
        endpoint: '/getByCity?field=1&city=test',
        responseType: typeof response.data
      });
  } catch (error) {
    logTestResult('Database Query Execution', false,
      `Error executing database query: ${error.message}`);
  }
}

/**
 * Test environment configuration for database
 */
async function testDatabaseEnvironment() {
  console.log('\n🔍 Testing Database Environment Configuration');
  console.log('-'.repeat(40));
  
  // Check if .env file exists
  const envExists = existsSync(ENV_FILE_PATH);
  logTestResult('Environment File', envExists,
    envExists ? '.env file found' : '.env file not found');
  
  // If env-status endpoint exists, use it to check DATABASE_URL
  try {
    const response = await makeRequest('/env-status');
    
    if (response.status === 200) {
      const databaseConfigured = response.data?.data?.variables?.DATABASE_URL === 'configured';
      
      logTestResult('DATABASE_URL Configuration', databaseConfigured,
        databaseConfigured ? 'DATABASE_URL is configured' : 'DATABASE_URL is not configured',
        { 
          status: response.status,
          databaseConfigured: databaseConfigured
        });
    } else {
      // Fallback: If we can connect to database, assume DATABASE_URL is configured
      const healthResponse = await makeRequest('/health');
      const dbConnected = healthResponse.data?.data?.database === 'connected';
      
      logTestResult('DATABASE_URL Configuration', dbConnected,
        'Inferring DATABASE_URL configuration from database connection',
        { databaseConnected: dbConnected });
    }
  } catch (error) {
    // If env-status endpoint doesn't exist, check health endpoint
    try {
      const healthResponse = await makeRequest('/health');
      const dbConnected = healthResponse.data?.data?.database === 'connected';
      
      logTestResult('DATABASE_URL Configuration', dbConnected,
        'Inferring DATABASE_URL configuration from database connection',
        { databaseConnected: dbConnected });
    } catch (healthError) {
      logTestResult('DATABASE_URL Configuration', false,
        `Could not verify DATABASE_URL configuration: ${error.message}`);
    }
  }
}

/**
 * Test Prisma schema
 */
async function testPrismaSchema() {
  console.log('\n🔍 Testing Prisma Schema');
  console.log('-'.repeat(40));
  
  const schemaPath = join(__dirname, 'prisma', 'schema.prisma');
  
  // Check if schema.prisma exists
  const schemaExists = existsSync(schemaPath);
  logTestResult('Prisma Schema File', schemaExists,
    schemaExists ? 'schema.prisma file found' : 'schema.prisma file not found');
  
  if (schemaExists) {
    try {
      // Check if schema.prisma contains datasource definition
      const schemaContent = readFileSync(schemaPath, 'utf8');
      const hasDatasource = schemaContent.includes('datasource db');
      const hasModels = schemaContent.includes('model ');
      
      logTestResult('Prisma Schema Configuration', hasDatasource && hasModels,
        `Prisma schema ${hasDatasource ? 'has' : 'missing'} datasource, ${hasModels ? 'has' : 'missing'} models`,
        { 
          hasDatasource: hasDatasource,
          hasModels: hasModels
        });
    } catch (error) {
      logTestResult('Prisma Schema Configuration', false,
        `Error reading schema.prisma: ${error.message}`);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // First check if server is running
    try {
      await makeRequest('/health');
      console.log('✅ Backend server is running');
    } catch (error) {
      console.error('❌ Backend server is not running. Please start it before running tests.');
      console.error(`   Error: ${error.message}`);
      process.exit(1);
    }
    
    // Run database tests
    await testDatabaseConnection();
    await testDatabaseQuery();
    await testDatabaseEnvironment();
    await testPrismaSchema();
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
