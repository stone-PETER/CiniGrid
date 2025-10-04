#!/usr/bin/env node

/**
 * AI Agent Implementation Test Script
 * Tests the integrated AI Agent service (aiAgent.js) without full server startup
 *
 * Usage: node test-ai-implementation.js "your scene description here"
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  findAndRankLocations,
  getCacheStats,
  isAIAgentAvailable,
  clearExpiredCache,
} from "./services/aiAgent.js";

dotenv.config();

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Check if required configuration is available
 */
function checkConfiguration() {
  log.title("🔍 Checking Configuration");

  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasMaps = !!process.env.GOOGLE_MAPS_API_KEY;
  const hasMongo = !!process.env.MONGO_URI;

  if (hasGemini) {
    log.success("Gemini API key found");
  } else {
    log.error("Gemini API key missing (GEMINI_API_KEY)");
  }

  if (hasMaps) {
    log.success("Google Maps API key found");
  } else {
    log.error("Google Maps API key missing (GOOGLE_MAPS_API_KEY)");
  }

  if (hasMongo) {
    log.success("MongoDB URI found");
  } else {
    log.warning("MongoDB URI missing (MONGO_URI) - caching won't work");
  }

  if (!hasGemini || !hasMaps) {
    log.error("\nPlease add API keys to backend/.env:");
    console.log("  GEMINI_API_KEY=your_gemini_key");
    console.log("  GOOGLE_MAPS_API_KEY=your_maps_key");
    console.log("  MONGO_URI=mongodb://localhost:27017/location-scouting");
    process.exit(1);
  }

  const available = isAIAgentAvailable();
  if (available) {
    log.success("AI Agent service is available\n");
  } else {
    log.error("AI Agent service is not available\n");
    process.exit(1);
  }
}

/**
 * Display results in a nice format
 */
function displayResults(result) {
  log.title("🎬 AI Agent Results");

  console.log(
    `${colors.bright}Cache Status: ${
      result.cached ? "✓ HIT (from cache)" : "✗ MISS (fresh results)"
    }${colors.reset}\n`
  );

  result.results.forEach((location, index) => {
    console.log(
      `${colors.bright}${index + 1}. ${location.name}${colors.reset}`
    );
    console.log(
      `   ${colors.cyan}Rating: ${location.rating}/10${colors.reset}`
    );
    console.log(
      `   ${colors.yellow}Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}${colors.reset}`
    );
    console.log(`   Address: ${location.address || "N/A"}`);
    console.log(`   Place ID: ${location.placeId || "N/A"}`);
    console.log(`   ${colors.green}Why: ${location.reason}${colors.reset}`);
    console.log("");
  });

  // Display metadata
  if (result.metadata) {
    log.title("📊 Processing Metadata");
    console.log(
      `   Total places found: ${result.metadata.totalPlacesFound || 0}`
    );
    console.log(
      `   Places analyzed: ${result.metadata.totalPlacesAnalyzed || 0}`
    );
    console.log(`   Processing time: ${result.metadata.processingTime || 0}ms`);
    if (result.metadata.apiCalls) {
      console.log(
        `   Google Places API calls: ${
          result.metadata.apiCalls.googlePlaces || 0
        }`
      );
      console.log(
        `   Gemini AI API calls: ${result.metadata.apiCalls.gemini || 0}`
      );
    }
    console.log("");
  }
}

/**
 * Display cache statistics
 */
async function displayCacheStats() {
  try {
    log.title("📈 Cache Statistics");
    const stats = await getCacheStats();

    console.log(`   Total cached entries: ${stats.totalCached}`);
    console.log(`   Total cache accesses: ${stats.totalAccesses}`);
    console.log(
      `   Average accesses per entry: ${stats.avgAccessesPerEntry.toFixed(2)}`
    );
    console.log(`   Cache hit rate: ${stats.cacheHitRate}`);
    if (stats.oldestEntry) {
      console.log(
        `   Oldest entry: ${new Date(stats.oldestEntry).toLocaleString()}`
      );
    }
    if (stats.newestEntry) {
      console.log(
        `   Newest entry: ${new Date(stats.newestEntry).toLocaleString()}`
      );
    }
    console.log("");
  } catch (error) {
    log.warning(
      "Could not retrieve cache stats (MongoDB might not be connected)"
    );
  }
}

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    log.warning("Skipping MongoDB connection (MONGO_URI not set)");
    return false;
  }

  try {
    log.info("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    log.success("Connected to MongoDB");
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    log.warning("Continuing without database (no caching)");
    return false;
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════╗
║   AI Agent Implementation Test               ║
║   Testing Integrated aiAgent.js              ║
╚═══════════════════════════════════════════════╝${colors.reset}
`);

  // Check configuration
  checkConfiguration();

  // Connect to database
  const dbConnected = await connectDatabase();

  // Get description from command line args or use default
  const description =
    process.argv[2] ||
    "Modern coffee shop with natural light for morning scene";

  console.log(`${colors.bright}Testing with description:${colors.reset}`);
  console.log(`  "${description}"\n`);

  const startTime = Date.now();

  try {
    // Test 1: Find and rank locations (fresh results)
    log.title("🔍 Test 1: Finding locations (fresh request)");
    const result1 = await findAndRankLocations(description, {
      forceRefresh: true,
      maxResults: 5,
    });

    displayResults(result1);

    // Test 2: Find and rank locations again (should hit cache if DB connected)
    if (dbConnected) {
      log.title("🔍 Test 2: Finding same locations (testing cache)");
      const result2 = await findAndRankLocations(description, {
        forceRefresh: false,
        maxResults: 5,
      });

      if (result2.cached) {
        log.success("✓ Cache is working! Results returned from cache");
        console.log(
          `   Cache access time: ~${
            result2.metadata?.processingTime || 0
          }ms (vs ${result1.metadata?.processingTime || 0}ms fresh)\n`
        );
      } else {
        log.warning("Cache miss - results fetched fresh");
      }

      // Display cache statistics
      await displayCacheStats();
    } else {
      log.warning("Skipping cache test (MongoDB not connected)");
    }

    // Summary
    const duration = Date.now() - startTime;
    log.title("✅ Test Summary");
    log.success(`Total test time: ${(duration / 1000).toFixed(2)}s`);
    log.success(`Results returned: ${result1.results.length}`);
    log.success(
      `Database caching: ${dbConnected ? "✓ Enabled" : "✗ Disabled"}`
    );

    console.log(
      `\n${colors.green}${colors.bright}✓ All tests completed successfully!${colors.reset}\n`
    );

    // Cleanup
    if (dbConnected) {
      await mongoose.disconnect();
      log.info("Disconnected from MongoDB");
    }

    process.exit(0);
  } catch (error) {
    log.error("\nTest failed!");
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.error(error.stack);
    }

    // Cleanup
    if (dbConnected) {
      await mongoose.disconnect();
    }

    process.exit(1);
  }
}

// Run the test
runTest();
