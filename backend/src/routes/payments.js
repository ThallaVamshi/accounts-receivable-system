const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', paymentController.getPayments);

router.post(
  '/',
  [
    body('invoiceId').isUUID().withMessage('Valid invoice ID is required'),
    body('paymentDate').isDate().withMessage('Payment date must be a valid date YYYY-MM-DD'),
    body('paymentMethod').trim().notEmpty().withMessage('Payment method is required'),
    body('amountPaid').isFloat({ min: 0.01 }).withMessage('Amount paid must be greater than zero'),
    body('paymentStatus').isIn(['Captured', 'Pending', 'Failed', 'Refunded']).withMessage('Payment status must be Captured, Pending, Failed, or Refunded')
  ],
  validate,
  paymentController.createPayment
);

router.delete('/:id', paymentController.deletePayment);

module.exports = router;
