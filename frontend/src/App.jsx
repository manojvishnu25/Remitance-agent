import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Remittance from './pages/Remittance';
import SendDraft from './pages/SendDraft';
import Goals from './pages/Goals';
import Activity from './pages/Activity';

function Layout({ children, onResetSuccess }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar onResetSuccess={onResetSuccess} />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [resetKey, setResetKey] = useState(0);

  const handleResetSuccess = () => {
    // Re-mount layout content to refresh data from server
    setResetKey((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <Layout key={resetKey} onResetSuccess={handleResetSuccess}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/remittance" element={<Remittance />} />
          <Route path="/send-draft/:id" element={<SendDraft />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
