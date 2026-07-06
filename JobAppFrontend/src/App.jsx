import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    position: '',
    name: '',
    mobile: '',
    email: '',
    fromState: '',
    fromCity: '',
    basedState: '',
    basedCity: '',
    workExperienceYears: '',
    workExperienceMonths: '',
    currentlyEmployed: '',
    lastEmployer: '',
    lastSalary: '',
    expectedSalary: '',
    joiningDate: '',
    recentLearning: '',
    whyHireYou: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  // Auth State
  const [jwtToken, setJwtToken] = useState(localStorage.getItem('token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ mobile: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const roles = [
    'Software Developer',
    'Sales Executive',
    'Digital Marketing',
    'Customer Support',
    'HR Manager'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      position: role
    }));
  };

  const submitApplication = async (tokenToUse = jwtToken) => {
    try {
      const response = await fetch('http://localhost:5086/api/application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToUse}`
        },
        body: JSON.stringify({
          position: formData.position,
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          fromState: formData.fromState,
          fromCity: formData.fromCity,
          basedState: formData.basedState,
          basedCity: formData.basedCity,
          workExperienceYears: parseInt(formData.workExperienceYears) || 0,
          workExperienceMonths: parseInt(formData.workExperienceMonths) || 0,
          isCurrentlyEmployed: formData.currentlyEmployed === 'Yes',
          employer: formData.lastEmployer || null,
          salary: parseFloat(formData.lastSalary) || null,
          expectedSalary: parseFloat(formData.expectedSalary) || null,
          joiningDate: formData.joiningDate,
          recentLearning: formData.recentLearning,
          whyHireYou: formData.whyHireYou
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        setJwtToken(null);
        setIsAuthModalOpen(true);
        setAuthError('Your session expired. Please log in again.');
      } else {
        const err = await response.text();
        console.error('Failed to submit application:', err);
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Network error. Is the backend API running?');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jwtToken) {
      // User is not logged in, pop up the Auth Modal!
      setAuthMode('login');
      setIsAuthModalOpen(true);
    } else {
      // User is logged in, proceed smoothly
      submitApplication();
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Specific password rules validation
    if (authForm.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (!/\d/.test(authForm.password)) {
      setAuthError('Password must contain at least one number.');
      return;
    }

    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:5086${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: authForm.mobile,
          password: authForm.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Assume backend returns { token: 'jwt_string' }
        const token = data.token;
        localStorage.setItem('token', token);
        setJwtToken(token);
        setIsAuthModalOpen(false);
        setAuthForm({ mobile: '', password: '', confirmPassword: '' });
        
        // We will just close the modal and let the user click "Submit Application" 
        // when they have finished filling out the rest of the form!
      } else {
        const errData = await response.json();
        setAuthError(errData.message || 'Authentication failed.');
      }
    } catch (error) {
      console.error('Auth Error:', error);
      setAuthError('Network error connecting to backend.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setJwtToken(null);
  };

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
        <div style={{textAlign: 'right'}}>
          {jwtToken ? (
            <button className="chip active" onClick={logout}>Logout</button>
          ) : (
            <button className="chip" onClick={() => setIsAuthModalOpen(true)}>Login / Sign Up</button>
          )}
        </div>
        <div className="header">
          <div className="logo-container">
            {/* Random Minimalist Logo (SVG) */}
            <svg className="logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>
          </div>
          <h1>Join Our Team</h1>
          <p>Apply to join our fast-growing company!</p>
        </div>
        <form onSubmit={handleSubmit}>
          
          {/* Position */}
          <div className="form-group">
            <label className="form-label">Position *</label>
            <div className="chips-container">
              {roles.map(role => (
                <button
                  type="button"
                  key={role}
                  className={`chip ${formData.position === role ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Details */}
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Your Name *</label>
              <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Mobile Number *</label>
              <input type="tel" name="mobile" className="form-control" pattern="[0-9]{10}" title="Please enter a 10 digit mobile number" value={formData.mobile} onChange={handleInputChange} required />
            </div>
            <div className="form-col">
              <label className="form-label">Email Address *</label>
              <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Location */}
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Where are you from? *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="fromState" className="form-control" placeholder="State" value={formData.fromState} onChange={handleInputChange} required />
                <input type="text" name="fromCity" className="form-control" placeholder="City" value={formData.fromCity} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">Where are you currently based? *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="basedState" className="form-control" placeholder="State" value={formData.basedState} onChange={handleInputChange} required />
                <input type="text" name="basedCity" className="form-control" placeholder="City" value={formData.basedCity} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="form-row" style={{ gap: '40px' }}>
            <div className="form-col">
              <label className="form-label">Work Experience *</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" name="workExperienceYears" className="form-control" placeholder="Years" min="0" max="50" value={formData.workExperienceYears} onChange={handleInputChange} required />
                <span className="input-suffix">years</span>
                <input type="number" name="workExperienceMonths" className="form-control" placeholder="Months" min="0" max="11" value={formData.workExperienceMonths} onChange={handleInputChange} required />
                <span className="input-suffix">months</span>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">Currently Employed? *</label>
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

          {/* Dynamic Fields based on Employment */}
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

          {/* Expectations */}
          <div className="form-row" style={{ gap: '40px' }}>
            <div className="form-col">
              <label className="form-label">Expected Salary (Monthly) *</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="input-prefix">₹</span>
                <input type="number" name="expectedSalary" className="form-control" min="0" value={formData.expectedSalary} onChange={handleInputChange} required />
                <span className="input-suffix">/ month</span>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label">If selected, when can you join? *</label>
              <input type="date" name="joiningDate" className="form-control" value={formData.joiningDate} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Subjective Questions */}
          <div className="form-group">
            <label className="form-label">Tell us something that you learned on your own in the last month. *</label>
            <textarea name="recentLearning" className="form-control" maxLength="200" value={formData.recentLearning} onChange={handleInputChange} required></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Why should we hire you? *</label>
            <textarea name="whyHireYou" className="form-control" maxLength="200" value={formData.whyHireYou} onChange={handleInputChange} required></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={!formData.position}>
            {jwtToken ? 'Submit Application' : 'Login to Submit Application'}
          </button>
        </form>
      </div>

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setIsAuthModalOpen(false)}>&times;</button>
            <div className="modal-header">
              <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
              <p>{authMode === 'login' ? 'Log in with your mobile number to submit.' : 'Sign up to submit your application.'}</p>
            </div>

            {authError && <div className="error-msg">{authError}</div>}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="tel" name="mobile" className="form-control" pattern="[0-9]{10}" placeholder="10-digit number" value={authForm.mobile} onChange={handleAuthInputChange} required />
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
    </>
  );
}

export default App;