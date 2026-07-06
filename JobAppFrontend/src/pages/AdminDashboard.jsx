import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Theme Toggle State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Filtering
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Details Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const decoded = jwtDecode(token);
      const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin') { navigate('/'); return; }
    } catch (e) { navigate('/'); return; }

    fetchApplications(token);
  }, [navigate]);

  const fetchApplications = async (token) => {
    try {
      const response = await fetch('http://localhost:5086/api/application', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5086/api/application/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this application? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5086/api/application/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete application');
      
      setApplications(prev => prev.filter(app => app.id !== id));
      setIsModalOpen(false);
      setSelectedApp(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openDetails = (app) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'Shortlisted': return { bg: 'rgba(22, 163, 74, 0.15)', text: '#10b981', dot: '#10b981' };
      case 'Rejected': return { bg: 'rgba(220, 38, 38, 0.15)', text: '#ef4444', dot: '#ef4444' };
      case 'Reviewed': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', dot: '#3b82f6' };
      default: return { bg: 'rgba(115, 115, 115, 0.15)', text: '#737373', dot: '#737373' };
    }
  };

  const filteredApps = applications.filter(app => filterStatus === 'All' || app.status === filterStatus);
  const tabs = ['All', 'Raw', 'Reviewed', 'Shortlisted', 'Rejected'];

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '15px'}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Admin Dashboard
        </h1>
        <div className="dashboard-actions">
          <button className="chip btn-secondary" style={{ padding: '10px 20px', margin: 0 }} onClick={() => navigate('/')}>
            Return to Website
          </button>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              border: filterStatus === tab ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              backgroundColor: filterStatus === tab ? 'rgba(59, 130, 246, 0.1)' : 'var(--code-bg)',
              color: filterStatus === tab ? '#3b82f6' : 'var(--text)',
              transition: 'all 0.2s ease',
              boxShadow: filterStatus === tab ? '0 0 15px rgba(59, 130, 246, 0.15)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="status-dot" style={{ backgroundColor: '#3b82f6', transform: 'scale(1.5)' }}></div>
          <p style={{ marginTop: '20px', fontSize: '1.1rem', color: 'var(--text)' }}>Loading applications...</p>
        </div>
      ) : error ? (
        <p className="error-msg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '8px', margin: '0 auto', border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: '600px' }}>{error}</p>
      ) : (
        <div className="app-container" style={{ padding: 0, overflowX: 'auto', width: '100%', maxWidth: 'none', margin: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: 'var(--code-bg)' }}>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'text-bottom'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Name
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'text-bottom'}}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  Position
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'text-bottom'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Experience
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'text-bottom'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Status
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'text-bottom'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Date Applied
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app, index) => {
                const styleObj = getStatusStyles(app.status);
                return (
                  <tr 
                    key={app.id} 
                    className="table-row animate-row" 
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', animationDelay: `${index * 0.05}s` }} 
                    onClick={() => openDetails(app)}
                  >
                    <td style={{ padding: '24px 30px', fontWeight: '600', color: 'var(--text-h)', fontSize: '1.05rem' }}>{app.name}</td>
                    <td style={{ padding: '24px 30px', color: 'var(--text)' }}>{app.position}</td>
                    <td style={{ padding: '24px 30px', color: 'var(--text)' }}>{app.workExperienceYears}y {app.workExperienceMonths}m</td>
                    <td style={{ padding: '24px 30px' }}>
                      <span style={{ 
                        padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600',
                        color: styleObj.text, backgroundColor: styleObj.bg, display: 'inline-flex', alignItems: 'center', border: `1px solid ${styleObj.text}30`
                      }}>
                        <span className="status-dot" style={{ backgroundColor: styleObj.dot, marginRight: '6px', width: '5px', height: '5px' }}></span>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '24px 30px', color: 'var(--text)' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '20px', opacity: 0.3}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <br/>
                    <span style={{ fontSize: '1.1rem' }}>No {filterStatus !== 'All' ? filterStatus : ''} applications found.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Centered Details Modal */}
      {isModalOpen && selectedApp && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content dashboard-modal animate-modal" onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: 'var(--text-h)', fontWeight: '700' }}>
                  {selectedApp.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <p style={{ margin: 0, color: 'var(--text)', fontSize: '1.05rem' }}>{selectedApp.position}</p>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', color: getStatusStyles(selectedApp.status).text, backgroundColor: getStatusStyles(selectedApp.status).bg }}>
                    {selectedApp.status}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="details-grid">
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Email Address</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.email}</p></div>
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Mobile Number</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.mobile}</p></div>
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Current Location</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.basedCity}, {selectedApp.basedState}</p></div>
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Hometown</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.fromCity}, {selectedApp.fromState}</p></div>
              </div>

              <div className="details-grid">
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Experience</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.workExperienceYears} Years, {selectedApp.workExperienceMonths} Months</p></div>
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Employment</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.isCurrentlyEmployed ? 'Employed' : 'Unemployed'}</p></div>
                {selectedApp.employer && (
                  <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{selectedApp.isCurrentlyEmployed ? 'Current' : 'Last'} Employer</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.employer}</p></div>
                )}
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Current Salary</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.salary ? `₹${selectedApp.salary} / mo` : 'N/A'}</p></div>
                <div><p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Expected Salary</p><p style={{ margin: 0, fontWeight: 'bold', color: '#3b82f6', fontSize: '1.05rem' }}>₹{selectedApp.expectedSalary} <span style={{fontSize:'0.8rem', fontWeight:'normal', color:'var(--text)'}}>/ mo</span></p></div>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 8px 0', fontWeight: '600' }}>Recent Learning</p>
                <div style={{ padding: '16px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid var(--border)', backgroundColor: 'var(--code-bg)', color: 'var(--text-h)', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{selectedApp.recentLearning}"
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 8px 0', fontWeight: '600' }}>Why should we hire you?</p>
                <div style={{ padding: '16px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid var(--border)', backgroundColor: 'var(--code-bg)', color: 'var(--text-h)', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{selectedApp.whyHireYou}"
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text)', marginRight: '15px' }}>Status:</span>
                <select 
                  style={{ width: 'auto', padding: '10px 14px', backgroundColor: 'var(--code-bg)', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  value={selectedApp.status}
                  onChange={(e) => updateStatus(selectedApp.id, e.target.value)}
                  disabled={statusUpdateLoading}
                >
                  <option value="Raw">Raw</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <button 
                onClick={() => deleteApplication(selectedApp.id)}
                style={{ backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
