import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import MetricCard from '../components/MetricCard';
import { InvoiceStatusDonut } from '../components/CustomCharts';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ height: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', width: '200px', animation: 'fadeIn 1s infinite alternate' }}></div>
        <div className="metrics-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ height: '120px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', animation: 'fadeIn 1s infinite alternate' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h3>{error}</h3>
      </div>
    );
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="dashboard-header-title">
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Financial Overview</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Welcome to your workspace insights</p>
        </div>
        <div className="dashboard-date" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
          <Calendar size={16} />
          <span>{currentDateStr}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <Link to="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MetricCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            color="purple" 
            icon={Users} 
          />
        </Link>
        <Link to="/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MetricCard 
            title="Total Invoices" 
            value={stats.totalInvoices} 
            color="blue" 
            icon={FileText} 
          />
        </Link>
        <Link to="/payments" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MetricCard 
            title="Total Revenue" 
            value={formatCurrency(stats.totalRevenue)} 
            color="green" 
            icon={DollarSign} 
          />
        </Link>
        <Link to="/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MetricCard 
            title="Outstanding Balance" 
            value={formatCurrency(stats.outstandingAmount)} 
            color={stats.outstandingAmount > 0 ? 'orange' : 'green'} 
            icon={Clock} 
          />
        </Link>
      </div>

      {/* Main dashboard visual segments */}
      <div className="dashboard-grid">
        {/* Left Side: Recent Payments */}
        <div className="card dashboard-payments-card">
          <h3 className="card-title">
            <TrendingUp size={18} color="#10b981" />
            <span>Recent Payments</span>
          </h3>
          {stats.recentPayments && stats.recentPayments.length > 0 ? (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{payment.paymentDate}</td>
                      <td style={{ fontWeight: '700', color: '#7c3aed' }}>
                        {payment.Invoice ? payment.Invoice.invoiceNumber : 'N/A'}
                      </td>
                      <td>
                        {payment.Invoice && payment.Invoice.Customer ? payment.Invoice.Customer.name : 'N/A'}
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {formatCurrency(payment.amountPaid)}
                      </td>
                      <td>{payment.paymentMethod}</td>
                      <td>
                        <span className={`badge badge-${payment.paymentStatus.toLowerCase()}`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              No payments recorded yet.
            </div>
          )}
        </div>

        {/* Right Side: Invoice breakdown status donut chart */}
        <div className="card dashboard-statuses-card">
          <h3 className="card-title">
            <FileText size={18} color="#3b82f6" />
            <span>Invoice Statuses</span>
          </h3>
          <InvoiceStatusDonut statusCounts={stats.statusCounts} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
