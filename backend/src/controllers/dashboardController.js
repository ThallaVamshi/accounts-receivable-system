const { Customer, Invoice, Payment } = require('../models');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total Customers
    const totalCustomers = await Customer.count({ where: { userId } });

    // 2. Total Invoices
    const totalInvoices = await Invoice.count({ where: { userId } });

    // 3. Total Revenue (sum of Captured payments)
    const payments = await Payment.findAll({
      where: { userId, paymentStatus: 'Captured' },
      attributes: ['amountPaid']
    });
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

    // 4. Outstanding Amount
    const invoices = await Invoice.findAll({
      where: { userId },
      attributes: ['grandTotal']
    });
    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal), 0);
    const outstandingAmount = Math.max(0, totalInvoiced - totalRevenue);

    // 5. Recent Payments (last 5)
    const recentPayments = await Payment.findAll({
      where: { userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Invoice,
          as: 'Invoice',
          attributes: ['invoiceNumber'],
          include: [
            {
              model: Customer,
              as: 'Customer',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    // 6. Invoice count by status
    const statusCounts = {
      Draft: 0,
      Sent: 0,
      Paid: 0,
      'Partially Paid': 0,
      Overdue: 0,
      Cancelled: 0
    };

    const invoicesByStatus = await Invoice.findAll({
      where: { userId },
      attributes: ['status', [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('status')), 'count']],
      group: ['status']
    });

    invoicesByStatus.forEach(item => {
      const status = item.getDataValue('status');
      const count = parseInt(item.getDataValue('count'), 10) || 0;
      if (statusCounts[status] !== undefined) {
        statusCounts[status] = count;
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalCustomers,
        totalInvoices,
        totalRevenue,
        outstandingAmount,
        recentPayments,
        statusCounts
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard statistics'
    });
  }
};
