# Blood Bank Application Testing Suite

This documentation covers the comprehensive testing suite for the Blood Bank application. The tests are designed to verify various aspects of the application, including database connectivity, environment configuration, API endpoints, and input validation.

## Test Suites

The testing suite consists of multiple specialized test scripts:

1. **Comprehensive Tests** (`comprehensive-tests.js`)
   - All-in-one test suite that covers database, environment, and API endpoints
   - Provides a complete overview of application health

2. **API Endpoint Tests** (`api-tests.js`)
   - Tests specific API endpoints with various input combinations
   - Validates error handling and successful responses

3. **Database Tests** (`database-tests.js`)
   - Focuses on database connectivity and query execution
   - Verifies Prisma schema configuration

4. **Environment Tests** (`environment-tests.js`)
   - Checks environment variable configuration
   - Tests CORS settings and JWT setup

## Running the Tests

### Prerequisites

- Node.js installed
- Backend server running on `localhost:5000` (default port)
- Database configured and accessible

### Running Individual Test Suites

```bash
# Run comprehensive tests
node comprehensive-tests.js

# Run API endpoint tests
node api-tests.js

# Run database tests
node database-tests.js

# Run environment tests
node environment-tests.js
```

### Interpreting Test Results

Each test will output:
- ✅ for passed tests
- ❌ for failed tests
- Details and error messages where applicable

At the end of each test suite, a summary shows:
- Total number of tests run
- Number of passed tests
- Number of failed tests
- For comprehensive tests, a breakdown by category

## Test Categories

### Database Tests

These tests verify:
- Connection to the database is established
- Database queries can be executed successfully
- Prisma schema is properly configured
- Environment variables for database are set correctly

### Environment Tests

These tests verify:
- Required environment variables are configured
- JWT secret is properly set up
- CORS configuration is working correctly
- Server environment is properly detected

### API Endpoint Tests

These tests verify:
- Endpoints respond with correct status codes
- Authentication endpoints work properly
- Input validation is functioning correctly
- Error responses are properly formatted

### Input Validation Tests

These tests verify:
- Required fields are properly validated
- Invalid inputs are rejected with appropriate error messages
- Valid inputs are accepted and processed correctly

## Adding New Tests

To add new tests:

1. Identify the appropriate test suite for your new test
2. Add a new test function following the existing patterns
3. Include your test function in the `runTests()` function
4. Document the new test in this README

## Troubleshooting

If tests are failing, check the following:

1. **Connection issues**:
   - Ensure the backend server is running on the expected host and port
   - Check for network connectivity issues

2. **Database issues**:
   - Verify DATABASE_URL is correct in .env file
   - Check if database server is running
   - Ensure database schema is up to date

3. **Environment issues**:
   - Verify all required environment variables are set
   - Check if .env file exists and has correct format

4. **API endpoint issues**:
   - Verify endpoints are implemented correctly
   - Check route definitions in the server code

## Continuous Integration

These tests can be integrated into a CI/CD pipeline by:

1. Adding a script in package.json:
   ```json
   "scripts": {
     "test": "node comprehensive-tests.js"
   }
   ```

2. Running the tests in your CI environment:
   ```bash
   npm test
   ```

3. Using the exit code (0 for success, 1 for failure) to determine if the pipeline should continue or fail
