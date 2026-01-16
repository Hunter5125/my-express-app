/**
 * Test: Verify remaining balance displays in form and persists after submission
 * Scenario: User with 2 working days (1.5 each), requests 2 days
 * Expected: Day with 1.0 remaining should appear in table after submission
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const DayOffRequest = require('./models/DayOffRequest');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayoff';

async function test() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to MongoDB\n');

    // 1. Find or create employee
    let employee = await User.findOne({ email: 'yousef@example.com' });
    if (!employee) {
      console.log('Creating employee...');
      employee = new User({
        name: 'Yousef',
        email: 'yousef@example.com',
        password: 'hashed_password',
        role: 'employee'
      });
      await employee.save();
    }
    console.log(`✓ Employee: ${employee.name} (${employee.email})\n`);

    // 2. Clear old working days for this employee
    await WorkingDay.deleteMany({ employee: employee._id });
    console.log('✓ Cleared old working days\n');

    // 3. Create 2 working days with 1.5 balance each
    const now = new Date();
    const monday = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const wednesday = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    const day1 = new WorkingDay({
      employee: employee._id,
      day: 'Monday',
      date: monday,
      balance: 1.5,
      used: false,
      remark: 'Initial working day 1'
    });

    const day2 = new WorkingDay({
      employee: employee._id,
      day: 'Wednesday',
      date: wednesday,
      balance: 1.5,
      used: false,
      remark: 'Initial working day 2'
    });

    await day1.save();
    await day2.save();
    console.log('✓ Created 2 working days:');
    console.log(`  Day 1: ${day1.day} - Balance: ${day1.balance}`);
    console.log(`  Day 2: ${day2.day} - Balance: ${day2.balance}`);
    console.log(`  Total: ${day1.balance + day2.balance} days\n`);

    // 4. Simulate smart allocation (request 2 days from 3.0 total)
    console.log('📋 Simulating smart allocation for 2-day request:');
    console.log(`  - Day 1: Use 1.5 (complete day)`);
    console.log(`  - Day 2: Use 0.5 (partial)\n`);

    // 5. Simulate form submission with daysUsed
    console.log('📝 Simulating form submission:');
    const updateData = [
      { id: day1._id.toString(), daysUsed: 1.5 },
      { id: day2._id.toString(), daysUsed: 0.5 }
    ];

    for (const data of updateData) {
      const wd = await WorkingDay.findById(data.id);
      const originalBalance = wd.balance;
      const amountUsed = data.daysUsed;
      
      wd.balance = parseFloat((wd.balance - amountUsed).toFixed(2));
      
      if (wd.balance <= 0) {
        wd.used = true;
        wd.balance = 0;
      }
      
      await wd.save();
      
      console.log(`  ${wd.day}:`);
      console.log(`    - Original: ${originalBalance}`);
      console.log(`    - Used: ${amountUsed}`);
      console.log(`    - New balance: ${wd.balance}`);
      console.log(`    - Marked as used: ${wd.used}`);
    }

    console.log('\n✓ Form submitted successfully\n');

    // 6. Query working days as /requests endpoint does
    console.log('🔍 Querying working days (used: false):');
    const visibleDays = await WorkingDay.find({ 
      employee: employee._id, 
      used: false 
    });

    console.log(`  Found ${visibleDays.length} visible days:`);
    visibleDays.forEach(day => {
      console.log(`    - ${day.day}: Balance = ${day.balance} days (used: ${day.used})`);
    });

    // 7. Expected result
    console.log('\n✅ Expected result: Day 2 (Wednesday) should appear with 1.0 balance');
    const expectedDay = visibleDays.find(d => d.day === 'Wednesday');
    if (expectedDay && expectedDay.balance === 1.0) {
      console.log('✅ SUCCESS: Remaining balance persists in table!');
    } else {
      console.log('❌ FAILED: Day not found or balance incorrect');
      if (expectedDay) {
        console.log(`   Found: ${expectedDay.day} with balance ${expectedDay.balance}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
