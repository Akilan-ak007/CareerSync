import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { utils, writeFile } from 'xlsx';
import { MapSelector } from '../components/MapSelector.js';
import {
  Search,
  Plus,
  Building,
  MapPin,
  Globe,
  Users,
  Mail,
  Phone,
  Link,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';

export const Companies: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isTeam = user?.role === 'PLACEMENT_TEAM';

  // State
  const [companies, setCompanies] = useState<any[]>([]);
  const [deletedCompanies, setDeletedCompanies] = useState<any[]>([]);
  const [viewDeleted, setViewDeleted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deletePermanent, setDeletePermanent] = useState(false);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedCompany, setSelectedCompany] = useState<any>(null); // Details drawer
  const [showFormModal, setShowFormModal] = useState(false); // Create/Edit Modal
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<any>({
    name: '',
    location: '',
    website: '',
    companySize: '100-500',
    companyAddress: '',
    latitude: null,
    longitude: null,
    formattedAddress: '',
    googleMapsUrl: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    description: '',
    logoUrl: '',
    industry: '',
    foundedYear: '',
    companyType: '',
    linkedinUrl: '',
    ctcLakhs: '',
    sampleResumeUrl: ''
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      if (viewDeleted && isAdmin) {
        const res = await api.companies.listDeleted();
        if (res.success) {
          setDeletedCompanies(res.data);
          setPagination({ totalCount: res.data.length, totalPages: 1, currentPage: 1, limit: 100 });
        }
      } else {
        const res = await api.companies.list({
          search,
          status: statusFilter,
          page,
          limit: 10
        });
        if (res.success) {
          setCompanies(res.data.companies);
          setPagination(res.data.pagination);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [search, statusFilter, page, viewDeleted]);

  // Form open handlers
  const handleOpenCreate = () => {
    setEditingCompanyId(null);
    setFormData({
      name: '',
      location: '',
      website: '',
      companySize: '100-500',
      companyAddress: '',
      latitude: null,
      longitude: null,
      formattedAddress: '',
      googleMapsUrl: '',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      description: '',
      logoUrl: '',
      industry: '',
      foundedYear: '',
      companyType: '',
      linkedinUrl: '',
      ctcLakhs: '',
      sampleResumeUrl: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (comp: any) => {
    setEditingCompanyId(comp.id);
    setFormData({
      name: comp.name,
      location: comp.location,
      website: comp.website,
      companySize: comp.companySize,
      companyAddress: comp.companyAddress,
      latitude: comp.latitude,
      longitude: comp.longitude,
      formattedAddress: comp.formattedAddress || comp.companyAddress,
      googleMapsUrl: comp.googleMapsUrl || '',
      contactPersonName: comp.contactPersonName,
      contactPersonPhone: comp.contactPersonPhone,
      contactPersonEmail: comp.contactPersonEmail,
      description: comp.description,
      logoUrl: comp.logoUrl || '',
      industry: comp.industry || '',
      foundedYear: comp.foundedYear ? String(comp.foundedYear) : '',
      companyType: comp.companyType || '',
      linkedinUrl: comp.linkedinUrl || '',
      ctcLakhs: comp.ctcLakhs ? String(comp.ctcLakhs) : '',
      sampleResumeUrl: comp.sampleResumeUrl || ''
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompanyId) {
        await api.companies.update(editingCompanyId, formData);
        toast.success(
          isTeam
            ? 'Company profile updated and resubmitted for Admin approval.'
            : 'Company details successfully updated.'
        );
      } else {
        await api.companies.create(formData);
        toast.success('Company submission created. Pending Admin approval.');
      }
      setShowFormModal(false);
      loadCompanies();
      if (selectedCompany?.id === editingCompanyId) setSelectedCompany(null);
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const triggerDelete = (comp: any) => {
    setDeleteTargetId(comp.id);
    setDeleteTargetName(comp.name);
    setDeletePermanent(false);
    setDeleteConfirmOpen(true);
  };

  const triggerPermanentDelete = (comp: any) => {
    setDeleteTargetId(comp.id);
    setDeleteTargetName(comp.name);
    setDeletePermanent(true);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      if (deletePermanent) {
        const res = await api.companies.permanentDelete(deleteTargetId);
        if (res.success) {
          toast.success('Company permanently purged.');
        }
      } else {
        await api.companies.delete(deleteTargetId);
        toast.success('Company moved to archived directory.');
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetName('');
      loadCompanies();
      if (selectedCompany?.id === deleteTargetId) setSelectedCompany(null);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await api.companies.restore(id);
      if (res.success) {
        toast.success('Company restored successfully.');
        loadCompanies();
      }
    } catch (err: any) {
      toast.error(err.message || 'Restoration failed.');
    }
  };

  const exportDeletedCompanies = (data: any[]) => {
    if (data.length === 0) {
      toast.error("No deleted companies to export.");
      return;
    }
    const formatted = data.map((comp: any, idx: number) => ({
      'S.No': idx + 1,
      'Company Name': comp.name,
      'Industry': comp.industry || 'IT / Softwares',
      'Location': comp.location,
      'Website': comp.website || 'N/A',
      'Company Size': comp.companySize || 'N/A',
      'Company Address': comp.companyAddress || 'N/A',
      'Latitude': comp.latitude || 'N/A',
      'Longitude': comp.longitude || 'N/A',
      'Contact Person': comp.contactPersonName || 'N/A',
      'Contact Phone': comp.contactPersonPhone || 'N/A',
      'Contact Email': comp.contactPersonEmail || 'N/A',
      'Description': comp.description || 'N/A',
      'Founded Year': comp.foundedYear || 'N/A',
      'Company Type': comp.companyType || 'N/A',
      'LinkedIn URL': comp.linkedinUrl || 'N/A',
      'Created By': comp.createdBy?.name || 'N/A',
      'Deleted At': comp.deletedAt ? new Date(comp.deletedAt).toLocaleString() : 'N/A'
    }));

    const worksheet = utils.json_to_sheet(formatted);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Delete History');
    
    writeFile(workbook, `Deleted_Companies_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Map click handler callback
  const handleMapLocationChange = (locationData: any) => {
    setFormData({
      ...formData,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      formattedAddress: locationData.formattedAddress,
      companyAddress: locationData.formattedAddress, // Auto populate company address
      googleMapsUrl: locationData.googleMapsUrl,
    });
  };

  // Status Badge UI helper
  const getStatusBadge = (status: string) => {
    const uppercase = status.toUpperCase();
    if (uppercase === 'APPROVED') {
      return (
        <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (uppercase === 'PENDING_APPROVAL') {
      return (
        <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <Clock className="w-3 h-3 animate-pulse" />
          <span>Cold</span>
        </span>
      );
    }
    if (uppercase === 'REJECTED') {
      return (
        <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
        <HelpCircle className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="h-full flex relative overflow-hidden">
      {/* List pane */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Companies Directory</h1>
            <p className="text-xs text-purple-800 uppercase tracking-wider font-extrabold mt-0.5">Manage corporate placement partners</p>
          </div>

          {viewDeleted && isAdmin ? (
            <button
              onClick={() => exportDeletedCompanies(deletedCompanies)}
              className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center space-x-2 transition-all shadow-md animate-fade-in"
            >
              <Download className="w-4 h-4" />
              <span>Export Delete History (.xlsx)</span>
            </button>
          ) : (
            !isManager && (
              <button
                onClick={handleOpenCreate}
                className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center space-x-2 transition-all shadow-md"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>{isAdmin ? 'Add New Company' : 'Submit Company'}</span>
              </button>
            )
          )}
        </div>

        {/* Admin Deleted Chunk Tab Selector */}
        {isAdmin && (
          <div className="flex border-b border-slate-200 pb-px font-mono text-[10px]">
            <button
              onClick={() => { setViewDeleted(false); setPage(1); }}
              className={`pb-2.5 px-4 font-extrabold border-b-2 transition-all ${
                !viewDeleted ? 'border-purple-800 text-purple-900 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              ACTIVE PARTNERS
            </button>
            <button
              onClick={() => { setViewDeleted(true); setPage(1); }}
              className={`pb-2.5 px-4 font-extrabold border-b-2 transition-all ${
                viewDeleted ? 'border-purple-800 text-purple-900 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              DELETE HISTORY
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by company name, location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 pl-9 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {isAdmin && (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-purple-700 transition-all"
              >
                <option value="">All Statuses (Admin View)</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING_APPROVAL">Pending Approval Only</option>
                <option value="REJECTED">Rejected Only</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-3 border-purple-800 border-t-transparent rounded-full inline-block animate-spin" />
          </div>
        ) : (viewDeleted ? deletedCompanies : companies).length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              {viewDeleted ? 'No soft-deleted corporate partners in the archive.' : 'No companies found.'}
            </p>
            {!isManager && !viewDeleted && (
              <button
                onClick={handleOpenCreate}
                className="bg-purple-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-950 transition-all shadow-sm"
              >
                Submit a Corporate Partner Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(viewDeleted ? deletedCompanies : companies).map((comp) => (
              <div
                key={comp.id}
                onClick={() => {
                  if (!viewDeleted) setSelectedCompany(comp);
                }}
                className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between ${
                  viewDeleted ? 'opacity-75 border-dashed border-slate-300' : 'cursor-pointer hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-900 shrink-0">
                        <Building className="w-5 h-5 text-purple-800" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{comp.name}</h4>
                        <span className="text-[10px] text-purple-800 font-extrabold uppercase tracking-wider">{comp.industry || 'IT / Software'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-medium">
                    {comp.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-semibold border-t border-slate-100 pt-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span className="truncate">{comp.location}</span>
                    </div>
                    {comp.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">{comp.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  {viewDeleted ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-extrabold uppercase tracking-wider">
                      DELETED {comp.deletedAt ? new Date(comp.deletedAt).toLocaleDateString() : ''}
                    </span>
                  ) : (
                    getStatusBadge(comp.status)
                  )}
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {viewDeleted ? (
                      <>
                         <button
                          onClick={() => handleRestore(comp.id)}
                          className="bg-white hover:bg-slate-50 border border-slate-300 text-[10px] font-bold text-slate-800 hover:text-emerald-700 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all shadow-sm"
                          title="Restore Profile"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => triggerPermanentDelete(comp)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold text-rose-800 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all"
                          title="Permanently Purge Profile"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Purge</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {((isTeam && comp.createdById === user?.id) || isAdmin) && (
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="p-1 hover:text-purple-800 text-slate-400 transition-colors hover:bg-slate-100 rounded"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => triggerDelete(comp)}
                            className="p-1 hover:text-rose-600 text-slate-400 transition-colors hover:bg-slate-100 rounded"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Company Details Drawer Overlay */}
      {selectedCompany && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-fade-in"
          onClick={() => setSelectedCompany(null)}
        >
          <div
            className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-4.5 h-4.5 text-purple-700" />
                <span>Corporate Partner Profile</span>
              </h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center mx-auto mb-3 shadow-md border border-purple-200">
                  <Building className="w-8 h-8 text-purple-800" />
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedCompany.name}</h3>
                <p className="text-xs text-purple-800 font-extrabold mt-0.5">{selectedCompany.industry || 'Corporate Partner'}</p>
                <div className="mt-3 flex justify-center">{getStatusBadge(selectedCompany.status)}</div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Corporate Overview
                </h4>
                <div className="space-y-2">
                  <p className="leading-relaxed text-slate-600 font-medium">{selectedCompany.description || 'No description provided.'}</p>
                  <div className="grid grid-cols-2 gap-3 text-slate-600 mt-2 font-bold">
                    <div>Company Size: <span className="text-slate-900 block mt-0.5">{selectedCompany.companySize}</span></div>
                    {selectedCompany.ctcLakhs && (
                      <div>Offered CTC: <span className="text-purple-800 font-extrabold block mt-0.5 font-mono">{selectedCompany.ctcLakhs} LPA</span></div>
                    )}
                    {selectedCompany.foundedYear && (
                      <div>Founded In: <span className="text-slate-900 block mt-0.5">{selectedCompany.foundedYear}</span></div>
                    )}
                  </div>
                  {selectedCompany.sampleResumeUrl && (
                    <div className="pt-2">
                      <a
                        href={selectedCompany.sampleResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-bold transition-colors shadow-xs"
                      >
                        <span className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-purple-700" />
                          <span>Sample Resume / JD Document</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Contact Representative (HR)
                </h4>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-semibold">
                  <div className="font-extrabold text-slate-900 text-xs">{selectedCompany.contactPersonName}</div>
                  <div className="flex items-center space-x-2 text-xs text-slate-700 font-mono">
                    <Mail className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>{selectedCompany.contactPersonEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-700 font-mono">
                    <Phone className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>{selectedCompany.contactPersonPhone}</span>
                  </div>
                </div>
              </div>

              {selectedCompany.latitude && selectedCompany.longitude && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Location Coordinates & Maps
                  </h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="text-slate-800 font-medium leading-relaxed">{selectedCompany.formattedAddress}</div>
                    <div className="flex space-x-4 font-mono text-slate-500 font-bold">
                      <div>Lat: {selectedCompany.latitude.toFixed(5)}</div>
                      <div>Lng: {selectedCompany.longitude.toFixed(5)}</div>
                    </div>
                    {selectedCompany.googleMapsUrl && (
                      <a
                        href={selectedCompany.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center space-x-1.5 text-purple-800 hover:underline font-extrabold transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Open Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCompany(null)}
                className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2 rounded-xl font-extrabold text-xs shadow-sm"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-xs text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {editingCompanyId ? 'Modify Company Profile' : 'Submit a Corporate Partner'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-extrabold">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold">Core City Location *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bangalore, Coimbatore"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold">Corporate Website *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://company.com"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold">Company Size *</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 font-bold focus:outline-none focus:border-purple-700"
                      >
                        <option value="10-50">10-50 Employees</option>
                        <option value="50-200">50-200 Employees</option>
                        <option value="200-500">200-500 Employees</option>
                        <option value="500-1000">500-1000 Employees</option>
                        <option value="1000-5000">1000-5000 Employees</option>
                        <option value="5000-10000">5000-10000 Employees</option>
                        <option value="10000+">10000+ Employees</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold">Industry / Domain</label>
                      <input
                        type="text"
                        placeholder="e.g. Software Development"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold flex items-center justify-between">
                        <span>Offered CTC (LPA)</span>
                        <span className="text-[10px] text-purple-800 font-extrabold">e.g. 12.5</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 12.5"
                        value={formData.ctcLakhs}
                        onChange={(e) => setFormData({ ...formData, ctcLakhs: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 font-extrabold">Sample Resume / JD Link</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={formData.sampleResumeUrl}
                        onChange={(e) => setFormData({ ...formData, sampleResumeUrl: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-extrabold">Description / Summary *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider">Contact Person Details (HR)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-700 font-extrabold">Contact Person Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactPersonName}
                          onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-700 font-extrabold">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={formData.contactPersonEmail}
                            onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-extrabold">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={formData.contactPersonPhone}
                            onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <label className="text-slate-900 font-extrabold flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-purple-700" />
                      <span>Select HQ Location on Interactive Map *</span>
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">Click on map or drag marker to set exact coordinates.</p>
                    <div className="h-64 rounded-xl border border-slate-300 overflow-hidden shadow-xs relative">
                      <MapSelector
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        initialAddress={formData.formattedAddress}
                        onChange={handleMapLocationChange}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-700">
                    <div className="text-slate-900 font-sans font-extrabold text-xs">Selected Location Metadata:</div>
                    <div className="text-slate-800 font-sans font-medium line-clamp-2">{formData.formattedAddress || 'No location selected yet.'}</div>
                    <div className="flex space-x-4 text-slate-500 font-bold pt-1 border-t border-slate-200">
                      <div>Latitude: {formData.latitude.toFixed(5)}</div>
                      <div>Longitude: {formData.longitude.toFixed(5)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-900 hover:bg-purple-950 text-white px-6 py-2.5 rounded-xl font-extrabold shadow-md"
                >
                  {editingCompanyId ? 'Save Profile Changes' : 'Submit Partner Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-xs text-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {deletePermanent ? 'Permanently Purge Partner?' : 'Archive Partner?'}
              </h3>
            </div>
            
            <p className="text-slate-600 font-medium leading-relaxed">
              Are you sure you want to {deletePermanent ? 'permanently purge' : 'soft-delete'} <span className="font-extrabold text-slate-900">{deleteTargetName}</span>?
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 rounded-xl font-extrabold shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
