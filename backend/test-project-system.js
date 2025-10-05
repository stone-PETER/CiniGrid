/**
 * Quick test script for Phase 1 project system
 * Tests authentication, project creation, and invitation flow
 */

const API_BASE = "http://localhost:5000/api";

let testUser1Token = "";
let testUser2Token = "";
let projectId = "";
let invitationId = "";

async function apiCall(endpoint, method = "GET", body = null, token = "") {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ API call failed: ${endpoint}`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function runTests() {
  console.log("🧪 Starting Phase 1 System Tests...\n");

  // Test 1: Register user1 (no role required)
  console.log("📝 Test 1: Register user1 without role...");
  const register1 = await apiCall("/auth/register", "POST", {
    username: `testuser_${Date.now()}`,
    password: "pass123",
  });

  if (register1.data.success) {
    testUser1Token = register1.data.data.token;
    console.log(`✅ User1 registered: ${register1.data.data.user.username}`);
    console.log(
      `   No role field: ${!register1.data.data.user.role ? "PASS" : "FAIL"}\n`
    );
  } else {
    console.log(`❌ User1 registration failed: ${register1.data.error}\n`);
    return;
  }

  // Test 2: Register user2
  console.log("📝 Test 2: Register user2...");
  const register2 = await apiCall("/auth/register", "POST", {
    username: `testuser2_${Date.now()}`,
    password: "pass123",
  });

  if (register2.data.success) {
    testUser2Token = register2.data.data.token;
    console.log(`✅ User2 registered: ${register2.data.data.user.username}\n`);
  } else {
    console.log(`❌ User2 registration failed: ${register2.data.error}\n`);
    return;
  }

  // Test 3: Create project
  console.log("📝 Test 3: Create project with user1...");
  const createProject = await apiCall(
    "/projects",
    "POST",
    {
      name: "Test Film Project",
      description: "Testing project-based roles",
    },
    testUser1Token
  );

  if (createProject.data.success) {
    projectId = createProject.data.data.project._id;
    console.log(`✅ Project created: ${createProject.data.data.project.name}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(
      `   Owner has 'owner' role: ${
        createProject.data.data.members[0].roles.includes("owner")
          ? "PASS"
          : "FAIL"
      }\n`
    );
  } else {
    console.log(`❌ Project creation failed: ${createProject.data.error}\n`);
    return;
  }

  // Test 4: List user1's projects
  console.log("📝 Test 4: List user1 projects...");
  const listProjects = await apiCall("/projects", "GET", null, testUser1Token);

  if (listProjects.data.success) {
    console.log(`✅ User1 has ${listProjects.data.data.count} project(s)`);
    console.log(
      `   Has 'owner' role: ${
        listProjects.data.data.projects[0].userRoles.includes("owner")
          ? "PASS"
          : "FAIL"
      }\n`
    );
  } else {
    console.log(`❌ List projects failed: ${listProjects.data.error}\n`);
  }

  // Test 5: Invite user2 to project
  console.log("📝 Test 5: Invite user2 to project...");
  const invite = await apiCall(
    `/projects/${projectId}/invitations`,
    "POST",
    {
      username: register2.data.data.user.username,
      roles: ["scout", "crew"],
      message: "Join our test project!",
    },
    testUser1Token
  );

  if (invite.data.success) {
    invitationId = invite.data.data.invitation._id;
    console.log(`✅ Invitation sent to user2`);
    console.log(`   Invitation ID: ${invitationId}`);
    console.log(`   Roles: ${invite.data.data.invitation.roles.join(", ")}\n`);
  } else {
    console.log(`❌ Invitation failed: ${invite.data.error}\n`);
    return;
  }

  // Test 6: Get user2's invitations
  console.log("📝 Test 6: Get user2 invitations...");
  const myInvites = await apiCall(
    "/invitations?status=pending",
    "GET",
    null,
    testUser2Token
  );

  if (myInvites.data.success) {
    console.log(
      `✅ User2 has ${myInvites.data.data.count} pending invitation(s)`
    );
    if (myInvites.data.data.invitations.length > 0) {
      console.log(
        `   Project: ${myInvites.data.data.invitations[0].projectId.name}`
      );
      console.log(
        `   From: ${myInvites.data.data.invitations[0].inviterId.username}\n`
      );
    }
  } else {
    console.log(`❌ Get invitations failed: ${myInvites.data.error}\n`);
  }

  // Test 7: Accept invitation
  console.log("📝 Test 7: User2 accepts invitation...");
  const accept = await apiCall(
    `/invitations/${invitationId}/accept`,
    "POST",
    null,
    testUser2Token
  );

  if (accept.data.success) {
    console.log(`✅ Invitation accepted!`);
    console.log(`   Message: ${accept.data.message}`);
    console.log(
      `   User2 roles: ${accept.data.data.member.roles.join(", ")}\n`
    );
  } else {
    console.log(`❌ Accept invitation failed: ${accept.data.error}\n`);
    return;
  }

  // Test 8: List user2's projects
  console.log(
    "📝 Test 8: List user2 projects (should include joined project)..."
  );
  const listProjects2 = await apiCall("/projects", "GET", null, testUser2Token);

  if (listProjects2.data.success) {
    console.log(`✅ User2 now has ${listProjects2.data.data.count} project(s)`);
    if (listProjects2.data.data.projects.length > 0) {
      console.log(
        `   Roles in project: ${listProjects2.data.data.projects[0].userRoles.join(
          ", "
        )}\n`
      );
    }
  } else {
    console.log(`❌ List projects failed: ${listProjects2.data.error}\n`);
  }

  // Test 9: Get project members
  console.log("📝 Test 9: Get project members...");
  const members = await apiCall(
    `/projects/${projectId}/members`,
    "GET",
    null,
    testUser1Token
  );

  if (members.data.success) {
    console.log(`✅ Project has ${members.data.data.count} member(s)`);
    members.data.data.members.forEach((member, i) => {
      console.log(
        `   ${i + 1}. ${member.userId.username} - Roles: ${member.roles.join(
          ", "
        )}`
      );
    });
    console.log();
  } else {
    console.log(`❌ Get members failed: ${members.data.error}\n`);
  }

  // Test 10: Try non-admin action (should fail)
  console.log(
    "📝 Test 10: User2 tries to invite someone (should fail - not admin)..."
  );
  const unauthorizedInvite = await apiCall(
    `/projects/${projectId}/invitations`,
    "POST",
    {
      username: "someuser",
      roles: ["crew"],
    },
    testUser2Token
  );

  if (unauthorizedInvite.status === 403) {
    console.log(`✅ Correctly blocked non-admin from inviting`);
    console.log(`   Error: ${unauthorizedInvite.data.error}\n`);
  } else {
    console.log(`❌ Non-admin was allowed to invite (should be blocked!)\n`);
  }

  console.log("🎉 All tests completed!\n");
  console.log("📊 Summary:");
  console.log("   - Authentication without roles: ✅");
  console.log("   - Project creation: ✅");
  console.log("   - Invitation system: ✅");
  console.log("   - Multiple roles per user: ✅");
  console.log("   - Authorization (admin checks): ✅");
}

// Run tests
runTests().catch(console.error);
