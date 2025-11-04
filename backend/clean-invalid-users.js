// Clean Invalid Users
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected!\n');
    
    // Find users without required fields
    const invalidUsers = await User.find({
      $or: [
        { walletAddress: { $exists: false } },
        { walletAddress: null },
        { email: { $exists: false } },
        { email: null },
        { role: { $exists: false } },
        { role: null }
      ]
    });
    
    console.log(`🔍 Found ${invalidUsers.length} invalid user(s)\n`);
    
    if (invalidUsers.length > 0) {
      console.log('Invalid users:');
      invalidUsers.forEach(user => {
        console.log(`   ID: ${user._id}`);
      });
      
      // Delete invalid users
      const result = await User.deleteMany({
        $or: [
          { walletAddress: { $exists: false } },
          { walletAddress: null },
          { email: { $exists: false } },
          { email: null },
          { role: { $exists: false } },
          { role: null }
        ]
      });
      
      console.log(`\n🗑️  Deleted ${result.deletedCount} invalid user(s)`);
      console.log('✅ Database cleaned! Users can now register properly.');
    } else {
      console.log('✅ No invalid users found. Database is clean.');
    }
    
    // Show remaining valid users
    const validUsers = await User.countDocuments();
    console.log(`\n👥 Valid users remaining: ${validUsers}`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });
