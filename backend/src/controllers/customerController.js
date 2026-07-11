const { Customer, Invoice } = require('../models');

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customers'
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully',
      data: customer
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer details'
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, companyName, gstNumber, email, mobileNumber, address } = req.body;

    const customer = await Customer.create({
      name,
      companyName,
      gstNumber,
      email,
      mobileNumber,
      address,
      userId: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating customer'
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, companyName, gstNumber, email, mobileNumber, address } = req.body;
    const customer = await Customer.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.update({
      name,
      companyName,
      gstNumber,
      email,
      mobileNumber,
      address
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('updateCustomer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating customer'
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Safety check: verify if customer has active invoices
    const activeInvoicesCount = await Invoice.count({
      where: { customerId: customer.id }
    });

    if (activeInvoicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer. There are ${activeInvoicesCount} invoice(s) associated with this customer.`
      });
    }

    await customer.destroy();

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('deleteCustomer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting customer'
    });
  }
};
