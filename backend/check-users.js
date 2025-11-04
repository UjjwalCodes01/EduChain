// Check Users in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('Checking Users Collection...\n');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully!\n');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Count users
    const userCount = await User.countDocuments();
    console.log(`👥 Total Users: ${userCount}\n`);
    
    if (userCount > 0) {
      // Show all users
      const users = await User.find({}).select('walletAddress email role emailVerified createdAt');
      console.log('📋 Users List:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Wallet: ${user.walletAddress}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Verified: ${user.emailVerified}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('⚠️  No users found in database!');
      console.log('\nPossible reasons:');
      console.log('1. Users haven\'t registered yet through the frontend');
      console.log('2. Registration endpoint is not being called');
      console.log('3. Registration is failing silently');
      console.log('\nNext steps:');
      console.log('- Try registering a new user from the frontend');
      console.log('- Check backend logs for registration errors');
      console.log('- Verify MONGO_URI is pointing to correct database');
    }
    
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
