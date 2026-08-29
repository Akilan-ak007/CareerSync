import React, { useState, useEffect } from 'react';
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
    linkedinUrl: ''
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
      linkedinUrl: ''
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
      linkedinUrl: comp.linkedinUrl || ''
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompanyId) {
        await api.companies.update(editingCompanyId, formData);
        alert(
          isTeam
            ? 'Company details updated. Since you edited an active profile, it has been resubmitted for Admin approval.'
            : 'Company details successfully updated.'
        );
      } else {
        await api.companies.create(formData);
        alert('Company submission created. It is now pending Admin approval.');
      }
      setShowFormModal(false);
      loadCompanies();
      if (selectedCompany?.id === editingCompanyId) setSelectedCompany(null);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
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
          alert('Company permanently purged.');
        }
      } else {
        await api.companies.delete(deleteTargetId);
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetName('');
      loadCompanies();
      if (selectedCompany?.id === deleteTargetId) setSelectedCompany(null);
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await api.companies.restore(id);
      if (res.success) {
        alert('Company restored successfully.');
        loadCompanies();
      }
    } catch (err: any) {
      alert(err.message || 'Restoration failed.');
    }
  };

  const exportDeletedCompanies = (data: any[]) => {
    if (data.length === 0) {
      alert("No deleted companies to export.");
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
            <h1 className="text-xl font-extrabold text-white">Companies Directory</h1>
            <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">Manage corporate placement partners</p>
          </div>

          {viewDeleted && isAdmin ? (
            <button
              onClick={() => exportDeletedCompanies(deletedCompanies)}
              className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all shadow-md animate-fade-in"
            >
              <Download className="w-4 h-4" />
              <span>Export Delete History (.xlsx)</span>
            </button>
          ) : (
            !isManager && (
              <button
                onClick={handleOpenCreate}
                className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all shadow-md"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>{isAdmin ? 'Add New Company' : 'Submit Company'}</span>
              </button>
            )
          )}
        </div>

        {/* Admin Deleted Chunk Tab Selector */}
        {isAdmin && (
          <div className="flex border-b border-brand-cocoa border-opacity-25 pb-px font-mono text-[10px]">
            <button
              onClick={() => { setViewDeleted(false); setPage(1); }}
              className={`pb-2 px-4 font-bold border-b-2 transition-all ${
                !viewDeleted ? 'border-brand-rosy text-white font-black' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              ACTIVE PARTNERS
            </button>
            <button
              onClick={() => { setViewDeleted(true); setPage(1); }}
              className={`pb-2 px-4 font-bold border-b-2 transition-all ${
                viewDeleted ? 'border-brand-rosy text-white font-black' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              DELETE HISTORY
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by company name, location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy transition-all"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          {isAdmin && (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
              >
                <option value="">All Statuses (Admin View)</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING_APPROVAL">Cold Only</option>
                <option value="REJECTED">Rejected Only</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          )}
        </div>

        {/* Companies Grid/Table */}
        {loading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
          </div>
        ) : (viewDeleted ? deletedCompanies : companies).length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm text-gray-400">
              {viewDeleted ? 'No soft-deleted corporate partners in the archive.' : 'No companies found.'}
            </p>
            {!isManager && !viewDeleted && (
              <button
                onClick={handleOpenCreate}
                className="bg-brand-cocoa text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-rosy hover:text-brand-black transition-all"
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
                className={`glass-panel p-5 transition-all relative flex flex-col justify-between ${
                  viewDeleted ? 'opacity-85 border-dashed border-gray-700' : 'cursor-pointer hover:border-brand-rosy'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-cocoa bg-opacity-20 border border-brand-cocoa border-opacity-30 flex items-center justify-center text-white overflow-hidden">
                        <img src="/company-logo.svg" alt={comp.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{comp.name}</h4>
                        <span className="text-[10px] text-gray-500 font-medium">{comp.industry || 'IT / Softwares'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-4">
                    {comp.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 text-[10px] text-gray-500 mb-4 font-medium border-t border-brand-cocoa border-opacity-20 pt-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-rosy" />
                      <span className="truncate">{comp.location}</span>
                    </div>
                    {comp.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-brand-rosy" />
                        <span className="truncate">{comp.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-cocoa border-opacity-10">
                  {viewDeleted ? (
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-red-400 border border-red-900 text-[8px] font-bold uppercase tracking-wider">
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
                          className="bg-brand-card hover:bg-emerald-950 border border-brand-cocoa border-opacity-25 hover:border-emerald-800 text-[9px] font-bold text-gray-300 hover:text-emerald-300 px-2 py-0.5 rounded flex items-center space-x-1 transition-all"
                          title="Restore Profile"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => triggerPermanentDelete(comp)}
                          className="bg-brand-card hover:bg-red-950 border border-brand-cocoa border-opacity-25 hover:border-red-900 text-[9px] font-bold text-gray-400 hover:text-red-300 px-2 py-0.5 rounded flex items-center space-x-1 transition-all"
                          title="Permanently Purge Profile"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Purge</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Only owner or admin can edit */}
                        {((isTeam && comp.createdById === user?.id) || isAdmin) && (
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="p-1 hover:text-brand-rosy text-gray-500 transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => triggerDelete(comp)}
                            className="p-1 hover:text-red-400 text-gray-500 transition-colors"
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

      {/* Details drawer (slides in from right) */}
      {selectedCompany && (
        <div className="w-96 bg-brand-card border-l border-brand-cocoa border-opacity-45 h-full flex flex-col z-30 animate-fade-in relative">
          <div className="p-6 border-b border-brand-cocoa border-opacity-35 flex items-center justify-between bg-brand-black">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Building className="w-4.5 h-4.5 text-brand-rosy" />
              <span>Company Profile</span>
            </h2>
            <button
              onClick={() => setSelectedCompany(null)}
              className="p-1 rounded hover:bg-brand-cocoa text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-400">
            {/* Header branding */}
            <div className="text-center pb-4 border-b border-brand-cocoa border-opacity-20">
              <div className="w-16 h-16 rounded-xl bg-brand-cocoa bg-opacity-35 text-white flex items-center justify-center mx-auto mb-3 shadow-md border border-brand-cocoa border-opacity-20 overflow-hidden">
                <img src="/company-logo.svg" alt={selectedCompany.name} className="w-full h-full object-cover rounded-xl" />
              </div>
              <h3 className="text-base font-bold text-white">{selectedCompany.name}</h3>
              <p className="text-[10px] text-gray-500 mt-1">{selectedCompany.industry || 'Corporate Partner'}</p>
              <div className="mt-2.5 flex justify-center">{getStatusBadge(selectedCompany.status)}</div>
            </div>

            {/* Profile Overview */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1">
                Corporate Overview
              </h4>
              <div className="space-y-2">
                <p className="leading-relaxed">{selectedCompany.description || 'No description provided.'}</p>
                <div className="grid grid-cols-2 gap-3 text-gray-500 mt-2 font-medium">
                  <div>Company Size: <span className="text-white block mt-0.5">{selectedCompany.companySize}</span></div>
                  {selectedCompany.foundedYear && (
                    <div>Founded In: <span className="text-white block mt-0.5">{selectedCompany.foundedYear}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Contacts details */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1">
                Contact Person (HR)
              </h4>
              <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-25 rounded-lg space-y-2">
                <div className="font-bold text-white text-xs">{selectedCompany.contactPersonName}</div>
                <div className="flex items-center space-x-2 text-[10px]">
                  <Mail className="w-3.5 h-3.5 text-brand-rosy" />
                  <span>{selectedCompany.contactPersonEmail}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px]">
                  <Phone className="w-3.5 h-3.5 text-brand-rosy" />
                  <span>{selectedCompany.contactPersonPhone}</span>
                </div>
              </div>
            </div>

            {/* Map Coordinates and Address Details */}
            {selectedCompany.latitude && selectedCompany.longitude && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1">
                  Location Coordinates
                </h4>
                <div className="p-3 bg-brand-dark bg-opacity-35 rounded-lg space-y-2 text-[10px]">
                  <div className="text-gray-300 font-medium leading-relaxed">{selectedCompany.formattedAddress}</div>
                  <div className="flex space-x-4 font-mono text-gray-500">
                    <div>Lat: {selectedCompany.latitude.toFixed(5)}</div>
                    <div>Lng: {selectedCompany.longitude.toFixed(5)}</div>
                  </div>
                  {selectedCompany.googleMapsUrl && (
                    <a
                      href={selectedCompany.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center space-x-1.5 text-brand-rosy hover:text-white font-bold transition-colors"
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
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingCompanyId ? 'Modify Company Profile' : 'Submit a Corporate Partner'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Inputs Pane */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-semibold">Core City Location *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bangalore, Chennai"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 font-semibold">Corporate Website *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://company.com"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-semibold">Company Size *</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
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
                      <label className="text-gray-400">Industry / Domain</label>
                      <input
                        type="text"
                        placeholder="e.g. Software Development"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">Description / Summary *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-3 border-t border-brand-cocoa border-opacity-20 pt-3">
                    <span className="font-bold text-white block uppercase tracking-wider text-[10px]">Contact Officer Details (HR)</span>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-gray-500">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactPersonName}
                          onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                          className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-1.5 px-3 text-white focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-gray-500">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={formData.contactPersonEmail}
                            onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                            className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-1.5 px-3 text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-500">Phone Number *</label>
                          <input
                            type="text"
                            required
                            value={formData.contactPersonPhone}
                            onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                            className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-1.5 px-3 text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Map Selector Pane */}
                <div className="space-y-4 border-l border-brand-cocoa border-opacity-20 pl-6">
                  <div className="space-y-1">
                    <span className="font-bold text-white block uppercase tracking-wider text-[10px]">
                      Map Address Selection
                    </span>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Search address using geolocator or click map directly to drop latitude/longitude coordinate markers.
                    </p>
                  </div>
                  <MapSelector
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                    initialAddress={formData.formattedAddress}
                    onChange={handleMapLocationChange}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2.5 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-6 py-2.5 rounded-lg font-bold shadow-lg"
                >
                  Submit Partner Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-cocoa border-opacity-40 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-2.5 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                {deletePermanent ? 'Permanent Purge' : 'Archive Partner'}
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              {deletePermanent ? (
                <span>Are you sure you want to permanently purge <strong className="text-white">{deleteTargetName}</strong>? This will clear all submission history and cannot be undone.</span>
              ) : (
                <span>Archive <strong className="text-white">{deleteTargetName}</strong>? Soft-deleted profiles are moved to the chunk archive and hidden from normal directories.</span>
              )}
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTargetId(null);
                  setDeleteTargetName('');
                }}
                className="flex-1 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-gray-400 hover:text-white py-2 rounded-lg text-xs font-bold font-mono transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 py-2 rounded-lg text-xs font-bold font-mono transition-all shadow-md"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
