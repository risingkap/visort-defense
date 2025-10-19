// Test script to check API response
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testing announcements API...');
    
    const response = await fetch('http://localhost:5000/api/announcements?page=1&limit=1');
    const data = await response.json();
    
    console.log('📡 Status:', response.status);
    console.log('📦 Response structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if data.data is an array
    if (data.data && Array.isArray(data.data)) {
      console.log('✅ data.data is an array with', data.data.length, 'items');
      if (data.data.length > 0) {
        console.log('🔍 First item structure:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log('❌ data.data is not an array:', typeof data.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
