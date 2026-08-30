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

  const CHART_COLORS = ['#7E22CE', '#0284C7', '#65A30D', '#EA580C', '#800000'];

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* 1. Dashboard Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Total Registered Students</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{cards.totalStudents}</h3>
            <p className="text-[10px] text-purple-800 mt-1 font-bold">Enrolled 2026 Batch Roster</p>
          </div>
          <div className="p-3.5 bg-purple-100 rounded-2xl text-purple-900 border border-purple-200 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Corporate Partners</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{cards.totalCompanies}</h3>
            <p className="text-[10px] text-emerald-800 mt-1 font-extrabold flex items-center space-x-1">
              <span>●</span>
              <span>{cards.approvedCompanies || cards.totalCompanies} Active Recruiters</span>
            </p>
          </div>
          <div className="p-3.5 bg-sky-100 rounded-2xl text-sky-900 border border-sky-200 shadow-xs">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Institutional Placement Rate</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{cards.placementPercentage}%</h3>
            <p className="text-[10px] text-slate-600 mt-1 font-bold">Placed: {cards.studentsPlaced} / {cards.totalStudents}</p>
          </div>
          <div className="p-3.5 bg-emerald-100 rounded-2xl text-emerald-900 border border-emerald-200 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Average Package (LPA)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{cards.averagePackage} LPA</h3>
            <p className="text-[10px] text-rose-800 mt-1 font-extrabold">Highest: {cards.highestPackage} LPA</p>
          </div>
          <div className="p-3.5 bg-amber-100 rounded-2xl text-amber-900 border border-amber-200 shadow-xs">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Placement Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Placement Distribution Overview</h4>
            <span className="text-[10px] text-purple-800 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">Batch 2026</span>
          </div>
          <div className="h-64 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.placementStats || [
                    { name: 'Placed', value: cards.studentsPlaced || 0 },
                    { name: 'Not Placed', value: (cards.totalStudents - cards.studentsPlaced) || 1 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {(charts?.placementStats || [
                    { name: 'Placed', value: cards.studentsPlaced || 0 },
                    { name: 'Not Placed', value: (cards.totalStudents - cards.studentsPlaced) || 1 }
                  ]).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t border-slate-100">
            {(charts?.placementStats || [
              { name: 'Placed', value: cards.studentsPlaced || 0 },
              { name: 'Not Placed', value: (cards.totalStudents - cards.studentsPlaced) || 0 }
            ]).map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="text-xs font-extrabold text-slate-800">{entry.name}: <span className="font-mono font-black">{entry.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Placement Ratios Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Department Placement Ratios</h4>
            <span className="text-[10px] text-sky-800 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">Across Departments</span>
          </div>
          <div className="h-64 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.departmentStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="department" stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="placed" name="Placed Students" fill="#7E22CE" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total" name="Total Students" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-purple-700" />
              <span className="text-xs font-bold text-slate-700">Placed Students</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-300" />
              <span className="text-xs font-bold text-slate-700">Total Enrolled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
