const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  const users = await User.find({});
  console.log('Total users in DB:', users.length);
  users.forEach(u => {
    console.log('Name:', u.name, 'Email:', u.email, 'ID:', u._id, 'Role:', u.role);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
