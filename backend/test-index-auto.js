/**
 * Automated Test Runner for index.js
 * Starts the server, runs tests, and shuts down
 */

import { spawn } from "child_process";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;

// Colors for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

console.log(
  `\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`
);
console.log(
  `${colors.blue}║     Automated index.js Test Runner                       ║${colors.reset}`
);
console.log(
  `${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`
);

// Start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.gray}Starting server...${colors.reset}`);

    serverProcess = spawn("node", ["index.js"], {
      cwd: __dirname,
      stdio: "pipe",
    });

    let serverReady = false;

    serverProcess.stdout.on("data", (data) => {
      const output = data.toString();
      process.stdout.write(`${colors.gray}[SERVER] ${output}${colors.reset}`);

      if (output.includes("Server running on port") && !serverReady) {
        serverReady = true;
        console.log(
          `${colors.green}✓ Server started successfully${colors.reset}\n`
        );
        setTimeout(() => resolve(), 2000); // Wait 2 seconds for full initialization
      }
    });

    serverProcess.stderr.on("data", (data) => {
      process.stderr.write(
        `${colors.red}[SERVER ERROR] ${data}${colors.reset}`
      );
    });

    serverProcess.on("error", (error) => {
      reject(new Error(`Failed to start server: ${error.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error("Server did not start within 30 seconds"));
      }
    }, 30000);
  });
}

// Stop the server
function stopServer() {
  if (serverProcess) {
    console.log(`\n${colors.gray}Shutting down server...${colors.reset}`);
    serverProcess.kill();
    serverProcess = null;
    console.log(`${colors.green}✓ Server stopped${colors.reset}\n`);
  }
}

// Run tests
async function runTests() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Running tests...${colors.reset}\n`);

    const testProcess = spawn("node", ["test-index.js"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on("error", (error) => {
      reject(new Error(`Failed to run tests: ${error.message}`));
    });
  });
}

// Main execution
async function main() {
  try {
    // Start server
    await startServer();

    // Run tests
    await runTests();

    // Success
    console.log(
      `${colors.green}✓ All tests completed successfully!${colors.reset}\n`
    );
  } catch (error) {
    console.error(`${colors.red}✗ Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    // Always stop server
    stopServer();
  }
}

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log(
    `\n${colors.yellow}Received SIGINT, cleaning up...${colors.reset}`
  );
  stopServer();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(
    `\n${colors.yellow}Received SIGTERM, cleaning up...${colors.reset}`
  );
  stopServer();
  process.exit(0);
});

// Run
main();
