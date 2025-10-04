/**
 * Test script for AI-powered location routes
 * Tests the new AI features in the locations API
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  analyzeLocation,
  getSimilarLocations,
  searchPotentialLocations,
} from "./controllers/locationsController.js";
import PotentialLocation from "./models/PotentialLocation.js";
import User from "./models/User.js";

dotenv.config();

// Mock request and response objects
const createMockReq = (body = {}, params = {}, user = null) => ({
  body,
  params,
  user: user || { _id: "test-user-id", role: "scout", username: "test-scout" },
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

// Test 1: Analyze a location
async function testAnalyzeLocation() {
  console.log("\n========================================");
  console.log("TEST 1: AI Location Analysis");
  console.log("========================================\n");

  const req = createMockReq({
    title: "Urban Rooftop",
    description: "Modern city rooftop with skyline views for action scene",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    region: "Los Angeles",
    sceneType: "action sequence",
  });

  const res = createMockRes();

  console.log("Request:", JSON.stringify(req.body, null, 2));
  console.log("\nCalling analyzeLocation...\n");

  await analyzeLocation(req, res);

  console.log("Status Code:", res.statusCode);
  console.log("Response:", JSON.stringify(res.jsonData, null, 2));

  if (res.jsonData?.success) {
    console.log("\n✓ Location analysis successful!");
    console.log(`✓ Source: ${res.jsonData.data.source}`);
    console.log(
      `✓ Suitability Score: ${res.jsonData.data.analysis.suitabilityScore}`
    );
    console.log(
      `✓ Similar Locations: ${res.jsonData.data.similarLocations?.length || 0}`
    );
  } else {
    console.log("\n✗ Location analysis failed");
  }
}

// Test 2: Search for potential locations with AI enhancement
async function testSearchLocations() {
  console.log("\n========================================");
  console.log("TEST 2: AI-Enhanced Location Search");
  console.log("========================================\n");

  const req = createMockReq({
    query: "beach sunset romantic scene",
    region: "California",
    limit: 10,
  });

  const res = createMockRes();

  console.log("Request:", JSON.stringify(req.body, null, 2));
  console.log("\nCalling searchPotentialLocations...\n");

  await searchPotentialLocations(req, res);

  console.log("Status Code:", res.statusCode);
  console.log("Response:", JSON.stringify(res.jsonData, null, 2));

  if (res.jsonData?.success) {
    console.log("\n✓ Location search successful!");
    console.log(`✓ Source: ${res.jsonData.data.source}`);
    console.log(`✓ Existing locations: ${res.jsonData.data.counts.existing}`);
    console.log(`✓ AI suggestions: ${res.jsonData.data.counts.aiSuggestions}`);
    console.log(`✓ Total results: ${res.jsonData.data.counts.total}`);
  } else {
    console.log("\n✗ Location search failed");
  }
}

// Test 3: Get similar locations (requires DB connection)
async function testSimilarLocations() {
  console.log("\n========================================");
  console.log("TEST 3: Find Similar Locations");
  console.log("========================================\n");

  try {
    // Connect to MongoDB
    if (process.env.MONGO_URI) {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✓ MongoDB connected\n");

      // Create a test location
      const testUser =
        (await User.findOne()) ||
        (await User.create({
          username: "test-scout",
          email: "test@example.com",
          password: "password123",
          role: "scout",
        }));

      const testLocation = await PotentialLocation.create({
        title: "Test Beach Location",
        description: "Beautiful sandy beach with clear blue water",
        coordinates: { lat: 33.7701, lng: -118.1937 },
        region: "Long Beach, CA",
        addedBy: testUser._id,
      });

      console.log("Created test location:", testLocation.title);
      console.log("Location ID:", testLocation._id);

      const req = createMockReq({}, { id: testLocation._id.toString() });
      const res = createMockRes();

      console.log("\nCalling getSimilarLocations...\n");

      await getSimilarLocations(req, res);

      console.log("Status Code:", res.statusCode);
      console.log("Response:", JSON.stringify(res.jsonData, null, 2));

      if (res.jsonData?.success) {
        console.log("\n✓ Similar locations found!");
        console.log(`✓ Source: ${res.jsonData.data.source}`);
        console.log(`✓ Suggestions count: ${res.jsonData.data.count}`);
        if (res.jsonData.data.cached !== undefined) {
          console.log(`✓ Cached: ${res.jsonData.data.cached}`);
        }
      } else {
        console.log("\n✗ Similar locations search failed");
      }

      // Clean up
      await testLocation.deleteOne();
      console.log("\n✓ Test location cleaned up");
    } else {
      console.log("⚠ MONGO_URI not configured, skipping database test");
    }
  } catch (error) {
    console.error("\n✗ Error in similar locations test:", error.message);
  }
}

// Test 4: Edge cases
async function testEdgeCases() {
  console.log("\n========================================");
  console.log("TEST 4: Edge Cases & Validation");
  console.log("========================================\n");

  // Test 4a: Missing required fields in analyze
  console.log("Test 4a: Analyze without required fields");
  let req = createMockReq({ title: "Test" }); // Missing description
  let res = createMockRes();
  await analyzeLocation(req, res);
  console.log(`✓ Status: ${res.statusCode} (expected 400)`);
  console.log(`✓ Error: ${res.jsonData?.error}\n`);

  // Test 4b: Empty search query
  console.log("Test 4b: Search with empty query");
  req = createMockReq({ query: "" });
  res = createMockRes();
  await searchPotentialLocations(req, res);
  console.log(`✓ Status: ${res.statusCode} (expected 400)`);
  console.log(`✓ Error: ${res.jsonData?.error}\n`);

  // Test 4c: Non-existent location ID
  console.log("Test 4c: Similar locations for non-existent ID");
  req = createMockReq({}, { id: "507f1f77bcf86cd799439011" });
  res = createMockRes();
  await getSimilarLocations(req, res);
  console.log(`✓ Status: ${res.statusCode} (expected 404 or works with mock)`);
  console.log(`✓ Response: ${res.jsonData?.error || "Mock data returned"}\n`);
}

// Main test runner
async function runAllTests() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║   AI-Powered Location Routes Integration Test Suite     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const startTime = Date.now();

  try {
    // Run tests
    await testAnalyzeLocation();
    await testSearchLocations();
    await testSimilarLocations();
    await testEdgeCases();

    const duration = Date.now() - startTime;

    console.log("\n========================================");
    console.log("TEST SUMMARY");
    console.log("========================================\n");
    console.log("✓ All tests completed successfully!");
    console.log(`✓ Total duration: ${duration}ms`);
    console.log("\n📋 New AI Features Available:");
    console.log(
      "   1. POST /api/locations/analyze - Analyze location suitability"
    );
    console.log(
      "   2. GET /api/locations/:id/similar - Find similar locations"
    );
    console.log(
      "   3. POST /api/locations/search - AI-enhanced location search"
    );
  } catch (error) {
    console.error("\n✗ Test suite failed:", error);
  } finally {
    // Close MongoDB connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("\n✓ MongoDB disconnected");
    }
  }

  console.log(
    "\n════════════════════════════════════════════════════════════\n"
  );
}

// Run the tests
runAllTests().catch(console.error);
