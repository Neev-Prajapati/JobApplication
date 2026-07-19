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

const CHARACTER_LIMITS = {
  name: 50,
  lastEmployer: 80,
  recentLearning: 500,
  whyHireYou: 500
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
  
  // Set theme to light always
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const filtered = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, mobile: filtered }));
      return;
    }
    if (name === 'expectedSalary') {
      const filtered = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, expectedSalary: filtered }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const filtered = value.replace(/[^0-9]/g, '');
      setAuthForm(prev => ({ ...prev, mobile: filtered }));
      return;
    }
    setAuthForm(prev => ({ ...prev, [name]: value }));
  };

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
          workExperienceYears: formatEmpty(formData.workExperienceYears), workExperienceMonths: (!formData.workExperienceMonths || formData.workExperienceMonths === '0') ? '0' : formData.workExperienceMonths.toString(),
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

    if ((formData.name || '').length > CHARACTER_LIMITS.name) {
      setValidationMessage(`Name cannot exceed ${CHARACTER_LIMITS.name} characters.`);
      setValidationModalOpen(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setValidationMessage("Please enter a valid Email");
      setValidationModalOpen(true);
      return;
    }

    if (formData.lastEmployer && (formData.lastEmployer || '').length > CHARACTER_LIMITS.lastEmployer) {
      setValidationMessage(`Employer name cannot exceed ${CHARACTER_LIMITS.lastEmployer} characters.`);
      setValidationModalOpen(true);
      return;
    }

    if (!/^\d{1,10}$/.test(formData.expectedSalary)) {
      setValidationMessage("Expected salary must be only digits and maximum 10 digits.");
      setValidationModalOpen(true);
      return;
    }

    const todayStr = getTodayDateString();
    if (formData.joiningDate && formData.joiningDate < todayStr) {
      setValidationMessage("Joining date cannot be in the past.");
      setValidationModalOpen(true);
      return;
    }

    if ((formData.recentLearning || '').length > CHARACTER_LIMITS.recentLearning) {
      setValidationMessage(`Past Projects / Recent Learning response cannot exceed ${CHARACTER_LIMITS.recentLearning} characters.`);
      setValidationModalOpen(true);
      return;
    }

    if ((formData.whyHireYou || '').length > CHARACTER_LIMITS.whyHireYou) {
      setValidationMessage(`'Why should we hire you?' response cannot exceed ${CHARACTER_LIMITS.whyHireYou} characters.`);
      setValidationModalOpen(true);
      return;
    }
    
    if (!e.target.checkValidity()) {
      const invalidElement = e.target.querySelector(':invalid');
      if (invalidElement && invalidElement.validationMessage) {
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
          if (role === 'Admin') { 
            navigate('/admin'); 
            return; 
          } else {
            navigate('/dashboard');
            return;
          }
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
          <button 
            className="submit-btn" 
            style={{ margin: '20px auto 0 auto' }} 
            onClick={() => {
              setFormData({
                position: '', name: '', mobile: '', email: '', fromState: '', fromCity: '', basedState: '', basedCity: '',
                workExperienceYears: '', workExperienceMonths: '', currentlyEmployed: '', lastEmployer: '', lastSalary: '',
                expectedSalary: '', joiningDate: '', recentLearning: '', whyHireYou: ''
              });
              setSubmitted(false);
            }}
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
          {isAdmin && (
            <button className="chip active" style={{ padding: '8px 16px', backgroundColor: '#bf5700', color: '#ffffff' }} onClick={() => navigate('/admin')}>
              Admin Dashboard
            </button>
          )}
          {jwtToken && (
            <button className="chip active" style={{ padding: '8px 16px' }} onClick={() => navigate('/dashboard')}>
              User Dashboard
            </button>
          )}
          {jwtToken ? (
            <button className="chip btn-secondary" onClick={logout}>Logout</button>
          ) : (
            <button className="chip btn-secondary" onClick={() => setIsAuthModalOpen(true)}>Login / Sign Up</button>
          )}
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
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  placeholder="Enter your name" 
                  maxLength={CHARACTER_LIMITS.name}
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  style={{ paddingRight: '70px' }}
                />
                <span style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  bottom: '8px', 
                  fontSize: '10px', 
                  color: '#888',
                  pointerEvents: 'none',
                  backgroundColor: '#fff',
                  padding: '0 2px',
                  lineHeight: '1'
                }}>
                  {(formData.name || '').length}/{CHARACTER_LIMITS.name}
                </span>
              </div>
            </div>
            <div className="form-col"></div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Mobile Number</label>
              <input 
                type="text" 
                name="mobile" 
                className="form-control" 
                pattern="[0-9]{10}" 
                maxLength="10" 
                placeholder="e.g. 9876543210"
                title="Please enter a 10 digit mobile number" 
                value={formData.mobile} 
                onChange={handleInputChange} 
                required 
              />
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
                <input type="number" name="workExperienceMonths" className="form-control" style={{ width: '100px' }} min="0" max="11" value={formData.workExperienceMonths} onChange={handleInputChange} />
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="lastEmployer" 
                    className="form-control" 
                    placeholder="Enter employer name" 
                    maxLength={CHARACTER_LIMITS.lastEmployer}
                    value={formData.lastEmployer || ''} 
                    onChange={handleInputChange} 
                    style={{ paddingRight: '70px' }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    bottom: '8px', 
                    fontSize: '10px', 
                    color: '#888',
                    pointerEvents: 'none',
                    backgroundColor: '#fff',
                    padding: '0 2px',
                    lineHeight: '1'
                  }}>
                    {(formData.lastEmployer || '').length}/{CHARACTER_LIMITS.lastEmployer}
                  </span>
                </div>
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
                <input 
                  type="text" 
                  name="expectedSalary" 
                  className="form-control" 
                  style={{ width: '150px' }} 
                  pattern="[0-9]{1,10}" 
                  value={formData.expectedSalary} 
                  onChange={handleInputChange} 
                  required 
                />
                <span className="input-suffix">/ month</span>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">If selected, when can you join?</label>
              <input 
                type="date" 
                name="joiningDate" 
                className="form-control" 
                min={getTodayDateString()} 
                value={formData.joiningDate} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Past Projects / Tell us something that you learned on your own in the last month.</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                name="recentLearning" 
                className="form-control" 
                placeholder="Describe your past projects or recent learning..." 
                maxLength={CHARACTER_LIMITS.recentLearning}
                value={formData.recentLearning} 
                onChange={handleInputChange} 
                required 
                style={{ paddingRight: '70px' }}
              />
              <span style={{ 
                position: 'absolute', 
                right: '12px', 
                bottom: '8px', 
                fontSize: '10px', 
                color: '#888',
                pointerEvents: 'none',
                backgroundColor: '#fff',
                padding: '0 2px',
                lineHeight: '1'
              }}>
                {(formData.recentLearning || '').length}/{CHARACTER_LIMITS.recentLearning}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Why should we hire you?</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                name="whyHireYou" 
                className="form-control" 
                placeholder="Explain why we should hire you..." 
                maxLength={CHARACTER_LIMITS.whyHireYou}
                value={formData.whyHireYou} 
                onChange={handleInputChange} 
                required 
                style={{ paddingRight: '70px' }}
              />
              <span style={{ 
                position: 'absolute', 
                right: '12px', 
                bottom: '8px', 
                fontSize: '10px', 
                color: '#888',
                pointerEvents: 'none',
                backgroundColor: '#fff',
                padding: '0 2px',
                lineHeight: '1'
              }}>
                {(formData.whyHireYou || '').length}/{CHARACTER_LIMITS.whyHireYou}
              </span>
            </div>
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
                <input 
                  type="text" 
                  name="mobile" 
                  className="form-control" 
                  pattern="[0-9]{10}" 
                  maxLength="10" 
                  placeholder="e.g. 9876543210" 
                  title="Please enter a 10 digit mobile number"
                  value={authForm.mobile} 
                  onChange={handleAuthInputChange} 
                  required 
                />
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