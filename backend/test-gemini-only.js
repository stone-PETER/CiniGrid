/**
 * TEST SCRIPT: Pure Gemini AI Location Generation
 *
 * This script tests the Gemini-only location generation
 * WITHOUT using Google Places API
 *
 * Usage: node test-gemini-only.js
 */

import dotenv from "dotenv";
import { generateLocationsWithGeminiOnly } from "./services/testGeminiOnlyService.js";

dotenv.config();

// ANSI color codes for pretty console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const log = {
  header: (text) =>
    console.log(
      `\n${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}`
    ),
  title: (text) =>
    console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
  data: (text) => console.log(`${colors.yellow}${text}${colors.reset}`),
  section: (text) =>
    console.log(`\n${colors.bright}${colors.magenta}${text}${colors.reset}`),
};

// Test scenarios
const testScenarios = [
  {
    name: "Modern Office Building",
    description:
      "I need a modern office building with glass facade, large open lobby, parking space, and located in a business district. Should have good natural lighting and be accessible for film crew.",
    maxResults: 3,
    region: "India",
  },
  {
    name: "Outdoor Park Scene",
    description:
      "Looking for a scenic outdoor park with walking paths, trees, benches, and a lake or pond. Needs to be quiet and peaceful, good for filming a romantic conversation scene.",
    maxResults: 3,
    region: "India",
  },
  {
    name: "Historic Temple",
    description:
      "Ancient temple with intricate architecture, stone carvings, and a spiritual atmosphere. Should have interesting lighting opportunities and minimal crowd interference.",
    maxResults: 2,
    region: "India",
  },
];

async function runTest(scenario, index) {
  log.header();
  log.title(`TEST ${index + 1}: ${scenario.name}`);
  log.header();

  console.log(`Description: "${scenario.description}"`);
  console.log(`Max Results: ${scenario.maxResults}`);
  console.log(`Region: ${scenario.region}\n`);

  const startTime = Date.now();

  try {
    const result = await generateLocationsWithGeminiOnly(scenario.description, {
      maxResults: scenario.maxResults,
      region: scenario.region,
    });

    const duration = Date.now() - startTime;

    log.success(`Generated ${result.count} locations in ${duration}ms`);
    log.info(`Model: ${result.metadata.model}`);
    log.info(`Source: ${result.metadata.source}`);

    // Display each location
    result.locations.forEach((location, i) => {
      log.section(`\nLocation ${i + 1}: ${location.name}`);
      console.log(`📍 Address: ${location.address}`);
      console.log(
        `🗺️  Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`
      );
      console.log(`⭐ Rating: ${location.rating}/10`);
      console.log(`🎬 Type: ${location.placeType || "N/A"}`);
      console.log(`\n💡 Reason:\n${location.reason}`);

      if (location.filmingDetails) {
        console.log(`\n🎥 Filming Details:`);
        if (location.filmingDetails.accessibility) {
          console.log(
            `   - Accessibility: ${location.filmingDetails.accessibility}`
          );
        }
        if (location.filmingDetails.parking) {
          console.log(`   - Parking: ${location.filmingDetails.parking}`);
        }
        if (location.filmingDetails.bestTimeToFilm) {
          console.log(
            `   - Best Time: ${location.filmingDetails.bestTimeToFilm}`
          );
        }
        if (
          location.filmingDetails.permits &&
          location.filmingDetails.permits.length > 0
        ) {
          console.log(
            `   - Permits Required: ${location.filmingDetails.permits.length}`
          );
          location.filmingDetails.permits.forEach((permit) => {
            console.log(
              `     • ${permit.name} (${
                permit.required ? "Required" : "Optional"
              }) - ${permit.estimatedCost}`
            );
          });
        }
      }

      if (location.photos && location.photos.length > 0) {
        console.log(`\n📸 Photos: ${location.photos.length} views`);
        location.photos.forEach((photo, pi) => {
          console.log(
            `   ${pi + 1}. ${photo.angle || "View"}: ${
              photo.description || "N/A"
            }`
          );
        });
      }

      if (location.estimatedDailyRate) {
        console.log(
          `\n💰 Estimated Daily Rate: ${location.estimatedDailyRate}`
        );
      }

      console.log("");
    });

    return { success: true, duration, count: result.count };
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     GEMINI-ONLY LOCATION GENERATION TEST SUITE           ║");
  console.log("║     (No Google Places API Required)                      ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    log.error("GEMINI_API_KEY not found in environment variables!");
    process.exit(1);
  }

  log.success("Gemini API key found");

  const results = [];

  // Run each test
  for (let i = 0; i < testScenarios.length; i++) {
    const result = await runTest(testScenarios[i], i);
    results.push(result);

    // Wait a bit between tests to avoid rate limits
    if (i < testScenarios.length - 1) {
      log.info("\nWaiting 2 seconds before next test...\n");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  log.header();
  log.title("TEST SUMMARY");
  log.header();

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  const totalLocations = results.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successful}/${testScenarios.length}`);
  console.log(`   ❌ Failed: ${failed}/${testScenarios.length}`);
  console.log(`   ⏱️  Total Time: ${totalDuration}ms`);
  console.log(`   📍 Total Locations Generated: ${totalLocations}`);
  console.log(
    `   ⚡ Average Time per Test: ${Math.round(
      totalDuration / testScenarios.length
    )}ms\n`
  );

  if (successful === testScenarios.length) {
    log.success("ALL TESTS PASSED! 🎉\n");
  } else {
    log.error(`${failed} test(s) failed\n`);
  }

  // Key differences highlight
  log.section("KEY DIFFERENCES: Gemini-Only vs Full AI Agent");
  console.log(`
  ${colors.cyan}Gemini-Only (This Test):${colors.reset}
  ✅ No Google Places API needed
  ✅ No API rate limits
  ✅ Faster responses (no Google API calls)
  ✅ Creative AI-generated locations
  ✅ Can generate locations for ANY region
  ❌ Locations are hypothetical (may not exist exactly)
  ❌ No real Google Place IDs
  ❌ No real photos (only descriptions)
  
  ${colors.yellow}Full AI Agent (Google Places + Gemini):${colors.reset}
  ✅ Real verified locations
  ✅ Actual Google Place IDs
  ✅ Real photos
  ✅ Verified addresses and coordinates
  ✅ Real reviews and ratings
  ❌ Requires Google Places API key
  ❌ API rate limits apply
  ❌ Slower (2 API calls)
  ❌ Limited to regions with Google Places coverage
  `);

  log.info("Test complete!\n");
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
