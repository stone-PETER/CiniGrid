# index.js Test Suite

Comprehensive testing for the Express.js server setup in `index.js`.

## Test Files

### 1. `test-index.js` - Main Test Suite

Complete test suite that validates all aspects of the server.

**Test Suites:**

- ✅ Server Initialization (5 tests)
- ✅ Middleware (3 tests)
- ✅ Route Registration (5 tests)
- ✅ Error Handling (5 tests)
- ✅ Database Connection (3 tests)
- ✅ API Response Format (5 tests)
- ✅ Environment Configuration (2+ tests)

**Total:** 28+ tests

### 2. `test-index-auto.js` - Automated Test Runner

Automatically starts the server, runs tests, and shuts down.

## Running Tests

### Option 1: Manual (Server already running)

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Run tests
node test-index.js
```

### Option 2: Automated (Starts server automatically)

```bash
# Single command - starts server, tests, and stops
node test-index-auto.js
```

### Option 3: Using npm scripts (add to package.json)

```json
{
  "scripts": {
    "test:index": "node test-index.js",
    "test:index:auto": "node test-index-auto.js"
  }
}
```

Then run:

```bash
npm run test:index        # Manual (server must be running)
npm run test:index:auto   # Automated (starts/stops server)
```

## Test Coverage

### 1. Server Initialization Tests

- ✓ Server is running and responding
- ✓ Root endpoint returns correct structure
- ✓ API version is present
- ✓ Endpoints object exists
- ✓ All expected endpoints are listed

### 2. Middleware Tests

- ✓ CORS headers present
- ✓ JSON body parsing works
- ✓ Content-Type header accepted

### 3. Route Registration Tests

- ✓ Auth routes registered at `/api/auth`
- ✓ AI routes registered at `/api/ai`
- ✓ Locations routes registered at `/api/locations`
- ✓ AI Agent routes registered at `/api/ai-agent`
- ✓ Test routes registered at `/api/test`

### 4. Error Handling Tests

- ✓ 404 handler works for non-existent routes
- ✓ 404 response has `success=false`
- ✓ 404 response includes error message
- ✓ 404 response is JSON
- ✓ Deep nested routes also return 404

### 5. Database Connection Tests

- ✓ MONGO_URI environment variable set
- ✓ Server started (implies DB connected)
- ✓ Database-dependent routes respond

### 6. API Response Format Tests

- ✓ Successful responses have `success:true`
- ✓ Error responses have `success:false`
- ✓ Error responses have `error` field
- ✓ Responses are valid JSON
- ✓ Content-Type is `application/json`

### 7. Environment Configuration Tests

- ✓ Required environment variables set
- ℹ Optional variables checked (informational)

## Expected Output

### Successful Run:

```
╔════════════════════════════════════════════════════════════╗
║        index.js Comprehensive Test Suite                 ║
╚════════════════════════════════════════════════════════════╝

Target: http://localhost:5000
Waiting for server to be ready...
✓ Server is ready

════════════════════════════════════════════════════════════
TEST SUITE 1: Server Initialization
════════════════════════════════════════════════════════════

✓ Server is running and responding
✓ Root endpoint returns success=true
✓ API version is present
✓ Endpoints object is present
✓ All expected endpoints are listed

[... more tests ...]

════════════════════════════════════════════════════════════
TEST SUMMARY
════════════════════════════════════════════════════════════

✓ Tests Passed: 28/28 (100.0%)
✓ Passed: 28
✗ Failed: 0

════════════════════════════════════════════════════════════
```

### Failed Tests:

```
✗ Server is running and responding
  Error: connect ECONNREFUSED 127.0.0.1:5000

Failed Tests:
  ✗ Server is running and responding
    Error: connect ECONNREFUSED 127.0.0.1:5000
```

## Requirements

- Node.js 16+
- Server must be running (for manual tests)
- Environment variables configured (`.env` file)

## Environment Variables Checked

### Required:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens

### Optional:

- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
- `GEMINI_API_KEY` - For AI features
- `GOOGLE_MAPS_API_KEY` - For location services

## Troubleshooting

### Error: "Server did not start in time"

- Check if another process is using the port
- Verify MongoDB is accessible
- Check environment variables in `.env`

### Error: "ECONNREFUSED"

- Make sure server is running (`npm run dev`)
- Check if PORT is correct
- Verify firewall settings

### Error: "Tests failed with exit code 1"

- Review failed test output
- Check server logs for errors
- Verify all routes are properly registered

## Integration with CI/CD

Add to GitHub Actions workflow:

```yaml
- name: Test Server Setup
  run: node test-index-auto.js
  working-directory: ./backend
```

## What's Tested vs Not Tested

### ✅ Tested:

- Server starts successfully
- Routes are registered
- Middleware functions
- Error handlers work
- Response formats are correct
- Environment configuration

### ❌ Not Tested (use other test files):

- Authentication logic → `test-api.js`
- AI functionality → `test-ai-implementation.js`
- Location routes → `test-location-ai.js`
- Database operations → `database-test.ps1`
- Integration tests → `test-integration.js`

## Related Test Files

- `test-api.js` - API endpoint tests
- `test-ai-implementation.js` - AI service tests
- `test-location-ai.js` - AI location routes tests
- `test-integration.js` - Full integration tests
- `database-test.ps1` - Database connection tests

---

**Purpose:** Validate that `index.js` correctly initializes the Express server, registers all routes, sets up middleware, and handles errors.

**Use Case:** Run before deployment to ensure server setup is correct.

**Last Updated:** 2025-01-22
