import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';
import { 
  FilePlus, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash, 
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal forms state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('Draft');
  
  // Dynamic line items: array of { description, quantity, unitPrice, gstPercentage, discountPercentage }
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: '0', unitPrice: '0', gstPercentage: '18', discountPercentage: '0' }
  ]);

  const [actionError, setActionError] = useState('');

  const fetchInvoices = async () => {
    try {
      const res = await api.get(
        `/invoices?search=${search}&status=${statusFilter}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([fetchInvoices(), fetchCustomers()]);
      setLoading(false);
    };
    initPage();
  }, [search, statusFilter, sortBy, sortOrder]);

  const openCreateModal = () => {
    setSelectedCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate(''); // empty due date, selected manually
    setInvoiceStatus('Draft');
    setLineItems([{ description: '', quantity: '0', unitPrice: '0', gstPercentage: '18', discountPercentage: '0' }]);
    setActionError('');
    setIsModalOpen(true);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: '0', unitPrice: '0', gstPercentage: '18', discountPercentage: '0' }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Update Item Row values
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][field] = value;
    setLineItems(updatedItems);
  };

  // Real-time calculations helper
  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let gstAmount = 0;

    lineItems.forEach(item => {
      const q = parseInt(item.quantity, 10) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      const gst = parseFloat(item.gstPercentage) || 0;
      const disc = parseFloat(item.discountPercentage) || 0;

      const itemSub = q * p;
      const itemDisc = itemSub * (disc / 100);
      const itemGst = (itemSub - itemDisc) * (gst / 100);

      subtotal += itemSub;
      discountAmount += itemDisc;
      gstAmount += itemGst;
    });

    const grandTotal = subtotal - discountAmount + gstAmount;

    return { subtotal, discountAmount, gstAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    if (!selectedCustomerId) {
      setActionError('Please select a customer');
      return;
    }

    if (lineItems.some(item => !item.description.trim() || parseInt(item.quantity, 10) <= 0 || parseFloat(item.unitPrice) < 0)) {
      setActionError('Please ensure all items have descriptions, positive quantities and non-negative prices');
      return;
    }

    try {
      const res = await api.post('/invoices', {
        customerId: selectedCustomerId,
        invoiceDate,
        dueDate,
        status: invoiceStatus,
        items: lineItems.map(item => ({
          ...item,
          quantity: parseInt(item.quantity, 10) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          gstPercentage: parseFloat(item.gstPercentage) || 0,
          discountPercentage: parseFloat(item.discountPercentage) || 0
        }))
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to create invoice');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Avoid triggering row click navigate
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const res = await api.delete(`/invoices/${id}`);
      if (res.success) {
        fetchInvoices();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Invoices Board</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Create, update and track billing status of invoices</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FilePlus size={18} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button 
          className="btn btn-secondary" 
          onClick={() => toggleSort('date')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>Date</span>
          <ArrowUpDown size={14} />
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => toggleSort('amount')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>Amount</span>
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* Invoice Table list */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
          Retrieving invoices registry...
        </div>
      ) : invoices.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer Name</th>
                  <th>Company</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: '700', color: '#7c3aed' }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: '600' }}>{inv.Customer ? inv.Customer.name : 'N/A'}</td>
                    <td>{inv.Customer ? inv.Customer.companyName : 'N/A'}</td>
                    <td>{inv.invoiceDate}</td>
                    <td>{inv.dueDate}</td>
                    <td style={{ fontWeight: '700' }}>{formatCurrency(inv.grandTotal)}</td>
                    <td>
                      <span className={`badge badge-${inv.status.toLowerCase().replace(' ', '-')}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.5rem' }}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          title="View Invoice Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.35rem 0.5rem' }}
                          onClick={(e) => handleDelete(e, inv.id)}
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          No invoices registered. Click "Create Invoice" to make your first billing request.
        </div>
      )}

      {/* Invoice Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Invoice"
        size="large"
      >
        <form onSubmit={handleSubmit}>
          {actionError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Select Customer *</label>
              {customers.length > 0 ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.5rem' }}>
                  No customers found. Create a customer first!
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Date *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="form-control"
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker()}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-control"
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker()}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
                className="form-control"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Line Items
          </h3>

          {/* Items Form Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {/* Column Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1.5fr 40px', 
              gap: '0.75rem', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              <div>Item Description *</div>
              <div>Quantity *</div>
              <div>Unit Price ($) *</div>
              <div>GST (%)</div>
              <div>Discount (%)</div>
              <div style={{ textAlign: 'right' }}>Total</div>
              <div></div>
            </div>

            {lineItems.map((item, idx) => {
              const itemSubtotal = (parseInt(item.quantity, 10) || 0) * (parseFloat(item.unitPrice) || 0);
              const itemDiscount = itemSubtotal * ((parseFloat(item.discountPercentage) || 0) / 100);
              const itemGst = (itemSubtotal - itemDiscount) * ((parseFloat(item.gstPercentage) || 0) / 100);
              const itemTotal = itemSubtotal - itemDiscount + itemGst;

              return (
                <div 
                  key={idx} 
                  style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1.5fr 40px', gap: '0.75rem', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Item Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    className="form-control"
                    placeholder="GST %"
                    value={item.gstPercentage}
                    onChange={(e) => handleItemChange(idx, 'gstPercentage', e.target.value)}
                  />

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Disc %"
                    value={item.discountPercentage}
                    onChange={(e) => handleItemChange(idx, 'discountPercentage', e.target.value)}
                  />

                  <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.95rem' }}>
                    {formatCurrency(itemTotal)}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 0.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddItemRow}
            style={{ marginBottom: '2rem' }}
          >
            <Plus size={16} />
            <span>Add Item Row</span>
          </button>

          {/* Totals Summary and Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={customers.length === 0}>
                Generate Invoice
              </button>
            </div>

            <div className="summary-table" style={{ width: '280px' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '0.25rem 0' }}>Subtotal</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', padding: '0.25rem 0' }}>{formatCurrency(totals.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '0.25rem 0' }}>Discount Amount (-)</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#ef4444', padding: '0.25rem 0' }}>{formatCurrency(totals.discountAmount)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '0.25rem 0' }}>GST Amount (+)</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#3b82f6', padding: '0.25rem 0' }}>{formatCurrency(totals.gstAmount)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: '800' }}>
                    <td style={{ paddingTop: '0.75rem', color: '#fff' }}>Grand Total</td>
                    <td style={{ paddingTop: '0.75rem', textAlign: 'right', color: '#7c3aed' }}>{formatCurrency(totals.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
