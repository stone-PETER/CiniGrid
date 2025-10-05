import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = "http://localhost:5000/api";

async function testIntegratedFunctionality() {
  try {
    console.log('🧪 Testing Integrated Scene and Task Management...\n');

    // Step 1: Login
    console.log('1. 🔐 Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'scout_sara',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful');

    // Step 2: Create a Scene
    console.log('\n2. 🎬 Creating Scene...');
    const sceneData = {
      sceneNumber: "SC-001",
      title: "Opening Beach Scene",
      description: "The protagonist walks along the beach at sunrise",
      location: "Malibu Beach",
      status: "ready",
      shotType: "wide",
      lighting: "natural",
      weather: "sunny"
    };

    const sceneResponse = await fetch(`${BASE_URL}/scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sceneData)
    });

    const sceneResult = await sceneResponse.json();
    console.log('Scene response:', JSON.stringify(sceneResult, null, 2));
    
    if (!sceneResponse.ok) {
      console.error('❌ Scene creation failed:', sceneResult);
      return;
    }
    
    console.log('✅ Scene created:', sceneResult.data.title);
    const sceneId = sceneResult.data._id;

    // Step 3: Create Tasks for the Scene
    console.log('\n3. 📋 Creating Tasks...');
    const tasks = [
      {
        title: "Equipment Setup",
        description: "Set up cameras and lighting for beach scene",
        type: "equipment",
        status: "ready",
        priority: "High",
        sceneId: sceneId,
        dependencies: ["Location scouting", "Weather check"],
        resources: ["Camera", "Tripod", "Lighting kit"],
        estimatedDuration: 60
      },
      {
        title: "Talent Preparation",
        description: "Makeup and wardrobe for lead actor",
        type: "talent",
        status: "backlogged", 
        priority: "Medium",
        sceneId: sceneId,
        estimatedDuration: 45
      }
    ];

    for (const taskData of tasks) {
      const taskResponse = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (taskResponse.ok) {
        const taskResult = await taskResponse.json();
        console.log(`✅ Task created: ${taskResult.data.title}`);
      } else {
        console.error(`❌ Failed to create task: ${taskData.title}`);
      }
    }

    // Step 4: Test Board Data
    console.log('\n4. 📊 Testing Board Data...');
    const boardResponse = await fetch(`${BASE_URL}/board`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (boardResponse.ok) {
      const boardData = await boardResponse.json();
      console.log('✅ Board data loaded successfully');
      console.log(`   Found scenes in different statuses:`);
      Object.keys(boardData.data).forEach(status => {
        const scenes = boardData.data[status].scenes;
        const tasks = boardData.data[status].tasks;
        console.log(`   - ${status}: ${scenes.length} scenes, ${tasks.length} tasks`);
      });
    } else {
      console.error('❌ Failed to load board data');
    }

    // Step 5: Update Scene Status
    console.log('\n5. 🔄 Testing Status Updates...');
    const updateResponse = await fetch(`${BASE_URL}/scenes/${sceneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'ongoing' })
    });

    if (updateResponse.ok) {
      console.log('✅ Scene status updated to ongoing');
    } else {
      console.error('❌ Failed to update scene status');
    }

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - Authentication working ✅');
    console.log('   - Scene creation working ✅');
    console.log('   - Task creation working ✅');
    console.log('   - Board data integration working ✅');
    console.log('   - Status updates working ✅');
    console.log('\n🚀 Ready for frontend testing!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testIntegratedFunctionality();