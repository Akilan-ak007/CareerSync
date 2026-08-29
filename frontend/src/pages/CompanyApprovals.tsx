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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                <th className="p-4">Company Name</th>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Submitter Role</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cocoa divide-opacity-20 text-gray-300">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-brand-card hover:bg-opacity-25 transition-colors">
                  <td className="p-4 font-bold text-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-brand-cocoa bg-opacity-10 flex items-center justify-center text-brand-rosy border border-brand-cocoa border-opacity-20">
                        <Building className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{sub.company?.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sub.company?.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{sub.submittedBy?.name || 'Unknown Officer'}</td>
                  <td className="p-4 font-semibold text-brand-rosy">{sub.submittedBy?.role?.name}</td>
                  <td className="p-4 font-mono text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' } as any)}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
                      <Clock className="w-3 h-3 animate-pulse" />
                      <span>Cold</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setViewCompany(sub.company)}
                        className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-gray-300 px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all font-semibold"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-rosy" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(sub, 'APPROVE')}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all font-semibold"
                        title="Approve"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(sub, 'REJECT')}
                        className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all font-semibold"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-2.5 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-4.5 h-4.5 text-brand-rosy" />
                <span>Company Submissions details</span>
              </h3>
              <button onClick={() => setViewCompany(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <span className="font-bold text-white block mb-1">Name & Industry</span>
                <p className="text-sm font-bold text-white">{viewCompany.name}</p>
                <p className="text-brand-rosy font-semibold mt-0.5">{viewCompany.industry || 'IT and Softwares'}</p>
              </div>

              <div>
                <span className="font-bold text-white block mb-1">Corporate Summary</span>
                <p className="leading-relaxed text-gray-400">{viewCompany.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-white block mb-1">Website URL</span>
                  <a
                    href={viewCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-rosy hover:text-white font-mono break-all inline-flex items-center space-x-1"
                  >
                    <span>{viewCompany.website}</span>
                    <Eye className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="font-bold text-white block mb-1">HQ Address</span>
                  <span className="text-gray-300">{viewCompany.companyAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-white block mb-1">Company Size</span>
                  <span className="text-gray-300">{viewCompany.companySize || 'N/A'}</span>
                </div>
                {viewCompany.ctcLakhs && (
                  <div>
                    <span className="font-bold text-white block mb-1">Offered CTC</span>
                    <span className="text-brand-rosy font-bold">{viewCompany.ctcLakhs} LPA</span>
                  </div>
                )}
              </div>

              {viewCompany.sampleResumeUrl && (
                <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-lg">
                  <span className="font-bold text-white block mb-2 font-semibold">Job Description & Sample Resume</span>
                  <a
                    href={viewCompany.sampleResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 rounded-lg text-white font-medium transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-brand-rosy" />
                      <span>View Job Description / Document</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                </div>
              )}

              <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-lg">
                <span className="font-bold text-white block mb-2">Corporate Recruiter (HR)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>Name: <span className="text-white block font-semibold">{viewCompany.contactPersonName}</span></div>
                  <div>Email: <span className="text-white block font-semibold truncate font-mono">{viewCompany.contactPersonEmail}</span></div>
                  <div>Phone: <span className="text-white block font-semibold">{viewCompany.contactPersonPhone}</span></div>
                </div>
              </div>

              {viewCompany.latitude && viewCompany.longitude && (
                <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-lg">
                  <span className="font-bold text-white block mb-2 font-semibold">Location Coordinates & Maps</span>
                  <div className="space-y-2">
                    <div className="text-gray-300 leading-relaxed font-medium">{viewCompany.formattedAddress}</div>
                    <div className="flex space-x-4 font-mono text-gray-500">
                      <div>Lat: {viewCompany.latitude.toFixed(5)}</div>
                      <div>Lng: {viewCompany.longitude.toFixed(5)}</div>
                    </div>
                    {viewCompany.googleMapsUrl && (
                      <a
                        href={viewCompany.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center space-x-1.5 text-brand-rosy hover:text-white font-bold transition-colors"
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

            <div className="flex justify-end pt-4 border-t border-brand-cocoa border-opacity-20 mt-4">
              <button
                onClick={() => setViewCompany(null)}
                className="bg-brand-cocoa text-white px-5 py-2 rounded-lg font-bold hover:bg-brand-rosy hover:text-brand-black transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Action Confirm (Approve/Reject) Modal Dialog */}
      {actionSubmission && actionType && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              {actionType === 'APPROVE' ? 'Approve Company Entry?' : 'Reject Company Entry'}
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              {actionType === 'APPROVE'
                ? `"${actionSubmission.company?.name}" will become immediately active and visible throughout the college placement directories and statistics.`
                : `Specify the validation errors or reasons why "${actionSubmission.company?.name}" is rejected. This will notify the submitter.`}
            </p>

            {actionType === 'REJECT' && (
              <div className="space-y-1.5 mb-4">
                <label className="text-gray-500 font-semibold">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete address details or invalid contact emails."
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none resize-none"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-brand-cocoa border-opacity-20">
              <button
                onClick={() => {
                  setActionSubmission(null);
                  setActionType(null);
                }}
                className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-lg font-bold text-white transition-all flex items-center space-x-1.5 ${
                  actionType === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-700 hover:bg-red-600'
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
