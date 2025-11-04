// Check User Details
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected!\n');
    
    // Get all users with full details
    const users = await User.find({}).lean();
    
    console.log('📋 Full User Data:\n');
    console.log(JSON.stringify(users, null, 2));
    
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });
