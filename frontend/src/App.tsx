import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';

import { Students } from './pages/Students.js';
import { Companies } from './pages/Companies.js';
import { CompanyApprovals } from './pages/CompanyApprovals.js';
import { PlacementDrives } from './pages/PlacementDrives.js';
import { PlacementTeam } from './pages/PlacementTeam.js';
import { Offers } from './pages/Offers.js';
import { Reports } from './pages/Reports.js';
import { AuditLogs } from './pages/AuditLogs.js';
import { AtsCandidates } from './pages/AtsCandidates.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Layout wrapper for all protected portal paths
const Layout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-brand-rosy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-darker">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Route guard checking role access parameters
const RoleRoute: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen bg-brand-darker flex items-center justify-center p-8 text-center">
    <div className="glass-panel p-8 max-w-sm">
      <h3 className="text-xl font-bold text-red-400">403 — Unauthorized</h3>
      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        Your role credentials do not permit you to access this page. If you believe this is in error, contact your administrator.
      </p>
      <a
        href="/dashboard"
        className="mt-6 inline-block bg-brand-cocoa text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-brand-rosy hover:text-brand-black transition-all"
      >
        Return to Dashboard
      </a>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#231515',
                color: '#ffffff',
                border: '1px solid rgba(175, 96, 96, 0.4)',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#34d399',
                  secondary: '#1c1313',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#1c1313',
                },
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Portal Routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/drives" element={<PlacementDrives />} />
                <Route path="/drives/:driveId/ats" element={<AtsCandidates />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/reports" element={<Reports />} />

                {/* Admin & Manager Only */}
                <Route element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                  <Route path="/team" element={<PlacementTeam />} />
                </Route>

                {/* Admin Only Paths */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/company-approvals" element={<CompanyApprovals />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
