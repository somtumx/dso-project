const express = require('express');
const router = express.Router();
const dosController = require('../controllers/dosController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', dosController.getAllDOs);
router.get('/pending', dosController.getPendingDOs);
router.get('/acknowledged', dosController.getAcknowledgedDOs);
router.post('/action', dosController.handleAction);
router.get('/:id', dosController.getDODetails);
router.post('/', dosController.createDO);
router.put('/:id/remarks', dosController.updateRemarks);
// router.put('/:id', dosController.updateDO); // Not used by frontend
// router.delete('/:id', dosController.deleteDO); // Not used by frontend

module.exports = router;
