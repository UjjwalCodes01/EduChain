/**
 * Script to normalize wallet and pool addresses to lowercase in the database
 * This ensures consistent querying and prevents duplicate issues
 */

const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

async function fixAddressCase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all applications
    const applications = await Application.find({});
    console.log(`📊 Found ${applications.length} applications`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const app of applications) {
      try {
        const needsUpdate = 
          app.walletAddress !== app.walletAddress.toLowerCase() ||
          app.poolAddress !== app.poolAddress.toLowerCase() ||
          app.email !== app.email.toLowerCase();

        if (needsUpdate) {
          // Update the addresses to lowercase
          app.walletAddress = app.walletAddress.toLowerCase();
          app.poolAddress = app.poolAddress.toLowerCase();
          app.email = app.email.toLowerCase();
          
          await app.save();
          updatedCount++;
          console.log(`✅ Updated application ${app._id}`);
        }
      } catch (error) {
        // If it's a duplicate key error, this application is a duplicate
        if (error.code === 11000) {
          console.log(`⚠️  Duplicate application found: ${app._id}`);
          console.log(`   Wallet: ${app.walletAddress}, Pool: ${app.poolAddress}`);
          console.log(`   You may want to manually review and delete this duplicate`);
          errorCount++;
        } else {
          console.error(`❌ Error updating application ${app._id}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Total applications: ${applications.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors/Duplicates: ${errorCount}`);
    console.log(`   Unchanged: ${applications.length - updatedCount - errorCount}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
fixAddressCase();
