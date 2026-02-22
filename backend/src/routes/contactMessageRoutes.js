const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { protect, admin } = require('../utils/jwt');

router.post('/submit', contactMessageController.submitFeedback);

router.get('/stats', protect, admin, contactMessageController.getMessageStats);

router.get('/', protect, admin, contactMessageController.getAllMessages);

router.get('/:id', protect, admin, contactMessageController.getMessageById);

router.patch('/:id/status', protect, admin, contactMessageController.updateMessageStatus);

router.post('/:id/reply', protect, admin, contactMessageController.replyToMessage);

router.delete('/:id', protect, admin, contactMessageController.deleteMessage);

module.exports = router;
