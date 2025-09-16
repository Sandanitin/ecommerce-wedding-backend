import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zepto_admin',
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  email: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    password: process.env.EMAIL_PASSWORD || 'your-app-password'
  },
  // defaultAdmin: {
  //   name: process.env.DEFAULT_ADMIN_NAME || 'Super Admin',
  //   email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@zepto.com',
  //   password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
  // },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_ACTUAL_KEY_ID',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_ACTUAL_KEY_SECRET'
  }
};
