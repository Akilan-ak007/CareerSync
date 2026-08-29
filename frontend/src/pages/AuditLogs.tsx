import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  History,
  Search,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector Dialog for values diff
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

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

  return (
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-gray-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white">System Audit Trails</h1>
        <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
          Monitor administrative operations and data mutations
        </p>
      </div>

      {/* Search Input bar */}
      <div className="p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-xl max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by action, user, or entity..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy transition-all"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main logs Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <History className="w-10 h-10 text-brand-rosy mx-auto opacity-70" />
            <p className="text-sm text-gray-400">No audit operations captured.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                <th className="p-4">Staff User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-center">Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cocoa divide-opacity-20 text-gray-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-brand-card hover:bg-opacity-20 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-white block">{log.user?.name || 'System Auto'}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{log.user?.email || 'System'}</span>
                  </td>
                  <td className="p-4 font-semibold text-brand-rosy">{log.role}</td>
                  <td className="p-4 font-bold text-white">{log.action}</td>
                  <td className="p-4 font-medium">
                    <span>{log.entity}</span>
                    <span className="text-[10px] text-gray-500 block font-mono mt-0.5 truncate max-w-[150px]">{log.entityId}</span>
                  </td>
                  <td className="p-4 font-mono text-gray-400">{log.ipAddress || 'Localhost'}</td>
                  <td className="p-4 font-mono">
                    {new Date(log.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' } as any)}
                  </td>
                  <td className="p-4 text-center">
                    {(log.oldValue || log.newValue) ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-gray-300 px-2.5 py-1 rounded flex items-center space-x-1.5 transition-all font-semibold mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-rosy" />
                        <span>Inspect JSON</span>
                      </button>
                    ) : (
                      <span className="text-gray-600 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination control */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} Logs)</span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Inspection values dialog */}
      {selectedLog && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Audit Log Values Payload: {selectedLog.action}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-white block mb-2 uppercase tracking-wide text-[10px]">Previous State</span>
                <pre className="p-3 bg-brand-dark rounded-lg text-[10px] text-gray-400 overflow-auto max-h-64 font-mono border border-brand-cocoa border-opacity-20">
                  {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'No previous values.'}
                </pre>
              </div>
              <div>
                <span className="font-bold text-white block mb-2 uppercase tracking-wide text-[10px]">Mutated State</span>
                <pre className="p-3 bg-brand-dark rounded-lg text-[10px] text-gray-400 overflow-auto max-h-64 font-mono border border-brand-cocoa border-opacity-20">
                  {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'No mutated values.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-cocoa border-opacity-20 mt-5">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-brand-cocoa text-white px-5 py-2 rounded-lg font-bold hover:bg-brand-rosy hover:text-brand-black transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
