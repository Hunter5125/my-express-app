const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const mongoose = require('mongoose');
require('dotenv').config();

async function testDeleteBalance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the employee user (Yousef)
    const user = await User.findById('6929de8ff227b93488ec0035');
    console.log('User:', user.name, 'Initial balance:', user.availableDays);

    // Get one working day to delete
    const workingDay = await WorkingDay.findOne({ employee: user._id, used: false });
    if (!workingDay) {
      console.log('No working days to delete');
      return;
    }
    console.log('Deleting working day:', workingDay.day, workingDay.date);

    // Delete the working day
    await WorkingDay.findByIdAndDelete(workingDay._id);
    // Decrement user's availableDays by 1
    await User.findByIdAndUpdate(user._id, { $inc: { availableDays: -1 } });

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

testDeleteBalance();
