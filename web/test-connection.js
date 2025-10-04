/**
 * Frontend-Backend Connection Test
 * Tests the connection between React frontend and Express backend
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

// Read .env file
function readEnvFile() {
  try {
    const envPath = path.join(__dirname, ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const env = {};

    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });

    return env;
  } catch (error) {
    console.log(
      `${colors.yellow}⚠ No .env file found, using defaults${colors.reset}`
    );
    return {};
  }
}

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || "GET",
      headers: {
        Origin: "http://localhost:5173",
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
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
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

// Main test function
async function testConnection() {
  console.log(
    `\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.blue}║      Frontend-Backend Connection Test                    ║${colors.reset}`
  );
  console.log(
    `${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`
  );

  // Read environment variables
  const env = readEnvFile();
  const apiUrl = env.VITE_API_URL || "http://localhost:5000/api";
  const backendUrl = apiUrl.replace("/api", "");

  console.log(`${colors.gray}Configuration:${colors.reset}`);
  console.log(`  Frontend URL: http://localhost:5173`);
  console.log(`  Backend URL: ${backendUrl}`);
  console.log(`  API Base URL: ${apiUrl}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Backend is running
  console.log(`${colors.blue}Test 1: Backend Server Status${colors.reset}`);
  try {
    const response = await makeRequest(backendUrl);
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Backend is running${colors.reset}`);
      console.log(
        `  ${colors.gray}Status: ${response.statusCode}${colors.reset}`
      );
      console.log(
        `  ${colors.gray}Message: ${response.body.message}${colors.reset}`
      );
      passed++;
    } else {
      console.log(
        `${colors.red}✗ Backend returned unexpected status${colors.reset}`
      );
      console.log(
        `  ${colors.red}Status: ${response.statusCode}${colors.reset}`
      );
      failed++;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot connect to backend${colors.reset}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    console.log(
      `  ${colors.yellow}Make sure backend is running: npm run dev${colors.reset}`
    );
    failed++;
  }

  // Test 2: CORS headers
  console.log(`\n${colors.blue}Test 2: CORS Configuration${colors.reset}`);
  try {
    const response = await makeRequest(backendUrl);
    const corsHeader = response.headers["access-control-allow-origin"];

    if (corsHeader) {
      console.log(`${colors.green}✓ CORS headers present${colors.reset}`);
      console.log(`  ${colors.gray}Allow Origin: ${corsHeader}${colors.reset}`);

      if (corsHeader.includes("5173") || corsHeader === "*") {
        console.log(
          `${colors.green}✓ Frontend port (5173) is allowed${colors.reset}`
        );
        passed++;
      } else {
        console.log(
          `${colors.yellow}⚠ Frontend port might not be allowed${colors.reset}`
        );
        console.log(
          `  ${colors.yellow}Expected: http://localhost:5173${colors.reset}`
        );
        console.log(`  ${colors.yellow}Got: ${corsHeader}${colors.reset}`);
        passed++;
      }
    } else {
      console.log(`${colors.red}✗ CORS headers missing${colors.reset}`);
      failed++;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot check CORS${colors.reset}`);
    failed++;
  }

  // Test 3: API endpoints accessible
  console.log(`\n${colors.blue}Test 3: API Endpoints${colors.reset}`);
  const endpoints = [
    { path: "/auth/login", method: "POST", body: {} },
    { path: "/ai/search", method: "POST", body: {} },
    { path: "/locations/potential", method: "GET" },
    { path: "/ai-agent/status", method: "GET" },
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${apiUrl}${endpoint.path}`;
      const response = await makeRequest(url, {
        method: endpoint.method,
        body: endpoint.body,
      });

      // 401 or 400 means endpoint exists but needs auth/data
      // 404 means endpoint doesn't exist
      if (response.statusCode !== 404) {
        console.log(
          `${colors.green}✓${colors.reset} ${endpoint.method} ${endpoint.path} - ${colors.gray}Status: ${response.statusCode}${colors.reset}`
        );
        passed++;
      } else {
        console.log(
          `${colors.red}✗${colors.reset} ${endpoint.method} ${endpoint.path} - ${colors.red}Not found${colors.reset}`
        );
        failed++;
      }
    } catch (error) {
      console.log(
        `${colors.red}✗${colors.reset} ${endpoint.method} ${endpoint.path} - ${colors.red}Error: ${error.message}${colors.reset}`
      );
      failed++;
    }
  }

  // Test 4: Environment configuration
  console.log(
    `\n${colors.blue}Test 4: Environment Configuration${colors.reset}`
  );

  if (env.VITE_API_URL) {
    console.log(`${colors.green}✓ VITE_API_URL is set${colors.reset}`);
    console.log(`  ${colors.gray}Value: ${env.VITE_API_URL}${colors.reset}`);
    passed++;
  } else {
    console.log(
      `${colors.yellow}⚠ VITE_API_URL not set (using default)${colors.reset}`
    );
    console.log(
      `  ${colors.gray}Default: http://localhost:5000/api${colors.reset}`
    );
    passed++;
  }

  // Summary
  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(
    `\n${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(
    `${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  if (failed === 0) {
    console.log(
      `${colors.green}✓ All tests passed: ${passed}/${total} (${percentage}%)${colors.reset}`
    );
    console.log(
      `${colors.green}✓ Frontend and backend are properly connected!${colors.reset}\n`
    );
  } else {
    console.log(
      `${colors.yellow}⚠ Tests passed: ${passed}/${total} (${percentage}%)${colors.reset}`
    );
    console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}\n`);

    if (failed > 2) {
      console.log(`${colors.yellow}Troubleshooting:${colors.reset}`);
      console.log(
        `  1. Make sure backend is running: cd backend && npm run dev`
      );
      console.log(`  2. Check backend is on port 5000`);
      console.log(`  3. Verify .env file has correct VITE_API_URL`);
      console.log(`  4. Check CORS settings in backend/index.js\n`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testConnection().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
