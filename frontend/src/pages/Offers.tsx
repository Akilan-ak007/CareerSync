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
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy transition-all"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
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
              <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
            </div>
          ) : offers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400">No recruitment offers logged yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Job Role</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Offer Date</th>
                  <th className="p-4">Status</th>
                  {!isManager && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cocoa divide-opacity-20 text-gray-300">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-brand-card hover:bg-opacity-25 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{offer.student?.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{offer.student?.registerNumber}</div>
                    </td>
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-brand-rosy" />
                        <span>{offer.company?.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-brand-rosy" />
                        <span>{offer.jobRole}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-brand-rosy font-mono">{offer.ctc} LPA</td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{new Date(offer.offerDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(offer.status)}</td>
                    {!isManager && (
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleOpenEdit(offer)}
                            className="p-1 hover:text-brand-rosy text-gray-500 transition-all"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(offer.id)}
                              className="p-1 hover:text-red-400 text-gray-500 transition-all"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300 animate-fade-in">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Modify Offer details
              </h3>
              <button onClick={() => setEditingOffer(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Job Title Role</label>
                <input
                  type="text"
                  required
                  value={editForm.jobRole}
                  onChange={(e) => setEditForm({ ...editForm, jobRole: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Package CTC (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editForm.ctc}
                  onChange={(e) => setEditForm({ ...editForm, ctc: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Offer Status Clearance</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                >
                  <option value="OFFERED">OFFERED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="JOINED">JOINED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2.5 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2.5 rounded-lg font-bold shadow-lg"
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
