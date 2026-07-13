import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../App.css';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry"
];

function App() {
  const [formData, setFormData] = useState({
    position: '', name: '', mobile: '', email: '', fromState: '', fromCity: '', basedState: '', basedCity: '',
    workExperienceYears: '', workExperienceMonths: '', currentlyEmployed: '', lastEmployer: '', lastSalary: '',
    expectedSalary: '', joiningDate: '', recentLearning: '', whyHireYou: ''
  });
  
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("Please fill the form completely.");
  const [jwtToken, setJwtToken] = useState(localStorage.getItem('token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Theme Toggle State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (jwtToken) {
      try {
        const decoded = jwtDecode(jwtToken);
        const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        setIsAdmin(role === 'Admin');
      } catch (e) { setIsAdmin(false  ); }
    } else { setIsAdmin(false); }
  }, [jwtToken]);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ mobile: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const roles = ['Sales Executive', 'Support Executive', 'Software Developer'];

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAuthInputChange = (e) => setAuthForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleRoleSelect = (role) => setFormData(prev => ({ ...prev, position: role }));

  const formatEmpty = (val) => (!val || val === '0' || val === 0) ? 'empty' : val.toString();

  const submitApplication = async (tokenToUse = jwtToken) => {
    try {
      const response = await fetch('http://localhost:5086/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenToUse}` },
        body: JSON.stringify({
          position: formData.position, name: formData.name, mobile: formData.mobile, email: formData.email,
          fromState: formData.fromState, fromCity: formData.fromCity, basedState: formData.basedState, basedCity: formData.basedCity,
          workExperienceYears: formatEmpty(formData.workExperienceYears), workExperienceMonths: formatEmpty(formData.workExperienceMonths),
          isCurrentlyEmployed: formData.currentlyEmployed === 'Yes', employer: formData.lastEmployer || 'empty',
          salary: formatEmpty(formData.lastSalary), expectedSalary: formatEmpty(formData.expectedSalary),
          joiningDate: formData.joiningDate, recentLearning: formData.recentLearning || 'empty', whyHireYou: formData.whyHireYou || 'empty'
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else if (response.status === 401) {
        localStorage.removeItem('token'); setJwtToken(null); setIsAuthModalOpen(true);
        setAuthError('Your session expired. Please log in again.');
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      alert('Network error. Is the backend API running?');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.position) {
      setValidationMessage("Please select a Position at the top of the form.");
      setValidationModalOpen(true);
      return;
    }
    
    if (!e.target.checkValidity()) {
      const invalidElement = e.target.querySelector(':invalid');
      if (invalidElement && invalidElement.validationMessage) {
        // e.g. "Value must be less than or equal to 50"
        setValidationMessage(invalidElement.validationMessage);
      } else {
        setValidationMessage("Please fill out all required fields correctly.");
      }
      setValidationModalOpen(true);
      return;
    }
    
    if (!jwtToken) { setAuthMode('login'); setIsAuthModalOpen(true); } else { submitApplication(); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setAuthError('');
    if (authForm.password.length < 8) return setAuthError('Password must be at least 8 characters long.');
    if (!/\d/.test(authForm.password)) return setAuthError('Password must contain at least one number.');
    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) return setAuthError('Passwords do not match.');

    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:5086${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: authForm.mobile, password: authForm.password })
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        localStorage.setItem('token', token); setJwtToken(token);
        
        try {
          const decoded = jwtDecode(token);
          const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          if (role === 'Admin') { navigate('/admin'); return; }
        } catch(e) {}
        
        setIsAuthModalOpen(false); setAuthForm({ mobile: '', password: '', confirmPassword: '' });
      } else {
        const errData = await response.json();
        setAuthError(errData.message || 'Authentication failed.');
      }
    } catch (error) { setAuthError('Network error connecting to backend.'); }
  };

  const logout = () => { localStorage.removeItem('token'); setJwtToken(null); };

  if (submitted) {
    return (
      <div className="app-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying. We will get back to you shortly.</p>
          <button className="submit-btn" onClick={() => setSubmitted(false)}>Submit Another Application</button>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          {isAdmin && (
            <button className="chip active" style={{ padding: '8px 16px', marginRight: '16px' }} onClick={() => navigate('/admin')}>
              Dashboard
            </button>
          )}
          {jwtToken ? (
            <button className="chip btn-secondary" onClick={logout}>Logout</button>
          ) : (
            <button className="chip btn-secondary" onClick={() => setIsAuthModalOpen(true)}>Login / Sign Up</button>
          )}
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
        <div className="header">
          <div className="logo-container">
            <img src="/logo.jpg" alt="Biziverse Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1>Join Our Team</h1>
          <p>Apply to join our fast-growing company!</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          
          <div className="form-group">
            <label className="form-label">Position</label>
            <div className="chips-container">
              {roles.map(role => (
                <button type="button" key={role} className={`chip ${formData.position === role ? 'active' : ''}`} onClick={() => handleRoleSelect(role)}>
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Your Name</label>
              <input type="text" name="name" className="form-control" placeholder="Enter your name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-col"></div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Mobile Number</label>
              <input type="tel" name="mobile" className="form-control" pattern="[0-9]{10}" maxLength="10" title="Please enter a 10 digit mobile number" value={formData.mobile} onChange={handleInputChange} required />
            </div>
            <div className="form-col">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-control" placeholder="Enter your email" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Where are you from?</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select name="fromState" className="form-control" value={formData.fromState} onChange={handleInputChange} required>
                  <option value="" disabled>Select State</option>
                  {indianStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
                <input type="text" name="fromCity" className="form-control" placeholder="Enter City" value={formData.fromCity} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">Where are you currently based?</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select name="basedState" className="form-control" value={formData.basedState} onChange={handleInputChange} required>
                  <option value="" disabled>Select State</option>
                  {indianStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
                <input type="text" name="basedCity" className="form-control" placeholder="Enter City" value={formData.basedCity} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          <div className="form-row" style={{ gap: '40px' }}>
            <div className="form-col">
              <label className="form-label">Work Experience</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" name="workExperienceYears" className="form-control" style={{ width: '100px' }} min="0" max="100" value={formData.workExperienceYears} onChange={handleInputChange} required />
                <span className="input-suffix">years</span>
                <input type="number" name="workExperienceMonths" className="form-control" style={{ width: '100px' }} min="0" max="11" value={formData.workExperienceMonths} onChange={handleInputChange} required />
                <span className="input-suffix">months</span>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">Currently Employed?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="currentlyEmployed" value="Yes" checked={formData.currentlyEmployed === 'Yes'} onChange={handleInputChange} required /> Yes
                </label>
                <label className="radio-label">
                  <input type="radio" name="currentlyEmployed" value="No" checked={formData.currentlyEmployed === 'No'} onChange={handleInputChange} required /> No
                </label>
              </div>
            </div>
          </div>

          {(formData.currentlyEmployed === 'Yes' || formData.currentlyEmployed === 'No') && (
            <div className="form-row" style={{ gap: '40px' }}>
              <div className="form-col">
                <label className="form-label">{formData.currentlyEmployed === 'No' ? 'Last Employer' : 'Current Employer'}</label>
                <input type="text" name="lastEmployer" className="form-control" value={formData.lastEmployer} onChange={handleInputChange} />
              </div>
              <div className="form-col">
                <label className="form-label">{formData.currentlyEmployed === 'No' ? 'Last Salary' : 'Current Salary'} (Monthly)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="input-prefix">₹</span>
                  <input type="number" name="lastSalary" className="form-control" min="0" value={formData.lastSalary} onChange={handleInputChange} />
                  <span className="input-suffix">/ month</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-row" style={{ gap: '40px' }}>
            <div className="form-col">
              <label className="form-label">Expected Salary</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="input-prefix">₹</span>
                <input type="number" name="expectedSalary" className="form-control" style={{ width: '150px' }} min="0" value={formData.expectedSalary} onChange={handleInputChange} required />
                <span className="input-suffix">/ month</span>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">If selected, when can you join?</label>
              <input type="date" name="joiningDate" className="form-control" value={formData.joiningDate} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tell us something that you learned on your own in the last month.</label>
            <input type="text" name="recentLearning" className="form-control" maxLength="10000" value={formData.recentLearning} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Why should we hire you?</label>
            <input type="text" name="whyHireYou" className="form-control" maxLength="10000" value={formData.whyHireYou} onChange={handleInputChange} required />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <button type="submit" className="submit-btn">
              {jwtToken ? 'Submit' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {isAuthModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-modal">
            <button className="close-btn" onClick={() => setIsAuthModalOpen(false)}>&times;</button>
            <div className="modal-header">
              <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
              <p>{authMode === 'login' ? 'Log in with your mobile number to submit.' : 'Sign up to submit your application.'}</p>
            </div>

            {authError && <div className="error-msg">{authError}</div>}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="tel" name="mobile" className="form-control" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={authForm.mobile} onChange={handleAuthInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-control" placeholder="At least 8 chars, 1 number" value={authForm.password} onChange={handleAuthInputChange} required />
              </div>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" name="confirmPassword" className="form-control" placeholder="Confirm your password" value={authForm.confirmPassword} onChange={handleAuthInputChange} required />
                </div>
              )}
              <button type="submit" className="submit-btn">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-toggle">
              {authMode === 'login' ? (
                <>Don't have an account? <span onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Sign Up</span></>
              ) : (
                <>Already have an account? <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Login</span></>
              )}
            </div>
          </div>
        </div>
      )}
      {validationModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setValidationModalOpen(false)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 15px 0', fontWeight: '400', fontSize: '20px', color: '#333' }}>Biziverse</h3>
            <p style={{ margin: '0 0 25px 0', color: '#333', fontSize: '15px' }}>{validationMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setValidationModalOpen(false)}
                style={{ background: '#e9ecef', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#333', cursor: 'pointer', fontSize: '14px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;