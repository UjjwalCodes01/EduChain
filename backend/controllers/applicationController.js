const Application = require('../models/Application');
const { uploadToIPFS, uploadJSONToIPFS } = require('../utils/ipfs');
const { sendVerificationEmail, sendStatusUpdateEmail } = require('../utils/email');
const crypto = require('crypto');

/**
 * Submit a new scholarship application
 */
exports.submitApplication = async (req, res) => {
  try {
    const {
      walletAddress,
      email,
      poolId,
      poolAddress,
      applicationData
    } = req.body;

    // Validate required fields
    if (!walletAddress || !email || !poolId || !poolAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate email format (basic check for college emails)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      walletAddress: walletAddress.toLowerCase(),
      poolAddress: poolAddress.toLowerCase()
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this scholarship pool'
      });
    }

    // Handle file upload if provided (uses mock CID if IPFS fails)
    let ipfsHash = '';
    if (req.file) {
      ipfsHash = await uploadToIPFS(req.file.buffer, req.file.originalname);
    }

    // Upload application metadata to IPFS (uses mock CID if IPFS fails)
    const metadata = {
      ...applicationData,
      timestamp: new Date().toISOString(),
      ipfsDocumentHash: ipfsHash
    };
    const metadataHash = await uploadJSONToIPFS(metadata);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create application
    const application = new Application({
      walletAddress: walletAddress.toLowerCase(),
      email: email.toLowerCase(),
      poolId,
      poolAddress: poolAddress.toLowerCase(),
      ipfsHash: metadataHash,
      applicationData,
      verificationToken,
      emailVerified: false,
      status: 'pending'
    });

    await application.save();

    // Send verification email
    try {
      await sendVerificationEmail(
        email,
        verificationToken,
        applicationData?.name || 'Student'
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Please check your email to verify.',
      data: {
        applicationId: application._id,
        ipfsHash: metadataHash,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      details: error.message
    });
  }
};

/**
 * Verify email with token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const application = await Application.findOne({ verificationToken: token });

    if (!application) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    if (application.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Verify the application
    await application.verify();

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        applicationId: application._id,
        walletAddress: application.walletAddress,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email',
      details: error.message
    });
  }
};

/**
 * Get application by wallet and pool
 */
exports.getApplication = async (req, res) => {
  try {
    const { walletAddress, poolAddress } = req.params;

    const application = await Application.findOne({
      walletAddress: walletAddress.toLowerCase(),
      poolAddress: poolAddress.toLowerCase()
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application',
      details: error.message
    });
  }
};

/**
 * Get all applications for a specific pool
 */
exports.getPoolApplications = async (req, res) => {
  try {
    const { poolAddress } = req.params;
    const { status } = req.query;

    const filter = { poolAddress: poolAddress.toLowerCase() };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching pool applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      details: error.message
    });
  }
};

/**
 * Get all applications for a wallet address
 */
exports.getWalletApplications = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const applications = await Application.find({
      walletAddress: walletAddress.toLowerCase()
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching wallet applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      details: error.message
    });
  }
};

/**
 * Resend verification email
 */
exports.resendVerification = async (req, res) => {
  try {
    const { walletAddress, poolAddress } = req.body;

    const application = await Application.findOne({
      walletAddress: walletAddress.toLowerCase(),
      poolAddress: poolAddress.toLowerCase()
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Generate new token
    const newToken = crypto.randomBytes(32).toString('hex');
    application.verificationToken = newToken;
    await application.save();

    // Resend verification email
    await sendVerificationEmail(
      application.email,
      newToken,
      application.applicationData?.name || 'Student'
    );

    res.json({
      success: true,
      message: 'Verification email resent successfully'
    });

  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email',
      details: error.message
    });
  }
};

module.exports = exports;
