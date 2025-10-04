#!/usr/bin/env node

/**
 * Test AI Controller Integration
 * Tests the AI controller with real AI Agent implementation
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { searchLocations } from "./controllers/aiController.js";

dotenv.config();

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

async function testAIController() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════╗
║   AI Controller Integration Test            ║
║   Testing searchLocations with AI Agent     ║
╚═══════════════════════════════════════════════╝${colors.reset}
`);

  // Connect to database
  try {
    log.info("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    log.success("Connected to MongoDB\n");
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    log.warning("Continuing without database\n");
  }

  const prompt = "Modern coffee shop with large windows for filming";
  log.title(`Testing: "${prompt}"`);

  // Create mock request and response objects
  const req = {
    body: {
      prompt,
      forceRefresh: false,
      maxResults: 3,
    },
  };

  let responseData = null;

  const res = {
    json: (data) => {
      responseData = data;
    },
    status: (code) => {
      return res;
    },
  };

  try {
    const startTime = Date.now();
    await searchLocations(req, res);
    const duration = Date.now() - startTime;

    if (responseData?.success) {
      log.success(`Request successful in ${(duration / 1000).toFixed(2)}s`);
      log.info(`Source: ${responseData.data.source}`);
      log.info(`Cached: ${responseData.data.cached ? "Yes ✓" : "No (fresh)"}`);
      log.success(`Got ${responseData.data.count} suggestions\n`);

      console.log(`${colors.bright}Results:${colors.reset}\n`);

      responseData.data.suggestions.forEach((suggestion, idx) => {
        console.log(
          `${colors.cyan}${idx + 1}. ${suggestion.title}${colors.reset}`
        );
        if (suggestion.rating) {
          console.log(
            `   Rating: ${colors.yellow}${suggestion.rating}/10${colors.reset}`
          );
        } else if (suggestion.confidence) {
          console.log(
            `   Confidence: ${colors.yellow}${(
              suggestion.confidence * 10
            ).toFixed(1)}/10${colors.reset}`
          );
        }
        console.log(`   Region: ${suggestion.region}`);
        console.log(`   ${suggestion.description.substring(0, 120)}...`);
        if (suggestion.placeId) {
          console.log(
            `   Place ID: ${colors.blue}${suggestion.placeId}${colors.reset}`
          );
        }
        console.log();
      });

      if (responseData.data.metadata) {
        log.title("📊 Performance Metrics");
        console.log(
          `   Processing time: ${responseData.data.metadata.processingTime}ms`
        );
        console.log(
          `   Places found: ${responseData.data.metadata.totalPlacesFound}`
        );
        console.log(
          `   Places analyzed: ${responseData.data.metadata.totalPlacesAnalyzed}`
        );
        if (responseData.data.metadata.apiCalls) {
          console.log(
            `   Google Places API calls: ${responseData.data.metadata.apiCalls.googlePlaces}`
          );
          console.log(
            `   Gemini AI calls: ${responseData.data.metadata.apiCalls.gemini}`
          );
        }
      }

      // Test cache on second request
      log.title("Testing cache with same prompt...");
      const req2 = {
        body: {
          prompt,
          forceRefresh: false,
          maxResults: 3,
        },
      };

      let responseData2 = null;
      const res2 = {
        json: (data) => {
          responseData2 = data;
        },
        status: () => res2,
      };

      const startTime2 = Date.now();
      await searchLocations(req2, res2);
      const duration2 = Date.now() - startTime2;

      if (responseData2?.success && responseData2.data.cached) {
        log.success(
          `Cache working! Retrieved in ${(duration2 / 1000).toFixed(2)}s`
        );
        log.success(
          `Speed improvement: ${(duration / duration2).toFixed(1)}x faster\n`
        );
      } else {
        log.warning("Cache not hit - might be using mock data\n");
      }
    } else {
      log.error(`Request failed: ${responseData?.error || "Unknown error"}`);
      if (responseData?.details) {
        console.error(`Details: ${responseData.details}`);
      }
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error.stack);
  }

  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    log.info("Disconnected from MongoDB");
  }

  log.title("✅ Test completed!");
}

// Run test
testAIController().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
