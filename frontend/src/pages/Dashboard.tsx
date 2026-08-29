import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Users,
  Building,
  CalendarCheck,
  TrendingUp,
  Award,
  CircleDollarSign,
  AlertCircle,
  Briefcase
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
  Legend,
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

  const COLORS = ['#988686', '#5C4E4E', '#D1D0D0', '#000000'];

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
        <span className="w-10 h-10 border-4 border-brand-rosy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 p-8">
        <div className="p-4 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-red-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Dashboard loading failed.'}</span>
        </div>
      </div>
    );
  }

  const { cards, charts } = stats;

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in">
      {/* 1. Dashboard Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-white mt-1">{cards.totalStudents}</h3>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Enrolled in 2026 Batch</p>
          </div>
          <div className="p-3 bg-brand-cocoa bg-opacity-20 rounded-xl text-brand-rosy">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Approved Companies</p>
            <h3 className="text-2xl font-black text-white mt-1">{cards.totalCompanies}</h3>
            <p className="text-[10px] text-brand-rosy mt-2 font-semibold">Active in Recruitment</p>
          </div>
          <div className="p-3 bg-brand-cocoa bg-opacity-20 rounded-xl text-brand-rosy">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Placement Rate</p>
            <h3 className="text-2xl font-black text-white mt-1">{cards.placementPercentage}%</h3>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Placed: {cards.studentsPlaced} / {cards.totalStudents}</p>
          </div>
          <div className="p-3 bg-brand-cocoa bg-opacity-20 rounded-xl text-brand-rosy">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Average Package</p>
            <h3 className="text-2xl font-black text-white mt-1">{cards.averagePackage} LPA</h3>
            <p className="text-[10px] text-brand-rosy mt-2 font-semibold">Highest: {cards.highestPackage} LPA</p>
          </div>
          <div className="p-3 bg-brand-cocoa bg-opacity-20 rounded-xl text-brand-rosy">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placement Rate (Placed vs Not Placed) */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Placement Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.placementStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.placementStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1C1717', borderColor: '#5C4E4E', borderRadius: '8px' }} />
                <Legend formatter={(value) => <span className="text-xs text-gray-400 font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package brackets distribution */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Package Distribution (CTC LPA)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.packageStats.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5C4E4E" opacity={0.2} />
                <XAxis dataKey="name" stroke="#988686" fontSize={11} />
                <YAxis stroke="#988686" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1717', borderColor: '#5C4E4E', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#988686" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department placement percentages */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Department-wise Placements (%)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.deptStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5C4E4E" opacity={0.2} />
                <XAxis dataKey="department" stroke="#988686" fontSize={11} />
                <YAxis stroke="#988686" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1C1717', borderColor: '#5C4E4E', borderRadius: '8px' }} />
                <Bar dataKey="percentage" name="Placement %" fill="#5C4E4E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top companies by offers */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Top Companies by Offers</h4>
          <div className="h-64">
            {charts.companyOffers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-brand-rosy">
                No offers recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.companyOffers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#5C4E4E" opacity={0.2} />
                  <XAxis type="number" stroke="#988686" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#988686" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1C1717', borderColor: '#5C4E4E', borderRadius: '8px' }} />
                  <Bar dataKey="offers" fill="#D1D0D0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Role-specific Information Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Admin Dashboard additions: approval queue and audit log summaries */}
        {user?.role === 'ADMIN' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Cold Approvals Queue</h4>
              {stats.recentPending?.length === 0 ? (
                <div className="py-6 text-center text-xs text-brand-rosy font-medium bg-brand-dark bg-opacity-20 rounded-lg">
                  All company submissions have been reviewed.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentPending?.map((item: any) => (
                    <div key={item.id} className="p-3 bg-brand-card rounded-lg flex items-center justify-between border border-brand-cocoa border-opacity-35">
                      <div>
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <div className="text-[10px] text-gray-500 mt-1">Submitted by: {item.createdBy?.name}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800 text-[9px] font-bold uppercase tracking-wider">
                        Cold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Audit Actions</h4>
              <div className="space-y-3">
                {stats.recentLogs?.map((log: any) => (
                  <div key={log.id} className="text-xs p-3 bg-brand-dark bg-opacity-30 rounded-lg flex items-center justify-between border border-brand-cocoa border-opacity-15">
                    <div>
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className="text-gray-500"> on {log.entity}</span>
                    </div>
                    <span className="text-[9px] text-brand-rosy font-mono">
                      {new Date(log.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' } as any)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI ATS Analytics Block */}
            {atsAnalytics && (
              <div className="space-y-6 pt-6 border-t border-brand-cocoa border-opacity-20 col-span-1 lg:col-span-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-5 h-5 text-brand-rosy" />
                  <span>AI ATS Recruiting Engine Analytics</span>
                </h4>

                {/* ATS Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-20 text-center space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">JDs Uploaded</span>
                    <span className="text-xl font-black text-white block font-mono">{atsAnalytics.metrics.jdsUploaded}</span>
                  </div>
                  <div className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-20 text-center space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Resumes Analyzed</span>
                    <span className="text-xl font-black text-white block font-mono">{atsAnalytics.metrics.resumesAnalyzed}</span>
                  </div>
                  <div className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-20 text-center space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Average ATS Match</span>
                    <span className="text-xl font-black text-brand-rosy block font-mono">{atsAnalytics.metrics.averageAtsScore}%</span>
                  </div>
                  <div className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-20 text-center space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Students Shortlisted</span>
                    <span className="text-xl font-black text-white block font-mono">{atsAnalytics.metrics.studentsShortlisted}</span>
                  </div>
                  <div className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-20 text-center space-y-1 col-span-2 lg:col-span-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AI Enabled Drives</span>
                    <span className="text-xl font-black text-white block font-mono">{atsAnalytics.metrics.drivesUsingAI}</span>
                  </div>
                </div>

                {/* Top Matching Candidates Table */}
                <div className="glass-panel overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-brand-card text-gray-500 border-b border-brand-cocoa border-opacity-25 uppercase tracking-wider font-semibold text-[9px]">
                        <th className="p-3">Rank Candidate</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Target Company</th>
                        <th className="p-3">Target Role</th>
                        <th className="p-3 text-center">ATS Match Score</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-cocoa divide-opacity-15 text-gray-300">
                      {atsAnalytics.topCandidates.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-brand-card hover:bg-opacity-10 transition-colors">
                          <td className="p-3 font-bold text-white flex items-center space-x-1">
                            <span className="text-brand-rosy font-mono">#{i + 1}</span>
                            <span>{c.studentName}</span>
                          </td>
                          <td className="p-3 font-semibold text-gray-400">{c.deptCode}</td>
                          <td className="p-3 font-semibold text-gray-300">{c.companyName}</td>
                          <td className="p-3 text-gray-400">{c.roleName}</td>
                          <td className="p-3 text-center font-mono font-bold text-brand-rosy">{c.atsScore}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              c.status === 'Shortlisted' ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manager Dashboard additions: display Placement Team Members count/activity */}
        {user?.role === 'MANAGER' && (
          <div className="glass-panel p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Placement Officer Activity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.teamActivity?.map((officer: any) => (
                <div key={officer.id} className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-30">
                  <div className="text-xs font-bold text-white">{officer.name}</div>
                  <div className="text-[10px] text-brand-rosy mt-0.5">{officer.email}</div>
                  <div className="mt-4 pt-3 border-t border-brand-cocoa border-opacity-20 flex justify-between items-center text-[10px] text-gray-400">
                    <span>Submitted Companies</span>
                    <span className="font-bold text-white">{officer.createdCompanies?.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placement Team Dashboard additions: Upcoming drives */}
        {user?.role === 'PLACEMENT_TEAM' && (
          <div className="glass-panel p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Drives Under Schedule</h4>
            {stats.upcomingMyDrives?.length === 0 ? (
              <div className="py-6 text-center text-xs text-brand-rosy bg-brand-dark bg-opacity-20 rounded-lg">
                No upcoming placement drives are currently scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.upcomingMyDrives?.map((drive: any) => (
                  <div key={drive.id} className="p-4 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-30">
                    <div className="text-xs font-bold text-white">{drive.company?.name}</div>
                    <div className="text-[10px] text-brand-rosy mt-0.5">{drive.jobRole}</div>
                    <div className="mt-4 text-[10px] text-gray-500">
                      Date: <span className="text-gray-300 font-semibold">{new Date(drive.driveDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
