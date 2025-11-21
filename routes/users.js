const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');

// Public endpoints
router.post('/login', usersController.loginUser);

// Protected endpoints
router.use(auth);
router.get('/profile', usersController.getUserProfile);
router.put('/profile', usersController.updateUserProfile);
router.put('/password', usersController.changePassword);

// Admin endpoints (Should add admin middleware check ideally)
router.get('/', usersController.getAllUsers);
router.post('/', usersController.registerUser);
router.put('/:email', usersController.adminUpdateUser);

module.exports = router;
