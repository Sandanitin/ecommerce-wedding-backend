import express from 'express';
import { protect } from '../middleware/auth.js';
import { createRazorpayOrder, verifyRazorpayPayment, getRazorpayPaymentDetails } from '../services/razorpayService.js';
import Order from '../models/Order.js';
import { config } from '../config.js';

const router = express.Router();

// @desc    Public Razorpay config (Key ID only)
// @route   GET /api/payments/config
// @access  Public
router.get('/config', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        keyId: config.razorpay.keyId || null
      }
    });
  } catch (error) {
    console.error('Payment config error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load payment config' });
  }
});

// @desc    Test payment service
// @route   GET /api/payments/test
// @access  Private
router.get('/test', protect, async (req, res) => {
  try {
    const isConfigured = config.razorpay.keyId && 
                        config.razorpay.keySecret && 
                        config.razorpay.keyId !== 'rzp_test_YOUR_ACTUAL_KEY_ID' &&
                        config.razorpay.keySecret !== 'YOUR_ACTUAL_KEY_SECRET';
    
    res.json({
      success: true,
      message: 'Payment service is working',
      data: {
        razorpayConfigured: isConfigured,
        keyId: config.razorpay.keyId ? config.razorpay.keyId.substring(0, 10) + '...' : 'NOT SET',
        keySecret: config.razorpay.keySecret ? 'SET' : 'NOT SET',
        environment: config.nodeEnv,
        configurationStatus: isConfigured ? 'Ready' : 'Needs API Keys'
      }
    });
  } catch (error) {
    console.error('Payment test error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment service test failed',
      error: error.message
    });
  }
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Create Razorpay order
    const orderResult = await createRazorpayOrder({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    });

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    res.json({
      success: true,
      data: orderResult.data,
      message: 'Payment order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment order'
    });
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is required'
      });
    }

    // Verify payment with Razorpay
    const verificationResult = await verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error
      });
    }

    // Update order status if orderId is provided
    if (orderId) {
      try {
        const order = await Order.findByIdAndUpdate(
          orderId,
          {
            paymentStatus: 'paid',
            status: 'processing',
            paymentDetails: {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature
            }
          },
          { new: true }
        );

        if (!order) {
          console.warn('Order not found for ID:', orderId);
        }
      } catch (orderError) {
        console.error('Error updating order:', orderError);
        // Don't fail the payment verification if order update fails
      }
    }

    res.json({
      success: true,
      data: verificationResult.data,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying payment'
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
router.get('/:paymentId', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentResult = await getRazorpayPaymentDetails(paymentId);

    if (!paymentResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: paymentResult.error
      });
    }

    res.json({
      success: true,
      data: paymentResult.data,
      message: 'Payment details retrieved successfully'
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment details'
    });
  }
});

export default router;
