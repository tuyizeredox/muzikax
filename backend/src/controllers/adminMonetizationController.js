"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEarningsRate = exports.processPayout = exports.rejectMonetization = exports.approveMonetization = exports.getPendingApplications = exports.getAllMonetizationRecords = void 0;
const Monetization = require("../models/Monetization");
const User = require("../models/User");

// Get all monetization records (admin only)
const getAllMonetizationRecords = async (req, res) => {
    try {
        const page = parseInt(req.query['page']) || 1;
        const limit = parseInt(req.query['limit']) || 10;
        const status = req.query['status'];
        
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const records = await Monetization.find(query)
            .populate('userId', 'name email role creatorType followersCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Monetization.countDocuments(query);
        
        res.json({
            records,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error fetching monetization records:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.getAllMonetizationRecords = getAllMonetizationRecords;

// Get pending applications (admin only)
const getPendingApplications = async (req, res) => {
    try {
        const records = await Monetization.find({ status: 'pending' })
            .populate('userId', 'name email role creatorType followersCount')
            .sort({ createdAt: 1 }); // Oldest first
        
        res.json({ records });
    } catch (error) {
        console.error('Error fetching pending applications:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.getPendingApplications = getPendingApplications;

// Approve monetization application (admin only)
const approveMonetization = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes, earningsRate = 1.00, platformCommission = 20 } = req.body;
        
        const monetization = await Monetization.findById(id);
        
        if (!monetization) {
            return res.status(404).json({ message: 'Monetization record not found' });
        }
        
        if (monetization.status !== 'pending') {
            return res.status(400).json({ 
                message: `Application is already ${monetization.status}` 
            });
        }
        
        // Update monetization record
        monetization.status = 'approved';
        monetization.earningsRate = earningsRate;
        monetization.platformCommission = platformCommission;
        monetization.adminNotes = adminNotes || '';
        monetization.approvalDate = new Date();
        
        await monetization.save();
        
        res.json({
            message: 'Monetization application approved successfully',
            monetization
        });
    } catch (error) {
        console.error('Error approving monetization:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.approveMonetization = approveMonetization;

// Reject monetization application (admin only)
const rejectMonetization = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, adminNotes } = req.body;
        
        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }
        
        const monetization = await Monetization.findById(id);
        
        if (!monetization) {
            return res.status(404).json({ message: 'Monetization record not found' });
        }
        
        if (monetization.status !== 'pending') {
            return res.status(400).json({ 
                message: `Application is already ${monetization.status}` 
            });
        }
        
        // Update monetization record
        monetization.status = 'rejected';
        monetization.rejectionReason = rejectionReason;
        monetization.adminNotes = adminNotes || '';
        
        await monetization.save();
        
        res.json({
            message: 'Monetization application rejected',
            monetization
        });
    } catch (error) {
        console.error('Error rejecting monetization:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.rejectMonetization = rejectMonetization;

// Process payout (admin only)
const processPayout = async (req, res) => {
    try {
        const { id, payoutId } = req.params;
        const { status, reference } = req.body; // status: 'processed' or 'failed'
        
        const monetization = await Monetization.findById(id);
        
        if (!monetization) {
            return res.status(404).json({ message: 'Monetization record not found' });
        }
        
        const payout = monetization.payoutHistory.id(payoutId);
        
        if (!payout) {
            return res.status(404).json({ message: 'Payout not found' });
        }
        
        if (payout.status !== 'pending') {
            return res.status(400).json({ 
                message: `Payout is already ${payout.status}` 
            });
        }
        
        payout.status = status;
        if (reference) {
            payout.reference = reference;
        }
        
        await monetization.save();
        
        res.json({
            message: `Payout ${status} successfully`,
            payout
        });
    } catch (error) {
        console.error('Error processing payout:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.processPayout = processPayout;

// Update earnings rate for a creator (admin only)
const updateEarningsRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { earningsRate, platformCommission, adminNotes } = req.body;
        
        const monetization = await Monetization.findById(id);
        
        if (!monetization) {
            return res.status(404).json({ message: 'Monetization record not found' });
        }
        
        if (monetization.status !== 'approved') {
            return res.status(400).json({ 
                message: 'Can only update earnings rate for approved creators' 
            });
        }
        
        if (earningsRate !== undefined) {
            monetization.earningsRate = earningsRate;
        }
        
        if (platformCommission !== undefined) {
            monetization.platformCommission = platformCommission;
        }
        
        if (adminNotes !== undefined) {
            monetization.adminNotes = adminNotes;
        }
        
        await monetization.save();
        
        res.json({
            message: 'Earnings configuration updated successfully',
            monetization
        });
    } catch (error) {
        console.error('Error updating earnings rate:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.updateEarningsRate = updateEarningsRate;