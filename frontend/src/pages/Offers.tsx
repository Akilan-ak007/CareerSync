import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Search,
  Briefcase,
  Building,
  GraduationCap,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  HelpCircle,
  Clock,
  XCircle
} from 'lucide-react';

export const Offers: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  // State
  const [offers, setOffers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Edit Offer Modal
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'OFFERED',
    ctc: '',
    jobRole: '',
  });

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await api.offers.list({
        search,
        companyId: selectedCompany,
        departmentId: selectedDept,
        status: selectedStatus,
        page,
        limit: 10
      });
      if (res.success) {
        setOffers(res.data.offers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [search, selectedCompany, selectedDept, selectedStatus, page]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const compsRes = await api.companies.list({ limit: 100 });
        if (compsRes.success) setCompanies(compsRes.data.companies.filter((c: any) => c.status === 'APPROVED'));

        const deptsRes = await api.students.departments();
        if (deptsRes.success) setDepartments(deptsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadMetadata();
  }, []);

  const handleOpenEdit = (offer: any) => {
    setEditingOffer(offer);
    setEditForm({
      status: offer.status,
      ctc: String(offer.ctc),
      jobRole: offer.jobRole,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    try {
      await api.offers.update(editingOffer.id, editForm);
      setEditingOffer(null);
      loadOffers();
    } catch (err: any) {
      alert(err.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this Offer record? This will adjust the corresponding student placement status.')) return;
    try {
      await api.offers.delete(id);
      loadOffers();
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'JOINED') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <CheckCircle className="w-3 h-3" />
          <span>Joined</span>
        </span>
      );
    }
    if (status === 'ACCEPTED') {
      return (
        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <Clock className="w-3 h-3" />
          <span>Accepted</span>
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
        <HelpCircle className="w-3 h-3" />
        <span>Offered</span>
      </span>
    );
  };

  return (
    <div className="h-full flex relative overflow-hidden text-xs text-gray-300">
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div>
          <h1 className="text-xl font-extrabold text-white">Student Offers Tracking</h1>
          <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
            Monitor institutional recruitment offers and acceptance conversion rates
          </p>
        </div>

        {/* Toolbar Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search student, job role..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 pl-9 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-purple-700 transition-all"
            >
              <option value="">All Corporate Partners</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-purple-700 transition-all"
            >
              <option value="">All Streams / Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-purple-700 transition-all"
            >
              <option value="">All Offer Statuses</option>
              <option value="OFFERED">Offered Only</option>
              <option value="ACCEPTED">Accepted Only</option>
              <option value="REJECTED">Rejected Only</option>
              <option value="JOINED">Joined Only</option>
            </select>
          </div>
        </div>

        {/* Offers Table */}
        <div className="glass-panel overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <span className="w-8 h-8 border-3 border-purple-800 border-t-transparent rounded-full inline-block animate-spin" />
            </div>
          ) : offers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-slate-500 font-medium">No recruitment offers logged yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="p-4">Student Candidate</th>
                  <th className="p-4">Corporate Partner</th>
                  <th className="p-4">Job Role Title</th>
                  <th className="p-4">Offered Package</th>
                  <th className="p-4">Offer Date</th>
                  <th className="p-4">Status Clearance</th>
                  {!isManager && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{offer.student?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{offer.student?.registerNumber}</div>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>{offer.company?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>{offer.jobRole}</span>
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-purple-800 font-mono text-sm">{offer.ctc} LPA</td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(offer.offerDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(offer.status)}</td>
                    {!isManager && (
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleOpenEdit(offer)}
                            className="p-1 hover:text-purple-800 text-slate-400 transition-all hover:bg-slate-100 rounded"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(offer.id)}
                              className="p-1 hover:text-rose-600 text-slate-400 transition-all hover:bg-slate-100 rounded"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Offer Modal */}
      {editingOffer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Modify Offer Details
              </h3>
              <button onClick={() => setEditingOffer(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Job Title Role</label>
                <input
                  type="text"
                  required
                  value={editForm.jobRole}
                  onChange={(e) => setEditForm({ ...editForm, jobRole: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Package CTC (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editForm.ctc}
                  onChange={(e) => setEditForm({ ...editForm, ctc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Offer Status Clearance</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-extrabold focus:outline-none focus:border-purple-700"
                >
                  <option value="OFFERED">OFFERED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="JOINED">JOINED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2.5 rounded-xl font-extrabold shadow-md"
                >
                  Update Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
