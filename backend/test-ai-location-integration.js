/**
 * Enhanced Integration Test - With AI and Location Testing
 * This test validates that AI search and locations wo    const aiResultsA = result.data.data?.suggestions || result.data.data || result.data.suggestions || [];
    console.log(`   AI Results type: ${typeof aiResultsA}, isArray: ${Array.isArray(aiResultsA)}, length: ${aiResultsA.length}`);
    logTest('AI returns results for Project A', aiResultsA.length > 0, `Count: ${aiResultsA.length}`);

    // Test AI Search for Project B
    logSection('AI Search - Project B (Different Query)');
    
    result = await apiCall('/ai/search', 'POST', {
      prompt: 'urban rooftop with city skyline',
      projectId: testProjects.projectB.id
    }, testUsers.producer.token);

    const aiResultsB = result.data.data?.suggestions || [];
    logTest('AI search works for Project B', result.status === 200, `Results: ${aiResultsB.length}`);PI calls
 */

import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:5000/api";

// Test users (reuse existing)
const testUsers = {
  producer: {
    username: "producer_test",
    password: "Test123!",
    token: null,
    userId: null,
  },
  scout: {
    username: "scout_test",
    password: "Test123!",
    token: null,
    userId: null,
  },
};

const testProjects = {
  projectA: { id: null, name: "AI Test Project A" },
  projectB: { id: null, name: "AI Test Project B" },
};

const apiCall = async (endpoint, method = "GET", body = null, token = null) => {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
};

const logTest = (testName, passed, details = "") => {
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}`);
  if (!passed) throw new Error(`Test failed: ${testName}`);
};

const logSection = (title) => {
  console.log("\n" + "=".repeat(60));
  console.log(`📋 ${title}`);
  console.log("=".repeat(60) + "\n");
};

const runEnhancedTests = async () => {
  console.log("\n🚀 Enhanced AI & Location Integration Test\n");

  try {
    // Login users
    logSection("Authentication");

    let result = await apiCall("/auth/login", "POST", {
      username: testUsers.producer.username,
      password: testUsers.producer.password,
    });
    testUsers.producer.token = result.data.data.token;
    testUsers.producer.userId = result.data.data.user.id;
    logTest(
      "Producer logged in",
      result.status === 200,
      `User ID: ${testUsers.producer.userId}`
    );

    result = await apiCall("/auth/login", "POST", {
      username: testUsers.scout.username,
      password: testUsers.scout.password,
    });
    testUsers.scout.token = result.data.data.token;
    testUsers.scout.userId = result.data.data.user.id;
    logTest(
      "Scout logged in",
      result.status === 200,
      `User ID: ${testUsers.scout.userId}`
    );

    // Create test projects
    logSection("Project Setup");

    result = await apiCall(
      "/projects",
      "POST",
      {
        name: testProjects.projectA.name,
        description: "Testing AI search and locations with project scoping",
      },
      testUsers.producer.token
    );
    testProjects.projectA.id = result.data.data?.project?._id;
    logTest(
      "Created Project A",
      result.status === 201,
      `ID: ${testProjects.projectA.id}`
    );

    result = await apiCall(
      "/projects",
      "POST",
      {
        name: testProjects.projectB.name,
        description: "Second project for isolation testing",
      },
      testUsers.producer.token
    );
    testProjects.projectB.id = result.data.data?.project?._id;
    logTest(
      "Created Project B",
      result.status === 201,
      `ID: ${testProjects.projectB.id}`
    );

    // Invite scout to Project A
    result = await apiCall(
      `/projects/${testProjects.projectA.id}/invitations`,
      "POST",
      {
        username: testUsers.scout.username,
        roles: ["scout"],
      },
      testUsers.producer.token
    );
    const invitationId = result.data.data?.invitation?._id;
    logTest("Invited scout to Project A", result.status === 201);

    result = await apiCall(
      `/invitations/${invitationId}/accept`,
      "POST",
      null,
      testUsers.scout.token
    );
    logTest("Scout accepted invitation", result.status === 200);

    // Test AI Search with Project Scoping
    logSection("AI Search - Project A");

    result = await apiCall(
      "/ai/search",
      "POST",
      {
        prompt: "modern coffee shop with large windows",
        projectId: testProjects.projectA.id,
      },
      testUsers.scout.token
    );

    console.log(`   Status: ${result.status}`);
    console.log(`   Success: ${result.data.success}`);
    console.log(`   Data keys: ${Object.keys(result.data)}`);
    console.log(`   Data.data type: ${typeof result.data.data}`);
    console.log(
      `   Data.data: ${JSON.stringify(result.data.data, null, 2).substring(
        0,
        500
      )}`
    );

    if (result.status !== 200) {
      console.log(
        `   Error: ${
          result.data.error || result.data.message || "Unknown error"
        }`
      );
    }

    logTest(
      "AI search returns 200",
      result.status === 200,
      `Status: ${result.status}`
    );

    const aiResultsA =
      result.data.data?.suggestions ||
      result.data.data ||
      result.data.suggestions ||
      [];
    console.log(
      `   AI Results type: ${typeof aiResultsA}, isArray: ${Array.isArray(
        aiResultsA
      )}, length: ${aiResultsA.length}`
    );
    logTest(
      "AI returns results for Project A",
      aiResultsA.length > 0,
      `Count: ${aiResultsA.length}`
    );

    // Test AI Search for Project B
    logSection("AI Search - Project B (Different Query)");

    result = await apiCall(
      "/ai/search",
      "POST",
      {
        prompt: "urban rooftop with city skyline",
        projectId: testProjects.projectB.id,
      },
      testUsers.producer.token
    );

    const aiResultsB = result.data.data || [];
    logTest(
      "AI search works for Project B",
      result.status === 200,
      `Results: ${aiResultsB.length}`
    );

    // Add location from AI result to Project A
    logSection("Location Management - Project A");

    if (aiResultsA.length > 0) {
      const suggestion = aiResultsA[0];
      console.log(
        `   Adding location: ${
          suggestion.name || suggestion.title || "Unknown"
        }`
      );

      result = await apiCall(
        "/locations/potential",
        "POST",
        {
          suggestionData: suggestion,
          projectId: testProjects.projectA.id,
        },
        testUsers.scout.token
      );

      logTest(
        "Add location to Project A",
        result.status === 201,
        `Location ID: ${result.data.data?.location?._id}`
      );

      const locationId = result.data.data?.location?._id;
      const locationProjectId = result.data.data?.location?.projectId;

      logTest(
        "Location has projectId",
        locationProjectId === testProjects.projectA.id,
        `ProjectId: ${locationProjectId}`
      );

      // Get locations for Project A
      result = await apiCall(
        `/locations/potential?projectId=${testProjects.projectA.id}`,
        "GET",
        null,
        testUsers.scout.token
      );

      const projectALocations = result.data.data?.locations || [];
      logTest(
        "Fetch Project A locations",
        projectALocations.length > 0,
        `Count: ${projectALocations.length}`
      );

      // Verify location is in the list
      const foundLocation = projectALocations.find(
        (loc) => loc._id === locationId
      );
      logTest("Added location appears in list", foundLocation !== undefined);

      // Finalize the location
      result = await apiCall(
        `/locations/potential/${locationId}/finalize`,
        "POST",
        {},
        testUsers.producer.token
      );

      logTest(
        "Finalize location",
        result.status === 200 || result.status === 201
      );

      const finalizedProjectId = result.data.data?.location?.projectId;
      logTest(
        "ProjectId preserved after finalization",
        finalizedProjectId === testProjects.projectA.id,
        `ProjectId: ${finalizedProjectId}`
      );

      // Get finalized locations
      result = await apiCall(
        `/locations/finalized?projectId=${testProjects.projectA.id}`,
        "GET",
        null,
        testUsers.producer.token
      );

      const finalizedLocations = result.data.data?.locations || [];
      logTest(
        "Fetch finalized locations",
        finalizedLocations.length > 0,
        `Count: ${finalizedLocations.length}`
      );
    }

    // Add location to Project B
    logSection("Location Management - Project B");

    if (aiResultsB.length > 0) {
      const suggestion = aiResultsB[0];

      result = await apiCall(
        "/locations/potential",
        "POST",
        {
          suggestionData: suggestion,
          projectId: testProjects.projectB.id,
        },
        testUsers.producer.token
      );

      logTest("Add location to Project B", result.status === 201);
    }

    // Test Data Isolation
    logSection("Data Isolation Testing");

    result = await apiCall(
      `/locations/potential?projectId=${testProjects.projectA.id}`,
      "GET",
      null,
      testUsers.scout.token
    );
    const projectALocs = result.data.data?.locations || [];

    result = await apiCall(
      `/locations/potential?projectId=${testProjects.projectB.id}`,
      "GET",
      null,
      testUsers.producer.token
    );
    const projectBLocs = result.data.data?.locations || [];

    console.log(`   Project A locations: ${projectALocs.length}`);
    console.log(`   Project B locations: ${projectBLocs.length}`);

    // Verify no location ID overlap
    const projectAIds = projectALocs.map((loc) => loc._id);
    const projectBIds = projectBLocs.map((loc) => loc._id);
    const overlap = projectAIds.filter((id) => projectBIds.includes(id));

    logTest(
      "No location overlap between projects",
      overlap.length === 0,
      `Overlap count: ${overlap.length}`
    );

    // Final Summary
    logSection("Test Summary");

    // Re-fetch locations to get accurate counts
    result = await apiCall(
      `/locations/potential?projectId=${testProjects.projectA.id}`,
      "GET",
      null,
      testUsers.scout.token
    );
    const finalProjectALocs = result.data.data?.locations || [];

    result = await apiCall(
      `/locations/potential?projectId=${testProjects.projectB.id}`,
      "GET",
      null,
      testUsers.producer.token
    );
    const finalProjectBLocs = result.data.data?.locations || [];

    console.log("📊 Results:");
    console.log(`   ✅ Projects created: 2`);
    console.log(`   ✅ AI searches performed: 2`);
    console.log(`   ✅ Project A AI results: ${aiResultsA.length}`);
    console.log(`   ✅ Project B AI results: ${aiResultsB.length}`);
    console.log(
      `   ✅ Project A potential locations: ${finalProjectALocs.length}`
    );
    console.log(
      `   ✅ Project B potential locations: ${finalProjectBLocs.length}`
    );

    result = await apiCall(
      `/locations/finalized?projectId=${testProjects.projectA.id}`,
      "GET",
      null,
      testUsers.producer.token
    );
    const finalizedLocs = result.data.data?.locations || [];
    console.log(`   ✅ Project A finalized locations: ${finalizedLocs.length}`);
    console.log(`   ✅ Data isolation: Verified`);
    console.log("\n✅ All enhanced tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Check backend
const checkBackend = async () => {
  try {
    const response = await fetch("http://localhost:5000");
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

(async () => {
  console.log("🔍 Checking backend...");
  const isRunning = await checkBackend();

  if (!isRunning) {
    console.error("❌ Backend not running on http://localhost:5000");
    process.exit(1);
  }

  console.log("✅ Backend is running\n");
  await runEnhancedTests();

  console.log("🎉 Enhanced integration test complete!\n");
  process.exit(0);
})();
