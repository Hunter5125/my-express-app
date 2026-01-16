const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const mongoose = require('mongoose');
require('dotenv').config();

async function testBalance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the employee user (Yousef)
    const user = await User.findOne({ role: 'employee' });
    console.log('User:', user.name, 'Initial balance:', user.availableDays);

    // Add a new working day
    const newWorkingDay = new WorkingDay({
      employee: user._id,
      day: 'Monday',
      date: new Date(),
      remark: 'Test working day',
      used: false
    });
    await newWorkingDay.save();
    console.log('Added working day');

    // Increment user's availableDays
    await User.findByIdAndUpdate(user._id, { $inc: { availableDays: 1 } });

    // Check updated balance
    const updatedUser = await User.findById(user._id);
    console.log('Updated balance:', updatedUser.availableDays);

    // Check total working days
    const workingDays = await WorkingDay.find({ employee: user._id, used: false });
    console.log('Total working days:', workingDays.length);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBalance();
