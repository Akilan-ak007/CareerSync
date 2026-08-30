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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="rgu-gradient-bar w-full absolute top-0 left-0 z-50"></div>
      
      {/* Background abstract gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />

      {/* Login Card Panel */}
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 animate-fade-in relative">
        {/* RGU Brand Banner Header */}
        <div className="text-center mb-8">
          <img 
            src="/rgu-banner-logo.png" 
            alt="Rathinam Global University" 
            className="h-12 mx-auto mb-4 object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">CAREERSYNC RGU</h2>
          <p className="text-xs text-purple-800 font-extrabold mt-0.5 tracking-wider uppercase">PLACEMENT MANAGEMENT PORTAL</p>
        </div>

        {/* Credentials Error Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Institutional Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="staff@rathinam.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-11 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Account Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-11 pr-11 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-1">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-900">
              <input type="checkbox" className="rounded border-slate-300 text-purple-700 focus:ring-purple-500" />
              <span>Keep Session Active</span>
            </label>
            <a href="#" className="text-purple-800 hover:text-purple-950 font-bold transition-colors">Help desk?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl text-xs font-extrabold tracking-wider transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>VERIFY & AUTHENTICATE</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Drawer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-3">Pre-Configured Staff Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-[9px] font-bold">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-left">
              <div className="text-purple-900 font-extrabold uppercase">Admin</div>
              <div className="text-slate-700 mt-1 truncate">admin@example.com</div>
              <div className="text-purple-700 font-mono">admin123</div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-left">
              <div className="text-sky-900 font-extrabold uppercase">Manager</div>
              <div className="text-slate-700 mt-1 truncate">manager@example.com</div>
              <div className="text-sky-700 font-mono">manager123</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left">
              <div className="text-emerald-900 font-extrabold uppercase">Team</div>
              <div className="text-slate-700 mt-1 truncate">placement@example.com</div>
              <div className="text-emerald-700 font-mono">placement123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
