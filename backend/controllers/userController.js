const User = require('../models/User');

/**
 * Get user profile by wallet address
 * GET /api/user/profile/:wallet
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { wallet } = req.params;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please complete onboarding first.'
      });
    }

    // Return user profile (exclude sensitive data)
    res.status(200).json({
      success: true,
      profile: {
        wallet: user.walletAddress,
        role: user.role,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName,
        institution: user.institution,
        organizationName: user.organizationName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * PUT /api/user/profile/:wallet
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { wallet } = req.params;
    const { email, fullName, institution, organizationName } = req.body;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (email) user.email = email;
    if (fullName !== undefined) user.fullName = fullName;
    if (institution !== undefined) user.institution = institution;
    if (organizationName !== undefined) user.organizationName = organizationName;

    // If email changed, mark as unverified
    if (email && email !== user.email) {
      user.emailVerified = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        wallet: user.walletAddress,
        role: user.role,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName,
        institution: user.institution,
        organizationName: user.organizationName,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
};

/**
 * Get user notification preferences
 * GET /api/user/preferences/:wallet
 */
exports.getPreferences = async (req, res) => {
  try {
    const { wallet } = req.params;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return preferences (default to true if not set)
    res.status(200).json({
      success: true,
      preferences: {
        emailNotifications: user.emailNotifications ?? true,
        applicationUpdates: user.applicationUpdates ?? true,
        weeklyDigest: user.weeklyDigest ?? false
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

/**
 * Update user notification preferences
 * PUT /api/user/preferences/:wallet
 */
exports.updatePreferences = async (req, res) => {
  try {
    const { wallet } = req.params;
    const { emailNotifications, applicationUpdates, weeklyDigest } = req.body;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (applicationUpdates !== undefined) user.applicationUpdates = applicationUpdates;
    if (weeklyDigest !== undefined) user.weeklyDigest = weeklyDigest;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        emailNotifications: user.emailNotifications,
        applicationUpdates: user.applicationUpdates,
        weeklyDigest: user.weeklyDigest
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};
