const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', invoiceController.getInvoices);

router.get('/:id', invoiceController.getInvoiceById);

router.post(
  '/',
  [
    body('customerId').isUUID().withMessage('Valid customer ID is required'),
    body('invoiceDate').isDate().withMessage('Invoice date must be a valid date YYYY-MM-DD'),
    body('dueDate').isDate().withMessage('Due date must be a valid date YYYY-MM-DD'),
    body('items').isArray({ min: 1 }).withMessage('Invoice items must be a non-empty array'),
    body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be a positive integer'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be a non-negative number'),
    body('items.*.gstPercentage').isFloat({ min: 0, max: 100 }).withMessage('GST % must be between 0 and 100'),
    body('items.*.discountPercentage').isFloat({ min: 0, max: 100 }).withMessage('Discount % must be between 0 and 100')
  ],
  validate,
  invoiceController.createInvoice
);

router.put(
  '/:id',
  [
    body('customerId').optional().isUUID().withMessage('Valid customer ID is required'),
    body('invoiceDate').optional().isDate().withMessage('Invoice date must be a valid date'),
    body('dueDate').optional().isDate().withMessage('Due date must be a valid date'),
    body('items').optional().isArray({ min: 1 }).withMessage('Invoice items must be a non-empty array'),
    body('items.*.description').optional().trim().notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Item quantity must be a positive integer'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Item unit price must be a non-negative number'),
    body('items.*.gstPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('GST % must be between 0 and 100'),
    body('items.*.discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount % must be between 0 and 100')
  ],
  validate,
  invoiceController.updateInvoice
);

router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
