import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import User from '../models/User.js';

async function updateAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const { email, password, name } = config.defaultAdmin;
    
    // Check if admin exists
    let admin = await User.findOne({ email });
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (admin) {
      // Update existing admin
      admin.password = hashedPassword;
      admin.name = name;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      admin = new User({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('✅ New admin user created successfully');
    }

    console.log('\nAdmin User Details:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log('Role: admin');
    console.log('Status: Active\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
updateAdminUser();
