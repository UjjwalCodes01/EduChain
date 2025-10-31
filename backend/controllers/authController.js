const User = require('../models/User');

/**
 * Check if wallet is registered and return user data
 * GET /api/auth/check/:wallet
 */
exports.checkWallet = async (req, res) => {
  try {
    const { wallet } = req.params;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        registered: false,
        message: 'Wallet not registered'
      });
    }

    // Return user data for auto-login
    res.status(200).json({
      success: true,
      registered: true,
      user: {
        wallet: user.walletAddress,
        role: user.role,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName,
        institution: user.institution,
        organizationName: user.organizationName,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error checking wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wallet',
      error: error.message
    });
  }
};

/**
 * Login with wallet (same as check but logs activity)
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        registered: false,
        message: 'Wallet not registered. Please complete onboarding.'
      });
    }

    // Update last login time (optional)
    user.lastLogin = new Date();
    await user.save();

    // Return user data
    res.status(200).json({
      success: true,
      registered: true,
      message: 'Login successful',
      user: {
        wallet: user.walletAddress,
        role: user.role,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName,
        institution: user.institution,
        organizationName: user.organizationName,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};
