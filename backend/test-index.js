/**
 * Comprehensive Test Suite for index.js
 * Tests server initialization, routes, middleware, and error handling
 */

import http from "http";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const API_BASE = `${BASE_URL}/api`;

// ANSI color codes for pretty output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const body = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test assertion helper
function assert(condition, testName, details = "") {
  results.total++;

  if (condition) {
    results.passed++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    if (details) console.log(`  ${colors.gray}${details}${colors.reset}`);
    results.tests.push({ name: testName, status: "passed", details });
  } else {
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (details) console.log(`  ${colors.red}${details}${colors.reset}`);
    results.tests.push({ name: testName, status: "failed", details });
  }
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 10, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest(BASE_URL);
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error("Server did not start in time");
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// TEST SUITE 1: Server Initialization
async function testServerInitialization() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.blue}TEST SUITE 1: Server Initialization${colors.reset}`
  );
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  try {
    // Test 1: Server is running
    const response = await makeRequest(BASE_URL);
    assert(
      response.statusCode === 200,
      "Server is running and responding",
      `Status: ${response.statusCode}`
    );

    // Test 2: Root endpoint returns correct structure
    assert(
      response.body && response.body.success === true,
      "Root endpoint returns success=true",
      `Response: ${JSON.stringify(response.body)}`
    );

    // Test 3: Version info present
    assert(
      response.body && response.body.version,
      "API version is present",
      `Version: ${response.body?.version}`
    );

    // Test 4: Endpoints object exists
    assert(
      response.body && response.body.endpoints,
      "Endpoints object is present",
      `Endpoints: ${JSON.stringify(response.body?.endpoints)}`
    );

    // Test 5: All expected endpoints listed
    const expectedEndpoints = ["auth", "ai", "locations", "aiAgent"];
    const actualEndpoints = response.body?.endpoints || {};
    const allPresent = expectedEndpoints.every((ep) => actualEndpoints[ep]);
    assert(
      allPresent,
      "All expected endpoints are listed",
      `Expected: ${expectedEndpoints.join(", ")}`
    );
  } catch (error) {
    console.log(
      `${colors.red}✗ Error in server initialization tests: ${error.message}${colors.reset}`
    );
  }
}

// TEST SUITE 2: Middleware
async function testMiddleware() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}TEST SUITE 2: Middleware${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  try {
    // Test 1: CORS headers present
    const response = await makeRequest(BASE_URL, {
      headers: { Origin: "http://localhost:3001" },
    });
    assert(
      response.headers["access-control-allow-origin"] !== undefined,
      "CORS headers are present",
      `CORS Origin: ${response.headers["access-control-allow-origin"]}`
    );

    // Test 2: JSON parsing works
    const jsonTest = await makeRequest(`${API_BASE}/test`, {
      method: "POST",
      body: { test: "data" },
    });
    // Note: Will be 404 if test route doesn't handle POST, but should parse JSON
    assert(
      jsonTest.statusCode !== 500,
      "JSON body parsing works (no 500 error)",
      `Status: ${jsonTest.statusCode}`
    );

    // Test 3: Content-Type header accepted
    const contentTypeTest = await makeRequest(BASE_URL, {
      headers: { "Content-Type": "application/json" },
    });
    assert(
      contentTypeTest.statusCode === 200,
      "Content-Type application/json accepted",
      `Status: ${contentTypeTest.statusCode}`
    );
  } catch (error) {
    console.log(
      `${colors.red}✗ Error in middleware tests: ${error.message}${colors.reset}`
    );
  }
}

// TEST SUITE 3: Route Registration
async function testRouteRegistration() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}TEST SUITE 3: Route Registration${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  // Test with specific endpoints that should exist
  const routes = [
    {
      path: "/api/auth/login",
      name: "Auth routes",
      method: "POST",
      expectedStatus: [400, 401], // Missing credentials or invalid
      body: {},
    },
    {
      path: "/api/ai/search",
      name: "AI routes",
      method: "POST",
      expectedStatus: [400, 401], // Missing auth or prompt
      body: {},
    },
    {
      path: "/api/locations/potential",
      name: "Locations routes",
      method: "GET",
      expectedStatus: [401], // Missing auth
    },
    {
      path: "/api/ai-agent/status",
      name: "AI Agent routes",
      method: "GET",
      expectedStatus: [200, 401], // Should return status
    },
    {
      path: "/api/test/test-add",
      name: "Test routes",
      method: "POST",
      expectedStatus: [401], // Missing auth
      body: {},
    },
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route.path}`, {
        method: route.method,
        body: route.body,
      });

      // Route is registered if we get expected status (not 404)
      const exists = response.statusCode !== 404;
      const statusMatch = route.expectedStatus.includes(response.statusCode);

      assert(
        exists,
        `${route.name} registered at ${route.path}`,
        `Status: ${response.statusCode} (${
          exists ? "route exists" : "not found"
        })`
      );
    } catch (error) {
      assert(
        false,
        `${route.name} registered at ${route.path}`,
        `Error: ${error.message}`
      );
    }
  }
}

// TEST SUITE 4: Error Handling
async function testErrorHandling() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}TEST SUITE 4: Error Handling${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  try {
    // Test 1: 404 handler for non-existent routes
    const notFoundResponse = await makeRequest(
      `${BASE_URL}/api/nonexistent-route`
    );
    assert(
      notFoundResponse.statusCode === 404,
      "404 handler works for non-existent routes",
      `Status: ${notFoundResponse.statusCode}, Message: ${notFoundResponse.body?.error}`
    );

    // Test 2: 404 response has correct structure
    assert(
      notFoundResponse.body && notFoundResponse.body.success === false,
      "404 response has success=false",
      `Response: ${JSON.stringify(notFoundResponse.body)}`
    );

    // Test 3: 404 includes error message
    assert(
      notFoundResponse.body && notFoundResponse.body.error,
      "404 response includes error message",
      `Error: ${notFoundResponse.body?.error}`
    );

    // Test 4: Invalid route returns JSON
    assert(
      notFoundResponse.headers["content-type"]?.includes("application/json"),
      "404 response is JSON",
      `Content-Type: ${notFoundResponse.headers["content-type"]}`
    );

    // Test 5: Deep nested route also returns 404
    const deepNotFound = await makeRequest(
      `${BASE_URL}/api/deeply/nested/nonexistent/route`
    );
    assert(
      deepNotFound.statusCode === 404,
      "Deep nested non-existent routes return 404",
      `Status: ${deepNotFound.statusCode}`
    );
  } catch (error) {
    console.log(
      `${colors.red}✗ Error in error handling tests: ${error.message}${colors.reset}`
    );
  }
}

// TEST SUITE 5: Database Connection (Info Check)
async function testDatabaseConnection() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.blue}TEST SUITE 5: Database Connection (Info Check)${colors.reset}`
  );
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  // Test 1: MONGO_URI environment variable is set
  assert(
    process.env.MONGO_URI !== undefined,
    "MONGO_URI environment variable is set",
    process.env.MONGO_URI ? "Set (value hidden)" : "Not set"
  );

  // Test 2: Server started (implies DB connected, since index.js waits for DB)
  try {
    const response = await makeRequest(BASE_URL);
    assert(
      response.statusCode === 200,
      "Server is running (implies MongoDB connected successfully)",
      "Server only starts after successful DB connection"
    );
  } catch (error) {
    assert(
      false,
      "Server is running (implies MongoDB connected successfully)",
      error.message
    );
  }

  // Test 3: Check if any database-dependent route works
  try {
    const authResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: "POST",
      body: { username: "test", password: "test" },
    });
    // Should return 401 or similar, not 500 (which would indicate DB error)
    assert(
      authResponse.statusCode !== 500,
      "Database-dependent routes respond (no 500 errors)",
      `Auth endpoint status: ${authResponse.statusCode}`
    );
  } catch (error) {
    console.log(
      `${colors.yellow}⚠${colors.reset} Could not test auth endpoint: ${error.message}`
    );
  }
}

// TEST SUITE 6: API Response Format
async function testAPIResponseFormat() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}TEST SUITE 6: API Response Format${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  try {
    // Test 1: Successful responses have success:true
    const successResponse = await makeRequest(BASE_URL);
    assert(
      successResponse.body && successResponse.body.success === true,
      "Successful responses have success:true",
      `Response: ${JSON.stringify(successResponse.body)}`
    );

    // Test 2: Error responses have success:false
    const errorResponse = await makeRequest(`${BASE_URL}/api/nonexistent`);
    assert(
      errorResponse.body && errorResponse.body.success === false,
      "Error responses have success:false",
      `Response: ${JSON.stringify(errorResponse.body)}`
    );

    // Test 3: Error responses have error field
    assert(
      errorResponse.body && errorResponse.body.error,
      "Error responses have error field",
      `Error: ${errorResponse.body?.error}`
    );

    // Test 4: Responses are valid JSON
    const jsonResponse = await makeRequest(BASE_URL);
    const isValidJSON =
      typeof jsonResponse.body === "object" && jsonResponse.body !== null;
    assert(
      isValidJSON,
      "Responses are valid JSON objects",
      `Type: ${typeof jsonResponse.body}`
    );

    // Test 5: Content-Type is application/json
    const headers = await makeRequest(BASE_URL);
    assert(
      headers.headers["content-type"]?.includes("application/json"),
      "Content-Type header is application/json",
      `Content-Type: ${headers.headers["content-type"]}`
    );
  } catch (error) {
    console.log(
      `${colors.red}✗ Error in API response format tests: ${error.message}${colors.reset}`
    );
  }
}

// TEST SUITE 7: Environment Configuration
async function testEnvironmentConfiguration() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.blue}TEST SUITE 7: Environment Configuration${colors.reset}`
  );
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  // Required environment variables
  const requiredVars = ["MONGO_URI", "JWT_SECRET"];

  // Optional but important variables
  const optionalVars = [
    "PORT",
    "FRONTEND_URL",
    "GEMINI_API_KEY",
    "GOOGLE_MAPS_API_KEY",
  ];

  // Test required variables
  requiredVars.forEach((varName) => {
    assert(
      process.env[varName] !== undefined,
      `Required env var ${varName} is set`,
      process.env[varName] ? "✓ Set" : "✗ Not set"
    );
  });

  // Check optional variables (informational)
  console.log(`\n${colors.gray}Optional Environment Variables:${colors.reset}`);
  optionalVars.forEach((varName) => {
    const isSet = process.env[varName] !== undefined;
    const icon = isSet ? "✓" : "○";
    const status = isSet ? "Set" : "Not set (using defaults)";
    console.log(`  ${icon} ${varName}: ${status}`);
  });
}

// Print summary
function printSummary() {
  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  const icon = results.failed === 0 ? "✓" : "✗";
  const color = results.failed === 0 ? colors.green : colors.red;

  console.log(
    `${color}${icon} Tests Passed: ${results.passed}/${results.total} (${passRate}%)${colors.reset}`
  );
  console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);

  if (results.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.tests
      .filter((t) => t.status === "failed")
      .forEach((t) => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.details)
          console.log(`    ${colors.gray}${t.details}${colors.reset}`);
      });
  }

  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Main test runner
async function runAllTests() {
  console.log(
    `\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.blue}║        index.js Comprehensive Test Suite                 ║${colors.reset}`
  );
  console.log(
    `${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`
  );

  console.log(`\n${colors.gray}Target: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.gray}Waiting for server to be ready...${colors.reset}`);

  try {
    // Wait for server to be ready
    await waitForServer();
    console.log(`${colors.green}✓ Server is ready${colors.reset}`);

    const startTime = Date.now();

    // Run all test suites
    await testServerInitialization();
    await testMiddleware();
    await testRouteRegistration();
    await testErrorHandling();
    await testDatabaseConnection();
    await testAPIResponseFormat();
    await testEnvironmentConfiguration();

    const duration = Date.now() - startTime;
    console.log(
      `\n${colors.gray}Total test duration: ${duration}ms${colors.reset}`
    );

    // Print summary
    printSummary();
  } catch (error) {
    console.error(
      `\n${colors.red}✗ Fatal error: ${error.message}${colors.reset}`
    );
    console.error(
      `${colors.red}Make sure the server is running before executing tests${colors.reset}`
    );
    console.error(
      `${colors.gray}Run: npm run dev (in another terminal)${colors.reset}\n`
    );
    process.exit(1);
  }
}

// Run the tests
runAllTests();
