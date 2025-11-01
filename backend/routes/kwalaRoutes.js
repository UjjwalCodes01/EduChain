// backend/routes/kwalaRoutes.js
// Add these endpoints for Kwala automation

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { fetchFromIPFS } = require('../utils/ipfs');

// Security middleware - verify requests are from Kwala
const verifyKwalaRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.KWALA_API_SECRET}`;
  
  if (authHeader !== expectedToken) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid Kwala API secret' 
    });
  }
  next();
};

// ============================================================================
// ENDPOINT 1: Review Application
// Called by Kwala when ApplicationSubmitted event fires
// ============================================================================
router.post('/review-application', verifyKwalaRequest, async (req, res) => {
  try {
    const { studentAddress, dataHash, poolAddress } = req.body;
    
    console.log(`[Kwala] Reviewing application for ${studentAddress}`);
    
    // 1. Verify student exists and email is verified
    const user = await User.findOne({ 
      walletAddress: studentAddress.toLowerCase() 
    });
    
    if (!user) {
      return res.json({ 
        status: 'rejected', 
        reason: 'Student not registered' 
      });
    }
    
    if (!user.isEmailVerified) {
      return res.json({ 
        status: 'rejected', 
        reason: 'Email not verified' 
      });
    }
    
    // 2. Fetch application data from IPFS
    let applicationData;
    try {
      applicationData = await fetchFromIPFS(dataHash);
    } catch (error) {
      return res.json({ 
        status: 'rejected', 
        reason: 'Could not fetch IPFS data' 
      });
    }
    
    // 3. Apply your scholarship criteria
    // Example: Require .edu email
    if (!user.email.endsWith('.edu')) {
      return res.json({ 
        status: 'rejected', 
        reason: 'Not a .edu email address' 
      });
    }
    
    // Example: Check GPA (if in application data)
    if (applicationData.gpa && applicationData.gpa < 3.0) {
      return res.json({ 
        status: 'rejected', 
        reason: 'GPA below requirement' 
      });
    }
    
    // 4. All checks passed - APPROVE!
    console.log(`[Kwala] Application APPROVED for ${studentAddress}`);
    
    return res.json({ 
      status: 'approved',
      studentEmail: user.email,
      studentName: user.fullName || 'Student'
    });
    
  } catch (error) {
    console.error('[Kwala] Review error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// ============================================================================
// ENDPOINT 2: Get Approved Students (for Payroll)
// Called by Kwala on cron schedule (e.g., every Friday)
// ============================================================================
router.post('/get-approved-students', verifyKwalaRequest, async (req, res) => {
  try {
    const { poolAddress, chainId } = req.body;
    
    console.log(`[Kwala] Fetching approved students for pool ${poolAddress}`);
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // ScholarshipPool ABI (minimal - only what we need)
    const POOL_ABI = [
      "function getApplicantCount() view returns (uint256)",
      "function applicants(uint256) view returns (address)",
      "function applications(address) view returns (address studentAddress, string dataHash, bool isVerified, bool isApproved, bool isPaid, uint256 timestamp)"
    ];
    
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    // Get all applicants
    const count = await pool.getApplicantCount();
    const approvedStudents = [];
    
    console.log(`[Kwala] Checking ${count} total applicants`);
    
    for (let i = 0; i < count; i++) {
      const applicantAddress = await pool.applicants(i);
      const application = await pool.applications(applicantAddress);
      
      // Find students who are approved but not yet paid
      if (application.isApproved && !application.isPaid) {
        approvedStudents.push(applicantAddress);
        console.log(`[Kwala] Found unpaid student: ${applicantAddress}`);
      }
    }
    
    console.log(`[Kwala] Total students to pay: ${approvedStudents.length}`);
    
    return res.json({ 
      students: approvedStudents,
      count: approvedStudents.length,
      poolAddress: poolAddress
    });
    
  } catch (error) {
    console.error('[Kwala] Get students error:', error);
    res.status(500).json({ 
      error: error.message,
      students: [] // Return empty array on error (Kwala will skip payment)
    });
  }
});

// ============================================================================
// ENDPOINT 3: Notify Student of Approval
// Called by Kwala after approving application on-chain
// ============================================================================
router.post('/notify-student', verifyKwalaRequest, async (req, res) => {
  try {
    const { studentAddress, status, poolAddress } = req.body;
    
    console.log(`[Kwala] Notifying ${studentAddress} of ${status}`);
    
    const user = await User.findOne({ 
      walletAddress: studentAddress.toLowerCase() 
    });
    
    if (!user || !user.email) {
      return res.json({ success: false, reason: 'User email not found' });
    }
    
    if (status === 'approved') {
      // Send approval email
      await sendEmail(
        user.email,
        '🎉 Scholarship Application Approved!',
        `
        <h2>Congratulations ${user.fullName || 'Student'}!</h2>
        <p>Your scholarship application has been <strong>approved</strong>!</p>
        <p><strong>Pool Address:</strong> ${poolAddress}</p>
        <p>Your scholarship payment will be processed automatically on the next payroll cycle (typically every Friday).</p>
        <p>You'll receive another email once the payment is sent to your wallet.</p>
        <br>
        <p>Thank you for using EduChain!</p>
        `
      );
      
      console.log(`[Kwala] Approval email sent to ${user.email}`);
    }
    
    return res.json({ success: true });
    
  } catch (error) {
    console.error('[Kwala] Notify error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================================
// ENDPOINT 4: Notify Students of Payment
// Called by Kwala after batch payment transaction completes
// ============================================================================
router.post('/notify-payment', verifyKwalaRequest, async (req, res) => {
  try {
    const { students, poolAddress, txHash } = req.body;
    
    console.log(`[Kwala] Notifying ${students.length} students of payment`);
    
    const blockExplorer = process.env.BLOCK_EXPLORER_URL || 
                          'https://mumbai.polygonscan.com';
    
    // Send email to each student
    for (const studentAddress of students) {
      const user = await User.findOne({ 
        walletAddress: studentAddress.toLowerCase() 
      });
      
      if (user && user.email) {
        await sendEmail(
          user.email,
          '💰 Scholarship Payment Sent!',
          `
          <h2>Great news ${user.fullName || 'Student'}!</h2>
          <p>Your scholarship payment has been <strong>sent</strong> to your wallet!</p>
          <p><strong>Your Wallet:</strong> ${studentAddress}</p>
          <p><strong>Transaction Hash:</strong> ${txHash}</p>
          <p><a href="${blockExplorer}/tx/${txHash}" target="_blank">
            View transaction on block explorer →
          </a></p>
          <p>The funds should appear in your wallet within a few minutes.</p>
          <br>
          <p>Congratulations on your scholarship! 🎓</p>
          <p>- The EduChain Team</p>
          `
        );
        
        console.log(`[Kwala] Payment email sent to ${user.email}`);
      }
    }
    
    return res.json({ 
      success: true,
      notifiedCount: students.length 
    });
    
  } catch (error) {
    console.error('[Kwala] Payment notification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================================
// ENDPOINT 5: Log Payroll Run (for analytics/monitoring)
// Called by Kwala at end of payroll workflow
// ============================================================================
router.post('/log-payroll', verifyKwalaRequest, async (req, res) => {
  try {
    const { poolAddress, studentCount, success, timestamp } = req.body;
    
    console.log(`[Kwala] Logging payroll run: ${studentCount} students paid`);
    
    // You can save this to your database for analytics
    // Example: Create a PayrollRun model and save the data
    
    // For now, just log it
    console.log({
      event: 'payroll_completed',
      poolAddress,
      studentCount,
      success,
      timestamp: timestamp || new Date().toISOString()
    });
    
    return res.json({ success: true });
    
  } catch (error) {
    console.error('[Kwala] Log payroll error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// Test that Kwala can reach your backend
// ============================================================================
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Kwala endpoints are ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
