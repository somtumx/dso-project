const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

const auth = require('../middleware/auth');

// Public endpoints
router.post('/login', usersController.loginUser);
router.post('/register', usersController.registerUser);

// Protected endpoints
router.use(auth);
router.get('/', usersController.getAllUsers);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
