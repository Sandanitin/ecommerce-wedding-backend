import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Create transporter
const createTransporter = () => {
  // For development, we'll use Gmail SMTP
  // In production, you might want to use services like SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otpCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Zepto Admin" <${config.email.user}>`,
      to: email,
      subject: 'Password Reset OTP - Zepto Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Zepto Admin</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              You requested to reset your password for your Zepto Admin account. 
              Use the following OTP code to verify your identity:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your OTP Code</h3>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${otpCode}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              © 2024 Zepto Admin. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Zepto Admin" <${config.email.user}>`,
      to: email,
      subject: 'Password Reset Successful - Zepto Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Zepto Admin</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Successful</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${userName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your password has been successfully reset. You can now log in to your account using your new password.
            </p>
            
            <div style="background: white; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
              <p style="color: #333; margin: 0; font-size: 16px; font-weight: bold;">
                ✅ Password reset completed successfully
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              © 2024 Zepto Admin. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    return { success: false, error: error.message };
  }
};
