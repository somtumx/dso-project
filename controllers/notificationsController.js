const db = require('../db');

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    // In GAS version, notifications are derived from logs. Here we are using a dedicated table.
    // However, the frontend expects specific fields: DisplayName, DO_Task_ID, Status_New, Change_Status_Time
    // We should probably log activities into a logs table and query that, OR adapt the current notifications table.
    // Given the complexity, let's just query the notifications table and map it to what frontend expects.
    // But wait, the GAS code filters "Status_log" sheet.

    // For now, let's return empty or simple notifications from our table, assuming our table structure matches or we adapt.
    // Current table: id, user_id, message, is_read, created_at.

    // If we want to fully support the feature, we need to store structured data or parse the message.
    // Let's assume 'message' contains JSON or we just return generic notifications.

    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 20', [userId]);

    // Adapting to frontend expectation
    const notifications = rows.map(row => ({
        DisplayName: "System", // Or parse from message
        DO_Task_ID: "N/A",
        Status_New: row.message,
        Change_Status_Time: row.created_at
    }));

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createNotification = async (req, res) => {
    const { user_id, message } = req.body;
    try {
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user_id, message]);
        res.status(201).json({ success: true, message: 'Notification created' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
