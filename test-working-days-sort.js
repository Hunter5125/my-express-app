/**
 * Test script to verify working days are sorted by date (oldest first)
 */

const mongoose = require('mongoose');
const WorkingDay = require('./models/WorkingDay');
const User = require('./models/User');

async function testSort() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/dayoff', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find a user (employee)
    const user = await User.findOne({ role: 'employee' });
    if (!user) {
      console.error('❌ No employee user found');
      process.exit(1);
    }

    console.log(`Testing working days for user: ${user.name} (${user._id})\n`);

    // Fetch working days with sorting (same as in route)
    const workingDays = await WorkingDay.find({ 
      used: false, 
      employee: user._id 
    }).populate('employee', 'name').sort({ date: 1 });

    console.log(`📋 Found ${workingDays.length} working days\n`);

    if (workingDays.length === 0) {
      console.log('ℹ️  No working days available to test sorting');
      process.exit(0);
    }

    // Display all working days with dates
    console.log('Working Days (should be in ascending date order):');
    console.log('═'.repeat(80));
    
    workingDays.forEach((day, index) => {
      const dateStr = day.date ? new Date(day.date).toLocaleDateString() : 'N/A';
      const isoDate = day.date ? new Date(day.date).toISOString().split('T')[0] : 'N/A';
      console.log(`${index + 1}. ${day.day} | ${dateStr} (${isoDate}) | Balance: ${day.balance}`);
    });

    console.log('═'.repeat(80));

    // Verify sorting
    let isSorted = true;
    for (let i = 1; i < workingDays.length; i++) {
      const prevDate = new Date(workingDays[i - 1].date).getTime();
      const currDate = new Date(workingDays[i].date).getTime();
      
      if (prevDate > currDate) {
        isSorted = false;
        console.log(`\n❌ Sorting Error: ${workingDays[i - 1].day} (${workingDays[i - 1].date}) comes before ${workingDays[i].day} (${workingDays[i].date})`);
      }
    }

    if (isSorted) {
      console.log('\n✅ Sorting verified: All working days are in ascending date order (oldest first)');
    } else {
      console.log('\n❌ Sorting failed: Working days are NOT in ascending date order');
    }

    await mongoose.connection.close();
    process.exit(isSorted ? 0 : 1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSort();
