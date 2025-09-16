import mongoose from 'mongoose';
import User from '../models/User.js';
import { config } from '../config.js';

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all users (excluding sensitive data)
    const users = await User.find({})
      .select('-password -otp -__v')
      .lean();

    console.log('\n=== Users in Database ===');
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Name: ${user.name || 'N/A'}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`- Created: ${new Date(user.createdAt).toLocaleString()}`);
      });
    }

    console.log('\n=== End of User List ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
listUsers();
