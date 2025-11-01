// Test MongoDB Connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...\n');
console.log('Connection String (password hidden):');
console.log(process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@'));
console.log('\n');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ MongoDB connection failed:');
    console.log('Error:', err.message);
    console.log('\nPossible issues:');
    console.log('1. Username or password is incorrect');
    console.log('2. Database user not created in MongoDB Atlas');
    console.log('3. IP address not whitelisted (add 0.0.0.0/0)');
    console.log('4. Cluster URL is incorrect');
    console.log('\nPlease check MongoDB Atlas:');
    console.log('- Database Access → Verify user exists');
    console.log('- Network Access → Add 0.0.0.0/0');
    console.log('- Database → Get correct connection string');
    process.exit(1);
  });
