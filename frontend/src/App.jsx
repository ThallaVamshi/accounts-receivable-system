import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import { Menu } from 'lucide-react';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarMode = () => {
    if (window.innerWidth <= 991) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: '#64748b' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebarMode} isHidden={sidebarCollapsed} />
      
      <div className={`main-layout ${sidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
        {/* Mobile Header Bar */}
        <header className="app-header no-print">
          <button className="hamburger" onClick={toggleSidebarMode}>
            <Menu size={24} />
          </button>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>
            Geeth Accounts Workspace
          </div>
        </header>

        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        Loading session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <AuthRoute>
            <AuthPage />
          </AuthRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedLayout>
            <Customers />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/invoices" 
        element={
          <ProtectedLayout>
            <Invoices />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/invoices/:id" 
        element={
          <ProtectedLayout>
            <InvoiceDetail />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedLayout>
            <Payments />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        } 
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
