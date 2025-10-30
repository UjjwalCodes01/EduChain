const nodemailer = require('nodemailer');

// Create transporter
let transporter;

const initEmailTransporter = () => {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log('Email transporter initialized');
  return transporter;
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

module.exports = {
  initEmailTransporter,
  sendVerificationEmail,
  sendStatusUpdateEmail
};
