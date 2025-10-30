const Application = require('../models/Application');
const { sendStatusUpdateEmail } = require('../utils/email');

/**
 * Get all applications (admin only)
 */
exports.getAllApplications = async (req, res) => {
  try {
    const { status, poolAddress, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (poolAddress) filter.poolAddress = poolAddress.toLowerCase();

    const skip = (page - 1) * limit;

    const applications = await Application.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: applications
    });

  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      details: error.message
    });
  }
};

/**
 * Approve an application
 */
exports.approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { adminAddress, notes } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (!application.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Application email must be verified before approval'
      });
    }

    if (application.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Application already approved'
      });
    }

    // Approve the application
    await application.approve(adminAddress, notes);

    // Send notification email
    try {
      await sendStatusUpdateEmail(
        application.email,
        'approved',
        application.poolId,
        application.applicationData?.name || 'Student'
      );
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: application
    });

  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve application',
      details: error.message
    });
  }
};

/**
 * Reject an application
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { adminAddress, notes } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Application already rejected'
      });
    }

    // Reject the application
    await application.reject(adminAddress, notes);

    // Send notification email
    try {
      await sendStatusUpdateEmail(
        application.email,
        'rejected',
        application.poolId,
        application.applicationData?.name || 'Student'
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'Application rejected',
      data: application
    });

  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application',
      details: error.message
    });
  }
};

/**
 * Mark application as paid
 */
exports.markAsPaid = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { transactionHash } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved applications can be marked as paid'
      });
    }

    await application.markAsPaid();

    // Optionally store transaction hash
    if (transactionHash) {
      application.transactionHash = transactionHash;
      await application.save();
    }

    res.json({
      success: true,
      message: 'Application marked as paid',
      data: application
    });

  } catch (error) {
    console.error('Error marking application as paid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark application as paid',
      details: error.message
    });
  }
};

/**
 * Get application statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const { poolAddress } = req.query;

    const filter = poolAddress 
      ? { poolAddress: poolAddress.toLowerCase() } 
      : {};

    const stats = await Application.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Application.countDocuments(filter);
    const verified = await Application.countDocuments({ 
      ...filter, 
      emailVerified: true 
    });

    const statsObject = {
      total,
      verified,
      byStatus: {}
    };

    stats.forEach(stat => {
      statsObject.byStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: statsObject
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
};

/**
 * Batch approve applications
 */
exports.batchApprove = async (req, res) => {
  try {
    const { applicationIds, adminAddress, notes } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'applicationIds must be a non-empty array'
      });
    }

    const results = {
      approved: [],
      failed: []
    };

    for (const id of applicationIds) {
      try {
        const application = await Application.findById(id);
        
        if (!application) {
          results.failed.push({ id, reason: 'Not found' });
          continue;
        }

        if (!application.emailVerified) {
          results.failed.push({ id, reason: 'Email not verified' });
          continue;
        }

        if (application.status === 'approved') {
          results.failed.push({ id, reason: 'Already approved' });
          continue;
        }

        await application.approve(adminAddress, notes);
        results.approved.push(id);

        // Send notification email (don't wait)
        sendStatusUpdateEmail(
          application.email,
          'approved',
          application.poolId,
          application.applicationData?.name || 'Student'
        ).catch(err => console.error('Email error:', err));

      } catch (error) {
        results.failed.push({ id, reason: error.message });
      }
    }

    res.json({
      success: true,
      message: `Approved ${results.approved.length} applications`,
      data: results
    });

  } catch (error) {
    console.error('Error batch approving:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch approve applications',
      details: error.message
    });
  }
};

module.exports = exports;
