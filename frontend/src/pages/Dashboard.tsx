import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Users,
  Building,
  TrendingUp,
  CircleDollarSign,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_stats_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [atsAnalytics, setAtsAnalytics] = useState<any>(() => {
    try {
      const cached = sessionStorage.getItem('ats_analytics_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(!stats);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#800000', '#0F172A', '#E11D48', '#2563EB'];

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        if (!stats) setLoading(true);
        const [res, atsRes] = await Promise.all([
          api.dashboard.getStats(user.role),
          user.role === 'ADMIN' ? api.ats.getAnalytics() : Promise.resolve({ success: false, data: null }),
        ]);

        if (res.success) {
          setStats(res.data);
          sessionStorage.setItem('dashboard_stats_cache', JSON.stringify(res.data));
        }
        if (atsRes && atsRes.success) {
          setAtsAnalytics(atsRes.data);
          sessionStorage.setItem('ats_analytics_cache', JSON.stringify(atsRes.data));
        }
      } catch (err: any) {
        console.error(err);
        if (!stats) setError('Failed to aggregate dashboard analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <span className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error || 'Dashboard loading failed.'}</span>
        </div>
      </div>
    );
  }

  const { cards, charts } = stats;

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-700">
      {/* 1. Dashboard Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{cards.totalStudents}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Enrolled in 2026 Batch</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Approved Companies</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{cards.totalCompanies}</h3>
            <p className="text-[10px] text-red-800 mt-1 font-bold">Active in Recruitment</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-100">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Placement Rate</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{cards.placementPercentage}%</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Placed: {cards.studentsPlaced} / {cards.totalStudents}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Average Package</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{cards.averagePackage} LPA</h3>
            <p className="text-[10px] text-red-800 mt-1 font-bold">Highest: {cards.highestPackage} LPA</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-100">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Placement Rate (Placed vs Not Placed) */}
        <div className="glass-panel p-6 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">Placement Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.placementDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.placementDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            {(charts?.placementDistribution || []).map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-bold text-slate-700">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Placement Breakdown */}
        <div className="glass-panel p-6 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">Department Placement Ratios</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="code" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="placed" name="Placed Students" fill="#800000" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total Students" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
