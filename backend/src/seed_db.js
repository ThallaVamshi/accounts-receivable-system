const { sequelize, User, Customer, Invoice, InvoiceItem, Payment } = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  console.log('=== STARTING DATABASE SEED PROCESS ===');

  try {
    // 1. Force sync to clear any old structure and start fresh
    await sequelize.sync({ force: true });
    console.log('✔ Database tables reset and synchronized successfully.');

    // 2. Create Users
    console.log('Creating users...');
    const user1 = await User.create({
      name: 'Finance Administrator',
      email: 'admin@company.com',
      password: 'password123' // Will be hashed by model hook
    });

    const user2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@cyberdyne.co',
      password: 'password123'
    });

    console.log('✔ Users seeded.');

    // 3. Create Customers for Finance Administrator (user1)
    console.log('Creating customers...');
    const customer1 = await Customer.create({
      name: 'Acme Corporation',
      companyName: 'Acme Holdings Ltd',
      gstNumber: '27AAAAA1111A1Z1',
      email: 'billing@acme.com',
      mobileNumber: '+1 555-0199',
      address: '100 Industrial Parkway, Sector 4, Silicon Valley',
      userId: user1.id
    });

    const customer2 = await Customer.create({
      name: 'Globex Corporation',
      companyName: 'Globex Corp',
      gstNumber: '27GLOBEX9988G1Z5',
      email: 'accounts@globex.com',
      mobileNumber: '+1 555-0244',
      address: '772 Evergreen Terrace, Springfield, OR',
      userId: user1.id
    });

    const customer3 = await Customer.create({
      name: 'Initech Solutions',
      companyName: 'Initech LLC',
      gstNumber: '27INITECH5555I1Z9',
      email: 'invoices@initech.com',
      mobileNumber: '+1 555-0311',
      address: '4120 Freemont Ave, Suite 100, Austin, TX',
      userId: user1.id
    });

    const customer4 = await Customer.create({
      name: 'Umbrella Corporation',
      companyName: 'Umbrella Holdings',
      gstNumber: '27UMBRELLA7777U1Z2',
      email: 'finance@umbrella.org',
      mobileNumber: '+1 888-999-0000',
      address: 'Raccoon City Research Facility, Sublevel 4, Raccoon City',
      userId: user1.id
    });

    console.log('✔ Customers seeded.');

    // 4. Create Invoices, Line Items and Payments
    console.log('Creating invoices and transactions...');

    // Today's date calculations
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 20);

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const overdueDate = new Date();
    overdueDate.setDate(today.getDate() - 45);

    const overdueDueDate = new Date();
    overdueDueDate.setDate(today.getDate() - 15);

    // INVOICE 1: Acme Corporation - PAID ($1,298.00)
    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-1001',
      invoiceDate: formatDate(pastDate),
      dueDate: formatDate(today),
      subtotal: 1200.00,
      gstAmount: 148.00,
      discountAmount: 50.00,
      grandTotal: 1298.00,
      status: 'Paid',
      customerId: customer1.id,
      userId: user1.id
    });

    await InvoiceItem.bulkCreate([
      {
        description: 'Server Migration Consulting',
        quantity: 5,
        unitPrice: 200.00,
        gstPercentage: 18.00,
        discountPercentage: 5.00,
        subtotal: 1000.00,
        discountAmount: 50.00,
        gstAmount: 171.00, // (1000 - 50) * 0.18 = 171
        total: 1121.00,
        invoiceId: inv1.id
      },
      {
        description: 'SSL Enterprise Certificate',
        quantity: 1,
        unitPrice: 200.00,
        gstPercentage: 12.00,
        discountPercentage: 0.00,
        subtotal: 200.00,
        discountAmount: 0.00,
        gstAmount: 24.00,
        total: 224.00,
        invoiceId: inv1.id
      }
    ]);

    // Record Captured Payment for Invoice 1
    await Payment.create({
      paymentDate: formatDate(pastDate),
      paymentMethod: 'Bank Transfer',
      amountPaid: 1298.00,
      referenceNumber: 'TXN-ACM-99827',
      paymentStatus: 'Captured',
      invoiceId: inv1.id,
      userId: user1.id
    });


    // INVOICE 2: Globex Corporation - PARTIALLY PAID ($3,540.00 total, $1,540.00 paid, $2,000.00 outstanding)
    const inv2 = await Invoice.create({
      invoiceNumber: 'INV-1002',
      invoiceDate: formatDate(pastDate),
      dueDate: formatDate(futureDate),
      subtotal: 3000.00,
      gstAmount: 540.00,
      discountAmount: 0.00,
      grandTotal: 3540.00,
      status: 'Partially Paid',
      customerId: customer2.id,
      userId: user1.id
    });

    await InvoiceItem.create({
      description: 'Custom Web Portal Development',
      quantity: 1,
      unitPrice: 3000.00,
      gstPercentage: 18.00,
      discountPercentage: 0.00,
      subtotal: 3000.00,
      discountAmount: 0.00,
      gstAmount: 540.00,
      total: 3540.00,
      invoiceId: inv2.id
    });

    await Payment.create({
      paymentDate: formatDate(today),
      paymentMethod: 'Credit Card',
      amountPaid: 1540.00,
      referenceNumber: 'TXN-GLB-00291',
      paymentStatus: 'Captured',
      invoiceId: inv2.id,
      userId: user1.id
    });


    // INVOICE 3: Initech Solutions - SENT (Outstanding $885.00)
    const inv3 = await Invoice.create({
      invoiceNumber: 'INV-1003',
      invoiceDate: formatDate(today),
      dueDate: formatDate(futureDate),
      subtotal: 750.00,
      gstPercentage: 18.00,
      gstAmount: 135.00,
      discountAmount: 0.00,
      grandTotal: 885.00,
      status: 'Sent',
      customerId: customer3.id,
      userId: user1.id
    });

    await InvoiceItem.create({
      description: 'IT Support & Auditing Desk Services',
      quantity: 15,
      unitPrice: 50.00,
      gstPercentage: 18.00,
      discountPercentage: 0.00,
      subtotal: 750.00,
      discountAmount: 0.00,
      gstAmount: 135.00,
      total: 885.00,
      invoiceId: inv3.id
    });


    // INVOICE 4: Umbrella Corporation - OVERDUE ($5,192.00)
    const inv4 = await Invoice.create({
      invoiceNumber: 'INV-1004',
      invoiceDate: formatDate(overdueDate),
      dueDate: formatDate(overdueDueDate),
      subtotal: 4400.00,
      gstAmount: 792.00,
      discountAmount: 0.00,
      grandTotal: 5192.00,
      status: 'Overdue',
      customerId: customer4.id,
      userId: user1.id
    });

    await InvoiceItem.bulkCreate([
      {
        description: 'Biometric Access Control Systems',
        quantity: 4,
        unitPrice: 1000.00,
        gstPercentage: 18.00,
        discountPercentage: 0.00,
        subtotal: 4000.00,
        discountAmount: 0.00,
        gstAmount: 720.00,
        total: 4720.00,
        invoiceId: inv4.id
      },
      {
        description: 'Hazardous Disposal Containers',
        quantity: 8,
        unitPrice: 50.00,
        gstPercentage: 18.00,
        discountPercentage: 0.00,
        subtotal: 400.00,
        discountAmount: 0.00,
        gstAmount: 72.00,
        total: 472.00,
        invoiceId: inv4.id
      }
    ]);


    // INVOICE 5: Acme Corporation - DRAFT ($354.00)
    const inv5 = await Invoice.create({
      invoiceNumber: 'INV-1005',
      invoiceDate: formatDate(today),
      dueDate: formatDate(futureDate),
      subtotal: 300.00,
      gstAmount: 54.00,
      discountAmount: 0.00,
      grandTotal: 354.00,
      status: 'Draft',
      customerId: customer1.id,
      userId: user1.id
    });

    await InvoiceItem.create({
      description: 'Network Routing Configurations',
      quantity: 1,
      unitPrice: 300.00,
      gstPercentage: 18.00,
      discountPercentage: 0.00,
      subtotal: 300.00,
      discountAmount: 0.00,
      gstAmount: 54.00,
      total: 354.00,
      invoiceId: inv5.id
    });

    console.log('✔ Invoices, line items and payment histories successfully created.');
    console.log('\n=== SEED DATA LOADED SUCCESSFUL ===\n');
    console.log('Default credentials to log in to React portal:');
    console.log('Email: admin@company.com');
    console.log('Password: password123');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ DATABASE SEED PROCESS FAILED ❌');
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
