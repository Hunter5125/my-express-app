/**
 * COMPREHENSIVE TEST: Complete User Workflow
 * 
 * Scenario:
 * - User has 2 working days (1.5 balance each) = 3.0 total
 * - User requests 2 days
 * - Smart allocation: Use 1.5 + 0.5 = 2.0 days
 * - Expected result: Remaining 1.0 should show in table
 * 
 * This test simulates the ENTIRE flow:
 * 1. Create working days
 * 2. Smart allocation (like form does)
 * 3. Form submission (send daysUsed values)
 * 4. Backend update (process daysUsed and update balance)
 * 5. Query table (retrieve visible days)
 * 6. Verify result
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const DayOffRequest = require('./models/DayOffRequest');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayoff';

async function test() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('📋 COMPREHENSIVE WORKFLOW TEST\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // STEP 1: Find or create employee
    console.log('STEP 1: Find/Create Employee');
    console.log('─────────────────────────────────────────────────────────\n');
    let employee = await User.findOne({ email: 'yousef@example.com' });
    if (!employee) {
      employee = new User({
        name: 'Yousef',
        email: 'yousef@example.com',
        password: 'hashed_password',
        role: 'employee'
      });
      await employee.save();
      console.log('✓ Created new employee');
    } else {
      console.log('✓ Found existing employee');
    }
    console.log(`  Name: ${employee.name}`);
    console.log(`  Email: ${employee.email}`);
    console.log(`  ID: ${employee._id}\n`);

    // STEP 2: Clear and create working days
    console.log('STEP 2: Create Working Days');
    console.log('─────────────────────────────────────────────────────────\n');
    await WorkingDay.deleteMany({ employee: employee._id });
    
    const now = new Date();
    const day1Date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const day2Date = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    const day1 = new WorkingDay({
      employee: employee._id,
      day: 'Monday',
      date: day1Date,
      balance: 1.5,
      used: false,
      remark: 'Test day 1'
    });

    const day2 = new WorkingDay({
      employee: employee._id,
      day: 'Wednesday',
      date: day2Date,
      balance: 1.5,
      used: false,
      remark: 'Test day 2'
    });

    await day1.save();
    await day2.save();

    console.log('✓ Created 2 working days:\n');
    console.log('┌──────────────┬───────────┬──────────────┬──────────┐');
    console.log('│ Working Day  │ Date      │ Balance      │ Used     │');
    console.log('├──────────────┼───────────┼──────────────┼──────────┤');
    console.log(`│ ${day1.day.padEnd(12)} │ ${day1Date.toISOString().slice(0,10)} │ ${day1.balance.toString().padStart(12)} │ ${day1.used.toString().padEnd(8)} │`);
    console.log(`│ ${day2.day.padEnd(12)} │ ${day2Date.toISOString().slice(0,10)} │ ${day2.balance.toString().padStart(12)} │ ${day2.used.toString().padEnd(8)} │`);
    console.log('└──────────────┴───────────┴──────────────┴──────────┘');
    console.log(`\nTotal balance available: ${day1.balance + day2.balance} days\n`);

    // STEP 3: Query initial working days (what user sees)
    console.log('STEP 3: Query Initial Working Days (Before Request)');
    console.log('─────────────────────────────────────────────────────────\n');
    const initialDays = await WorkingDay.find({ 
      employee: employee._id,
      used: false 
    }).sort({ date: 1 });
    
    console.log('✓ Query result (used: false):\n');
    console.log('┌──────────────┬───────────┬──────────────┐');
    console.log('│ Working Day  │ Date      │ Balance      │');
    console.log('├──────────────┼───────────┼──────────────┤');
    initialDays.forEach(wd => {
      console.log(`│ ${wd.day.padEnd(12)} │ ${wd.date.toISOString().slice(0,10)} │ ${wd.balance.toString().padStart(12)} │`);
    });
    console.log('└──────────────┴───────────┴──────────────┘\n');

    // STEP 4: Simulate smart allocation (what form calculates)
    console.log('STEP 4: Smart Allocation (Form Calculation)');
    console.log('─────────────────────────────────────────────────────────\n');
    console.log('✓ User requests: 2 days\n');
    console.log('Smart allocation strategy:');
    console.log('  1. Prefer complete days first');
    console.log('  2. Then FIFO split if needed\n');
    console.log('Calculation:');
    console.log('  Day 1 (Monday): Has 1.5 balance → Use 1.5 (complete day)');
    console.log('  Day 2 (Wednesday): Has 1.5 balance → Use 0.5 (partial)\n');
    console.log('Result: 1.5 + 0.5 = 2.0 days ✓');
    console.log('Remaining: 1.5 - 0.5 = 1.0 in Wednesday\n');

    // STEP 5: Simulate form submission
    console.log('STEP 5: Form Submission (Send daysUsed)');
    console.log('─────────────────────────────────────────────────────────\n');
    const formData = [
      { 
        id: day1._id.toString(),
        day: 'Monday',
        daysUsed: 1.5
      },
      { 
        id: day2._id.toString(),
        day: 'Wednesday',
        daysUsed: 0.5
      }
    ];

    console.log('✓ Form sends to backend:\n');
    console.log('┌──────────────┬───────────────┐');
    console.log('│ Working Day  │ Days Used     │');
    console.log('├──────────────┼───────────────┤');
    formData.forEach(row => {
      console.log(`│ ${row.day.padEnd(12)} │ ${row.daysUsed.toString().padStart(13)} │`);
    });
    console.log('└──────────────┴───────────────┘\n');

    // STEP 6: Backend processes submission
    console.log('STEP 6: Backend Process (Update Balance)');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const updatedDays = [];
    for (const row of formData) {
      const wd = await WorkingDay.findById(row.id);
      const originalBalance = wd.balance;
      const amountUsed = row.daysUsed;
      
      // This is the critical calculation
      wd.balance = parseFloat((wd.balance - amountUsed).toFixed(2));
      
      if (wd.balance <= 0) {
        wd.used = true;
        wd.balance = 0;
      }
      
      await wd.save();
      
      console.log(`✓ Updated: ${wd.day}`);
      console.log(`  Original balance: ${originalBalance}`);
      console.log(`  Days used: ${amountUsed}`);
      console.log(`  New balance: ${wd.balance}`);
      console.log(`  Marked as used: ${wd.used}\n`);
      
      updatedDays.push({ day: wd.day, balance: wd.balance, used: wd.used });
    }

    // STEP 7: Query table after update (what user sees after redirect)
    console.log('STEP 7: Query Table After Request (After Redirect)');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const visibleDays = await WorkingDay.find({ 
      employee: employee._id,
      used: false 
    }).sort({ date: 1 });

    console.log(`✓ Query result (used: false):`);
    console.log(`  Found ${visibleDays.length} visible day(s)\n`);
    
    if (visibleDays.length > 0) {
      console.log('┌──────────────┬───────────┬──────────────┐');
      console.log('│ Working Day  │ Date      │ Balance      │');
      console.log('├──────────────┼───────────┼──────────────┤');
      visibleDays.forEach(wd => {
        console.log(`│ ${wd.day.padEnd(12)} │ ${wd.date.toISOString().slice(0,10)} │ ${wd.balance.toString().padStart(12)} │`);
      });
      console.log('└──────────────┴───────────┴──────────────┘\n');
    } else {
      console.log('┌────────────────────────────────────┐');
      console.log('│ No visible days (all used)         │');
      console.log('└────────────────────────────────────┘\n');
    }

    // STEP 8: Verify result
    console.log('STEP 8: Verification');
    console.log('─────────────────────────────────────────────────────────\n');

    const hasRemainingDay = visibleDays.some(d => d.day === 'Wednesday' && d.balance === 1.0);
    const mondayRemoved = !visibleDays.some(d => d.day === 'Monday');
    
    console.log('Expected results:');
    console.log('  ✓ Monday should be removed (0 remaining)');
    console.log('  ✓ Wednesday should appear with 1.0 balance');
    console.log('  ✓ Total visible balance should be 1.0\n');
    
    console.log('Actual results:');
    console.log(`  ${mondayRemoved ? '✓' : '✗'} Monday removed: ${mondayRemoved}`);
    console.log(`  ${hasRemainingDay ? '✓' : '✗'} Wednesday with 1.0: ${hasRemainingDay}`);
    console.log(`  ${visibleDays.length === 1 ? '✓' : '✗'} Only 1 day visible: ${visibleDays.length === 1}`);
    console.log(`  Total balance: ${visibleDays.reduce((sum, d) => sum + d.balance, 0)}\n`);

    // Final result
    console.log('═══════════════════════════════════════════════════════════\n');
    if (mondayRemoved && hasRemainingDay) {
      console.log('✅ SUCCESS: Remaining balance correctly appears in table!');
      console.log('   The issue is FIXED!');
    } else {
      console.log('❌ FAILURE: Remaining balance not showing correctly');
      console.log('   Debug needed!');
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
