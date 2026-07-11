const { Customer, Invoice, Payment } = require('../models');
const { Op } = require('sequelize');

exports.getCustomerOutstandingReport = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all customers for the user
    const customers = await Customer.findAll({
      where: { userId },
      attributes: ['id', 'name', 'companyName', 'email']
    });

    const report = [];

    for (const customer of customers) {
      // Invoiced sum
      const invoices = await Invoice.findAll({
        where: { customerId: customer.id, userId },
        attributes: ['id', 'grandTotal']
      });

      const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal), 0);

      // Captured payments sum
      const invoiceIds = invoices.map(inv => inv.id);
      let totalPaid = 0;

      if (invoiceIds.length > 0) {
        const payments = await Payment.findAll({
          where: {
            invoiceId: { [Op.in]: invoiceIds },
            paymentStatus: 'Captured'
          },
          attributes: ['amountPaid']
        });
        totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
      }

      const netOutstanding = Math.max(0, totalInvoiced - totalPaid);

      report.push({
        customerId: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        totalInvoiced,
        totalPaid,
        netOutstanding
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer outstanding report generated',
      data: report
    });
  } catch (error) {
    console.error('getCustomerOutstandingReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating customer outstanding report'
    });
  }
};

exports.getMonthlyRevenueReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Months template
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i + 1,
      monthName: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
      invoiced: 0,
      collected: 0
    }));

    // Get invoices created in current year
    const invoices = await Invoice.findAll({
      where: {
        userId,
        invoiceDate: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      attributes: ['invoiceDate', 'grandTotal']
    });

    invoices.forEach(inv => {
      const parts = inv.invoiceDate ? inv.invoiceDate.split('-') : [];
      const month = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : new Date(inv.invoiceDate).getMonth();
      if (month >= 0 && month < 12) {
        monthlyData[month].invoiced += parseFloat(inv.grandTotal);
      }
    });

    // Get captured payments in current year
    const payments = await Payment.findAll({
      where: {
        userId,
        paymentStatus: 'Captured',
        paymentDate: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      attributes: ['paymentDate', 'amountPaid']
    });

    payments.forEach(p => {
      const parts = p.paymentDate ? p.paymentDate.split('-') : [];
      const month = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : new Date(p.paymentDate).getMonth();
      if (month >= 0 && month < 12) {
        monthlyData[month].collected += parseFloat(p.amountPaid);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Monthly revenue report generated',
      data: monthlyData
    });
  } catch (error) {
    console.error('getMonthlyRevenueReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating monthly revenue report'
    });
  }
};

exports.getPaymentHistoryReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, paymentMethod, paymentStatus } = req.query;

    const whereClause = { userId };

    if (startDate && endDate) {
      whereClause.paymentDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.paymentDate = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.paymentDate = { [Op.lte]: endDate };
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Invoice,
          as: 'Invoice',
          attributes: ['invoiceNumber'],
          include: [
            {
              model: Customer,
              as: 'Customer',
              attributes: ['name', 'companyName']
            }
          ]
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    const report = payments.map(p => ({
      paymentId: p.id,
      paymentDate: p.paymentDate,
      invoiceNumber: p.Invoice ? p.Invoice.invoiceNumber : 'N/A',
      customerName: (p.Invoice && p.Invoice.Customer) ? p.Invoice.Customer.name : 'N/A',
      companyName: (p.Invoice && p.Invoice.Customer) ? p.Invoice.Customer.companyName : 'N/A',
      paymentMethod: p.paymentMethod,
      amountPaid: parseFloat(p.amountPaid),
      referenceNumber: p.referenceNumber,
      paymentStatus: p.paymentStatus
    }));

    return res.status(200).json({
      success: true,
      message: 'Payment history report retrieved',
      data: report
    });
  } catch (error) {
    console.error('getPaymentHistoryReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating payment history report'
    });
  }
};
