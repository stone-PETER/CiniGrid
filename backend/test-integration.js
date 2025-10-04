#!/usr/bin/env node

/**
 * Simple AI Agent Test Script
 * Tests the AI Agent integration without full server startup
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

console.log("\n🔍 Testing AI Agent Integration\n");

// Check environment variables
console.log("✓ Environment Variables:");
console.log(`  PORT: ${process.env.PORT || "5000"}`);
console.log(`  MONGO_URI: ${process.env.MONGO_URI ? "✓ Set" : "✗ Not set"}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? "✓ Set" : "✗ Not set"}`);
console.log(
  `  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Not set"}`
);
console.log(
  `  GOOGLE_MAPS_API_KEY: ${
    process.env.GOOGLE_MAPS_API_KEY ? "✓ Set" : "✗ Not set"
  }`
);

// Check if modules can be imported
console.log("\n✓ Checking module imports:");

try {
  const { default: AIRecommendation } = await import(
    "./models/AIRecommendation.js"
  );
  console.log("  ✓ AIRecommendation model imported");
} catch (error) {
  console.log(`  ✗ AIRecommendation model error: ${error.message}`);
}

try {
  const aiAgentController = await import("./controllers/aiAgentController.js");
  console.log("  ✓ aiAgentController imported");
  console.log(`    - Functions: ${Object.keys(aiAgentController).join(", ")}`);
} catch (error) {
  console.log(`  ✗ aiAgentController error: ${error.message}`);
}

try {
  const { default: aiAgentRoutes } = await import("./routes/aiAgentRoutes.js");
  console.log("  ✓ aiAgentRoutes imported");
} catch (error) {
  console.log(`  ✗ aiAgentRoutes error: ${error.message}`);
}

try {
  const aiAgent = await import("./services/aiAgent.js");
  console.log("  ✓ aiAgent service imported");
  console.log(`    - Functions: ${Object.keys(aiAgent).join(", ")}`);

  // Check if AI Agent is available
  if (aiAgent.isAIAgentAvailable) {
    const available = aiAgent.isAIAgentAvailable();
    console.log(
      `    - AI Agent Available: ${
        available ? "✓ Yes" : "✗ No (API keys missing)"
      }`
    );
  }
} catch (error) {
  console.log(`  ✗ aiAgent service error: ${error.message}`);
}

console.log("\n✓ Integration Test Complete!\n");

// Test database connection
if (process.env.MONGO_URI) {
  console.log("Testing MongoDB connection...");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connection successful");

    // Check if AIRecommendation collection exists
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const hasAIRecommendation = collections.some(
      (col) => col.name === "airecommendations"
    );
    console.log(
      `✓ AIRecommendation collection: ${
        hasAIRecommendation ? "exists" : "will be created on first use"
      }`
    );

    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  } catch (error) {
    console.log(`✗ MongoDB error: ${error.message}`);
  }
}

console.log("\n✅ All checks complete!\n");
