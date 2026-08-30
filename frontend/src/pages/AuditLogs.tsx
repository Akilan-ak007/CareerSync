import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  History,
  Search,
  AlertCircle,
  Activity,
  User,
  Shield,
  Clock,
  Globe
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.auditLogs.list({
        search,
        page,
        limit: 15
      });
      if (res.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit log trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, page]);

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('SUBMIT')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('APPROVE')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REJECT') || act.includes('TERMINATE')) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return 'bg-red-100 text-red-900 border-red-300 font-extrabold';
    if (role === 'MANAGER') return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
  };

  const getEntityBadge = (entity: string) => {
    const ent = entity.toUpperCase();
    if (ent.includes('USER')) return 'bg-slate-100 text-slate-800 border-slate-300';
    if (ent.includes('STUDENT')) return 'bg-teal-100 text-teal-800 border-teal-300';
    if (ent.includes('COMPANY')) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (ent.includes('DRIVE')) return 'bg-violet-100 text-violet-800 border-violet-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="h-full p-4 md:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-800" />
            <h1 className="text-xl font-black text-slate-900">System Audit Trails</h1>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5">
            Real-time security log monitor for administrative mutations and portal activities
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by user, role, action or entity..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 transition-all shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-2 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Logs Table - Clean, Colorful & Scaled */}
      <div className="glass-panel overflow-x-auto shadow-xs rounded-xl bg-white border border-slate-200">
        {loading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-3 border-red-800 border-t-transparent rounded-full inline-block animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-500">No audit operations captured.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[900px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px] whitespace-nowrap">
                  <th className="p-3.5">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>User</span>
                    </div>
                  </th>
                  <th className="p-3.5">
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th className="p-3.5">
                    <div className="flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-500" />
                      <span>Operation Action</span>
                    </div>
                  </th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">
                    <div className="flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>IP Address</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Timestamp</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{log.user?.name || 'System Auto'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.user?.email || 'System'}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider border ${getRoleBadge(log.role)}`}>
                        {log.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase border shadow-2xs ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getEntityBadge(log.entity)}`}>
                        {log.entity}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5 truncate max-w-[160px]">
                        ID: {log.entityId}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3.5 font-mono text-right text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination control */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="font-semibold">Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} Logs)</span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-40 font-bold transition-all shadow-2xs"
            >
              Previous
            </button>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-40 font-bold transition-all shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
