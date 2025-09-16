// Test script to verify Razorpay configuration
// Run this with: node test-razorpay-config.js

import dotenv from 'dotenv';
import { config } from './config.js';

dotenv.config();

console.log('🔧 Testing Razorpay Configuration...\n');

console.log('Environment Variables:');
console.log('  RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'NOT SET');
console.log('  RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');

console.log('\nConfig Object:');
console.log('  config.razorpay.keyId:', config.razorpay.keyId ? config.razorpay.keyId.substring(0, 10) + '...' : 'NOT SET');
console.log('  config.razorpay.keySecret:', config.razorpay.keySecret ? 'SET' : 'NOT SET');

console.log('\nConfiguration Status:');
const isConfigured = config.razorpay.keyId && 
                    config.razorpay.keySecret && 
                    config.razorpay.keyId !== 'rzp_test_YOUR_ACTUAL_KEY_ID' &&
                    config.razorpay.keySecret !== 'YOUR_ACTUAL_KEY_SECRET';

if (isConfigured) {
  console.log('✅ Razorpay is properly configured!');
} else {
  console.log('❌ Razorpay configuration is incomplete.');
  console.log('\nTo fix this:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add your Razorpay keys:');
  console.log('   RAZORPAY_KEY_ID=rzp_test_your_actual_key_id');
  console.log('   RAZORPAY_KEY_SECRET=your_actual_key_secret');
  console.log('3. Get your keys from: https://dashboard.razorpay.com/app/keys');
}

console.log('\n🎉 Configuration test completed!');
