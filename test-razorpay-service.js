// Test script to verify Razorpay service functionality
// Run this with: node test-razorpay-service.js

import dotenv from 'dotenv';
import { createRazorpayOrder } from './services/razorpayService.js';

dotenv.config();

console.log('🔧 Testing Razorpay Service...\n');

async function testRazorpayService() {
  try {
    // Test creating a small order
    const testOrderData = {
      amount: 100, // ₹1.00 (in paise)
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: true,
        description: 'Test order for Razorpay integration'
      }
    };

    console.log('Creating test Razorpay order...');
    console.log('Order data:', testOrderData);

    const result = await createRazorpayOrder(testOrderData);

    if (result.success) {
      console.log('✅ Razorpay order created successfully!');
      console.log('Order ID:', result.data.id);
      console.log('Amount:', result.data.amount);
      console.log('Currency:', result.data.currency);
      console.log('Status:', result.data.status);
    } else {
      console.log('❌ Failed to create Razorpay order:');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testRazorpayService();
