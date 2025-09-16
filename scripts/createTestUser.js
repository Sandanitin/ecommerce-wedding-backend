import User from '../models/User.js';

const createTestUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ 
      email: 'user@test.com' 
    });

    if (existingUser) {
      console.log('✅ Test user already exists');
      return;
    }

    // Create test regular user
    const testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
      isActive: true
    });

    console.log('✅ Test user created successfully');
    console.log(`   Email: user@test.com`);
    console.log(`   Password: password123`);
    console.log('   Role: user');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
};

export default createTestUser;
