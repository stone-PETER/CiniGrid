import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = "http://localhost:5000/api";

async function testAuthAndScenes() {
  try {
    console.log('🧪 Testing Authentication and Scene Creation...\n');

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

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.data.user.username}`);
    
    const token = loginData.data.token;

    // Step 2: Test Scene Creation
    console.log('\n2. 🎬 Testing Scene Creation...');
    const sceneData = {
      sceneNumber: "SC-001",
      title: "Opening Scene",
      description: "The story begins in a coffee shop",
      location: "Downtown Coffee Shop",
      status: "backlogged",
      shotType: "establishing",
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

    if (!sceneResponse.ok) {
      console.error('❌ Scene creation failed:', sceneResponse.status);
      const errorData = await sceneResponse.json();
      console.error('   Error:', errorData);
      return;
    }

    const sceneResult = await sceneResponse.json();
    console.log('✅ Scene creation successful');
    console.log(`   Scene: ${sceneResult.data.title} (${sceneResult.data.sceneNumber})`);

    // Step 3: Test Scene Listing
    console.log('\n3. 📋 Testing Scene Listing...');
    const listResponse = await fetch(`${BASE_URL}/scenes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!listResponse.ok) {
      console.error('❌ Scene listing failed:', listResponse.status);
      return;
    }

    const listData = await listResponse.json();
    console.log(`✅ Scene listing successful - Found ${listData.data.length} scenes`);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthAndScenes();