const ContactMessage = require('../models/ContactMessage');

exports.submitFeedback = async (req, res) => {
  try {
    const { message, type = 'feedback', name, email } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const contactMessage = new ContactMessage({
      message: message.trim(),
      type,
      name: name || 'Anonymous',
      email: email || 'unknown@muzikax.com',
      userId: req.user?.id || null
    });

    await contactMessage.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We appreciate it.',
      data: contactMessage
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      message: 'Failed to submit feedback. Please try again later.',
      error: error.message
    });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const messages = await ContactMessage.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email avatar');

    const total = await ContactMessage.countDocuments(filter);

    return res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status: 'read', readAt: new Date() },
      { new: true }
    ).populate('userId', 'username email avatar');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error fetching message:', error);
    return res.status(500).json({
      message: 'Failed to fetch message',
      error: error.message
    });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, adminNotes } = req.body;

    if (!adminReply || adminReply.trim().length === 0) {
      return res.status(400).json({ message: 'Reply cannot be empty' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      {
        adminReply: adminReply.trim(),
        adminNotes: adminNotes || '',
        status: 'replied',
        repliedAt: new Date(),
        adminId: req.user.id
      },
      { new: true }
    ).populate('userId', 'username email avatar');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    return res.json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    return res.status(500).json({
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error updating message status:', error);
    return res.status(500).json({
      message: 'Failed to update message status',
      error: error.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    return res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

exports.getMessageStats = async (req, res) => {
  try {
    const stats = await ContactMessage.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await ContactMessage.countDocuments();

    return res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
