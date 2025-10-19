// Debug script to check what data is actually in the database
const debugDatabaseData = async () => {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 Debugging Database Data');
  console.log('==========================');
  
  try {
    // Test 1: Get all disposal records
    console.log('\n1. Fetching ALL disposal records...');
    const allResponse = await fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&fields=summary`);
    const allData = await allResponse.json();
    
    if (allResponse.ok) {
      console.log(`📋 Total records found: ${allData.data?.length || 0}`);
      
      if (allData.data && allData.data.length > 0) {
        // Group by binType
        const grouped = allData.data.reduce((acc, record) => {
          const type = record.binType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Records by type:');
        Object.entries(grouped).forEach(([type, count]) => {
          console.log(`   - ${type}: ${count} records`);
        });
        
        // Show sample records
        console.log('\n📝 Sample records:');
        allData.data.slice(0, 3).forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record._id}, Type: ${record.binType}, BinId: ${record.binId}, Created: ${record.createdAt}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch all records:', allData.error);
    }
    
    // Test 2: Get hazardous records specifically
    console.log('\n2. Fetching HAZARDOUS records...');
    const hazardousResponse = await fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Hazardous&fields=summary`);
    const hazardousData = await hazardousResponse.json();
    
    if (hazardousResponse.ok) {
      console.log(`🔴 Hazardous records: ${hazardousData.data?.length || 0}`);
    } else {
      console.log('❌ Failed to fetch hazardous records:', hazardousData.error);
    }
    
    // Test 3: Get non-hazardous records specifically
    console.log('\n3. Fetching NON-HAZARDOUS records...');
    const nonHazardousResponse = await fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Non-Hazardous&fields=summary`);
    const nonHazardousData = await nonHazardousResponse.json();
    
    if (nonHazardousResponse.ok) {
      console.log(`🟢 Non-Hazardous records: ${nonHazardousData.data?.length || 0}`);
      
      if (nonHazardousData.data && nonHazardousData.data.length > 0) {
        console.log('📝 Sample non-hazardous records:');
        nonHazardousData.data.slice(0, 3).forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record._id}, Type: ${record.binType}, BinId: ${record.binId}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch non-hazardous records:', nonHazardousData.error);
    }
    
    // Test 4: Check if there are any records with different binType values
    console.log('\n4. Checking for other binType values...');
    if (allData.data && allData.data.length > 0) {
      const uniqueTypes = [...new Set(allData.data.map(r => r.binType))];
      console.log('🏷️ Unique binType values found:', uniqueTypes);
      
      uniqueTypes.forEach(type => {
        const count = allData.data.filter(r => r.binType === type).length;
        console.log(`   - "${type}": ${count} records`);
      });
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   - Total records: ${allData.data?.length || 0}`);
    console.log(`   - Hazardous: ${hazardousData.data?.length || 0}`);
    console.log(`   - Non-Hazardous: ${nonHazardousData.data?.length || 0}`);
    
    console.log('\n🎉 Database debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

// Run the debug if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  debugDatabaseData();
} else {
  // Browser environment
  console.log('Run this debug in Node.js environment or call debugDatabaseData() in browser console');
}

module.exports = { debugDatabaseData };
