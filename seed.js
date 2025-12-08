const mongoose = require('mongoose');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
require('dotenv').config();

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const users = [
      { name: 'Ismail', email: 'ismail@example.com', password: 'Password123!', role: 'manager', employeeNo: '123456', signature: 'Ismail Signature' },
      { name: 'Alaa', email: 'alaa@example.com', password: 'Password123!', role: 'team_leader', employeeNo: '1234', signature: 'Alaa Signature' },
      { name: 'Yousef', email: 'yousef@example.com', password: 'Password123!', role: 'employee', employeeNo: '89860', signature: 'Yousef Signature' }
    ];

    const createdUsers = [];
    for (const userData of users) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = new User({
          name: userData.name,
          email: userData.email,
          passwordHash: userData.password, // Will be hashed by pre-save hook
          role: userData.role,
          employeeNo: userData.employeeNo,
          signature: userData.signature
        });
        await user.save();
        console.log(`User ${userData.name} created`);
      } else {
        user.employeeNo = userData.employeeNo;
        user.signature = userData.signature;
        await user.save();
        console.log(`User ${userData.name} updated`);
      }
      createdUsers.push(user);
    }

    // Create sample working days for each user
    const yousefUser = createdUsers.find(u => u.name === 'Yousef');
    const alaaUser = createdUsers.find(u => u.name === 'Alaa');
    
    if (yousefUser) {
      const existingWorkingDays = await WorkingDay.find({ employee: yousefUser._id });
      if (existingWorkingDays.length === 0) {
        const workingDays = [
          {
            employee: yousefUser._id,
            day: 'Sunday',
            date: new Date('2024-01-07'),
            remark: 'Worked on project documentation',
            used: false
          },
          {
            employee: yousefUser._id,
            day: 'Saturday',
            date: new Date('2024-01-13'),
            remark: 'Emergency deployment',
            used: false
          }
        ];
        await WorkingDay.insertMany(workingDays);
        console.log(`Sample working days created for ${yousefUser.name}`);
      }
    }

    if (alaaUser) {
      const existingWorkingDays = await WorkingDay.find({ employee: alaaUser._id });
      if (existingWorkingDays.length === 0) {
        const workingDays = [
          {
            employee: alaaUser._id,
            day: 'Friday',
            date: new Date('2024-01-12'),
            remark: 'Team meeting preparation',
            used: false
          }
        ];
        await WorkingDay.insertMany(workingDays);
        console.log(`Sample working days created for ${alaaUser.name}`);
      }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedUsers();
