import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Set theme to light always
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  // Filtering
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Details Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  const updateStatus = async (id, newStatus, newNotes) => {
    setStatusUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5086/api/application/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, adminNotes: newNotes })
      });
      
      if (!response.ok) throw new Error('Failed to update status/notes');
      
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus, adminNotes: newNotes } : app));
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus, adminNotes: newNotes });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const requestDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5086/api/application/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete application');
      
      setApplications(prev => prev.filter(app => app.id !== deleteTargetId));
      setIsModalOpen(false);
      setSelectedApp(null);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openDetails = (app) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const saveChangesAndClose = async () => {
    if (!selectedApp) return;
    
    const originalApp = applications.find(a => a.id === selectedApp.id);
    if (originalApp && (originalApp.status !== selectedApp.status || originalApp.adminNotes !== selectedApp.adminNotes)) {
      await updateStatus(selectedApp.id, selectedApp.status, selectedApp.adminNotes);
    }
    
    setIsModalOpen(false);
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'Shortlisted': return { bg: 'rgba(22, 163, 74, 0.15)', text: '#10b981', dot: '#10b981' };
      case 'Rejected': return { bg: 'rgba(220, 38, 38, 0.15)', text: '#ef4444', dot: '#ef4444' };
      case 'Reviewed': return { bg: 'rgba(191, 87, 0, 0.15)', text: '#bf5700', dot: '#bf5700' };
      default: return { bg: 'rgba(115, 115, 115, 0.15)', text: '#737373', dot: '#737373' };
    }
  };

  const renderExperience = (years, months, format = 'short') => {
    const isYEmpty = !years || years === '0' || String(years).toLowerCase() === 'empty';
    const cleanMonths = (!months || String(months).toLowerCase() === 'empty' || months === 'null') ? '0' : String(months);
    
    if (isYEmpty && cleanMonths === '0') return 'None';
    
    if (format === 'short') {
      const yStr = isYEmpty ? '' : `${years}y`;
      const mStr = `${cleanMonths}m`;
      return [yStr, mStr].filter(Boolean).join(' ');
    } else {
      const yStr = isYEmpty ? '' : `${years} Years`;
      const mStr = `${cleanMonths} Months`;
      return [yStr, mStr].filter(Boolean).join(', ');
    }
  };

  const filteredApps = applications.filter(app => filterStatus === 'All' || app.status === filterStatus);
  const tabs = ['All', 'Raw', 'Reviewed', 'Shortlisted', 'Rejected'];
  const relatedApps = selectedApp ? applications.filter(app => app.mobile === selectedApp.mobile) : [];
  const originalApp = selectedApp ? applications.find(a => a.id === selectedApp.id) : null;
  const displayStatus = originalApp ? originalApp.status : (selectedApp ? selectedApp.status : 'Raw');

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bf5700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '15px'}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Admin Dashboard
        </h1>
        <div className="dashboard-actions">
          <button className="chip btn-secondary" style={{ padding: '10px 20px', margin: 0 }} onClick={() => navigate('/')}>
            Return to Website
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
              border: filterStatus === tab ? '1px solid rgba(191, 87, 0, 0.5)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              backgroundColor: filterStatus === tab ? 'rgba(191, 87, 0, 0.1)' : 'var(--code-bg)',
              color: filterStatus === tab ? '#bf5700' : 'var(--text)',
              transition: 'all 0.2s ease',
              boxShadow: filterStatus === tab ? '0 0 15px rgba(191, 87, 0, 0.15)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="status-dot" style={{ backgroundColor: '#bf5700', transform: 'scale(1.5)' }}></div>
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
                  Name
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  Position
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  Experience
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  Status
                </th>
                <th style={{ padding: '20px 30px', color: 'var(--text)' }}>
                  Date Applied
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.reduce((acc, current) => {
                if (!acc.find(app => app.mobile === current.mobile)) {
                  acc.push(current);
                }
                return acc;
              }, []).map((app, index) => {
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
                    <td style={{ padding: '24px 30px', color: 'var(--text)' }}>{renderExperience(app.workExperienceYears, app.workExperienceMonths, 'short')}</td>
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
                  <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', color: getStatusStyles(displayStatus).text, backgroundColor: getStatusStyles(displayStatus).bg }}>
                    {displayStatus}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => requestDelete(selectedApp.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete Application"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
                
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Close Details"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {relatedApps.length > 1 && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: '#333333', fontSize: '13px' }}>Select Application:</span>
                <select
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--bg)', 
                    color: 'var(--text-h)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  value={selectedApp.id}
                  onChange={(e) => {
                    const nextApp = relatedApps.find(a => a.id === parseInt(e.target.value));
                    if (nextApp) setSelectedApp(nextApp);
                  }}
                >
                  {relatedApps.map((app, idx) => (
                    <option key={app.id} value={app.id}>
                      Application {idx + 1} ({app.position})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Wrapper container for both detail blocks, styled as a box */}
              <div style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '20px', 
                backgroundColor: 'var(--code-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.email}</p></div>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Mobile Number</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.mobile}</p></div>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Current Location</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.basedCity}, {selectedApp.basedState}</p></div>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Hometown</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.fromCity}, {selectedApp.fromState}</p></div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '5px' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Experience</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{renderExperience(selectedApp.workExperienceYears, selectedApp.workExperienceMonths, 'long')}</p></div>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Employment</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.isCurrentlyEmployed ? 'Employed' : 'Unemployed'}</p></div>
                  {(selectedApp.employer && selectedApp.employer !== 'empty') && (
                    <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>{selectedApp.isCurrentlyEmployed ? 'Current' : 'Last'} Employer</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{selectedApp.employer}</p></div>
                  )}
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Current Salary</p><p style={{ margin: 0, fontWeight: '500', color: 'var(--text-h)' }}>{(!selectedApp.salary || selectedApp.salary === 'empty' || selectedApp.salary === '0') ? 'N/A' : `₹${selectedApp.salary} / mo`}</p></div>
                  <div><p style={{ fontSize: '13px', color: '#333333', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>Expected Salary</p><p style={{ margin: 0, fontWeight: 'bold', color: '#bf5700', fontSize: '1.05rem' }}>{(!selectedApp.expectedSalary || selectedApp.expectedSalary === 'empty' || selectedApp.expectedSalary === '0') ? 'N/A' : <span>₹{selectedApp.expectedSalary} <span style={{fontSize:'0.8rem', fontWeight:'normal', color:'var(--text)'}}>/ mo</span></span>}</p></div>
                </div>
              </div>

              {/* Wrapper container for recent learning and why should we hire you, styled as a box */}
              <div style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '20px', 
                backgroundColor: 'var(--code-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#333333', margin: '0 0 8px 0', fontWeight: '600' }}>Recent Learning</p>
                  <div style={{ padding: '16px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-h)', lineHeight: '1.6', fontStyle: 'italic' }}>
                    "{selectedApp.recentLearning}"
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#333333', margin: '0 0 8px 0', fontWeight: '600' }}>Why should we hire you?</p>
                  <div style={{ padding: '16px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-h)', lineHeight: '1.6', fontStyle: 'italic' }}>
                    "{selectedApp.whyHireYou}"
                  </div>
                </div>
              </div>

            </div>

            {/* Status Selection Row */}
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <span style={{ fontWeight: '600', color: 'var(--text)', marginRight: '15px' }}>Status:</span>
              <select 
                style={{ width: 'auto', padding: '10px 14px', backgroundColor: getStatusStyles(selectedApp.status).bg, color: getStatusStyles(selectedApp.status).text, fontWeight: 'bold', cursor: 'pointer', border: `1px solid ${getStatusStyles(selectedApp.status).text}40`, borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                value={selectedApp.status}
                onChange={(e) => setSelectedApp({ ...selectedApp, status: e.target.value })}
                disabled={statusUpdateLoading}
              >
                <option value="Raw" style={{backgroundColor: 'var(--bg)', color: 'var(--text-h)'}}>Raw</option>
                <option value="Reviewed" style={{backgroundColor: 'var(--bg)', color: 'var(--text-h)'}}>Reviewed</option>
                <option value="Shortlisted" style={{backgroundColor: 'var(--bg)', color: 'var(--text-h)'}}>Shortlisted</option>
                <option value="Rejected" style={{backgroundColor: 'var(--bg)', color: 'var(--text-h)'}}>Rejected</option>
              </select>
            </div>

            {/* Admin Notes below status selection */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '13px', color: '#333333', margin: '0 0 8px 0', fontWeight: '600' }}>Admin Notes (Interview / Comments)</p>
              <textarea 
                style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-h)', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                placeholder="Add your notes about this applicant here..."
                value={selectedApp.adminNotes || ''}
                onChange={(e) => setSelectedApp({ ...selectedApp, adminNotes: e.target.value })}
              />
            </div>

            {/* Save Button at the very bottom left */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                onClick={saveChangesAndClose}
                style={{ backgroundColor: '#bf5700', border: 'none', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease', fontSize: '0.9rem' }}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setIsDeleteModalOpen(false)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 15px 0', fontWeight: '400', fontSize: '20px', color: '#333' }}>Biziverse</h3>
            <p style={{ margin: '0 0 25px 0', color: '#333', fontSize: '15px' }}>Are you sure you want to completely delete this application? This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '8px 24px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ padding: '8px 24px', backgroundColor: '#bf5700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
