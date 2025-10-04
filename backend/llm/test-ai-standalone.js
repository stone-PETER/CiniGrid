#!/usr/bin/env node

/**
 * Standalone AI Agent Test Script
 * Tests Google Places API + Gemini AI without database or authentication
 *
 * Usage: node test-ai-standalone.js "your scene description here"
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize clients
const mapsClient = new Client({});
let geminiClient = null;

if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

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
 * Check if required API keys are configured
 */
function checkConfiguration() {
  log.title("🔍 Checking Configuration");

  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasMaps = !!process.env.GOOGLE_MAPS_API_KEY;

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

  if (!hasGemini || !hasMaps) {
    log.error("\nPlease add API keys to backend/.env:");
    console.log("  GEMINI_API_KEY=your_gemini_key");
    console.log("  GOOGLE_MAPS_API_KEY=your_maps_key");
    process.exit(1);
  }

  log.success("Configuration OK\n");
}

/**
 * Search for places using Google Places API
 */
async function searchPlaces(description) {
  log.title("📍 Step 1: Searching Google Places");
  log.info(`Query: "${description}"`);

  try {
    const response = await mapsClient.textSearch({
      params: {
        query: description,
        key: process.env.GOOGLE_MAPS_API_KEY,
        type: "point_of_interest",
      },
    });

    const places = response.data.results || [];
    log.success(`Found ${places.length} locations`);

    // Display first few results
    if (places.length > 0) {
      console.log("\n  Sample results:");
      places.slice(0, 3).forEach((place, i) => {
        console.log(
          `  ${i + 1}. ${place.name} - ${
            place.formatted_address || place.vicinity
          }`
        );
      });
      console.log("");
    }

    return places;
  } catch (error) {
    log.error("Google Places API error:");
    console.error(error.message);
    throw error;
  }
}

/**
 * Format places for Gemini AI
 */
function formatPlacesForAI(places) {
  return places.map((place, index) => ({
    id: index + 1,
    name: place.name,
    address:
      place.formatted_address || place.vicinity || "Address not available",
    coordinates: {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    },
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    types: place.types || [],
    placeId: place.place_id,
  }));
}

/**
 * Rank locations using Gemini AI
 */
async function rankWithGemini(description, places) {
  log.title("🤖 Step 2: Ranking with Gemini AI");
  log.info(`Analyzing ${places.length} locations...`);

  try {
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });
    const placesData = formatPlacesForAI(places);

    const prompt = `You are an expert location scout for film and TV production.

Scene Description: "${description}"

Analyze and rank the following filming locations based on their suitability for this scene. Consider:
- Visual appeal and aesthetics matching the scene
- Accessibility for film crew and equipment
- Practical filming considerations
- Atmosphere and ambiance
- Unique features that enhance the scene

Locations to analyze:
${JSON.stringify(placesData.slice(0, 10), null, 2)}

Return ONLY a valid JSON array with the top 5 locations. Each location must include:
{
  "name": "Location name",
  "reason": "2-3 sentences explaining why suitable",
  "rating": <number 0-10>,
  "coordinates": {"lat": <lat>, "lng": <lng>},
  "address": "Full address",
  "placeId": "Google place ID"
}

Return ONLY the JSON array, no markdown or additional text.`;

    log.info("Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean markdown formatting if present
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    const rankedLocations = JSON.parse(text);
    log.success(`Gemini ranked ${rankedLocations.length} locations`);

    return rankedLocations;
  } catch (error) {
    log.error("Gemini AI error:");
    console.error(error.message);
    throw error;
  }
}

/**
 * Display results in a nice format
 */
function displayResults(results) {
  log.title("🎬 Top 5 Filming Locations");

  results.forEach((location, index) => {
    console.log(
      `${colors.bright}${index + 1}. ${location.name}${colors.reset}`
    );
    console.log(
      `   ${colors.cyan}Rating: ${location.rating}/10${colors.reset}`
    );
    console.log(
      `   ${colors.yellow}Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}${colors.reset}`
    );
    console.log(`   Address: ${location.address}`);
    console.log(`   ${colors.green}Why: ${location.reason}${colors.reset}`);
    console.log("");
  });
}

/**
 * Main test function
 */
async function runTest() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════╗
║   AI Agent Standalone Test                   ║
║   Google Places + Gemini AI                  ║
╚═══════════════════════════════════════════════╝${colors.reset}
`);

  // Check configuration
  checkConfiguration();

  // Get description from command line args or use default
  const description =
    process.argv[2] ||
    "Modern coffee shop with natural light for morning scene";

  console.log(`${colors.bright}Testing with description:${colors.reset}`);
  console.log(`  "${description}"\n`);

  const startTime = Date.now();

  try {
    // Step 1: Search Google Places
    const places = await searchPlaces(description);

    if (places.length === 0) {
      log.error("No places found. Try a different description.");
      process.exit(1);
    }

    // Limit to first 10 for faster processing
    const placesToAnalyze = places.slice(0, 10);

    // Step 2: Rank with Gemini
    const ranked = await rankWithGemini(description, placesToAnalyze);

    // Display results
    displayResults(ranked);

    // Summary
    const duration = Date.now() - startTime;
    log.title("📊 Test Summary");
    log.success(`Total places found: ${places.length}`);
    log.success(`Places analyzed: ${placesToAnalyze.length}`);
    log.success(`Results returned: ${ranked.length}`);
    log.success(`Processing time: ${(duration / 1000).toFixed(2)}s`);

    console.log(
      `\n${colors.green}${colors.bright}✓ Test completed successfully!${colors.reset}\n`
    );
  } catch (error) {
    log.error("\nTest failed!");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();
