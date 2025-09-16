import mongoose from 'mongoose';
import { config } from '../config.js';
import User from '../models/User.js';

async function removeTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Delete the test user by email
    const result = await User.deleteOne({ email: 'user@test.com' });

    if (result.deletedCount === 1) {
      console.log('✅ Test user removed successfully');
    } else {
      console.log('ℹ️  Test user not found. No changes made.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing test user:', error.message);
    process.exit(1);
  }
}

// Run the script
removeTestUser();
