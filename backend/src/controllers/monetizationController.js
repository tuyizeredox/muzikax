"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarningsReport = exports.requestPayout = exports.updateEarnings = exports.checkMonetizationStatus = exports.applyForMonetization = void 0;
const Monetization = require("../models/Monetization");
const User = require("../models/User");
const Track = require("../models/Track");

// Apply for monetization
const applyForMonetization = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Check if user already has a monetization record
        let monetization = await Monetization.findOne({ userId });
        
        if (monetization) {
            return res.status(400).json({ 
                message: 'You have already applied for monetization',
                status: monetization.status
            });
        }
        
        // Get user details
        const user = await User.findById(userId);
        if (!user || user.role !== 'creator') {
            return res.status(403).json({ message: 'Only creators can apply for monetization' });
        }
        
        // Count user's tracks
        const tracksCount = await Track.countDocuments({ creatorId: userId });
        
        // Check requirements (20 followers, 3 tracks)
        const requirementsMet = user.followersCount >= 20 && tracksCount >= 3;
        
        // Create monetization record
        monetization = new Monetization_1.default({
            userId,
            followersCount: user.followersCount,
            tracksCount,
            requirementsMet
        });
        
        await monetization.save();
        
        res.status(201).json({
            message: 'Monetization application submitted successfully',
            requirements: {
                followersRequired: 20,
                tracksRequired: 3,
                currentFollowers: user.followersCount,
                currentTracks: tracksCount,
                requirementsMet
            },
            application: monetization
        });
    } catch (error) {
        console.error('Error applying for monetization:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.applyForMonetization = applyForMonetization;

// Check monetization status
const checkMonetizationStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const monetization = await Monetization.findOne({ userId });
        const user = await User.findById(userId);
        const tracksCount = await Track.countDocuments({ creatorId: userId });
        
        if (!monetization) {
            // User hasn't applied yet
            const requirementsMet = user.followersCount >= 20 && tracksCount >= 3;
            
            return res.json({
                status: 'not_applied',
                requirements: {
                    followersRequired: 20,
                    tracksRequired: 3,
                    currentFollowers: user.followersCount,
                    currentTracks: tracksCount,
                    requirementsMet
                }
            });
        }
        
        // Update current counts
        monetization.followersCount = user.followersCount;
        monetization.tracksCount = tracksCount;
        monetization.requirementsMet = user.followersCount >= 20 && tracksCount >= 3;
        
        await monetization.save();
        
        res.json({
            status: monetization.status,
            requirements: {
                followersRequired: 20,
                tracksRequired: 3,
                currentFollowers: monetization.followersCount,
                currentTracks: monetization.tracksCount,
                requirementsMet: monetization.requirementsMet
            },
            earnings: {
                totalEarnings: monetization.totalEarnings,
                pendingEarnings: monetization.pendingEarnings,
                paidEarnings: monetization.paidEarnings,
                earningsRate: monetization.earningsRate,
                platformCommission: monetization.platformCommission
            },
            applicationDate: monetization.applicationDate,
            approvalDate: monetization.approvalDate,
            rejectionReason: monetization.rejectionReason
        });
    } catch (error) {
        console.error('Error checking monetization status:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.checkMonetizationStatus = checkMonetizationStatus;

// Update earnings (called when tracks are played)
const updateEarnings = async (creatorId, playCount = 1) => {
    try {
        const monetization = await Monetization.findOne({ 
            userId: creatorId,
            status: 'approved' 
        });
        
        if (!monetization) {
            // Creator is not monetized, no earnings to update
            return;
        }
        
        // Calculate earnings: (plays / 1000) * earningsRate * (100 - commission) / 100
        const earningsPer1000 = monetization.earningsRate;
        const commission = monetization.platformCommission;
        const artistPercentage = (100 - commission) / 100;
        
        const newEarnings = (playCount / 1000) * earningsPer1000 * artistPercentage;
        
        monetization.pendingEarnings += newEarnings;
        monetization.totalEarnings += newEarnings;
        
        await monetization.save();
        
        console.log(`Updated earnings for creator ${creatorId}: +$${newEarnings.toFixed(2)}`);
    } catch (error) {
        console.error('Error updating earnings:', error);
    }
};
exports.updateEarnings = updateEarnings;

// Request payout
const requestPayout = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, paymentMethod } = req.body;
        
        const monetization = await Monetization.findOne({ 
            userId,
            status: 'approved' 
        });
        
        if (!monetization) {
            return res.status(403).json({ message: 'You are not approved for monetization' });
        }
        
        if (monetization.pendingEarnings < amount) {
            return res.status(400).json({ 
                message: 'Insufficient pending earnings',
                available: monetization.pendingEarnings
            });
        }
        
        if (amount < 10) { // Minimum payout amount
            return res.status(400).json({ message: 'Minimum payout amount is $10' });
        }
        
        // Add to payout history
        monetization.payoutHistory.push({
            amount,
            date: new Date(),
            status: 'pending',
            paymentMethod,
            reference: `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        
        // Update earnings
        monetization.pendingEarnings -= amount;
        monetization.paidEarnings += amount;
        monetization.lastPayoutDate = new Date();
        
        await monetization.save();
        
        res.json({
            message: 'Payout request submitted successfully',
            payout: monetization.payoutHistory[monetization.payoutHistory.length - 1]
        });
    } catch (error) {
        console.error('Error requesting payout:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.requestPayout = requestPayout;

// Get earnings report
const getEarningsReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;
        
        const monetization = await Monetization.findOne({ userId });
        
        if (!monetization) {
            return res.status(404).json({ message: 'No monetization record found' });
        }
        
        // Get tracks for detailed report
        const tracks = await Track.find({ creatorId: userId });
        
        // Calculate earnings by track
        const trackEarnings = tracks.map(track => {
            const earnings = (track.plays / 1000) * monetization.earningsRate * (100 - monetization.platformCommission) / 100;
            return {
                trackId: track._id,
                trackTitle: track.title,
                plays: track.plays,
                earnings: parseFloat(earnings.toFixed(2))
            };
        });
        
        // Filter by date if provided
        let filteredPayouts = monetization.payoutHistory;
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            filteredPayouts = monetization.payoutHistory.filter(payout => 
                payout.date >= start && payout.date <= end
            );
        }
        
        res.json({
            summary: {
                totalEarnings: monetization.totalEarnings,
                pendingEarnings: monetization.pendingEarnings,
                paidEarnings: monetization.paidEarnings,
                totalPlays: tracks.reduce((sum, track) => sum + track.plays, 0),
                totalTracks: tracks.length
            },
            trackEarnings,
            payoutHistory: filteredPayouts,
            earningsRate: monetization.earningsRate,
            platformCommission: monetization.platformCommission
        });
    } catch (error) {
        console.error('Error getting earnings report:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.getEarningsReport = getEarningsReport;