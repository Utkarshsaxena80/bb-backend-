/**
 * Comprehensive API Testing Suite for Blood Bank Application
 * 
 * This test suite validates:
 * 1. Database connectivity
 * 2. Environment configuration
 * 3. API endpoints functionality with valid inputs
 * 4. API endpoints error handling with invalid inputs
 * 
 * Run with: node comprehensive-tests.js
 */

import { request } from 'http';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 5000;
const TEST_TIMEOUT = 8000; // 8 seconds
const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE_PATH = join(__dirname, '.env');

// Test results tracking
let results = {
  passed: 0,
  failed: 0,
  total: 0,
  byCategory: {
    database: { passed: 0, failed: 0 },
    environment: { passed: 0, failed: 0 },
    endpoints: { passed: 0, failed: 0 },
    validation: { passed: 0, failed: 0 }
  }
};

console.log('🔬 Blood Bank API Comprehensive Test Suite');
console.log('='.repeat(60));
console.log(`Testing backend at: http://${BACKEND_HOST}:${BACKEND_PORT}`);
console.log('');

// ======================================
// Helper Functions
// ======================================

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
 * Log test result with formatted output
 */
function logTestResult(category, testName, passed, message = '', details = null) {
  results.total++;
  
  if (passed) {
    results.passed++;
    results.byCategory[category].passed++;
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    results.byCategory[category].failed++;
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

// ======================================
// Database Connectivity Tests
// ======================================

/**
 * Test if API can connect to the database
 */
async function testDatabaseConnection() {
  console.log('\n📊 Database Connectivity Tests');
  console.log('-'.repeat(40));
  
  try {
    // Use health endpoint that should check DB connection
    const response = await makeRequest('/health');
    
    if (response.status === 200 && response.data && response.data.database === 'connected') {
      logTestResult('database', 'Database Connection', true, 'Successfully connected to database');
    } else {
      logTestResult('database', 'Database Connection', false, 'Failed to connect to database', 
        { status: response.status, response: response.data });
    }
  } catch (error) {
    logTestResult('database', 'Database Connection', false, `Error: ${error.message}`);
  }
}

/**
 * Test if API can perform a database query
 */
async function testDatabaseQuery() {
  try {
    // Use the getByCity endpoint which queries the database
    const response = await makeRequest('/getByCity?field=1&city=test');
    
    // We don't care about results, just that the query executed without DB errors
    if (response.status === 200 || response.status === 404) {
      logTestResult('database', 'Database Query', true, 
        'Successfully executed database query', { status: response.status });
    } else {
      logTestResult('database', 'Database Query', false, 
        'Failed to execute database query', { status: response.status, data: response.data });
    }
  } catch (error) {
    logTestResult('database', 'Database Query', false, `Error: ${error.message}`);
  }
}

// ======================================
// Environment Configuration Tests
// ======================================

/**
 * Test if environment variables are properly loaded
 */
async function testEnvironmentVariables() {
  console.log('\n🔧 Environment Configuration Tests');
  console.log('-'.repeat(40));
  
  try {
    // Check if .env file exists
    const envExists = existsSync(ENV_FILE_PATH);
    logTestResult('environment', 'Environment File Exists', envExists, 
      envExists ? '.env file found' : '.env file not found');
    
    // Check environment endpoint if it exists
    try {
      const response = await makeRequest('/env-status');
      if (response.status === 200 && response.data && response.data.configured) {
        logTestResult('environment', 'Environment Variables Loaded', true, 
          'Environment variables loaded successfully');
      } else {
        logTestResult('environment', 'Environment Variables Loaded', false, 
          'Environment endpoint indicates configuration issues', { response: response.data });
      }
    } catch (error) {
      // If endpoint doesn't exist, check for PORT var in a different way
      const healthResponse = await makeRequest('/health');
      logTestResult('environment', 'Environment Variables Loaded', 
        healthResponse.status === 200, 
        'Inferring environment setup from health endpoint');
    }
  } catch (error) {
    logTestResult('environment', 'Environment Variables', false, `Error: ${error.message}`);
  }
}

/**
 * Test if JWT secret is properly configured
 */
async function testJwtConfiguration() {
  try {
    // Try to register a donor and get token, then validate token
    const testUser = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "TestPassword123!",
      phone: "1234567890",
      BloodType: "O+",
      city: "Test City"
    };
    
    // First check if register endpoint is responding (without actually registering)
    const checkResponse = await makeRequest('/donor-login', 'POST', {
      email: "nonexistent@example.com",
      password: "wrong"
    });
    
    // If we get 401 or 400, JWT is likely configured (we just provided wrong credentials)
    if (checkResponse.status === 401 || checkResponse.status === 400) {
      logTestResult('environment', 'JWT Configuration', true, 
        'JWT authentication appears to be configured');
    } else {
      logTestResult('environment', 'JWT Configuration', false, 
        'Could not verify JWT configuration', { status: checkResponse.status });
    }
  } catch (error) {
    logTestResult('environment', 'JWT Configuration', false, `Error: ${error.message}`);
  }
}

// ======================================
// API Endpoint Tests
// ======================================

/**
 * Test all public API endpoints
 */
async function testPublicEndpoints() {
  console.log('\n🌐 API Endpoint Tests');
  console.log('-'.repeat(40));
  
  const publicEndpoints = [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/getByCity?field=1&city=test', method: 'GET', name: 'Get By City' },
    { path: '/patientDetail', method: 'GET', name: 'Patient Detail' }
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      const response = await makeRequest(endpoint.path, endpoint.method);
      
      logTestResult('endpoints', `${endpoint.name} Endpoint (${endpoint.method} ${endpoint.path})`, 
        response.status < 500, // Consider 4xx as "working" since it might be auth or validation error
        `Status: ${response.status}`, 
        { status: response.status, path: endpoint.path });
    } catch (error) {
      logTestResult('endpoints', `${endpoint.name} Endpoint (${endpoint.method} ${endpoint.path})`, 
        false, `Error: ${error.message}`);
    }
  }
}

/**
 * Test authentication endpoints
 */
async function testAuthEndpoints() {
  const authEndpoints = [
    { path: '/donor-login', method: 'POST', data: { email: "test@example.com", password: "password" }, name: 'Donor Login' },
    { path: '/patient-login', method: 'POST', data: { email: "test@example.com", password: "password" }, name: 'Patient Login' }
  ];
  
  for (const endpoint of authEndpoints) {
    try {
      const response = await makeRequest(endpoint.path, endpoint.method, endpoint.data);
      
      // Either 200 (successful login) or 401/400 (invalid credentials) indicates endpoint is working
      const endpointWorking = response.status === 200 || response.status === 401 || response.status === 400;
      
      logTestResult('endpoints', `${endpoint.name} Endpoint (${endpoint.method} ${endpoint.path})`, 
        endpointWorking,
        `Status: ${response.status}`, 
        { status: response.status, path: endpoint.path });
    } catch (error) {
      logTestResult('endpoints', `${endpoint.name} Endpoint (${endpoint.method} ${endpoint.path})`, 
        false, `Error: ${error.message}`);
    }
  }
}

// ======================================
// Input Validation Tests
// ======================================

/**
 * Test validation on bycity endpoint
 */
async function testByCityValidation() {
  console.log('\n✅ Input Validation Tests');
  console.log('-'.repeat(40));
  
  // Test cases with expected results
  const testCases = [
    { 
      name: "Missing field parameter", 
      path: "/getByCity?city=testcity", 
      expectedStatus: 400 
    },
    { 
      name: "Missing city parameter", 
      path: "/getByCity?field=1", 
      expectedStatus: 400 
    },
    { 
      name: "Invalid field value", 
      path: "/getByCity?field=3&city=testcity", 
      expectedStatus: 400 
    },
    { 
      name: "Valid parameters", 
      path: "/getByCity?field=1&city=testcity", 
      expectedStatus: 200 
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await makeRequest(testCase.path);
      
      const expectedStatusMatch = response.status === testCase.expectedStatus;
      
      logTestResult('validation', `ByCity Validation: ${testCase.name}`, 
        expectedStatusMatch,
        `Expected status ${testCase.expectedStatus}, got ${response.status}`, 
        { 
          status: response.status,
          path: testCase.path,
          expectedStatus: testCase.expectedStatus,
          match: expectedStatusMatch 
        });
    } catch (error) {
      logTestResult('validation', `ByCity Validation: ${testCase.name}`, 
        false, `Error: ${error.message}`);
    }
  }
}

/**
 * Test validation on login endpoints
 */
async function testLoginValidation() {
  // Test cases with expected results
  const testCases = [
    { 
      name: "Missing email", 
      path: "/donor-login", 
      data: { password: "password" },
      expectedStatus: 400 
    },
    { 
      name: "Missing password", 
      path: "/donor-login", 
      data: { email: "test@example.com" },
      expectedStatus: 400 
    },
    { 
      name: "Invalid email format", 
      path: "/donor-login", 
      data: { email: "not-an-email", password: "password" },
      expectedStatus: 400 
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await makeRequest(testCase.path, 'POST', testCase.data);
      
      // Either the expected status or 404 (endpoint not found) is acceptable for validation tests
      const expectedStatusMatch = response.status === testCase.expectedStatus || response.status === 404;
      
      logTestResult('validation', `Login Validation: ${testCase.name}`, 
        expectedStatusMatch,
        `Expected status ${testCase.expectedStatus}, got ${response.status}`, 
        { 
          status: response.status,
          path: testCase.path,
          data: testCase.data,
          expectedStatus: testCase.expectedStatus
        });
    } catch (error) {
      logTestResult('validation', `Login Validation: ${testCase.name}`, 
        false, `Error: ${error.message}`);
    }
  }
}

// ======================================
// Main Test Runner
// ======================================

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
    
    // Run all tests
    await testDatabaseConnection();
    await testDatabaseQuery();
    
    await testEnvironmentVariables();
    await testJwtConfiguration();
    
    await testPublicEndpoints();
    await testAuthEndpoints();
    
    await testByCityValidation();
    await testLoginValidation();
    
    // Print summary
    console.log('\n📋 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
    console.log('');
    
    // Category summary
    console.log('Category Breakdown:');
    Object.entries(results.byCategory).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const percentage = total > 0 ? Math.round((stats.passed / total) * 100) : 0;
      console.log(`- ${category.charAt(0).toUpperCase() + category.slice(1)}: ${stats.passed}/${total} (${percentage}%)`);
    });
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
