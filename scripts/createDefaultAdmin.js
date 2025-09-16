import User from '../models/User.js';
import { config } from '../config.js';

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: config.defaultAdmin.email 
    });

    if (existingAdmin) {
      console.log('✅ Default admin user already exists');
      return;
    }

    // Create default admin user
    const adminUser = await User.create({
      name: config.defaultAdmin.name,
      email: config.defaultAdmin.email,
      password: config.defaultAdmin.password,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Default admin user created successfully');
    console.log(`   Email: ${config.defaultAdmin.email}`);
    console.log(`   Password: ${config.defaultAdmin.password}`);
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating default admin user:', error.message);
  }
};

export default createDefaultAdmin;
