const mongoose = require('mongoose');
const WorkingDay = require('./models/WorkingDay');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/dayoff').then(async () => {
  console.log('Connected to MongoDB');
  
  // Get users first
  const users = await User.find({}).select('name email _id');
  console.log('\n📋 Users:');
  users.forEach(u => console.log(`  ${u.name} (${u.email}): ${u._id}`));
  
  // Get all working days
  const allDays = await WorkingDay.find({}).populate('employee', 'name email');
  console.log('\n📋 Working Days in DB:', allDays.length);
  allDays.forEach(d => {
    const empName = d.employee && d.employee.name ? d.employee.name : 'unknown';
    console.log(`  ${d.day} ${d.date.toISOString().split('T')[0]}: balance=${d.balance}, employee=${empName}`);
  });
  
  // For the user "Yousef Fadlallah", check their working days
  const yousef = await User.findOne({ name: 'Yousef Fadlallah' });
  if (yousef) {
    const yousefDays = await WorkingDay.find({ employee: yousef._id });
    console.log(`\n📋 Working Days for Yousef (${yousef._id}):`, yousefDays.length);
    yousefDays.forEach(d => console.log(`  ${d.day} ${d.date.toISOString().split('T')[0]}: balance=${d.balance}`));
  }
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
