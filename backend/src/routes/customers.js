const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', customerController.getCustomers);

router.get('/:id', customerController.getCustomerById);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Customer Name is required'),
    body('companyName').trim().notEmpty().withMessage('Company Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('mobileNumber').trim().notEmpty().withMessage('Mobile Number is required'),
    body('address').trim().notEmpty().withMessage('Address is required')
  ],
  validate,
  customerController.createCustomer
);

router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Customer Name is required'),
    body('companyName').trim().notEmpty().withMessage('Company Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('mobileNumber').trim().notEmpty().withMessage('Mobile Number is required'),
    body('address').trim().notEmpty().withMessage('Address is required')
  ],
  validate,
  customerController.updateCustomer
);

router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
