const express = require('express');
const router = express.Router();
const { getUsersForChat, getUserById } = require('../controllers/publicUserController');
const { protect } = require('../utils/jwt');

// Public user routes for chat functionality (requires authentication)
router.get('/users-for-chat', protect, getUsersForChat);
router.get('/user/:id', protect, getUserById);

module.exports = router;