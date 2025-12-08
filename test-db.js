const WorkingDay = require('./models/WorkingDay');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  const days = await WorkingDay.find({});
  console.log('Total working days in DB:', days.length);
  days.forEach(d => {
    console.log('Day:', d.day, 'Date:', d.date, 'Remark:', d.remark, 'Employee:', d.employee);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
