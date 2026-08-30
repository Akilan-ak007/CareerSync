import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Building2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

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
      setError('Please enter your institutional email and password.');
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
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 text-xs font-sans">
      {/* LEFT 50%: RGU Hero Branding Section */}
      <div className="relative bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden">
        {/* Background Ambient Glows & Geometric Patterns */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Banner */}
        <div className="z-10 space-y-4">
          <img
            src="/rgu-banner-logo.png"
            alt="Rathinam Group of Institutions"
            className="h-12 object-contain filter drop-shadow-md"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="inline-flex items-center space-x-2 bg-purple-800/80 backdrop-blur-xs text-purple-200 text-[10px] font-extrabold px-3 py-1 rounded-full border border-purple-700/60 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>CAREERSYNC 2.0 • OFFICIAL PORTAL</span>
          </div>
        </div>

        {/* Middle Hero Content */}
        <div className="z-10 my-10 space-y-6">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Empowering Campus Placements & Recruitment Analytics
          </h1>
          <p className="text-purple-200 text-xs md:text-sm leading-relaxed max-w-lg font-medium">
            Streamlining institutional recruitment drives, corporate partner clearances, AI-powered ATS candidate shortlisting, and real-time placement conversion ledgers.
          </p>

          {/* Abstract Feature Highlights Grid (No Emojis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-purple-800/50">
            <div className="p-3.5 bg-purple-900/40 rounded-2xl border border-purple-800/60 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">Role-Based Access</h4>
                <p className="text-[10px] text-purple-300 mt-0.5">Customized controls for Admins, Managers & Officers.</p>
              </div>
            </div>

            <div className="p-3.5 bg-purple-900/40 rounded-2xl border border-purple-800/60 flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">Real-Time Analytics</h4>
                <p className="text-[10px] text-purple-300 mt-0.5">Live department placement ratios & salary distribution.</p>
              </div>
            </div>

            <div className="p-3.5 bg-purple-900/40 rounded-2xl border border-purple-800/60 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">AI Resume Matcher</h4>
                <p className="text-[10px] text-purple-300 mt-0.5">Automated JD criteria extraction & ATS scoring.</p>
              </div>
            </div>

            <div className="p-3.5 bg-purple-900/40 rounded-2xl border border-purple-800/60 flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">Corporate Network</h4>
                <p className="text-[10px] text-purple-300 mt-0.5">Geocoded recruiter directory & HR contacts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-[10px] text-purple-300 font-medium">
          © 2026 Rathinam Group of Institutions. All rights reserved.
        </div>
      </div>

      {/* RIGHT 50%: Login Portal Panel */}
      <div className="bg-slate-50 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white p-8 md:p-10 border border-slate-200/80 rounded-3xl shadow-xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <img src="/rgu-icon.svg" alt="RGU Emblem" className="w-10 h-10 object-contain" />
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Portal Sign In</h2>
                <p className="text-xs text-purple-800 font-extrabold uppercase tracking-wider">CAREERSYNC MANAGEMENT</p>
              </div>
            </div>
          </div>

          {/* Credentials Error Alert */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Institutional Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@rathinam.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-200 transition-all"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 pr-11 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-200 transition-all"
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
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-purple-700 focus:ring-purple-500" />
                <span>Keep Session Active</span>
              </label>
              <a href="#" className="text-purple-800 hover:text-purple-950 font-bold transition-colors">Help desk?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3.5 rounded-xl text-xs font-extrabold tracking-wider transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>AUTHENTICATE & ACCESS PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
