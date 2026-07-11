const { Payment, Invoice, Customer } = require('../models');

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Invoice,
          as: 'Invoice',
          attributes: ['id', 'invoiceNumber', 'grandTotal', 'status'],
          include: [
            {
              model: Customer,
              as: 'Customer',
              attributes: ['id', 'name', 'companyName']
            }
          ]
        }
      ],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments
    });
  } catch (error) {
    console.error('getPayments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving payments'
    });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, paymentDate, paymentMethod, amountPaid, referenceNumber, paymentStatus } = req.body;

    // Verify Invoice exists and belongs to User
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId: req.user.id },
      include: [{ model: Payment, as: 'Payments' }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const amt = parseFloat(amountPaid);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      paymentDate,
      paymentMethod,
      amountPaid: amt,
      referenceNumber,
      paymentStatus, // 'Captured', 'Pending', 'Failed', 'Refunded'
      invoiceId,
      userId: req.user.id
    });

    // Business Logic: If payment is Captured, update invoice status
    if (paymentStatus === 'Captured') {
      // Calculate total captured payments for this invoice
      const capturedPayments = invoice.Payments
        ? invoice.Payments
            .filter(p => p.paymentStatus === 'Captured')
            .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0) + amt
        : amt;

      const grandTotal = parseFloat(invoice.grandTotal);

      if (capturedPayments >= grandTotal) {
        await invoice.update({ status: 'Paid' });
      } else if (capturedPayments > 0) {
        await invoice.update({ status: 'Partially Paid' });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('createPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording payment'
    });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Invoice, as: 'Invoice' }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const invoice = payment.Invoice;
    await payment.destroy();

    // Recalculate invoice status if the deleted payment was Captured
    if (payment.paymentStatus === 'Captured' && invoice) {
      const remainingPayments = await Payment.findAll({
        where: { invoiceId: invoice.id, paymentStatus: 'Captured' }
      });

      const totalCaptured = remainingPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
      const grandTotal = parseFloat(invoice.grandTotal);

      let newStatus = 'Sent';
      if (totalCaptured >= grandTotal) {
        newStatus = 'Paid';
      } else if (totalCaptured > 0) {
        newStatus = 'Partially Paid';
      } else {
        newStatus = 'Sent'; // Revert back to Sent if no captured payments exist
      }

      await invoice.update({ status: newStatus });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment record deleted and invoice status updated'
    });
  } catch (error) {
    console.error('deletePayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting payment'
    });
  }
};
