const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const auth = require('../middleware/auth');

router.use(auth);

// Notification endpoints
router.get('/', notificationsController.getNotifications);
router.put('/:id/read', notificationsController.markAsRead);
router.post('/', notificationsController.createNotification);

module.exports = router;
