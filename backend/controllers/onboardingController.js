const User = require('../models/User');
const { uploadToIPFS } = require('../utils/ipfs');
const { sendVerificationEmail } = require('../utils/email');
const crypto = require('crypto');

// Register Student
exports.registerStudent = async (req, res) => {
    try {
        console.log('📍 POST /api/onboarding/student - Starting registration');
        const { wallet, fullName, email, institute, program, graduationYear } = req.body;
        console.log('📝 Registration data:', { wallet, fullName, email, institute, program, graduationYear });

        // Validate required fields
        if (!wallet || !fullName || !email || !institute || !program || !graduationYear) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Normalize wallet address
        const walletAddress = wallet.toLowerCase();
        console.log('🔄 Normalized wallet address:', walletAddress);

        // Check if user already exists
        const existingUser = await User.findOne({ walletAddress });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this wallet address already exists'
            });
        }

        // Check if email is already used
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Upload document to IPFS if provided (only for actual files)
        let documentCID = null;
        if (req.file) {
            try {
                documentCID = await uploadToIPFS(req.file.buffer);
            } catch (error) {
                console.error('IPFS document upload error:', error);
                // Continue without document if IPFS fails
            }
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new student user
        const newUser = new User({
            walletAddress,
            role: 'student',
            email: email.toLowerCase(),
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
            studentData: {
                fullName,
                institute,
                program,
                graduationYear: parseInt(graduationYear),
                documentCID
            }
        });

        await newUser.save();
        console.log('✅ Student user saved to database:', {
            id: newUser._id,
            walletAddress: newUser.walletAddress,
            role: newUser.role,
            email: newUser.email
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
            console.log('📧 Verification email sent to:', email);
        } catch (error) {
            console.error('Email sending error:', error);
            // Continue even if email fails
        }

        console.log('🎉 Student registration completed successfully');
        res.status(201).json({
            success: true,
            message: 'Student registration successful. Please check your email to verify your account.',
            data: {
                walletAddress: newUser.walletAddress,
                role: newUser.role,
                email: newUser.email,
                emailVerified: newUser.emailVerified
            }
        });

    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register student',
            error: error.message
        });
    }
};

// Register Provider
exports.registerProvider = async (req, res) => {
    try {
        console.log('📍 POST /api/onboarding/provider - Starting registration');
        const { wallet, organizationName, email, website, description, contactPerson } = req.body;
        console.log('📝 Provider registration data:', { wallet, organizationName, email, website, description, contactPerson });

        // Validate required fields
        if (!wallet || !organizationName || !email || !description || !contactPerson) {
            console.log('❌ Missing required fields for provider');
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Normalize wallet address
        const walletAddress = wallet.toLowerCase();
        console.log('🔄 Normalized wallet address:', walletAddress);

        // Check if user already exists
        const existingUser = await User.findOne({ walletAddress });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this wallet address already exists'
            });
        }

        // Check if email is already used
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Upload document to IPFS if provided
        let documentCID = null;
        if (req.file) {
            try {
                documentCID = await uploadToIPFS(req.file.buffer);
            } catch (error) {
                console.error('IPFS document upload error:', error);
                // Continue without document if IPFS fails
            }
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new provider user
        const newUser = new User({
            walletAddress,
            role: 'provider',
            email: email.toLowerCase(),
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
            providerData: {
                organizationName,
                website: website || '',
                description,
                contactPerson,
                documentCID,
                verified: false
            }
        });

        await newUser.save();
        console.log('✅ Provider user saved to database:', {
            id: newUser._id,
            walletAddress: newUser.walletAddress,
            role: newUser.role,
            email: newUser.email
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
            console.log('📧 Verification email sent to:', email);
        } catch (error) {
            console.error('Email sending error:', error);
            // Continue even if email fails
        }

        console.log('🎉 Provider registration completed successfully');
        res.status(201).json({
            success: true,
            message: 'Provider registration successful. Please check your email to verify your account.',
            data: {
                walletAddress: newUser.walletAddress,
                role: newUser.role,
                email: newUser.email,
                emailVerified: newUser.emailVerified,
                providerVerified: newUser.providerData.verified
            }
        });

    } catch (error) {
        console.error('Provider registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register provider',
            error: error.message
        });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with valid token
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Verify email
        await user.verifyEmail();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                walletAddress: user.walletAddress,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email',
            error: error.message
        });
    }
};

// Resend Verification Email
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            error: error.message
        });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({ 
            walletAddress: walletAddress.toLowerCase() 
        }).select('-verificationToken -verificationTokenExpiry');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message
        });
    }
};
