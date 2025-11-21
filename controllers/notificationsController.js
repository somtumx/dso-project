const db = require('../db');

exports.getNotifications = async (req, res) => {
  // Assuming user id is available in req.user (from auth middleware)
  const userId = req.user ? req.user.id : req.query.user_id; 
  if (!userId) {
      return res.status(400).json({error: "User ID is required"});
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Added createNotification mainly for testing purposes
exports.createNotification = async (req, res) => {
    const { user_id, message } = req.body;
    try {
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user_id, message]);
        res.status(201).json({ message: 'Notification created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
