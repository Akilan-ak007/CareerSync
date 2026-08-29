import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Search,
  Plus,
  FileSpreadsheet,
  ArrowUpDown,
  Filter,
  X,
  User,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Trash2,
  Edit2,
  ExternalLink,
  UploadCloud,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export const Students: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filters & State
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // Details drawer
  const [showFormModal, setShowFormModal] = useState(false); // Add/Edit Modal
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    departmentId: '',
    studentType: 'DAY_SCHOLAR',
    email: '',
    phoneNumber: '',
    sslcPercentage: '',
    hscPercentage: '',
    ugPercentage: '',
    pgPercentage: '',
    resumeUrl: '',
    selfIntroUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    placementStatus: 'NOT_PLACED'
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Fetch list
  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.students.list({
        search,
        departmentId: selectedDept,
        studentType: selectedType,
        placementStatus: selectedStatus,
        page,
        limit: 10,
        sortBy,
        sortOrder
      });
      if (res.success) {
        setStudents(res.data.students);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, selectedDept, selectedType, selectedStatus, sortBy, sortOrder, page]);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await api.students.departments();
        if (res.success) setDepartments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadDepts();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Form handlers
  const handleOpenCreate = () => {
    setEditingStudentId(null);
    setFormData({
      name: '',
      registerNumber: '',
      departmentId: departments[0]?.id || '',
      studentType: 'DAY_SCHOLAR',
      email: '',
      phoneNumber: '',
      sslcPercentage: '',
      hscPercentage: '',
      ugPercentage: '',
      pgPercentage: '',
      resumeUrl: '',
      selfIntroUrl: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      placementStatus: 'NOT_PLACED'
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudentId(student.id);
    setFormData({
      name: student.name,
      registerNumber: student.registerNumber,
      departmentId: student.departmentId,
      studentType: student.studentType,
      email: student.email,
      phoneNumber: student.phoneNumber,
      sslcPercentage: String(student.sslcPercentage),
      hscPercentage: String(student.hscPercentage),
      ugPercentage: String(student.ugPercentage),
      pgPercentage: student.pgPercentage ? String(student.pgPercentage) : '',
      resumeUrl: student.resumeUrl,
      selfIntroUrl: student.selfIntroUrl,
      linkedinUrl: student.linkedinUrl,
      githubUrl: student.githubUrl,
      portfolioUrl: student.portfolioUrl,
      placementStatus: student.placementStatus
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await api.students.update(editingStudentId, formData);
      } else {
        await api.students.create(formData);
      }
      setShowFormModal(false);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete Student Profile? This action will hide the student from the portal database.')) return;
    try {
      await api.students.delete(id);
      loadStudents();
      if (selectedStudent?.id === id) setSelectedStudent(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  // Excel handlers
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setImportError(null);
    try {
      const res = await api.students.importPreview(file);
      if (res.success) {
        setImportPreview(res.data);
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse Excel file.');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = importPreview.validRows.map((r: any) => r.data);
      const res = await api.students.importConfirm(payload);
      if (res.success) {
        alert(res.message);
        setShowImportModal(false);
        setExcelFile(null);
        setImportPreview(null);
        loadStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Bulk import transaction failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="h-full flex relative overflow-hidden">
      {/* Main content pane */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Header Action Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">Students Repository</h1>
            <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">Manage academic records and files</p>
          </div>

          {isAdmin && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-40 text-gray-300 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Excel Import</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all shadow-md"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Add New Student</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy transition-all"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
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
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
            >
              <option value="">All Student Types</option>
              <option value="HOSTEL">Hostel Scholar</option>
              <option value="DAY_SCHOLAR">Day Scholar</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
            >
              <option value="">All Placement Statuses</option>
              <option value="NOT_PLACED">Not Placed</option>
              <option value="PLACED">Placed</option>
              <option value="MULTIPLE_OFFERS">Multiple Offers</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Database records Table */}
        <div className="glass-panel overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-sm text-gray-400">No student records found.</p>
              {isAdmin && (
                <button
                  onClick={handleOpenCreate}
                  className="bg-brand-cocoa text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-rosy hover:text-brand-black transition-all"
                >
                  Create manual entry
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    <span className="flex items-center space-x-1">
                      <span>Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('registerNumber')}>
                    <span className="flex items-center space-x-1">
                      <span>Reg. Number</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cocoa divide-opacity-20 text-gray-300">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="hover:bg-brand-card hover:bg-opacity-40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-white">{student.name}</td>
                    <td className="p-4 font-mono">{student.registerNumber}</td>
                    <td className="p-4">{student.department?.code}</td>
                    <td className="p-4 font-mono">{student.email}</td>
                    <td className="p-4">{student.phoneNumber}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          student.placementStatus === 'PLACED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : student.placementStatus === 'MULTIPLE_OFFERS'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {student.placementStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="text-gray-400 hover:text-brand-rosy transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} Students)</span>
            <div className="flex space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Student profile detail view drawer (Slides in on right side) */}
      {selectedStudent && (
        <div className="w-96 bg-brand-card border-l border-brand-cocoa border-opacity-45 h-full flex flex-col z-30 animate-fade-in relative">
          <div className="p-6 border-b border-brand-cocoa border-opacity-35 flex items-center justify-between bg-brand-black">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4.5 h-4.5 text-brand-rosy" />
              <span>Student Profile</span>
            </h2>
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-1 rounded hover:bg-brand-cocoa text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Header info card */}
            <div className="text-center pb-4 border-b border-brand-cocoa border-opacity-20">
              <div className="w-16 h-16 rounded-full bg-brand-cocoa text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                {selectedStudent.name.charAt(0)}
              </div>
              <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
              <p className="text-gray-500 font-mono mt-0.5">{selectedStudent.registerNumber}</p>
              <p className="text-[10px] text-brand-rosy font-semibold uppercase tracking-wider mt-1">{selectedStudent.studentType.replace('_', ' ')}</p>
            </div>

            {/* Academic Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-brand-cocoa border-opacity-25 pb-1">
                <GraduationCap className="w-4 h-4 text-brand-rosy" />
                <span>Academic Record</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-gray-400">
                <div>Department: <span className="text-white block mt-0.5 font-semibold">{selectedStudent.department?.name}</span></div>
                <div>UG CGPA: <span className="text-white block mt-0.5 font-semibold">{selectedStudent.ugPercentage}</span></div>
                <div>SSLC Marks: <span className="text-white block mt-0.5 font-semibold">{selectedStudent.sslcPercentage}%</span></div>
                <div>HSC Marks: <span className="text-white block mt-0.5 font-semibold">{selectedStudent.hscPercentage}%</span></div>
                {selectedStudent.pgPercentage && (
                  <div>PG CGPA: <span className="text-white block mt-0.5 font-semibold">{selectedStudent.pgPercentage}</span></div>
                )}
              </div>
            </div>

            {/* Placement and Offers History */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-brand-cocoa border-opacity-25 pb-1">
                <Briefcase className="w-4 h-4 text-brand-rosy" />
                <span>Recruitment History</span>
              </h4>
              {selectedStudent.offers?.length === 0 ? (
                <div className="text-gray-500 italic p-3 bg-brand-dark bg-opacity-35 rounded-lg text-center">
                  No placement offers logged yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedStudent.offers?.map((offer: any) => (
                    <div key={offer.id} className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white">{offer.company?.name}</span>
                        <span className="px-2 py-0.5 rounded bg-brand-rosy text-brand-black text-[9px] font-black">{offer.ctc} LPA</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{offer.jobRole}</div>
                      <div className="text-[9px] text-gray-500 text-right mt-2">
                        Offer Date: {new Date(offer.offerDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links and Drive files */}
            <div className="space-y-2 pt-2">
              {selectedStudent.resumeUrl && (
                <a
                  href={selectedStudent.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <span className="font-medium">Curriculum Vitae (Resume)</span>
                  <ExternalLink className="w-4 h-4 text-brand-rosy" />
                </a>
              )}
              {selectedStudent.selfIntroUrl && (
                <a
                  href={selectedStudent.selfIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <span className="font-medium">Self Introduction Video</span>
                  <ExternalLink className="w-4 h-4 text-brand-rosy" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Add / Edit manual form modal (Admin only) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingStudentId ? 'Edit Student Details' : 'Manual New Student Entry'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Register Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Student Type *</label>
                  <select
                    value={formData.studentType}
                    onChange={(e) => setFormData({ ...formData, studentType: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                  >
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                    <option value="HOSTEL">Hostel</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 border-t border-brand-cocoa border-opacity-20 pt-4">
                <div className="space-y-1">
                  <label className="text-gray-400">SSLC (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sslcPercentage}
                    onChange={(e) => setFormData({ ...formData, sslcPercentage: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400">HSC (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.hscPercentage}
                    onChange={(e) => setFormData({ ...formData, hscPercentage: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400">UG (CGPA) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.ugPercentage}
                    onChange={(e) => setFormData({ ...formData, ugPercentage: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400">PG (CGPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pgPercentage}
                    onChange={(e) => setFormData({ ...formData, pgPercentage: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-brand-cocoa border-opacity-20 pt-4">
                <div className="space-y-1">
                  <label className="text-gray-400">Resume Link (Google Drive)</label>
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400">Self Introduction Video Link</label>
                  <input
                    type="url"
                    value={formData.selfIntroUrl}
                    onChange={(e) => setFormData({ ...formData, selfIntroUrl: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2 rounded-lg font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Excel import modal (Admin only) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-rosy" />
                <span>Bulk Excel Student Import</span>
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                  setImportPreview(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag & drop upload area */}
            {!importPreview && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-cocoa border-opacity-40 rounded-xl py-12 px-6 bg-brand-dark bg-opacity-20 text-center hover:border-brand-rosy transition-all">
                <UploadCloud className="w-12 h-12 text-brand-rosy mb-4" />
                <p className="text-sm font-bold text-white">Upload your Excel student roster</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-sm">
                  Roster must have headings: <span className="font-mono text-brand-rosy">name, register_number, department, student_type, email, phone_number, sslc_percentage, hsc_percentage, ug_percentage, pg_percentage, resume_url</span>
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-file-uploader"
                />
                <label
                  htmlFor="excel-file-uploader"
                  className="mt-6 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2 rounded-lg font-bold cursor-pointer transition-all shadow-md"
                >
                  Select File
                </label>
              </div>
            )}

            {/* Error file warning */}
            {importError && (
              <div className="mt-4 p-4 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-red-200 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold">File Parsing Error</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{importError}</p>
                </div>
              </div>
            )}

            {/* Upload preview results */}
            {importPreview && (
              <div className="space-y-6">
                {/* Summary boxes */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 p-4 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Sheet Rows</span>
                    <h4 className="text-2xl font-black text-white mt-1">{importPreview.totalRows}</h4>
                  </div>
                  <div className="bg-emerald-950 bg-opacity-20 border border-emerald-900 p-4 rounded-lg text-center">
                    <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Valid & Ready</span>
                    <h4 className="text-2xl font-black text-emerald-400 mt-1">{importPreview.validCount}</h4>
                  </div>
                  <div className="bg-red-950 bg-opacity-20 border border-red-900 p-4 rounded-lg text-center">
                    <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Invalid / Errors</span>
                    <h4 className="text-2xl font-black text-red-400 mt-1">{importPreview.invalidCount}</h4>
                  </div>
                </div>

                {/* Detailed Errors Roster (if any) */}
                {importPreview.invalidRows.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Identified Row Failures ({importPreview.invalidCount})</span>
                    </h4>
                    <div className="max-h-60 overflow-y-auto border border-brand-cocoa border-opacity-30 rounded-lg divide-y divide-brand-cocoa divide-opacity-20 bg-brand-dark bg-opacity-10">
                      {importPreview.invalidRows.map((row: any) => (
                        <div key={row.rowNumber} className="p-3 flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white font-mono">Row {row.rowNumber}</span>
                            <span className="text-gray-500 ml-2">({row.data?.name || 'Empty Name'} - {row.data?.registerNumber || 'Empty Register'})</span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {row.errors.map((err: string, i: number) => (
                                <span key={i} className="bg-red-950 text-red-300 px-2 py-0.5 rounded text-[9px] border border-red-900">
                                  {err}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Preview details */}
                {importPreview.validCount > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Valid Students Preview ({importPreview.validCount})</span>
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-brand-cocoa border-opacity-35 rounded-lg bg-brand-dark bg-opacity-15 font-mono text-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-brand-dark bg-opacity-60 text-gray-500 border-b border-brand-cocoa border-opacity-30">
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Register</th>
                            <th className="p-2">Department</th>
                            <th className="p-2">UG CGPA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-cocoa divide-opacity-10 text-gray-400">
                          {importPreview.validRows.slice(0, 10).map((row: any) => (
                            <tr key={row.rowNumber}>
                              <td className="p-2 text-white font-bold">{row.data.name}</td>
                              <td className="p-2">{row.data.registerNumber}</td>
                              <td className="p-2">{row.data.department}</td>
                              <td className="p-2 text-brand-rosy">{row.data.ugPercentage}</td>
                            </tr>
                          ))}
                          {importPreview.validCount > 10 && (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-gray-600 italic">
                                ...and {importPreview.validCount - 10} more rows
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                  <button
                    onClick={() => {
                      setExcelFile(null);
                      setImportPreview(null);
                    }}
                    className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2.5 rounded-lg font-bold"
                  >
                    Reset & Upload Again
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importPreview.validCount === 0 || importing}
                    className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-6 py-2.5 rounded-lg font-black transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg"
                  >
                    {importing ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm Bulk Import ({importPreview.validCount} Students)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
