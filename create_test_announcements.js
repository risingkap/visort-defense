// Script to create test announcements
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

const testAnnouncements = [
  {
    title: "Welcome to viSORT Mobile App",
    message: "This is a test announcement to verify the notification system is working properly. Please check your mobile app for notifications.",
    status: "sent",
    createdBy: {
      name: "Admin User",
      email: "admin@visort.com"
    },
    recipients: [
      {
        id: "EMP001",
        name: "Test Employee",
        email: "employee@visort.com"
      }
    ]
  },
  {
    title: "System Maintenance Notice",
    message: "The system will be under maintenance tomorrow from 2-4 PM. Please plan your work accordingly.",
    status: "sent",
    createdBy: {
      name: "Admin User",
      email: "admin@visort.com"
    },
    recipients: [
      {
        id: "EMP001",
        name: "Test Employee",
        email: "employee@visort.com"
      }
    ]
  },
  {
    title: "New Feature Update",
    message: "We've added new waste tracking features to the mobile app. Check out the latest updates!",
    status: "sent",
    createdBy: {
      name: "Admin User",
      email: "admin@visort.com"
    },
    recipients: [
      {
        id: "EMP001",
        name: "Test Employee",
        email: "employee@visort.com"
      }
    ]
  },
  {
    title: "Safety Reminder",
    message: "Please remember to wear safety equipment when handling waste. Safety first!",
    status: "sent",
    createdBy: {
      name: "Admin User",
      email: "admin@visort.com"
    },
    recipients: [
      {
        id: "EMP001",
        name: "Test Employee",
        email: "employee@visort.com"
      }
    ]
  },
  {
    title: "Company-Wide Announcement",
    message: "This announcement is for all employees. Thank you for your hard work!",
    status: "sent",
    createdBy: {
      name: "Admin User",
      email: "admin@visort.com"
    },
    recipients: [] // Empty recipients means company-wide
  }
];

async function createTestAnnouncements() {
  console.log('🚀 Creating test announcements...');
  
  for (let i = 0; i < testAnnouncements.length; i++) {
    const announcement = testAnnouncements[i];
    
    try {
      const response = await fetch(`${BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcement)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created: "${announcement.title}"`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed to create "${announcement.title}": ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating "${announcement.title}": ${error.message}`);
    }
  }
  
  console.log('🎉 Test announcements creation completed!');
}

// Run the script
createTestAnnouncements();
