import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { MonthlyRevenueChart } from '../components/CustomCharts';
import { 
  BarChart3, 
  UserMinus, 
  Calendar, 
  Download,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('outstanding'); // 'outstanding', 'revenue', 'payments'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Data
  const [outstandingData, setOutstandingData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Payment Filter state
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchOutstandingReport = async () => {
    try {
      const res = await api.get('/reports/outstanding');
      if (res.success) setOutstandingData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load outstanding balance report');
    }
  };

  const fetchRevenueReport = async () => {
    try {
      const res = await api.get('/reports/monthly-revenue');
      if (res.success) setRevenueData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load monthly revenue report');
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      let query = `/reports/payment-history?`;
      if (filterStartDate) query += `startDate=${filterStartDate}&`;
      if (filterEndDate) query += `endDate=${filterEndDate}&`;
      if (filterMethod) query += `paymentMethod=${filterMethod}&`;
      if (filterStatus) query += `paymentStatus=${filterStatus}&`;

      const res = await api.get(query);
      if (res.success) setPaymentHistory(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load payment history report');
    }
  };

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      setError('');
      if (activeTab === 'outstanding') {
        await fetchOutstandingReport();
      } else if (activeTab === 'revenue') {
        await fetchRevenueReport();
      } else if (activeTab === 'payments') {
        await fetchPaymentHistory();
      }
      setLoading(false);
    };

    loadReportData();
  }, [activeTab, filterStartDate, filterEndDate, filterMethod, filterStatus]);

  // Export to CSV helper (convenience for technical interview demo)
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    // Extract headers
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    // Extract row data
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Clean strings and numbers
        const escaped = ('' + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Financial Reports</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>View, filter and audit accounts receivable telemetry</p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Controller */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'outstanding' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('outstanding')}
          style={{ borderRadius: '20px', padding: '0.5rem 1.25rem' }}
        >
          Outstanding Balance
        </button>
        <button 
          className={`btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('revenue')}
          style={{ borderRadius: '20px', padding: '0.5rem 1.25rem' }}
        >
          Monthly Revenue
        </button>
        <button 
          className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
          style={{ borderRadius: '20px', padding: '0.5rem 1.25rem' }}
        >
          Payment History
        </button>
      </div>

      {/* Report Screens */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
          Compiling report telemetry...
        </div>
      ) : (
        <div>
          {/* 1. Customer Outstanding Tab */}
          {activeTab === 'outstanding' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserMinus size={18} color="#f59e0b" />
                  <span>Customer Net Outstanding Balances</span>
                </h3>
                {outstandingData.length > 0 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => exportToCSV(outstandingData, 'customer_outstanding_report')}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>

              {outstandingData.length > 0 ? (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Company Name</th>
                        <th>Total Invoiced</th>
                        <th>Total Cash Paid</th>
                        <th>Net Outstanding Balance</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingData.map((row) => {
                        const outstandingRatio = row.totalInvoiced > 0 ? row.netOutstanding / row.totalInvoiced : 0;
                        let riskBadgeClass = 'badge-paid';
                        let riskLabel = 'Settled';

                        if (row.netOutstanding > 0) {
                          if (outstandingRatio > 0.5) {
                            riskBadgeClass = 'badge-overdue';
                            riskLabel = 'High Debt';
                          } else {
                            riskBadgeClass = 'badge-partially';
                            riskLabel = 'Moderate';
                          }
                        }

                        return (
                          <tr key={row.customerId}>
                            <td style={{ fontWeight: '600' }}>{row.name}</td>
                            <td style={{ color: '#94a3b8' }}>{row.companyName}</td>
                            <td>{formatCurrency(row.totalInvoiced)}</td>
                            <td style={{ color: '#10b981', fontWeight: '600' }}>{formatCurrency(row.totalPaid)}</td>
                            <td style={{ color: row.netOutstanding > 0 ? '#ef4444' : 'inherit', fontWeight: '700' }}>
                              {formatCurrency(row.netOutstanding)}
                            </td>
                            <td>
                              <span className={`badge ${riskBadgeClass}`}>
                                {riskLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>No customer balance logs found.</p>
              )}
            </div>
          )}

          {/* 2. Monthly Revenue Chart Tab */}
          {activeTab === 'revenue' && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#3b82f6" />
                <span>Monthly Invoicing vs Collected Revenue</span>
              </h3>
              <MonthlyRevenueChart data={revenueData} />
            </div>
          )}

          {/* 3. Detailed Payment Auditor Logs */}
          {activeTab === 'payments' && (
            <div>
              {/* Filter controls */}
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={filterStartDate}
                      onChange={e => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">End Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={filterEndDate}
                      onChange={e => setFilterEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Method</label>
                    <select 
                      className="form-control"
                      value={filterMethod}
                      onChange={e => setFilterMethod(e.target.value)}
                    >
                      <option value="">All Methods</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Payment Status</label>
                    <select 
                      className="form-control"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Captured">Captured</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="#10b981" />
                    <span>Captured Payment Records Ledger</span>
                  </h3>
                  {paymentHistory.length > 0 && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => exportToCSV(paymentHistory, 'payment_history_report')}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>

                {paymentHistory.length > 0 ? (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Payment Date</th>
                          <th>Invoice #</th>
                          <th>Customer</th>
                          <th>Company</th>
                          <th>Method</th>
                          <th>Txn Reference</th>
                          <th>Amount Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.paymentDate}</td>
                            <td style={{ fontWeight: '700', color: '#7c3aed' }}>{row.invoiceNumber}</td>
                            <td style={{ fontWeight: '600' }}>{row.customerName}</td>
                            <td>{row.companyName}</td>
                            <td>{row.paymentMethod}</td>
                            <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{row.referenceNumber || 'N/A'}</td>
                            <td style={{ fontWeight: '700' }}>{formatCurrency(row.amountPaid)}</td>
                            <td>
                              <span className={`badge badge-${row.paymentStatus.toLowerCase()}`}>
                                {row.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>No payments matched the selected filters.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
