import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api.js';
import {
  Check,
  X,
  FileCheck,
  Building,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  HelpCircle,
  Clock,
  MapPin,
  ExternalLink,
  FileText
} from 'lucide-react';

export const CompanyApprovals: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rejection / Approval dialog control
  const [actionSubmission, setActionSubmission] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detailed view dialog
  const [viewCompany, setViewCompany] = useState<any | null>(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.companies.submissions();
      if (res.success) {
        setSubmissions(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleOpenAction = (sub: any, type: 'APPROVE' | 'REJECT') => {
    setActionSubmission(sub);
    setActionType(type);
    setRejectionReason('');
  };

  const handleActionConfirm = async () => {
    if (!actionSubmission || !actionType) return;

    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please specify a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'APPROVE') {
        const res = await api.companies.approve(actionSubmission.id);
        if (res.success) {
          toast.success('Company successfully approved!');
        }
      } else {
        const res = await api.companies.reject(actionSubmission.id, rejectionReason);
        if (res.success) {
          toast.success('Company successfully rejected.');
        }
      }
      setActionSubmission(null);
      setActionType(null);
      loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-gray-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white">Company Approval Queue</h1>
        <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
          Review new corporate entries submitted by managers and team officers
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <FileCheck className="w-12 h-12 text-brand-rosy mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">No Pending Approvals</p>
            <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
              Any new companies added by staff will appear here for review and verification.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="p-4">Corporate Partner</th>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Submitter Role</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Status Clearance</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-extrabold text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-extrabold">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{sub.company?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sub.company?.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{sub.submittedBy?.name || 'Unknown Officer'}</td>
                  <td className="p-4 font-extrabold text-purple-800 uppercase tracking-wider text-[10px]">{sub.submittedBy?.role?.name}</td>
                  <td className="p-4 font-mono font-bold text-slate-600">
                    {new Date(sub.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' } as any)}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold uppercase tracking-wider flex items-center space-x-1 w-max">
                      <Clock className="w-3 h-3 animate-pulse" />
                      <span>Pending Approval</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setViewCompany(sub.company)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all font-bold shadow-xs text-xs"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-700" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(sub, 'APPROVE')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all font-extrabold shadow-xs text-xs"
                        title="Approve"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(sub, 'REJECT')}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all font-extrabold shadow-xs text-xs"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 1. Inspect Company details Modal */}
      {viewCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-4.5 h-4.5 text-purple-700" />
                <span>Company Submission Details</span>
              </h3>
              <button onClick={() => setViewCompany(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Legal Name & Domain</span>
                <p className="text-base font-extrabold text-slate-900">{viewCompany.name}</p>
                <p className="text-xs text-purple-800 font-extrabold mt-0.5">{viewCompany.industry || 'IT / Software'}</p>
              </div>

              <div>
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Corporate Summary</span>
                <p className="leading-relaxed text-slate-600 font-medium">{viewCompany.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 font-semibold">
                <div>
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Website URL</span>
                  <a
                    href={viewCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-800 hover:underline font-mono break-all inline-flex items-center space-x-1 font-bold"
                  >
                    <span>{viewCompany.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">HQ City / Location</span>
                  <span className="text-slate-800 font-bold">{viewCompany.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-semibold">
                <div>
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Company Size</span>
                  <span className="text-slate-800 font-bold">{viewCompany.companySize || 'N/A'}</span>
                </div>
                {viewCompany.ctcLakhs && (
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Offered CTC</span>
                    <span className="text-purple-800 font-extrabold font-mono">{viewCompany.ctcLakhs} LPA</span>
                  </div>
                )}
              </div>

              {viewCompany.sampleResumeUrl && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-extrabold text-slate-900 block mb-2">Job Description & Sample Resume</span>
                  <a
                    href={viewCompany.sampleResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-bold transition-colors shadow-xs"
                  >
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span>View Job Description Document</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-extrabold text-slate-900 block mb-2 uppercase tracking-wider text-[10px]">Contact Person (HR)</span>
                <div className="grid grid-cols-3 gap-3 font-semibold text-slate-700">
                  <div>Name: <span className="text-slate-900 block font-bold">{viewCompany.contactPersonName}</span></div>
                  <div>Email: <span className="text-slate-900 block font-bold truncate font-mono text-[11px]">{viewCompany.contactPersonEmail}</span></div>
                  <div>Phone: <span className="text-slate-900 block font-bold font-mono text-[11px]">{viewCompany.contactPersonPhone}</span></div>
                </div>
              </div>

              {viewCompany.latitude && viewCompany.longitude && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-extrabold text-slate-900 block uppercase tracking-wider text-[10px]">Location Coordinates & Maps</span>
                  <div className="space-y-2">
                    <div className="text-slate-800 leading-relaxed font-medium">{viewCompany.formattedAddress}</div>
                    <div className="flex space-x-4 font-mono text-slate-500 font-bold">
                      <div>Lat: {viewCompany.latitude.toFixed(5)}</div>
                      <div>Lng: {viewCompany.longitude.toFixed(5)}</div>
                    </div>
                    {viewCompany.googleMapsUrl && (
                      <a
                        href={viewCompany.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center space-x-1.5 text-purple-800 hover:underline font-extrabold transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Open Google Maps Location</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setViewCompany(null)}
                className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2 rounded-xl font-extrabold transition-all text-xs shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Action Confirm (Approve/Reject) Modal Dialog */}
      {actionSubmission && actionType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 shadow-2xl">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              {actionType === 'APPROVE' ? 'Approve Corporate Partner?' : 'Reject Partner Submission'}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-4">
              {actionType === 'APPROVE'
                ? `"${actionSubmission.company?.name}" will become immediately active and visible throughout the college placement directories and statistics.`
                : `Specify the validation errors or reasons why "${actionSubmission.company?.name}" is rejected. This will notify the submitter.`}
            </p>

            {actionType === 'REJECT' && (
              <div className="space-y-1.5 mb-4">
                <label className="text-slate-700 font-extrabold">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete address details or invalid contact emails."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setActionSubmission(null);
                  setActionType(null);
                }}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold shadow-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl font-extrabold text-white transition-all flex items-center space-x-1.5 shadow-md ${
                  actionType === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {actionType === 'APPROVE' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>{actionType === 'APPROVE' ? 'Approve' : 'Confirm Reject'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
