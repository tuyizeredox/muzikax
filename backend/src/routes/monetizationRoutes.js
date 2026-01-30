const express = require('express');
const router = express.Router();
const { protect, creator, admin } = require('../utils/jwt');
const { 
    applyForMonetization,
    checkMonetizationStatus,
    requestPayout,
    getEarningsReport
} = require('../controllers/monetizationController');

const {
    getAllMonetizationRecords,
    getPendingApplications,
    approveMonetization,
    rejectMonetization,
    processPayout,
    updateEarningsRate
} = require('../controllers/adminMonetizationController');

// Creator routes (protected)
router.post('/apply', protect, creator, applyForMonetization);
router.get('/status', protect, creator, checkMonetizationStatus);
router.post('/payout', protect, creator, requestPayout);
router.get('/report', protect, creator, getEarningsReport);

// Admin routes (protected)
router.get('/admin/all', protect, admin, getAllMonetizationRecords);
router.get('/admin/pending', protect, admin, getPendingApplications);
router.put('/admin/approve/:id', protect, admin, approveMonetization);
router.put('/admin/reject/:id', protect, admin, rejectMonetization);
router.put('/admin/payout/:id/:payoutId', protect, admin, processPayout);
router.put('/admin/earnings/:id', protect, admin, updateEarningsRate);

module.exports = router;