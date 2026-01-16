/**
 * Data Migration Script
 * Migrates data from Local MongoDB to MongoDB Atlas
 */

const mongoose = require('mongoose');

// Local MongoDB connection
const localMongoUri = 'mongodb://127.0.0.1:27017/dayoff';

// MongoDB Atlas connection
const atlasMongoUri = 'mongodb+srv://yousef321Fadlallah:OO2Rgxn4n510zwXG@cluster0.d2qjcav.mongodb.net/?appName=Cluster0';

// Import models
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const DayOffRequest = require('./models/DayOffRequest');
const Department = require('./models/Department');
const Section = require('./models/Section');

async function migrateData() {
  try {
    console.log('📋 Starting Data Migration...\n');

    // Connect to local MongoDB
    console.log('🔗 Connecting to local MongoDB...');
    const localConnection = await new Promise((resolve, reject) => {
      const conn = mongoose.createConnection(localMongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      conn.on('connected', () => resolve(conn));
      conn.on('error', reject);
    });
    console.log('✅ Connected to local MongoDB\n');

    // Get collections from local database
    console.log('📊 Fetching data from local MongoDB...');
    
    const localDb = localConnection.db;
    
    // Define models for local connection
    const LocalUser = localConnection.model('User', require('./models/User').schema);
    const LocalDepartment = localConnection.model('Department', require('./models/Department').schema);
    const LocalSection = localConnection.model('Section', require('./models/Section').schema);
    const LocalWorkingDay = localConnection.model('WorkingDay', require('./models/WorkingDay').schema);
    const LocalDayOffRequest = localConnection.model('DayOffRequest', require('./models/DayOffRequest').schema);

    // Fetch data counts
    const userCount = await LocalUser.countDocuments();
    const deptCount = await LocalDepartment.countDocuments();
    const sectCount = await LocalSection.countDocuments();
    const workingDayCount = await LocalWorkingDay.countDocuments();
    const requestCount = await LocalDayOffRequest.countDocuments();

    console.log(`Found data:`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Departments: ${deptCount}`);
    console.log(`  Sections: ${sectCount}`);
    console.log(`  Working Days: ${workingDayCount}`);
    console.log(`  Day-Off Requests: ${requestCount}\n`);

    if (userCount === 0 && deptCount === 0 && workingDayCount === 0) {
      console.log('⚠️  No data found in local MongoDB. Skipping migration.\n');
      await localConnection.disconnect();
      return;
    }

    // Connect to MongoDB Atlas
    console.log('🚀 Connecting to MongoDB Atlas...');
    await mongoose.connect(atlasMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    // Migrate Departments
    if (deptCount > 0) {
      console.log('📤 Migrating Departments...');
      const depts = await LocalDepartment.find();
      for (const dept of depts) {
        await Department.findByIdAndUpdate(dept._id, dept.toObject(), { upsert: true });
      }
      console.log(`✅ Migrated ${depts.length} departments\n`);
    }

    // Migrate Sections
    if (sectCount > 0) {
      console.log('📤 Migrating Sections...');
      const sections = await LocalSection.find();
      for (const section of sections) {
        await Section.findByIdAndUpdate(section._id, section.toObject(), { upsert: true });
      }
      console.log(`✅ Migrated ${sections.length} sections\n`);
    }

    // Migrate Users
    if (userCount > 0) {
      console.log('📤 Migrating Users...');
      const users = await LocalUser.find();
      for (const user of users) {
        await User.findByIdAndUpdate(user._id, user.toObject(), { upsert: true });
      }
      console.log(`✅ Migrated ${users.length} users\n`);
    }

    // Migrate Working Days
    if (workingDayCount > 0) {
      console.log('📤 Migrating Working Days...');
      const workingDays = await LocalWorkingDay.find();
      for (const wd of workingDays) {
        await WorkingDay.findByIdAndUpdate(wd._id, wd.toObject(), { upsert: true });
      }
      console.log(`✅ Migrated ${workingDays.length} working days\n`);
    }

    // Migrate Day-Off Requests
    if (requestCount > 0) {
      console.log('📤 Migrating Day-Off Requests...');
      const requests = await LocalDayOffRequest.find();
      for (const req of requests) {
        await DayOffRequest.findByIdAndUpdate(req._id, req.toObject(), { upsert: true });
      }
      console.log(`✅ Migrated ${requests.length} day-off requests\n`);
    }

    console.log('🎉 Data Migration Complete!\n');
    console.log('Summary:');
    console.log(`  ✅ ${deptCount} Departments`);
    console.log(`  ✅ ${sectCount} Sections`);
    console.log(`  ✅ ${userCount} Users`);
    console.log(`  ✅ ${workingDayCount} Working Days`);
    console.log(`  ✅ ${requestCount} Day-Off Requests\n`);
    console.log('All data is now in MongoDB Atlas! 🚀\n');

    // Cleanup
    try {
      localConnection.close();
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateData();
