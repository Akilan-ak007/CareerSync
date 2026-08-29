import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';
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
  FileCheck,
  Globe,
  Mail,
  Calendar,
  UserX,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-4 h-4 text-white shrink-0 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4 text-blue-400 shrink-0 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const StudentAvatar: React.FC<{ name: string; photoUrl?: string | null; className?: string }> = ({ name, photoUrl, className = 'w-8 h-8 text-xs' }) => {
  const [useFallback, setUseFallback] = useState(false);

  const getRealDriveUrl = () => {
    if (!photoUrl || typeof photoUrl !== 'string') return null;
    const clean = photoUrl.trim();
    if (!clean) return null;

    // Detect mock test IDs like "1Photo_..."
    if (clean.includes('1Photo_') || clean.includes('resume_')) return null;

    const match = clean.match(/(?:file\/d\/|id=|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{15,})/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    return null;
  };

  const directUrl = getRealDriveUrl();
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=5e3838&color=ffffff&size=256&bold=true`;

  return (
    <img
      src={(!useFallback && directUrl) ? directUrl : fallbackUrl}
      alt={name}
      referrerPolicy="no-referrer"
      className={`${className} rounded-full object-cover border border-brand-cocoa shrink-0 bg-brand-dark shadow-sm`}
      onError={() => setUseFallback(true)}
    />
  );
};

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
    collegeEmail: '',
    personalEmail: '',
    phoneNumber: '',
    sslcPercentage: '',
    hscPercentage: '',
    ugPercentage: '',
    pgPercentage: '',
    resumeUrl: '',
    selfIntroUrl: '',
    linkedinUrl: '',
    linkedinId: '',
    githubUrl: '',
    githubId: '',
    portfolioUrl: '',
    photoUrl: '',
    graduationDate: '',
    placementStatus: 'NOT_PLACED'
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Termination States
  const [viewTerminated, setViewTerminated] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [studentToTerminate, setStudentToTerminate] = useState<any>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminating, setTerminating] = useState(false);

  // Fetch list
  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.students.list({
        search,
        departmentId: selectedDept,
        studentType: selectedType,
        placementStatus: viewTerminated ? 'TERMINATED' : selectedStatus,
        isTerminated: viewTerminated ? 'true' : 'false',
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
  }, [search, selectedDept, selectedType, selectedStatus, sortBy, sortOrder, page, viewTerminated]);

  const handleOpenTerminate = (student: any) => {
    setStudentToTerminate(student);
    setTerminationReason('');
    setShowTerminateModal(true);
  };

  const handleConfirmTerminate = async () => {
    if (!studentToTerminate) return;
    try {
      setTerminating(true);
      const res = await api.students.terminate(studentToTerminate.id, terminationReason);
      if (res.success) {
        setShowTerminateModal(false);
        setStudentToTerminate(null);
        if (selectedStudent?.id === studentToTerminate.id) setSelectedStudent(null);
        loadStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Termination failed.');
    } finally {
      setTerminating(false);
    }
  };

  const handleRestoreStudent = async (studentId: string) => {
    if (!window.confirm('Re-instate this student to active status?')) return;
    try {
      const res = await api.students.restore(studentId);
      if (res.success) {
        loadStudents();
        if (selectedStudent?.id === studentId) setSelectedStudent(null);
      }
    } catch (err: any) {
      alert(err.message || 'Restoration failed.');
    }
  };

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
      collegeEmail: '',
      personalEmail: '',
      phoneNumber: '',
      sslcPercentage: '',
      hscPercentage: '',
      ugPercentage: '',
      pgPercentage: '',
      resumeUrl: '',
      selfIntroUrl: '',
      linkedinUrl: '',
      linkedinId: '',
      githubUrl: '',
      githubId: '',
      portfolioUrl: '',
      photoUrl: '',
      graduationDate: '',
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
      collegeEmail: student.collegeEmail || student.email,
      personalEmail: student.personalEmail || '',
      phoneNumber: student.phoneNumber,
      sslcPercentage: String(student.sslcPercentage),
      hscPercentage: String(student.hscPercentage),
      ugPercentage: String(student.ugPercentage),
      pgPercentage: student.pgPercentage ? String(student.pgPercentage) : '',
      resumeUrl: student.resumeUrl || '',
      selfIntroUrl: student.selfIntroUrl || '',
      linkedinUrl: student.linkedinUrl || '',
      linkedinId: student.linkedinId || '',
      githubUrl: student.githubUrl || '',
      githubId: student.githubId || '',
      portfolioUrl: student.portfolioUrl || '',
      photoUrl: student.photoUrl || '',
      graduationDate: student.graduationDate ? new Date(student.graduationDate).toISOString().split('T')[0] : '',
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

        {/* Tab Selector: Active vs Terminated List */}
        <div className="flex border-b border-brand-cocoa border-opacity-25 pb-px font-mono text-[10px]">
          <button
            onClick={() => { setViewTerminated(false); setPage(1); }}
            className={`pb-2 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 ${
              !viewTerminated ? 'border-brand-rosy text-white font-black' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ACTIVE STUDENTS</span>
          </button>
          <button
            onClick={() => { setViewTerminated(true); setPage(1); }}
            className={`pb-2 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 ${
              viewTerminated ? 'border-red-500 text-red-300 font-black' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-red-400" />
            <span>TERMINATED STUDENTS LIST</span>
          </button>
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
                    <td className="p-4 font-bold text-white flex items-center space-x-3">
                      <StudentAvatar name={student.name} photoUrl={student.photoUrl} className="w-8 h-8 text-xs" />
                      <div>
                        <div>{student.name}</div>
                        {student.graduationDate && !isNaN(new Date(student.graduationDate).getTime()) && new Date(student.graduationDate).getFullYear() > 1970 && (
                          <div className="text-[10px] text-gray-500 font-normal">
                            Grad: {new Date(student.graduationDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono">{student.registerNumber}</td>
                    <td className="p-4">{student.department?.code}</td>
                    <td className="p-4 font-mono">{student.email}</td>
                    <td className="p-4">{student.phoneNumber}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          student.placementStatus === 'TERMINATED' || student.isTerminated
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : student.placementStatus === 'PLACED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : student.placementStatus === 'MULTIPLE_OFFERS'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {student.isTerminated ? 'TERMINATED' : student.placementStatus.replace('_', ' ')}
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
                            {!student.isTerminated ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(student)}
                                  className="text-gray-400 hover:text-brand-rosy transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenTerminate(student)}
                                  className="text-amber-500 hover:text-red-400 transition-colors"
                                  title="Terminate Student"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(student.id)}
                                  className="text-gray-500 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestoreStudent(student.id)}
                                className="bg-emerald-950 hover:bg-emerald-800 text-emerald-300 px-2.5 py-1 rounded text-[10px] font-bold border border-emerald-800 flex items-center space-x-1 transition-all"
                                title="Re-instate / Restore Student"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Re-instate</span>
                              </button>
                            )}
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
              <StudentAvatar name={selectedStudent.name} photoUrl={selectedStudent.photoUrl} className="w-20 h-20 text-3xl mx-auto mb-3 shadow-lg" />
              <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
              <p className="text-gray-500 font-mono mt-0.5">{selectedStudent.registerNumber}</p>
              <p className="text-[10px] text-brand-rosy font-semibold uppercase tracking-wider mt-1">{selectedStudent.studentType.replace('_', ' ')}</p>
              {selectedStudent.isTerminated && (
                <div className="mt-3 p-3 bg-red-950 bg-opacity-60 border border-red-800 rounded-lg text-left space-y-1">
                  <div className="flex items-center space-x-1.5 text-red-300 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    <span>TERMINATED STUDENT RECORD</span>
                  </div>
                  {selectedStudent.terminatedAt && (
                    <div className="text-[10px] text-red-400 font-mono">
                      Terminated on: {new Date(selectedStudent.terminatedAt).toLocaleDateString()}
                    </div>
                  )}
                  {selectedStudent.terminationReason && (
                    <div className="text-[11px] text-gray-300 italic pt-1 border-t border-red-900 border-opacity-40">
                      "{selectedStudent.terminationReason}"
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleRestoreStudent(selectedStudent.id)}
                      className="mt-2 w-full bg-emerald-950 hover:bg-emerald-800 text-emerald-300 py-1.5 rounded text-xs font-bold border border-emerald-800 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-instate / Restore Student</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Email & Contact Info */}
            <div className="space-y-2 p-3 bg-brand-dark bg-opacity-30 rounded-lg border border-brand-cocoa border-opacity-20">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4 text-brand-rosy shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">College Email</span>
                  <span className="font-mono text-white">{selectedStudent.collegeEmail || selectedStudent.email}</span>
                </div>
              </div>
              {selectedStudent.personalEmail && (
                <div className="flex items-center space-x-2 text-gray-300 pt-1 border-t border-brand-cocoa border-opacity-15">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Personal Email</span>
                    <span className="font-mono text-white">{selectedStudent.personalEmail}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Social & Portfolio Links */}
            <div className="grid grid-cols-1 gap-2">
              {selectedStudent.githubUrl || selectedStudent.githubId ? (
                <a
                  href={selectedStudent.githubUrl || `https://github.com/${selectedStudent.githubId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-brand-dark hover:bg-brand-cocoa border border-brand-cocoa border-opacity-30 rounded-lg text-white font-medium transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <GithubIcon />
                    <span>GitHub: <span className="font-mono text-brand-rosy">{selectedStudent.githubId || 'Profile'}</span></span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ) : null}

              {selectedStudent.linkedinUrl || selectedStudent.linkedinId ? (
                <a
                  href={selectedStudent.linkedinUrl || `https://linkedin.com/in/${selectedStudent.linkedinId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-brand-dark hover:bg-brand-cocoa border border-brand-cocoa border-opacity-30 rounded-lg text-white font-medium transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <LinkedinIcon />
                    <span>LinkedIn: <span className="font-mono text-blue-300">{selectedStudent.linkedinId || 'Profile'}</span></span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ) : null}

              {selectedStudent.portfolioUrl ? (
                <a
                  href={selectedStudent.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-brand-dark hover:bg-brand-cocoa border border-brand-cocoa border-opacity-30 rounded-lg text-white font-medium transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Portfolio Website</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ) : null}
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
                  <label className="text-gray-400 font-semibold">College Email ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value, collegeEmail: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Personal Email ID</label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
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
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Graduation Date</label>
                  <input
                    type="date"
                    value={formData.graduationDate}
                    onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Photo Section */}
              <div className="space-y-2 border-t border-brand-cocoa border-opacity-20 pt-4">
                <label className="text-gray-400 font-semibold flex items-center justify-between">
                  <span>Student Photo (Google Drive Link / Image URL)</span>
                  {formData.photoUrl && (
                    <span className="text-[10px] text-brand-rosy">Auto-converts Google Drive Share Links</span>
                  )}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="flex-1 bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                  {formData.photoUrl && (
                    <img
                      src={getGoogleDriveImageUrl(formData.photoUrl) || ''}
                      alt="Preview"
                      className="w-9 h-9 rounded-full object-cover border border-brand-rosy shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              {/* GitHub, LinkedIn, Portfolio Links & IDs */}
              <div className="grid grid-cols-2 gap-4 border-t border-brand-cocoa border-opacity-20 pt-4">
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">GitHub ID / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. akilan-dev"
                    value={formData.githubId}
                    onChange={(e) => setFormData({ ...formData, githubId: e.target.value, githubUrl: e.target.value ? `https://github.com/${e.target.value}` : formData.githubUrl })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">LinkedIn ID / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. akilan-profile"
                    value={formData.linkedinId}
                    onChange={(e) => setFormData({ ...formData, linkedinId: e.target.value, linkedinUrl: e.target.value ? `https://linkedin.com/in/${e.target.value}` : formData.linkedinUrl })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-gray-400 font-semibold">Portfolio Website Link</label>
                  <input
                    type="url"
                    placeholder="https://akilan.dev"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
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
                <p className="text-[10px] text-gray-400 mt-2 max-w-lg leading-relaxed">
                  Supported Headings: <span className="font-mono text-brand-rosy">name, register_number, department, student_type, email, college_email, personal_email, phone_number, sslc_percentage, hsc_percentage, ug_percentage, photo_url (Google Drive), graduation_date, github_id, linkedin_id, portfolio_url</span>
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

      {/* Terminate Student Modal */}
      {showTerminateModal && studentToTerminate && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-red-900 border-opacity-50 rounded-xl shadow-2xl p-6 space-y-5 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-red-900 border-opacity-30 pb-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Terminate Student Profile</span>
              </div>
              <button onClick={() => setShowTerminateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-gray-300">
                Are you sure you want to terminate <strong className="text-white">{studentToTerminate.name}</strong> ({studentToTerminate.registerNumber})?
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Terminating a student will move their record out of active placement repository to the <strong className="text-red-300">Terminated Students List</strong> and set their placement status to <span className="text-red-400 font-bold font-mono">TERMINATED</span>.
              </p>

              <div className="space-y-1 pt-2">
                <label className="text-gray-400 font-semibold block">Termination Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Disciplinary action, policy breach, academic drop out..."
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none focus:border-red-500 resize-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-brand-cocoa border-opacity-20">
              <button
                type="button"
                onClick={() => setShowTerminateModal(false)}
                className="bg-brand-dark hover:bg-brand-cocoa text-gray-300 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={terminating || !terminationReason.trim()}
                onClick={handleConfirmTerminate}
                className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 px-5 py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-md"
              >
                <UserX className="w-4 h-4" />
                <span>{terminating ? 'Terminating...' : 'Confirm Termination'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
