// Test script to verify count consistency between waste log management and disposal history
const testCountConsistency = async () => {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 Testing Count Consistency Between Waste Log Management and Disposal History');
  console.log('================================================================================');
  
  try {
    // Test 1: Get counts from waste log management (new method)
    console.log('\n1. Fetching counts using disposal history endpoints...');
    
    const [hazardousResponse, nonHazardousResponse] = await Promise.all([
      fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Hazardous&fields=summary`),
      fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Non-Hazardous&fields=summary`)
    ]);

    const hazardousData = await hazardousResponse.json();
    const nonHazardousData = await nonHazardousResponse.json();

    if (!hazardousResponse.ok || !nonHazardousResponse.ok) {
      throw new Error('Failed to fetch disposal records');
    }

    // Filter non-hazardous data to only include Non-Hazardous type
    const nonHazardousFiltered = (nonHazardousData.data || []).filter(item => 
      item.binType === 'Non-Hazardous'
    );

    const wasteLogHazardousCount = hazardousData.data?.length || 0;
    const wasteLogNonHazardousCount = nonHazardousFiltered.length || 0;
    const wasteLogTotalCount = wasteLogHazardousCount + wasteLogNonHazardousCount;

    console.log(`✅ Waste Log Management Counts:`);
    console.log(`   - Hazardous: ${wasteLogHazardousCount}`);
    console.log(`   - Non-Hazardous: ${wasteLogNonHazardousCount}`);
    console.log(`   - Total: ${wasteLogTotalCount}`);

    // Test 2: Get counts from old stats endpoint for comparison
    console.log('\n2. Fetching counts from old stats endpoint (30 days)...');
    const statsResponse = await fetch(`${baseUrl}/api/waste/stats/summary?days=30`);
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log(`📊 Old Stats Endpoint Counts (30 days):`);
      console.log(`   - Hazardous: ${statsData.data?.hazardous || 0}`);
      console.log(`   - Non-Hazardous: ${statsData.data?.nonHazardous || 0}`);
      console.log(`   - Total: ${statsData.data?.total || 0}`);
    }

    // Test 3: Get all disposal records for verification
    console.log('\n3. Fetching all disposal records for verification...');
    const allRecordsResponse = await fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&fields=summary`);
    const allRecordsData = await allRecordsResponse.json();
    
    if (allRecordsResponse.ok) {
      const allRecords = allRecordsData.data || [];
      const hazardousRecords = allRecords.filter(item => item.binType === 'Hazardous');
      const nonHazardousRecords = allRecords.filter(item => item.binType === 'Non-Hazardous');
      
      console.log(`📋 All Disposal Records:`);
      console.log(`   - Total Records: ${allRecords.length}`);
      console.log(`   - Hazardous: ${hazardousRecords.length}`);
      console.log(`   - Non-Hazardous: ${nonHazardousRecords.length}`);
      
      // Verify consistency
      const isConsistent = 
        wasteLogHazardousCount === hazardousRecords.length &&
        wasteLogNonHazardousCount === nonHazardousRecords.length;
      
      console.log(`\n🎯 Consistency Check:`);
      console.log(`   - Hazardous counts match: ${wasteLogHazardousCount === hazardousRecords.length ? '✅' : '❌'}`);
      console.log(`   - Non-Hazardous counts match: ${wasteLogNonHazardousCount === nonHazardousRecords.length ? '✅' : '❌'}`);
      console.log(`   - Overall consistency: ${isConsistent ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    console.log('\n🎉 Count consistency test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testCountConsistency();
} else {
  // Browser environment
  console.log('Run this test in Node.js environment or call testCountConsistency() in browser console');
}

module.exports = { testCountConsistency };
