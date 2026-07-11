const express = require('express');
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/outstanding', reportsController.getCustomerOutstandingReport);
router.get('/monthly-revenue', reportsController.getMonthlyRevenueReport);
router.get('/payment-history', reportsController.getPaymentHistoryReport);

module.exports = router;
