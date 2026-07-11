import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';
import { 
  ArrowLeft, 
  Printer, 
  CreditCard, 
  Calendar, 
  User, 
  DollarSign, 
  FileText,
  AlertCircle
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Captured');
  
  const [paymentError, setPaymentError] = useState('');

  const fetchInvoiceDetails = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      if (res.success) {
        setInvoice(res.data);
      }
    } catch (err) {
      console.error('Error fetching invoice detail:', err);
      setError('Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  // Calculate unpaid balance
  const calculateBalance = () => {
    if (!invoice) return 0;
    const totalPaid = (invoice.Payments || [])
      .filter(p => p.paymentStatus === 'Captured')
      .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
    return Math.max(0, parseFloat(invoice.grandTotal) - totalPaid);
  };

  const openPaymentModal = () => {
    const balance = calculateBalance();
    setAmountPaid(balance.toFixed(2));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setReferenceNumber('');
    setPaymentStatus('Captured');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    const amt = parseFloat(amountPaid);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid payment amount greater than zero');
      return;
    }

    try {
      const res = await api.post('/payments', {
        invoiceId: invoice.id,
        paymentDate,
        paymentMethod,
        amountPaid: amt,
        referenceNumber,
        paymentStatus
      });

      if (res.success) {
        setIsPaymentModalOpen(false);
        fetchInvoiceDetails(); // Refetch to update status and payments list
      }
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Invoice not found'}</h3>
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>
      </div>
    );
  }

  const balanceDue = calculateBalance();

  return (
    <div>
      {/* Detail Toolbar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} />
          <span>Invoices List</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
          {balanceDue > 0 && invoice.status !== 'Cancelled' && (
            <button className="btn btn-primary" onClick={openPaymentModal}>
              <CreditCard size={16} />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Layout */}
      <div className="invoice-template">
        {/* Header */}
        <div className="invoice-template-header">
          <div className="invoice-company-details">
            <h2>Geeth LLC</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>100 Pine Street, San Francisco, CA 94111</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Email: finance@geethllc.com | Web: geethllc.com</p>
          </div>

          <div className="invoice-metadata">
            <h3>INVOICE STATEMENT</h3>
            <p style={{ fontSize: '1.1rem', fontWeight: '800' }}>{invoice.invoiceNumber}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <span className={`badge badge-${invoice.status.toLowerCase().replace(' ', '-')}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Billing columns */}
        <div className="invoice-billing-section">
          <div className="billing-col">
            <h4>Billed To</h4>
            {invoice.Customer ? (
              <div>
                <p style={{ fontSize: '1.05rem', fontWeight: '700' }}>{invoice.Customer.name}</p>
                <p style={{ fontWeight: '600', color: '#7c3aed', fontSize: '0.9rem' }}>{invoice.Customer.companyName}</p>
                {invoice.Customer.gstNumber && (
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '0.25rem' }}>GSTIN: {invoice.Customer.gstNumber}</p>
                )}
                <p style={{ color: '#94a3b8', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{invoice.Customer.address}</p>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Email: {invoice.Customer.email} | Mobile: {invoice.Customer.mobileNumber}</p>
              </div>
            ) : (
              <p>N/A</p>
            )}
          </div>

          <div className="billing-col" style={{ textAlign: 'right' }}>
            <h4>Invoice Date</h4>
            <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{invoice.invoiceDate}</p>

            <h4>Due Date</h4>
            <p style={{ fontWeight: '600', color: balanceDue > 0 ? '#f59e0b' : 'inherit' }}>{invoice.dueDate}</p>

            {balanceDue > 0 ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h4>Net Balance Due</h4>
                <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(balanceDue)}</p>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                <span className="badge badge-paid" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Fully Paid</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice items table */}
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
          Line Items
        </h4>
        <div className="table-responsive" style={{ border: 'none', marginBottom: '2rem' }}>
          <table className="custom-table" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th style={{ paddingLeft: '0', background: 'transparent' }}>Description</th>
                <th style={{ textAlign: 'right', background: 'transparent' }}>Qty</th>
                <th style={{ textAlign: 'right', background: 'transparent' }}>Unit Price</th>
                <th style={{ textAlign: 'right', background: 'transparent' }}>GST %</th>
                <th style={{ textAlign: 'right', background: 'transparent' }}>Discount %</th>
                <th style={{ textAlign: 'right', paddingRight: '0', background: 'transparent' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.Items && invoice.Items.map((item) => (
                <tr key={item.id}>
                  <td style={{ paddingLeft: '0', fontWeight: '500' }}>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', color: '#3b82f6' }}>{item.gstPercentage}%</td>
                  <td style={{ textAlign: 'right', color: '#ef4444' }}>{item.discountPercentage}%</td>
                  <td style={{ textAlign: 'right', paddingRight: '0', fontWeight: '700' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice calculations box */}
        <div className="invoice-summary-box">
          <table className="summary-table">
            <tbody>
              <tr>
                <td style={{ color: '#94a3b8' }}>Subtotal</td>
                <td style={{ fontWeight: '600' }}>{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Total Discount (-)</td>
                <td style={{ fontWeight: '600', color: '#ef4444' }}>{formatCurrency(invoice.discountAmount)}</td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Total GST Tax (+)</td>
                <td style={{ fontWeight: '600', color: '#3b82f6' }}>{formatCurrency(invoice.gstAmount)}</td>
              </tr>
              <tr className="grand-total">
                <td>Grand Total</td>
                <td>{formatCurrency(invoice.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice payment logs */}
      <div className="card no-print" style={{ marginTop: '2rem' }}>
        <h3 className="card-title">
          <CreditCard size={18} color="#7c3aed" />
          <span>Payment History Log</span>
        </h3>
        {invoice.Payments && invoice.Payments.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Amount Paid</th>
                  <th>Reference Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoice.Payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.paymentDate}</td>
                    <td>{p.paymentMethod}</td>
                    <td style={{ fontWeight: '700' }}>{formatCurrency(p.amountPaid)}</td>
                    <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{p.referenceNumber || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${p.paymentStatus.toLowerCase()}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No payment transactions recorded for this invoice yet.</p>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment Transaction"
      >
        <form onSubmit={handleRecordPayment}>
          {paymentError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{paymentError}</span>
            </div>
          )}

          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Total Invoice Amount:</span>
              <span style={{ fontWeight: '700', color: '#fff' }}>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              <span>Remaining Balance Due:</span>
              <span style={{ fontWeight: '700', color: '#ef4444' }}>{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-control"
              required
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount Paid ($) *</label>
            <input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="form-control"
              max={balanceDue.toFixed(2)}
              min="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reference Number (Txn ID)</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="form-control"
              placeholder="e.g. TXN-998877"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Payment Status *</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="form-control"
              required
            >
              <option value="Captured">Captured</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetail;
