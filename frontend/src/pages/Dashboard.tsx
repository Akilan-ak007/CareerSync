import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Users,
  Building,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
  UserCheck,
  FileCheck2,
  ExternalLink
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

  const CHART_COLORS = ['#7E22CE', '#0284C7', '#65A30D', '#EA580C', '#800000'];
  const PACKAGE_COLORS = ['#94A3B8', '#38BDF8', '#818CF8', '#A855F7'];

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
        if (!stats) setError('Failed to aggregate master dashboard analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <span className="w-10 h-10 border-4 border-purple-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error || 'Master dashboard loading failed.'}</span>
        </div>
      </div>
    );
  }

  const { cards, charts, recentLogs, recentPending, teamActivity, recentMyCompanies, upcomingMyDrives } = stats;

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* Role-Based Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-850 to-purple-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-white" />
        </div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="bg-purple-800 text-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-700 uppercase tracking-wider">
              {user?.role?.replace('_', ' ')} WORKSPACE
            </span>
            <span className="text-purple-300 font-mono text-[10px]">Real-Time Sync</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-purple-200 text-xs font-medium max-w-xl">
            {user?.role === 'ADMIN' && 'System Administrator Panel — Full oversight of drives, corporate approvals, student profiles, and audit trails.'}
            {user?.role === 'MANAGER' && 'Placement Dean & Manager Command — Monitor team performance, department conversion rates, and offer packages.'}
            {user?.role === 'PLACEMENT_TEAM' && 'Placement Officer Dashboard — Manage your assigned corporate partners, drive schedules, and student shortlists.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 z-10">
          {user?.role === 'ADMIN' && (
            <Link
              to="/company-approvals"
              className="bg-white hover:bg-purple-50 text-purple-950 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <FileCheck2 className="w-4 h-4 text-purple-800" />
              <span>Approvals ({cards?.pendingCompanies || 0})</span>
            </Link>
          )}
          <Link
            to="/drives"
            className="bg-purple-800 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs border border-purple-600 transition-all flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Placement Drives ({cards?.upcomingDrives || 0})</span>
          </Link>
        </div>
      </div>

      {/* 1. Master KPI Cards Grid */}
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
              <span>{cards.approvedCompanies || cards.totalCompanies} Approved Recruiters</span>
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

      {/* 2. Secondary Metrics Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Total Offers Issued</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{cards.totalOffers || 0}</div>
          </div>
          <Briefcase className="w-5 h-5 text-purple-700" />
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Upcoming Drives</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{cards.upcomingDrives || 0}</div>
          </div>
          <Calendar className="w-5 h-5 text-sky-700" />
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Completed Drives</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{cards.completedDrives || 0}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Pending Approval</span>
            <div className="text-xl font-black text-amber-800 mt-0.5">{cards.pendingCompanies || 0}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* 3. Analytics Visualizations Grid */}
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

        {/* CTC Package Salary Distribution Histogram */}
        {charts?.packageStats?.distribution && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Salary CTC Package Distribution</h4>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">LPA Tiers</span>
            </div>
            <div className="h-64 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.packageStats.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" name="Offers Count" fill="#0284C7" radius={[6, 6, 0, 0]}>
                    {charts.packageStats.distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PACKAGE_COLORS[index % PACKAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Corporate Status & Top Hiring Partners */}
        {charts?.companyOffers && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Top Hiring Corporate Partners</h4>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Headcount</span>
            </div>
            <div className="space-y-3 pt-2">
              {charts.companyOffers.length === 0 ? (
                <p className="text-slate-400 font-medium text-center py-12">No corporate offer data logged yet.</p>
              ) : (
                charts.companyOffers.map((comp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-900 text-white font-extrabold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs">{comp.name}</span>
                    </div>
                    <span className="font-mono font-black text-purple-900 text-sm bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                      {comp.offers} {comp.offers === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Role-Based Specialized Executive Widgets */}
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approval Roster Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Company Clearance ({recentPending?.length || 0})</span>
              </h4>
              <Link to="/company-approvals" className="text-purple-800 hover:underline font-extrabold text-xs flex items-center space-x-1">
                <span>View Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {!recentPending || recentPending.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium bg-slate-50 rounded-xl">
                  No company approvals pending clearance.
                </div>
              ) : (
                recentPending.map((comp: any) => (
                  <div key={comp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900">{comp.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Submitted by: {comp.createdBy?.name || 'Officer'}</div>
                    </div>
                    <Link
                      to="/company-approvals"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-xs transition-all"
                    >
                      Review
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Stream Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Recent System Audit Stream</span>
              </h4>
              <Link to="/audit-logs" className="text-purple-800 hover:underline font-extrabold text-xs flex items-center space-x-1">
                <span>All Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {!recentLogs || recentLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium bg-slate-50 rounded-xl">
                  No audit logs recorded yet.
                </div>
              ) : (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900">{log.action}</span>
                      <span className="text-slate-500 ml-2 font-medium">({log.entityName})</span>
                      <div className="text-[10px] text-purple-800 font-bold">{log.user?.name || 'System User'}</div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'MANAGER' && teamActivity && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-700" />
              <span>Placement Officers Roster & Submissions</span>
            </h4>
            <Link to="/team" className="text-purple-800 hover:underline font-extrabold text-xs">Manage Team</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamActivity.map((member: any) => (
              <div key={member.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{member.name}</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                    {member.createdCompanies?.length || 0} Companies Submitted
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono">{member.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'PLACEMENT_TEAM' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              My Upcoming Drives
            </h4>
            <div className="space-y-2">
              {!upcomingMyDrives || upcomingMyDrives.length === 0 ? (
                <p className="text-slate-400 font-medium text-center py-6">No drives currently scheduled.</p>
              ) : (
                upcomingMyDrives.map((d: any) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900">{d.company?.name}</div>
                      <div className="text-[10px] text-purple-800 font-bold">{d.jobRole} • {d.ctc} LPA</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {new Date(d.driveDate).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              My Corporate Submissions
            </h4>
            <div className="space-y-2">
              {!recentMyCompanies || recentMyCompanies.length === 0 ? (
                <p className="text-slate-400 font-medium text-center py-6">No company entries submitted yet.</p>
              ) : (
                recentMyCompanies.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.location}</div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
