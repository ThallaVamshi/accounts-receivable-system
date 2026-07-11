import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  LogOut,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isHidden }) => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${isHidden ? 'hidden' : ''}`}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="sidebar-brand">
          <TrendingUp size={24} color="#7c3aed" />
          <span>Geeth Accounts</span>
        </div>
      </Link>

      <nav className="sidebar-menu">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <NavLink 
                to={link.to} 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={toggleSidebar}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>{user?.email}</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
