const Application = require('../models/Application');

/**
 * Get transaction history for a wallet
 * GET /api/transactions/wallet/:address
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const { address } = req.params;
    const walletAddress = address.toLowerCase();

    // Find all applications related to this wallet
    const applications = await Application.find({
      $or: [
        { walletAddress: walletAddress }, // Student applications
        { poolAddress: walletAddress }     // Provider pools (if they match)
      ]
    }).sort({ createdAt: -1 });

    // Transform applications into transaction format
    const transactions = applications.map(app => {
      // Determine transaction type based on status
      let type = 'application';
      let status = 'pending';
      let amount = '0';

      if (app.paid) {
        type = 'scholarship_received';
        status = 'completed';
        amount = app.scholarshipAmount || '0';
      } else if (app.adminApproved) {
        type = 'application_approved';
        status = 'approved';
      } else if (app.rejectionReason) {
        type = 'application_rejected';
        status = 'rejected';
      }

      return {
        id: app._id,
        type: type,
        status: status,
        amount: amount,
        poolAddress: app.poolAddress,
        poolName: app.poolName || 'Unknown Pool',
        timestamp: app.createdAt,
        txHash: app.txHash || null,
        description: generateDescription(type, app),
        metadata: {
          applicationId: app._id,
          studentName: app.name,
          institution: app.institution,
          program: app.program
        }
      };
    });

    res.status(200).json({
      success: true,
      transactions: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

/**
 * Helper function to generate transaction descriptions
 */
function generateDescription(type, application) {
  switch (type) {
    case 'scholarship_received':
      return `Received scholarship from ${application.poolName || 'pool'}`;
    case 'application_approved':
      return `Application approved for ${application.poolName || 'pool'}`;
    case 'application_rejected':
      return `Application rejected for ${application.poolName || 'pool'}`;
    case 'application':
      return `Applied to ${application.poolName || 'pool'}`;
    default:
      return 'Transaction';
  }
}

/**
 * Get detailed transaction info
 * GET /api/transactions/:id
 */
exports.getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      transaction: {
        id: application._id,
        type: application.paid ? 'scholarship_received' : 'application',
        status: application.paid ? 'completed' : application.adminApproved ? 'approved' : 'pending',
        amount: application.scholarshipAmount || '0',
        poolAddress: application.poolAddress,
        poolName: application.poolName,
        timestamp: application.createdAt,
        txHash: application.txHash,
        studentInfo: {
          name: application.name,
          email: application.email,
          institution: application.institution,
          program: application.program,
          gpa: application.gpa
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
};
