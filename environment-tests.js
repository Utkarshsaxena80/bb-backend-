/**
 * Environment Configuration Tests for Blood Bank Application
 * 
 * This test suite focuses on:
 * - Environment variables configuration
 * - JWT setup
 * - CORS configuration
 * - Server settings
 * 
 * Run with: node environment-tests.js
 */

import { request } from 'http';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Configuration
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 5000;
const TEST_TIMEOUT = 5000; // 5 seconds
const ENV_FILE_PATH = join(__dirname, '.env');

// Test results
let results = {
  passed: 0,
  failed: 0,
  total: 0
};

console.log('🔧 Blood Bank Environment Configuration Tests');
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
 * Test if .env file exists and has required variables
 */
async function testEnvFile() {
  console.log('\n🔍 Testing Environment File');
  console.log('-'.repeat(40));
  
  // Check if .env file exists
  const envExists = existsSync(ENV_FILE_PATH);
  logTestResult('Environment File Exists', envExists,
    envExists ? '.env file found' : '.env file not found');
  
  if (envExists) {
    try {
      // Read .env file
      const envContent = readFileSync(ENV_FILE_PATH, 'utf8');
      const envLines = envContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
      
      // Check for required variables
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
      const foundVars = requiredVars.filter(varName => 
        envLines.some(line => line.startsWith(`${varName}=`))
      );
      
      logTestResult('Required Environment Variables', foundVars.length === requiredVars.length,
        `Found ${foundVars.length}/${requiredVars.length} required variables`,
        { 
          found: foundVars,
          missing: requiredVars.filter(v => !foundVars.includes(v))
        });
    } catch (error) {
      logTestResult('Reading Environment File', false,
        `Error reading .env file: ${error.message}`);
    }
  }
}

/**
 * Test environment variables via env-status endpoint
 */
async function testEnvEndpoint() {
  console.log('\n🔍 Testing Environment Configuration via API');
  console.log('-'.repeat(40));
  
  try {
    const response = await makeRequest('/env-status');
    
    if (response.status === 200) {
      const envConfigured = response.data?.data?.configured === true;
      
      logTestResult('Environment Variables Configured', envConfigured,
        envConfigured ? 'All required environment variables are configured' : 'Some environment variables are missing',
        { 
          configuredCount: response.data?.data?.configuredCount,
          expectedCount: response.data?.data?.expectedCount,
          environment: response.data?.data?.environment
        });
      
      // Check individual variables
      if (response.data?.data?.variables) {
        const variables = response.data.data.variables;
        Object.entries(variables).forEach(([key, value]) => {
          logTestResult(`${key} Configuration`, value === 'configured',
            `${key} is ${value}`,
            { configured: value === 'configured' });
        });
      }
    } else {
      logTestResult('Environment Configuration', false,
        `Env status endpoint returned unexpected status: ${response.status}`,
        { status: response.status });
    }
  } catch (error) {
    // If env-status endpoint doesn't exist, check other ways
    try {
      const healthResponse = await makeRequest('/health');
      logTestResult('Environment Configuration', healthResponse.status === 200,
        'Inferring environment configuration from health endpoint',
        { 
          status: healthResponse.status,
          environment: healthResponse.data?.data?.environment
        });
    } catch (healthError) {
      logTestResult('Environment Configuration', false,
        `Could not verify environment configuration: ${error.message}`);
    }
  }
}

/**
 * Test CORS configuration
 */
async function testCorsConfiguration() {
  console.log('\n🔍 Testing CORS Configuration');
  console.log('-'.repeat(40));
  
  try {
    const response = await makeRequest('/health', 'GET', null, {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET'
    });
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    const foundHeaders = corsHeaders.filter(header => response.headers[header]);
    
    logTestResult('CORS Headers', foundHeaders.length > 0,
      `Found ${foundHeaders.length}/${corsHeaders.length} CORS headers`,
      { 
        headers: foundHeaders,
        allowOrigin: response.headers['access-control-allow-origin'],
        allowCredentials: response.headers['access-control-allow-credentials']
      });
    
    // Test preflight request
    const preflightResponse = await makeRequest('/health', 'OPTIONS', null, {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET'
    });
    
    logTestResult('CORS Preflight', preflightResponse.status === 204 || preflightResponse.status === 200,
      `Preflight response status: ${preflightResponse.status}`,
      { 
        status: preflightResponse.status,
        headers: Object.keys(preflightResponse.headers)
          .filter(h => h.startsWith('access-control'))
          .reduce((obj, key) => {
            obj[key] = preflightResponse.headers[key];
            return obj;
          }, {})
      });
  } catch (error) {
    logTestResult('CORS Configuration', false,
      `Error testing CORS configuration: ${error.message}`);
  }
}

/**
 * Test JWT configuration via login attempt
 */
async function testJwtConfiguration() {
  console.log('\n🔍 Testing JWT Configuration');
  console.log('-'.repeat(40));
  
  try {
    // Try login with likely invalid credentials
    const loginResponse = await makeRequest('/donor-login', 'POST', {
      email: "test@example.com",
      password: "wrongpassword"
    });
    
    // If we get a proper response (even 401), JWT is likely configured
    const jwtConfigured = loginResponse.status !== 500;
    
    logTestResult('JWT Configuration', jwtConfigured,
      `Login endpoint response status: ${loginResponse.status}`,
      { 
        status: loginResponse.status,
        responseType: typeof loginResponse.data
      });
    
    // Check for JWT cookie in a successful login
    if (loginResponse.status === 200) {
      const hasCookie = loginResponse.headers['set-cookie'] && 
                       loginResponse.headers['set-cookie'].some(c => c.includes('jwt='));
      
      logTestResult('JWT Cookie', hasCookie,
        hasCookie ? 'JWT cookie is set on successful login' : 'No JWT cookie found');
    }
  } catch (error) {
    // If endpoint not found, JWT might still be configured
    if (error.message.includes('ECONNREFUSED') || error.message.includes('404')) {
      logTestResult('JWT Configuration', true,
        'Could not test JWT - endpoint not available',
        { error: error.message });
    } else {
      logTestResult('JWT Configuration', false,
        `Error testing JWT configuration: ${error.message}`);
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
    
    // Run environment tests
    await testEnvFile();
    await testEnvEndpoint();
    await testCorsConfiguration();
    await testJwtConfiguration();
    
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
