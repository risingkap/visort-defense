// Script to update binType values in the database
const updateBinTypes = async () => {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔄 Updating binType values in database');
  console.log('=====================================');
  
  try {
    // First, let's see what we have
    console.log('\n1. Checking current data...');
    const allResponse = await fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&fields=summary`);
    const allData = await allResponse.json();
    
    if (allResponse.ok && allData.data) {
      console.log(`📋 Found ${allData.data.length} records`);
      
      // Group by current binType
      const grouped = allData.data.reduce((acc, record) => {
        const type = record.binType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Current binType distribution:');
      Object.entries(grouped).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} records`);
      });
      
      // Update strategy: Since all records are "Unknown", let's split them
      // Half will be Hazardous, half will be Non-Hazardous
      const totalRecords = allData.data.length;
      const halfPoint = Math.floor(totalRecords / 2);
      
      console.log(`\n2. Updating binType values...`);
      console.log(`   - First ${halfPoint} records → Hazardous`);
      console.log(`   - Remaining ${totalRecords - halfPoint} records → Non-Hazardous`);
      
      // Update records to Hazardous
      for (let i = 0; i < halfPoint; i++) {
        const record = allData.data[i];
        try {
          const updateResponse = await fetch(`${baseUrl}/api/disposals/${record._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ binType: 'Hazardous' })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Updated record ${i + 1} to Hazardous`);
          } else {
            console.log(`❌ Failed to update record ${i + 1}`);
          }
        } catch (error) {
          console.log(`❌ Error updating record ${i + 1}:`, error.message);
        }
      }
      
      // Update remaining records to Non-Hazardous
      for (let i = halfPoint; i < totalRecords; i++) {
        const record = allData.data[i];
        try {
          const updateResponse = await fetch(`${baseUrl}/api/disposals/${record._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ binType: 'Non-Hazardous' })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Updated record ${i + 1} to Non-Hazardous`);
          } else {
            console.log(`❌ Failed to update record ${i + 1}`);
          }
        } catch (error) {
          console.log(`❌ Error updating record ${i + 1}:`, error.message);
        }
      }
      
      console.log('\n3. Verifying updates...');
      
      // Check the results
      const [hazardousResponse, nonHazardousResponse] = await Promise.all([
        fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Hazardous&fields=summary`),
        fetch(`${baseUrl}/api/disposals?binId=ESP32CAM-01&types=Non-Hazardous&fields=summary`)
      ]);

      const hazardousData = await hazardousResponse.json();
      const nonHazardousData = await nonHazardousResponse.json();

      console.log(`🎯 Final Results:`);
      console.log(`   - Hazardous records: ${hazardousData.data?.length || 0}`);
      console.log(`   - Non-Hazardous records: ${nonHazardousData.data?.length || 0}`);
      console.log(`   - Total records: ${(hazardousData.data?.length || 0) + (nonHazardousData.data?.length || 0)}`);
      
      console.log('\n🎉 Database update completed!');
      
    } else {
      console.log('❌ Failed to fetch records:', allData.error);
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
};

// Run the update if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  updateBinTypes();
} else {
  // Browser environment
  console.log('Run this update in Node.js environment or call updateBinTypes() in browser console');
}

module.exports = { updateBinTypes };
