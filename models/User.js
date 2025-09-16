import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // OTP fields for password reset
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp.code = otpCode;
  this.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otp.attempts = 0;
  this.otp.isUsed = false;
  return otpCode;
};

// Verify OTP
userSchema.methods.verifyOTP = async function(code) {
  const now = new Date();
  
  // Check if OTP exists and is not used
  if (!this.otp.code || this.otp.isUsed) {
    return { valid: false, message: 'No valid OTP found' };
  }
  
  // Check if OTP is expired
  if (this.otp.expiresAt < now) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  // Check if maximum attempts exceeded
  if (this.otp.attempts >= 3) {
    return { valid: false, message: 'Maximum attempts exceeded' };
  }
  
  // Check if OTP code matches
  if (this.otp.code !== code) {
    this.otp.attempts += 1;
    await this.save();
    return { valid: false, message: 'Invalid OTP code' };
  }
  
  // Mark OTP as used
  this.otp.isUsed = true;
  await this.save();
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP
userSchema.methods.clearOTP = async function() {
  this.otp.code = null;
  this.otp.expiresAt = null;
  this.otp.attempts = 0;
  this.otp.isUsed = false;
  return await this.save();
};

export default mongoose.model('User', userSchema);
