import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

// Lazy load the AdminDashboard to reduce initial bundle size for regular users
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="status-dot" style={{ backgroundColor: '#bf5700', transform: 'scale(1.5)', marginBottom: '15px' }}></div>
          Loading Application...
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;