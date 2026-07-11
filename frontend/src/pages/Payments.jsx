import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  CreditCard, 
  Search, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      if (res.success) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment record? The corresponding invoice status will be recalculated.')) return;

    try {
      const res = await api.delete(`/payments/${id}`);
      if (res.success) {
        fetchPayments();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete payment record');
    }
  };

  const filteredPayments = payments.filter(p => {
    const customerName = p.Invoice?.Customer?.name || '';
    const companyName = p.Invoice?.Customer?.companyName || '';
    const invoiceNum = p.Invoice?.invoiceNumber || '';
    const refNum = p.referenceNumber || '';

    return (
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      companyName.toLowerCase().includes(search.toLowerCase()) ||
      invoiceNum.toLowerCase().includes(search.toLowerCase()) ||
      refNum.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Payments Journal</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Review all payment transactions and cash intake history</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search payments by invoice #, customer name or reference #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Payments list table */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
          Loading payments list...
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference Number</th>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.paymentDate}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8', fontWeight: '500' }}>
                      {p.referenceNumber || 'N/A'}
                    </td>
                    <td style={{ fontWeight: '700', color: '#7c3aed' }}>
                      {p.Invoice ? p.Invoice.invoiceNumber : 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{p.Invoice?.Customer ? p.Invoice.Customer.name : 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.Invoice?.Customer?.companyName}</div>
                    </td>
                    <td>{p.paymentMethod}</td>
                    <td style={{ fontWeight: '700' }}>{formatCurrency(p.amountPaid)}</td>
                    <td>
                      <span className={`badge badge-${p.paymentStatus.toLowerCase()}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.35rem 0.5rem' }}
                        onClick={() => handleDelete(p.id)}
                        title="Delete Payment Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          No payments recorded yet. Navigate to an Invoice detail page to capture a payment.
        </div>
      )}
    </div>
  );
};

export default Payments;
