import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  FileText, 
  MapPin,
  AlertTriangle 
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null); // Null for create, customer object for edit
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    gstNumber: '',
    email: '',
    mobileNumber: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setActionError('');
  };

  const openCreateModal = () => {
    setCurrentCustomer(null);
    setFormData({
      name: '',
      companyName: '',
      gstNumber: '',
      email: '',
      mobileNumber: '',
      address: ''
    });
    setActionError('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      companyName: customer.companyName,
      gstNumber: customer.gstNumber || '',
      email: customer.email,
      mobileNumber: customer.mobileNumber,
      address: customer.address
    });
    setActionError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    try {
      let res;
      if (currentCustomer) {
        // Edit Customer
        res = await api.put(`/customers/${currentCustomer.id}`, formData);
      } else {
        // Create Customer
        res = await api.post('/customers', formData);
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setActionError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    setActionError('');

    try {
      const res = await api.delete(`/customers/${id}`);
      if (res.success) {
        fetchCustomers();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Customer Registry</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>View and manage customer accounts details</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={18} />
          <span>New Customer</span>
        </button>
      </div>

      {actionError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
          Loading customers list...
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: 0, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{customer.name}</h3>
                    <p style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: '600' }}>{customer.companyName}</p>
                  </div>
                  {customer.gstNumber && (
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '4px', fontWeight: '700' }}>
                      GST: {customer.gstNumber}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} />
                    <span style={{ wordBreak: 'break-all' }}>{customer.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} />
                    <span>{customer.mobileNumber}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem' }}>{customer.address}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.45rem', justifyContent: 'center' }}
                  onClick={() => openEditModal(customer)}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '0.45rem', justifyContent: 'center' }}
                  onClick={() => handleDelete(customer.id)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          No customers found matching your search.
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCustomer ? 'Edit Customer' : 'Create New Customer'}
      >
        <form onSubmit={handleSubmit}>
          {actionError && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {actionError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g. Acme Corp"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g. 27AAAAA1111A1Z1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-control"
              placeholder="billing@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g. +1 555-0199"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="form-control"
              rows="3"
              placeholder="Enter billing address..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {currentCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
