const sequelize = require('../config/db');
const User = require('./User');
const Customer = require('./Customer');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Payment = require('./Payment');

// Define Associations

// User associations
User.hasMany(Customer, { foreignKey: 'userId', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Invoice, { foreignKey: 'userId', onDelete: 'CASCADE' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Payment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: 'userId' });

// Customer <-> Invoice associations
Customer.hasMany(Invoice, { foreignKey: 'customerId', onDelete: 'RESTRICT' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'Customer' });

// Invoice <-> InvoiceItem associations (cascade on delete)
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'Items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// Invoice <-> Payment associations
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'Payments', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'Invoice' });

module.exports = {
  sequelize,
  User,
  Customer,
  Invoice,
  InvoiceItem,
  Payment
};
