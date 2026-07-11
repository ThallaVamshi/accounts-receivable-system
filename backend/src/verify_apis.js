const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');

const PORT = 5001;
let server;

// Start server on test port
const startTestServer = () => {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
};

// Helper for HTTP requests
const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n=== STARTING API VERIFICATION SUITE ===\n');

  try {
    // 1. Sync Database
    await sequelize.sync({ force: true });
    console.log('✔ Database clean synchronized');

    await startTestServer();

    let authToken = '';
    let customerId = '';
    let invoiceId = '';

    // 2. Test User Registration
    const signupRes = await request('/api/auth/signup', 'POST', {
      name: 'Test Administrator',
      email: 'admin@example.com',
      password: 'password123'
    });

    if (signupRes.statusCode === 201 && signupRes.body.success) {
      console.log('✔ Auth Signup successful');
      authToken = signupRes.body.data.token;
    } else {
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
    }

    // 3. Test User Login
    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'password123'
    });

    if (loginRes.statusCode === 200 && loginRes.body.success) {
      console.log('✔ Auth Login successful');
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    // 4. Test Current User Profile
    const meRes = await request('/api/auth/me', 'GET', null, authToken);
    if (meRes.statusCode === 200 && meRes.body.success && meRes.body.data.user.email === 'admin@example.com') {
      console.log('✔ Auth Profile Session retrieval verified');
    } else {
      throw new Error(`Auth Profile verification failed: ${JSON.stringify(meRes.body)}`);
    }

    // 5. Test Customer Creation
    const customerRes = await request('/api/customers', 'POST', {
      name: 'Acme Corporation',
      companyName: 'Acme Corp Ltd',
      gstNumber: '27AAAAA1111A1Z1',
      email: 'billing@acme.com',
      mobileNumber: '+919876543210',
      address: '101, Business Heights, Mumbai, MH - 400001'
    }, authToken);

    if (customerRes.statusCode === 201 && customerRes.body.success) {
      console.log('✔ Customer Creation successful');
      customerId = customerRes.body.data.id;
    } else {
      throw new Error(`Customer creation failed: ${JSON.stringify(customerRes.body)}`);
    }

    // 6. Test Invoice Creation with Calculations
    // Item 1: Qty=2, Price=100.00, GST=18%, Disc=10%
    //   Subtotal = 200.00
    //   Discount = 20.00
    //   Taxable = 180.00 -> GST = 180 * 0.18 = 32.40
    //   Total = 180 + 32.40 = 212.40
    // Item 2: Qty=1, Price=500.00, GST=12%, Disc=5%
    //   Subtotal = 500.00
    //   Discount = 25.00
    //   Taxable = 475.00 -> GST = 475 * 0.12 = 57.00
    //   Total = 475 + 57.00 = 532.00
    // Invoice Totals:
    //   Subtotal = 700.00
    //   Discount = 45.00
    //   GST = 89.40
    //   Grand Total = 744.40
    const invoiceRes = await request('/api/invoices', 'POST', {
      customerId,
      invoiceDate: '2026-07-10',
      dueDate: '2026-08-10',
      items: [
        {
          description: 'Consulting Services',
          quantity: 2,
          unitPrice: 100,
          gstPercentage: 18,
          discountPercentage: 10
        },
        {
          description: 'Software License',
          quantity: 1,
          unitPrice: 500,
          gstPercentage: 12,
          discountPercentage: 5
        }
      ]
    }, authToken);

    if (invoiceRes.statusCode === 201 && invoiceRes.body.success) {
      const inv = invoiceRes.body.data;
      const sub = parseFloat(inv.subtotal);
      const disc = parseFloat(inv.discountAmount);
      const gst = parseFloat(inv.gstAmount);
      const grand = parseFloat(inv.grandTotal);

      if (sub === 700 && disc === 45 && gst === 89.4 && grand === 744.4) {
        console.log('✔ Invoice Creation & Financial Calculations verified successfully');
        console.log(`   (Subtotal: ${sub}, Disc: ${disc}, GST: ${gst}, Grand Total: ${grand})`);
      } else {
        throw new Error(`Calculations mismatch. Subtotal: ${sub}, Disc: ${disc}, GST: ${gst}, Grand Total: ${grand}`);
      }
      invoiceId = inv.id;
    } else {
      throw new Error(`Invoice creation failed: ${JSON.stringify(invoiceRes.body)}`);
    }

    // 7. Test Partial Payment Recording and Auto Status Update
    const paymentRes1 = await request('/api/payments', 'POST', {
      invoiceId,
      paymentDate: '2026-07-10',
      paymentMethod: 'UPI',
      amountPaid: 300.00,
      referenceNumber: 'REF123456',
      paymentStatus: 'Captured'
    }, authToken);

    if (paymentRes1.statusCode === 201 && paymentRes1.body.success) {
      // Check invoice status
      const checkInvRes1 = await request(`/api/invoices/${invoiceId}`, 'GET', null, authToken);
      const status = checkInvRes1.body.data.status;
      if (status === 'Partially Paid') {
        console.log('✔ Partial payment recorded. Invoice status auto-updated to "Partially Paid"');
      } else {
        throw new Error(`Expected status "Partially Paid", got "${status}"`);
      }
    } else {
      throw new Error(`First payment failed: ${JSON.stringify(paymentRes1.body)}`);
    }

    // 8. Test Full Payment Recording
    const paymentRes2 = await request('/api/payments', 'POST', {
      invoiceId,
      paymentDate: '2026-07-11',
      paymentMethod: 'Bank Transfer',
      amountPaid: 444.40,
      referenceNumber: 'REF789012',
      paymentStatus: 'Captured'
    }, authToken);

    if (paymentRes2.statusCode === 201 && paymentRes2.body.success) {
      // Check invoice status
      const checkInvRes2 = await request(`/api/invoices/${invoiceId}`, 'GET', null, authToken);
      const status = checkInvRes2.body.data.status;
      if (status === 'Paid') {
        console.log('✔ Final payment recorded. Invoice status auto-updated to "Paid"');
      } else {
        throw new Error(`Expected status "Paid", got "${status}"`);
      }
    } else {
      throw new Error(`Second payment failed: ${JSON.stringify(paymentRes2.body)}`);
    }

    // 9. Verify Dashboard API
    const dashboardRes = await request('/api/dashboard', 'GET', null, authToken);
    if (dashboardRes.statusCode === 200 && dashboardRes.body.success) {
      const stats = dashboardRes.body.data;
      if (stats.totalCustomers === 1 && stats.totalInvoices === 1 && stats.totalRevenue === 744.4 && stats.outstandingAmount === 0) {
        console.log('✔ Dashboard KPI metrics matched expected values');
      } else {
        throw new Error(`Dashboard details mismatch: ${JSON.stringify(stats)}`);
      }
    } else {
      throw new Error(`Dashboard API fetch failed: ${JSON.stringify(dashboardRes.body)}`);
    }

    // 10. Verify Reports API
    const reportsRes = await request('/api/reports/outstanding', 'GET', null, authToken);
    if (reportsRes.statusCode === 200 && reportsRes.body.success) {
      const rep = reportsRes.body.data[0];
      if (rep.totalInvoiced === 744.4 && rep.totalPaid === 744.4 && rep.netOutstanding === 0) {
        console.log('✔ Outstanding Balance report validated');
      } else {
        throw new Error(`Outstanding report details mismatch: ${JSON.stringify(rep)}`);
      }
    } else {
      throw new Error(`Outstanding report fetch failed: ${JSON.stringify(reportsRes.body)}`);
    }

    console.log('\n✔✔ ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ✔✔\n');
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST SUITE FAILED ❌');
    console.error(error);
    process.exit(1);
  } finally {
    if (server) {
      server.close(() => {
        console.log('[TEST SERVER] Closed.');
      });
    }
  }
};

runTests();
