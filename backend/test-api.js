import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test function
async function testLocationAPI() {
  try {
    console.log('🧪 Testing Location Storage API Fixes');
    console.log('=====================================\n');

    // Step 1: Login to get token
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
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.data.user.username} (${loginData.data.user.role})`);
    
    const token = loginData.data.token;

    // Step 2: Test AI search
    console.log('\n2. 🤖 Testing AI search...');
    const aiResponse = await fetch(`${BASE_URL}/ai/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'Find beach locations for filming'
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI search failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ AI search successful');
    console.log(`   Found ${aiData.data.suggestions.length} suggestions`);

    // Step 3: Test adding manual location with string permits (the main issue)
    console.log('\n3. 📍 Testing manual location add with string permits...');
    const locationResponse = await fetch(`${BASE_URL}/locations/potential`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        manualData: {
          title: 'Test Beach Location',
          description: 'Beautiful test beach for romantic scenes',
          coordinates: { lat: 8.5241, lng: 76.9366 },
          region: 'Kerala, India',
          tags: ['beach', 'romantic', 'test'],
          permits: ['Coastal Permit', 'Tourism Department', 'Local Authority'],
          images: ['https://example.com/beach1.jpg']
        }
      })
    });

    if (!locationResponse.ok) {
      const errorText = await locationResponse.text();
      throw new Error(`Location add failed: ${locationResponse.status} - ${errorText}`);
    }

    const locationData = await locationResponse.json();
    console.log('✅ Manual location add successful');
    console.log(`   Location ID: ${locationData.data.location._id}`);
    console.log(`   Title: ${locationData.data.location.title}`);
    console.log(`   Permits: ${locationData.data.location.permits.length} permits transformed`);
    
    // Show transformed permits
    locationData.data.location.permits.forEach((permit, index) => {
      console.log(`     ${index + 1}. ${permit.name} (required: ${permit.required})`);
    });

    // Step 4: Test direct add with object permits
    console.log('\n4. 📍 Testing direct add with object permits...');
    const directResponse = await fetch(`${BASE_URL}/locations/direct-add/potential`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Studio Location',
        description: 'Professional studio with equipment',
        coordinates: { lat: 19.0760, lng: 72.8777 },
        region: 'Mumbai, Maharashtra',
        tags: ['studio', 'professional'],
        permits: [
          { name: 'Studio Booking', required: true, notes: 'Book 2 weeks ahead' },
          { name: 'Equipment Setup', required: false, notes: 'Optional for basic shoots' }
        ],
        images: ['https://example.com/studio1.jpg']
      })
    });

    if (!directResponse.ok) {
      const errorText = await directResponse.text();
      throw new Error(`Direct add failed: ${directResponse.status} - ${errorText}`);
    }

    const directData = await directResponse.json();
    console.log('✅ Direct add successful');
    console.log(`   Location ID: ${directData.data.location._id}`);
    console.log(`   Permits: ${directData.data.location.permits.length} permits (already objects)`);

    // Step 5: Test get all potential locations
    console.log('\n5. 📋 Testing get all potential locations...');
    const getAllResponse = await fetch(`${BASE_URL}/locations/potential`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!getAllResponse.ok) {
      throw new Error(`Get all failed: ${getAllResponse.status}`);
    }

    const getAllData = await getAllResponse.json();
    console.log('✅ Get all locations successful');
    console.log(`   Total locations: ${getAllData.data.count}`);

    console.log('\n🎉 ALL TESTS PASSED! Location storage is working correctly.');
    console.log('\n✅ Issues Fixed:');
    console.log('   - Permit string array → object array transformation');
    console.log('   - Enhanced error logging and validation');
    console.log('   - Proper MongoDB connection handling');
    console.log('   - Detailed error messages for debugging');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('   Error:', error.message);
    console.error('\n🔧 Check server logs for detailed error information');
  }
}

// Run the test
testLocationAPI();