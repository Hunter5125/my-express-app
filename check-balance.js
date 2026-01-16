const mongoose = require('mongoose');
const DayOffRequest = require('./models/DayOffRequest');

mongoose.connect('mongodb://127.0.0.1:27017/dayoff', {});

const db = mongoose.connection;
db.on('connected', async () => {
  try {
    const request = await DayOffRequest.findById('69654d479661d65ca4a934d4');
    if (request) {
      console.log('Found request:');
      console.log('  _id:', request._id);
      console.log('  balance:', request.balance);
      console.log('  usedBalance:', request.usedBalance);
      console.log('  date_to_be_taken:', request.date_to_be_taken);
      console.log('  day_to_be_taken:', request.day_to_be_taken);
      console.log('  remark:', request.remark);
    } else {
      console.log('Request not found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
});
