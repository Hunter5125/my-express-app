const mongoose = require('mongoose');
const DayOffRequest = require('./models/DayOffRequest');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  const requests = await DayOffRequest.find({});
  console.log('Total requests in DB:', requests.length);
  requests.slice(0, 5).forEach((req, idx) => {
    console.log(`\n--- Request ${idx + 1} ---`);
    console.log('ID:', req._id);
    console.log('Status:', req.status);
    console.log('Day to be taken:', req.day_to_be_taken);
    console.log('Date to be taken:', req.date_to_be_taken);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
