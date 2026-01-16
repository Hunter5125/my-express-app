const mongoose = require('mongoose');
const DayOffRequest = require('./models/DayOffRequest');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dayoff');
    const requests = await DayOffRequest.find({}).sort({ createdAt: -1 }).limit(3);
    
    if (requests.length > 0) {
      console.log(`\n✓ Found ${requests.length} requests\n`);
      requests.forEach((req, idx) => {
        console.log(`--- Request #${idx + 1} ---`);
        console.log(`  _id: ${req._id}`);
        console.log(`  day_to_be_taken: "${req.day_to_be_taken}"`);
        console.log(`  date_to_be_taken: ${req.date_to_be_taken}`);
        console.log(`  formattedDate_to_be_taken: "${req.formattedDate_to_be_taken}"`);
        console.log(`  working_day: "${req.working_day}"`);
        console.log(`  working_day_date: ${req.working_day_date}`);
        console.log(`  balance: ${req.balance}`);
        console.log(`  usedBalance: ${req.usedBalance}`);
        console.log(`  remark: "${req.remark}"`);
        console.log(`  status: "${req.status}"`);
        console.log();
      });
    } else {
      console.log('No requests found');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
