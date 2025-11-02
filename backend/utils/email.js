const nodemailer = require('nodemailer');

// Create transporter
let transporter;

const initEmailTransporter = () => {
  try {
    // Prefer SendGrid if API key provided (more reliable for hosting providers)
    if (process.env.SENDGRID_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
      console.log('ℹ️  Using SendGrid SMTP for emails');
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Fallback to SMTP (supports Gmail via explicit SMTP settings)
      const service = process.env.EMAIL_SERVICE || 'gmail';

      if (service === 'gmail') {
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            // allow self-signed certs (useful in some hosting environments)
            rejectUnauthorized: false
          },
          pool: true
        });
        console.log('ℹ️  Using Gmail SMTP for emails');
      } else {
        // Generic service name (letting nodemailer resolve well-known service)
        transporter = nodemailer.createTransport({
          service: service,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        console.log(`ℹ️  Using ${service} for emails`);
      }
    } else {
      console.warn('⚠️  Email credentials not configured. Email functionality will be disabled.');
      return null;
    }

    // Verify transporter connectivity and credentials
    transporter.verify()
      .then(() => console.log('✅ Email transporter initialized and verified'))
      .catch((err) => console.error('❌ Email transporter verification failed:', err && err.message ? err.message : err));

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error);
    return null;
  }
};

/**
 * Send verification email to student
 * @param {String} email - Student email address
 * @param {String} token - Verification token
 * @param {String} studentName - Student name (optional)
 */
const sendVerificationEmail = async (email, token, studentName = 'Student') => {
  try {
    if (!transporter) {
      transporter = initEmailTransporter();
    }

    if (!transporter) {
      console.warn('⚠️  Email transporter not available. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
      from: `EduChain <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - EduChain Scholarship Application',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 EduChain</h1>
              <p>Decentralized Scholarship Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${studentName},</h2>
              <p>Thank you for applying for a scholarship through EduChain!</p>
              <p>To complete your application, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
              <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
              <p>If you didn't apply for a scholarship on EduChain, please ignore this email.</p>
              <div class="footer">
                <p>© 2025 EduChain. All rights reserved.</p>
                <p>Powered by Blockchain Technology</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send application status update email
 * @param {String} email - Student email address
 * @param {String} status - Application status (approved/rejected)
 * @param {String} poolName - Scholarship pool name
 * @param {String} studentName - Student name
 */
const sendStatusUpdateEmail = async (email, status, poolName, studentName = 'Student') => {
  try {
    if (!transporter) {
      transporter = initEmailTransporter();
    }

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? '🎉 Congratulations! Your Scholarship Application is Approved'
      : 'Scholarship Application Update';

    const mailOptions = {
      from: `EduChain <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isApproved ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status { padding: 15px; background: ${isApproved ? '#d4edda' : '#f8d7da'}; color: ${isApproved ? '#155724' : '#721c24'}; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isApproved ? '🎉' : '📧'} EduChain</h1>
              <p>Application Status Update</p>
            </div>
            <div class="content">
              <h2>Hello ${studentName},</h2>
              <p>Your scholarship application for <strong>${poolName}</strong> has been reviewed.</p>
              <div class="status">
                ${isApproved ? '✅ APPROVED' : '❌ NOT SELECTED'}
              </div>
              ${isApproved 
                ? `<p>Congratulations! Your application has been approved. The scholarship funds will be transferred to your wallet shortly.</p>
                   <p>Please check your wallet and the EduChain dashboard for the transaction details.</p>`
                : `<p>We regret to inform you that your application was not selected at this time. We encourage you to apply for other available scholarships.</p>
                   <p>Thank you for your interest in our scholarship program.</p>`
              }
              <p>If you have any questions, please visit our platform or contact support.</p>
              <div class="footer">
                <p>© 2025 EduChain. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    // Don't throw - email is not critical for status update
    return false;
  }
};

/**
 * Send OTP email for registration verification
 * @param {String} email - User email address
 * @param {String} otp - 6-digit OTP code
 * @param {String} userName - User name (optional)
 */
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    if (!transporter) {
      transporter = initEmailTransporter();
    }

    if (!transporter) {
      console.warn('⚠️  Email transporter not available. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `EduChain <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your EduChain Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 EduChain</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Welcome to EduChain! Please use the verification code below to complete your registration:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                <p style="margin: 0;"><strong>⏰ This code will expire in 10 minutes.</strong></p>
              </div>

              <p><strong>Security Tips:</strong></p>
              <ul>
                <li>Never share this code with anyone</li>
                <li>EduChain will never ask for your code via phone or text</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>

              <div class="footer">
                <p>© 2025 EduChain. All rights reserved.</p>
                <p>Powered by Blockchain Technology</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  initEmailTransporter,
  sendVerificationEmail,
  sendStatusUpdateEmail,
  sendOTPEmail
};
