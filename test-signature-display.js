const mongoose = require('mongoose');
const User = require('./models/User');
const DayOffRequest = require('./models/DayOffRequest');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dayoff');
    console.log('✅ Connected to MongoDB');

    // Find Alaa
    const alaa = await User.findOne({ name: 'Alaa' });
    if (!alaa) {
      console.log('❌ Alaa not found');
      process.exit(1);
    }

    console.log('✅ Found Alaa');
    console.log('Signature type:', typeof alaa.signature);
    console.log('Signature starts with:', alaa.signature?.substring(0, 50) || 'NO SIGNATURE');
    console.log('Signature length:', alaa.signature?.length || 0);

    // Check if signature is a data URL
    if (alaa.signature && alaa.signature.startsWith('data:')) {
      console.log('✅ Signature is a data URL');
      console.log('Format:', alaa.signature.substring(0, 20) + '...');
    } else if (alaa.signature) {
      console.log('⚠️  Signature is not a data URL:', alaa.signature.substring(0, 50));
    }

    // Find a day-off request
    const requests = await DayOffRequest.find({ employee: alaa._id }).limit(1);
    if (requests.length > 0) {
      console.log('✅ Found', requests.length, 'request(s)');
      console.log('Request ID:', requests[0]._id);
      console.log('Employee signature in request:', requests[0].employee?.signature?.substring?.(0, 50) || 'NO SIGNATURE');
    } else {
      console.log('⚠️  No requests found for Alaa');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

test();
