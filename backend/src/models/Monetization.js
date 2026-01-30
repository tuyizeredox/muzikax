"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MonetizationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Monetization status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    // Requirements tracking
    followersCount: {
        type: Number,
        default: 0
    },
    tracksCount: {
        type: Number,
        default: 0
    },
    // Requirements met status
    requirementsMet: {
        type: Boolean,
        default: false
    },
    // Earnings configuration
    earningsRate: {
        type: Number,
        default: 1.00 // $1.00 per 1000 streams (can be adjusted by admin)
    },
    platformCommission: {
        type: Number,
        default: 20 // 20% commission, artist gets 80%
    },
    // Total earnings tracking
    totalEarnings: {
        type: Number,
        default: 0
    },
    // Pending earnings (not yet paid out)
    pendingEarnings: {
        type: Number,
        default: 0
    },
    // Paid out earnings
    paidEarnings: {
        type: Number,
        default: 0
    },
    // Last payout date
    lastPayoutDate: {
        type: Date,
        default: null
    },
    // Payout history
    payoutHistory: [{
        amount: Number,
        date: Date,
        status: {
            type: String,
            enum: ['processed', 'pending', 'failed'],
            default: 'pending'
        },
        paymentMethod: String,
        reference: String
    }],
    // Admin notes
    adminNotes: {
        type: String,
        default: ''
    },
    // Rejection reason if rejected
    rejectionReason: {
        type: String,
        default: ''
    },
    // Application date
    applicationDate: {
        type: Date,
        default: Date.now
    },
    // Approval date
    approvalDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});
// Indexes for better query performance
MonetizationSchema.index({ userId: 1 });
MonetizationSchema.index({ status: 1 });
MonetizationSchema.index({ createdAt: -1 });
module.exports = mongoose_1.default.model('Monetization', MonetizationSchema);