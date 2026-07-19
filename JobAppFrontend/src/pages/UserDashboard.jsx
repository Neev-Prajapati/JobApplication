import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // Enforce light theme
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const mobile = decoded.unique_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 'Applicant';
      setUserName(mobile);
      
      const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      setIsAdminUser(role === 'Admin');
    } catch (e) {
      navigate('/');
      return;
    }

    fetchMyApplications(token);
  }, [navigate]);

  const fetchMyApplications = async (token) => {
    try {
      const response = await fetch('http://localhost:5086/api/application/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch your applications');
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'Shortlisted': return { bg: 'rgba(22, 163, 74, 0.15)', text: '#10b981' };
      case 'Rejected': return { bg: 'rgba(220, 38, 38, 0.15)', text: '#ef4444' };
      case 'Reviewed': return { bg: 'rgba(191, 87, 0, 0.15)', text: '#bf5700' };
      default: return { bg: 'rgba(115, 115, 115, 0.15)', text: '#737373' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="app-container">
      
      {/* Top Toolbar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
        {isAdminUser && (
          <button className="chip active" style={{ padding: '8px 16px' }} onClick={() => navigate('/admin')}>
            Admin Dashboard
          </button>
        )}
        <button className="chip active" style={{ padding: '8px 16px', backgroundColor: '#bf5700', color: '#ffffff' }} onClick={() => navigate('/')}>
          Apply Again
        </button>
        <button className="chip btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      {/* Header Block matching the main page theme */}
      <div className="header" style={{ marginBottom: '35px' }}>
        <div className="logo-container">
          <img src="/logo.jpg" alt="Biziverse Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h1>Applicant Dashboard</h1>
        <p>Track your submitted applications and their current status</p>
      </div>

      <div style={{ padding: '0 10px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text)' }}>
            <div className="status-dot" style={{ backgroundColor: '#bf5700', transform: 'scale(1.2)', margin: '0 auto 15px auto' }}></div>
            Loading your applications...
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text)', backgroundColor: 'var(--code-bg)' }}>
            <p style={{ margin: '0 0 15px 0' }}>You haven't submitted any job applications yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="submit-btn"
              style={{ maxWidth: '250px', margin: '0 auto' }}
            >
              Create New Application
            </button>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '13px', color: '#333333', margin: '0 0 10px 0', fontWeight: '600', textTransform: 'uppercase' }}>
              Your Submissions ({applications.length})
            </h2>
            
            {applications.map((app) => (
              <div 
                key={app.id} 
                className="details-grid"
                style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text-h)', fontWeight: '600' }}>
                    {app.position}
                  </h3>
                  <div style={{ display: 'flex', gap: '15px', color: 'var(--text)', fontSize: '0.85rem' }}>
                    <span><strong>Applicant:</strong> {app.name}</span>
                    <span>•</span>
                    <span><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div>
                  <span 
                    style={{ 
                      padding: '6px 16px', 
                      borderRadius: '999px', 
                      fontSize: '0.8rem', 
                      fontWeight: '700', 
                      color: getStatusStyles(app.status).text, 
                      backgroundColor: getStatusStyles(app.status).bg 
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
