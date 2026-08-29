import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      // Redirect dynamically based on role after login is resolved
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background abstract gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cocoa rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-rosy rounded-full blur-3xl opacity-10" />

      {/* Login Card Panel */}
      <div className="w-full max-w-md p-8 glass-panel z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-dark flex items-center justify-center p-1 border border-brand-cocoa border-opacity-35 mx-auto mb-4 shadow-xl">
            <img src="/logo.png" alt="CareerSync Logo" className="w-full h-full object-contain filter invert" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">CareerSync</h2>
          <p className="text-xs text-brand-rosy font-medium mt-1 tracking-widest uppercase">Institutional Gate 2.0</p>
        </div>

        {/* Credentials Error Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 bg-opacity-40 border border-red-900 rounded-lg text-red-200 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="staff@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-40 rounded-lg py-2.5 px-4 pl-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-rosy focus:ring-1 focus:ring-brand-rosy transition-all"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-40 rounded-lg py-2.5 px-4 pl-11 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-rosy focus:ring-1 focus:ring-brand-rosy transition-all"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-gray-300">
              <input type="checkbox" className="rounded bg-brand-dark border-brand-cocoa text-brand-rosy focus:ring-0" />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:text-brand-rosy transition-colors">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-3 rounded-lg text-sm font-bold tracking-wider transition-all duration-300 shadow-lg hover:shadow-brand-rosy hover:shadow-opacity-20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Verify & Authenticate</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Drawer helper */}
        <div className="mt-8 pt-6 border-t border-brand-cocoa border-opacity-20 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">Development Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold tracking-wide">
            <div className="p-2 rounded bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-10">
              <div className="text-brand-rosy uppercase">Admin</div>
              <div className="text-gray-500 mt-1 truncate">admin@example.com</div>
              <div className="text-gray-600 font-mono">admin123</div>
            </div>
            <div className="p-2 rounded bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-10">
              <div className="text-brand-rosy uppercase">Manager</div>
              <div className="text-gray-500 mt-1 truncate">manager@example.com</div>
              <div className="text-gray-600 font-mono">manager123</div>
            </div>
            <div className="p-2 rounded bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-10">
              <div className="text-brand-rosy uppercase">Team</div>
              <div className="text-gray-500 mt-1 truncate">placement@example.com</div>
              <div className="text-gray-600 font-mono">placement123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
