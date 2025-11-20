const express = require('express');
const router = express.Router();
const dosController = require('../controllers/dosController');
const auth = require('../middleware/auth');

router.use(auth);

// DO management endpoints
router.get('/', dosController.getAllDOs);
router.get('/:id', dosController.getDODetails);
router.post('/', dosController.createDO);
router.put('/:id', dosController.updateDO);
router.delete('/:id', dosController.deleteDO);

module.exports = router;
