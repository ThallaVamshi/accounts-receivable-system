const { sequelize, Invoice, InvoiceItem, Customer, Payment } = require('../models');
const { Op } = require('sequelize');

// Helper to generate sequential invoice number
const generateInvoiceNumber = async () => {
  const invoices = await Invoice.findAll({
    attributes: ['invoiceNumber']
  });

  if (invoices.length === 0) {
    return 'INV-1001';
  }

  let maxNum = 1000;
  for (const inv of invoices) {
    const lastNumStr = inv.invoiceNumber.replace('INV-', '');
    const num = parseInt(lastNumStr, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  return `INV-${maxNum + 1}`;
};

exports.getInvoices = async (req, res) => {
  try {
    const { search, status, sortBy, sortOrder } = req.query;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const customerWhere = {};
    if (search) {
      // Search by Customer Name or Invoice Number
      whereClause[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
        { '$Customer.name$': { [Op.like]: `%${search}%` } },
        { '$Customer.companyName$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Sorting
    let order = [['invoiceDate', 'DESC']];
    if (sortBy) {
      const orderDir = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      if (sortBy === 'amount') {
        order = [['grandTotal', orderDir]];
      } else if (sortBy === 'date') {
        order = [['invoiceDate', orderDir]];
      } else if (sortBy === 'number') {
        order = [['invoiceNumber', orderDir]];
      }
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'companyName', 'email']
        }
      ],
      order
    });

    return res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    console.error('getInvoices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving invoices'
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Customer,
          as: 'Customer'
        },
        {
          model: InvoiceItem,
          as: 'Items'
        },
        {
          model: Payment,
          as: 'Payments'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    console.error('getInvoiceById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving invoice details'
    });
  }
};

exports.createInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { customerId, invoiceDate, dueDate, items, status } = req.body;

    // Verify Customer exists and belongs to User
    const customer = await Customer.findOne({
      where: { id: customerId, userId: req.user.id }
    });

    if (!customer) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Selected customer not found'
      });
    }

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invoice must contain at least one item'
      });
    }

    // Auto-generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculations
    let subtotalSum = 0;
    let gstSum = 0;
    let discountSum = 0;
    let grandTotalSum = 0;

    const lineItemsData = items.map(item => {
      const qty = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const gstPct = parseFloat(item.gstPercentage) || 0;
      const discPct = parseFloat(item.discountPercentage) || 0;

      const itemSubtotal = qty * price;
      const itemDiscount = itemSubtotal * (discPct / 100);
      const itemGst = (itemSubtotal - itemDiscount) * (gstPct / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemGst;

      subtotalSum += itemSubtotal;
      discountSum += itemDiscount;
      gstSum += itemGst;
      grandTotalSum += itemTotal;

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        gstPercentage: gstPct,
        discountPercentage: discPct,
        subtotal: itemSubtotal,
        discountAmount: itemDiscount,
        gstAmount: itemGst,
        total: itemTotal
      };
    });

    // Create Invoice header
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotal: subtotalSum,
      gstAmount: gstSum,
      discountAmount: discountSum,
      grandTotal: grandTotalSum,
      status: status || 'Draft',
      customerId,
      userId: req.user.id
    }, { transaction });

    // Create Invoice items
    const finalItems = lineItemsData.map(item => ({
      ...item,
      invoiceId: invoice.id
    }));

    await InvoiceItem.bulkCreate(finalItems, { transaction });

    // Auto-create a Captured payment log if the invoice starts as 'Paid'
    if (status === 'Paid') {
      await Payment.create({
        paymentDate: invoiceDate || new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        amountPaid: grandTotalSum,
        referenceNumber: `AUTO-${invoiceNumber}`,
        paymentStatus: 'Captured',
        invoiceId: invoice.id,
        userId: req.user.id
      }, { transaction });
    }

    await transaction.commit();

    // Fetch full invoice detail to return
    const createdInvoice = await Invoice.findOne({
      where: { id: invoice.id },
      include: [{ model: Customer, as: 'Customer' }, { model: InvoiceItem, as: 'Items' }]
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: createdInvoice
    });
  } catch (error) {
    await transaction.rollback();
    console.error('createInvoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating invoice'
    });
  }
};

exports.updateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { customerId, invoiceDate, dueDate, items, status } = req.body;

    const invoice = await Invoice.findOne({
      where: { id, userId: req.user.id }
    });

    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Verify Customer belongs to User
    if (customerId) {
      const customer = await Customer.findOne({
        where: { id: customerId, userId: req.user.id }
      });
      if (!customer) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Selected customer not found'
        });
      }
    }

    // Recalculations if items are updated
    let updatedTotals = {};
    if (items && items.length > 0) {
      // Clear old items
      await InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction });

      let subtotalSum = 0;
      let gstSum = 0;
      let discountSum = 0;
      let grandTotalSum = 0;

      const lineItemsData = items.map(item => {
        const qty = parseInt(item.quantity, 10) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const gstPct = parseFloat(item.gstPercentage) || 0;
        const discPct = parseFloat(item.discountPercentage) || 0;

        const itemSubtotal = qty * price;
        const itemDiscount = itemSubtotal * (discPct / 100);
        const itemGst = (itemSubtotal - itemDiscount) * (gstPct / 100);
        const itemTotal = itemSubtotal - itemDiscount + itemGst;

        subtotalSum += itemSubtotal;
        discountSum += itemDiscount;
        gstSum += itemGst;
        grandTotalSum += itemTotal;

        return {
          description: item.description,
          quantity: qty,
          unitPrice: price,
          gstPercentage: gstPct,
          discountPercentage: discPct,
          subtotal: itemSubtotal,
          discountAmount: itemDiscount,
          gstAmount: itemGst,
          total: itemTotal,
          invoiceId: invoice.id
        };
      });

      await InvoiceItem.bulkCreate(lineItemsData, { transaction });

      updatedTotals = {
        subtotal: subtotalSum,
        gstAmount: gstSum,
        discountAmount: discountSum,
        grandTotal: grandTotalSum
      };
    }

    await invoice.update({
      customerId: customerId || invoice.customerId,
      invoiceDate: invoiceDate || invoice.invoiceDate,
      dueDate: dueDate || invoice.dueDate,
      status: status || invoice.status,
      ...updatedTotals
    }, { transaction });

    // Handle payments synchronization:
    const finalStatus = status || invoice.status;
    const finalInvoiceTotal = updatedTotals.grandTotal !== undefined ? updatedTotals.grandTotal : parseFloat(invoice.grandTotal);

    if (finalStatus === 'Paid') {
      const autoPayment = await Payment.findOne({
        where: { invoiceId: invoice.id, referenceNumber: `AUTO-${invoice.invoiceNumber}` },
        transaction
      });

      if (autoPayment) {
        const otherPayments = await Payment.findAll({
          where: { 
            invoiceId: invoice.id, 
            paymentStatus: 'Captured',
            id: { [Op.ne]: autoPayment.id }
          },
          transaction
        });
        const otherPaid = otherPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
        const correctedAmt = Math.max(0, finalInvoiceTotal - otherPaid);
        
        if (correctedAmt === 0) {
          await autoPayment.destroy({ transaction });
        } else {
          await autoPayment.update({ amountPaid: correctedAmt }, { transaction });
        }
      } else {
        const existingPayments = await Payment.findAll({
          where: { invoiceId: invoice.id, paymentStatus: 'Captured' },
          transaction
        });
        const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
        const remainingBalance = Math.max(0, finalInvoiceTotal - totalPaid);

        if (remainingBalance > 0) {
          await Payment.create({
            paymentDate: invoiceDate || invoice.invoiceDate || new Date().toISOString().split('T')[0],
            paymentMethod: 'Bank Transfer',
            amountPaid: remainingBalance,
            referenceNumber: `AUTO-${invoice.invoiceNumber}`,
            paymentStatus: 'Captured',
            invoiceId: invoice.id,
            userId: req.user.id
          }, { transaction });
        }
      }
    } else {
      // If status is NOT 'Paid' (e.g. Draft, Sent, Overdue), remove any auto-generated payment records
      await Payment.destroy({
        where: { 
          invoiceId: invoice.id, 
          referenceNumber: `AUTO-${invoice.invoiceNumber}`
        },
        transaction
      });
    }

    await transaction.commit();

    const finalInvoice = await Invoice.findOne({
      where: { id: invoice.id },
      include: [
        { model: Customer, as: 'Customer' },
        { model: InvoiceItem, as: 'Items' },
        { model: Payment, as: 'Payments' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: finalInvoice
    });
  } catch (error) {
    await transaction.rollback();
    console.error('updateInvoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating invoice'
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.destroy();

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting invoice'
    });
  }
};
