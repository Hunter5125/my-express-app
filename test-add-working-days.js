// Test script to add working days to Yousef's account
const mongoose = require('mongoose');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayoff').then(async () => {
  try {
    console.log('Connected to MongoDB');
    
    // Find Yousef
    const yousef = await User.findOne({ name: 'Yousef Fadlallah' });
    if (!yousef) {
      console.log('Yousef not found');
      process.exit(1);
    }
    
    console.log('Found Yousef:', yousef.name, yousef._id);
    
    // Delete existing working days for Yousef
    await WorkingDay.deleteMany({ employee: yousef._id });
    console.log('Cleared existing working days');
    
    // Create test working days
    const workingDays = [
      {
        employee: yousef._id,
        date: new Date('2025-12-15'),
        day: 'Monday',
        remark: 'Testing days 1',
        balance: 0.5,
        used: false
      },
      {
        employee: yousef._id,
        date: new Date('2025-12-17'),
        day: 'Wednesday',
        remark: 'Testing days 2',
        balance: 1.0,
        used: false
      },
      {
        employee: yousef._id,
        date: new Date('2025-12-20'),
        day: 'Saturday',
        remark: 'Testing days 3',
        balance: 2.0,
        used: false
      }
    ];
    
    const created = await WorkingDay.insertMany(workingDays);
    console.log(`Created ${created.length} working days:`);
    created.forEach(wd => {
      console.log(`  - ${wd.day} (${wd.date.toISOString().split('T')[0]}): balance=${wd.balance}`);
    });
    
    console.log('\n✅ Test data created successfully');
    console.log('Total balance:', workingDays.reduce((sum, wd) => sum + wd.balance, 0));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});
