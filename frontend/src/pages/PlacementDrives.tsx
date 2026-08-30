import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Laptop,
  GraduationCap,
  Percent,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  FileCheck,
  UserCheck,
  FileText,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  Briefcase,
  Building,
  Mail,
  Phone,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PlacementStudentAvatar: React.FC<{ name: string; photoUrl?: string | null; className?: string }> = ({ name, photoUrl, className = 'w-6 h-6 text-[10px]' }) => {
  const [useFallback, setUseFallback] = useState(false);
  const getRealDriveUrl = () => {
    if (!photoUrl || typeof photoUrl !== 'string') return null;
    const clean = photoUrl.trim();
    if (!clean || clean.includes('1Photo_') || clean.includes('resume_')) return null;
    const match = clean.match(/(?:file\/d\/|id=|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{15,})/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
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

export const PlacementDrives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isTeam = user?.role === 'PLACEMENT_TEAM';

  // State
  const [drives, setDrives] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1 });

  // JD & ATS Matching States
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showJdEditor, setShowJdEditor] = useState(false);
  const [editedJdInfo, setEditedJdInfo] = useState<any>(null);

  // Filters
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modals & Drawers
  const [selectedDrive, setSelectedDrive] = useState<any>(null); // Detail drawer
  const [showFormModal, setShowFormModal] = useState(false); // Add/Edit Form
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const [completeSearch, setCompleteSearch] = useState('');
  const [completeDept, setCompleteDept] = useState('');

  // Form Fields
  const [formData, setFormData] = useState<any>({
    companyId: '',
    driveDate: '',
    driveLocation: '',
    driveType: 'ON_CAMPUS',
    jobRole: '',
    eligibleDepartments: [],
    minimumCgpa: '6.5',
    maximumBacklogs: '0',
    ctc: '5.0',
    status: 'UPCOMING'
  });

  // Completion modal
  const [completingDrive, setCompletingDrive] = useState<any | null>(null);
  const [completionData, setCompletionData] = useState<any>({
    ctc: '',
    highestCtc: '',
    averageCtc: '',
    lowestCtc: '',
    selectedStudentIds: [],
    participatedStudentIds: [],
  });
  const [completionLoading, setCompletionLoading] = useState(false);

  // Filter completing drive students dynamically during render
  const filteredCompletingStudents = completingDrive?.students?.filter((item: any) => {
    const sName = item.student?.name || '';
    const sReg = item.student?.registerNumber || '';
    const sDept = item.student?.department?.code || '';
    
    const searchMatch = 
      sName.toLowerCase().includes(completeSearch.toLowerCase()) || 
      sReg.toLowerCase().includes(completeSearch.toLowerCase());
      
    const deptMatch = completeDept === '' || sDept === completeDept;
    
    return searchMatch && deptMatch;
  }) || [];

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDrive) return;
    try {
      setUploadStatus('Uploading...');
      const res = await api.ats.uploadJd(selectedDrive.id, file);
      if (res.success) {
        setUploadStatus('Uploaded successfully!');
        setSelectedDrive({
          ...selectedDrive,
          jdFileName: res.data.jdFileName,
          jdFileSize: res.data.jdFileSize,
          jdFileUrl: res.data.jdFileUrl,
          jdExtracted: res.data.jdExtracted,
          jdExtractedInfo: res.data.jdExtractedInfo
        });
        loadDrives();
      } else {
        setUploadStatus('Upload failed: ' + res.message);
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatus('Upload failed: ' + err.message);
    }
  };

  const handleJdDelete = async () => {
    if (!selectedDrive || !window.confirm('Are you sure you want to remove this Job Description PDF? This will reset all associated AI extractions.')) return;
    try {
      setUploadStatus('Removing...');
      const res = await api.ats.removeJd(selectedDrive.id);
      if (res.success) {
        setUploadStatus('Removed successfully.');
        setTimeout(() => setUploadStatus(null), 800);
        setSelectedDrive({
          ...selectedDrive,
          jdFileName: null,
          jdFileSize: null,
          jdFileUrl: null,
          jdExtracted: false,
          jdExtractedInfo: null
        });
        loadDrives();
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to remove Job Description PDF.');
      setUploadStatus(null);
    }
  };

  const handleJdExtraction = async () => {
    if (!selectedDrive) return;
    try {
      setIsExtracting(true);
      // Simulate extraction loaders
      const extractionStages = [
        'Extracting raw PDF text...',
        'Parsing job title & qualifications...',
        'Analyzing required technical keywords...',
        'Compiling eligibility checklist...'
      ];

      for (const stage of extractionStages) {
        setUploadStatus(stage);
        await new Promise((r) => setTimeout(r, 650));
      }

      const res = await api.ats.extractJd(selectedDrive.id);
      if (res.success) {
        setUploadStatus('AI Extraction Complete.');
        setTimeout(() => setUploadStatus(null), 800);
        setSelectedDrive({
          ...selectedDrive,
          jdExtracted: true,
          jdExtractedInfo: res.data.jdExtractedInfo
        });
        loadDrives();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('AI Extraction failed: ' + err.message);
      setUploadStatus(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveJdEdits = async () => {
    if (!selectedDrive || !editedJdInfo) return;
    try {
      const res = await api.ats.updateJd(selectedDrive.id, editedJdInfo);
      if (res.success) {
        toast.success('Job Description updated successfully.');
        setSelectedDrive({
          ...selectedDrive,
          jdExtractedInfo: editedJdInfo
        });
        setShowJdEditor(false);
        loadDrives();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save Job Description edits.');
    }
  };

  const handleSelectDrive = async (drive: any) => {
    try {
      const res = await api.drives.get(drive.id);
      if (res.success) {
        setSelectedDrive(res.data);
      } else {
        setSelectedDrive(drive);
      }
    } catch (err) {
      console.error(err);
      setSelectedDrive(drive);
    }
  };

  const exportPlacedStudents = (drive: any) => {
    if (!drive || !drive.students) return;
    
    // Filter placed students
    const placed = drive.students.filter((s: any) => s.selected === true);
    if (placed.length === 0) {
      toast.error("No students are marked as Placed (Selected) in this drive yet.");
      return;
    }

    const formatted = placed.map((item: any, idx: number) => ({
      'S.No': idx + 1,
      'Name': item.student?.name,
      'Register Number': item.student?.registerNumber,
      'Department': item.student?.department?.name || 'N/A',
      'Dept Code': item.student?.department?.code || 'N/A',
      'Email': item.student?.email,
      'Phone': item.student?.phoneNumber,
      'UG CGPA': item.student?.ugPercentage,
      'Package CTC (LPA)': drive.ctc,
      'Recruitment Type': drive.driveType,
      'Placement Status': 'PLACED'
    }));

    const worksheet = utils.json_to_sheet(formatted);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Placed Students');
    
    writeFile(workbook, `${drive.company?.name || 'Drive'}_Placed_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const loadDrives = async () => {
    try {
      setLoading(true);
      const res = await api.drives.list({
        companyId: selectedCompany,
        status: selectedStatus,
        department: selectedDept,
        page,
        limit: 10
      });
      if (res.success) {
        setDrives(res.data.drives);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, [selectedCompany, selectedStatus, selectedDept, page]);

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

  // Form handlers
  const handleOpenCreate = () => {
    if (companies.length === 0) {
      alert('You must have at least one APPROVED company in the directory to schedule a drive.');
      return;
    }
    setEditingDriveId(null);
    setFormData({
      companyId: companies[0]?.id || '',
      driveDate: '',
      driveLocation: '',
      driveType: 'ON_CAMPUS',
      jobRole: '',
      eligibleDepartments: [departments[0]?.code || 'CSE'],
      minimumCgpa: '6.5',
      maximumBacklogs: '0',
      ctc: '5.0',
      status: 'UPCOMING'
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (drive: any) => {
    setEditingDriveId(drive.id);
    setFormData({
      companyId: drive.companyId,
      driveDate: new Date(drive.driveDate).toISOString().split('T')[0],
      driveLocation: drive.driveLocation,
      driveType: drive.driveType,
      jobRole: drive.jobRole,
      eligibleDepartments: drive.eligibleDepartments,
      minimumCgpa: String(drive.minimumCgpa),
      maximumBacklogs: String(drive.maximumBacklogs),
      ctc: String(drive.ctc),
      status: drive.status
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriveId) {
        await api.drives.update(editingDriveId, formData);
        toast.success('Placement drive updated.');
      } else {
        await api.drives.create(formData);
        toast.success('New placement drive scheduled!');
      }
      setShowFormModal(false);
      loadDrives();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete Placement Drive record? This cannot be undone.')) return;
    try {
      await api.drives.delete(id);
      toast.success('Placement drive record deleted.');
      loadDrives();
      if (selectedDrive?.id === id) setSelectedDrive(null);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed.');
    }
  };

  // Completion setup
  const handleOpenComplete = async (drive: any) => {
    setSelectedDrive(null);
    setCompleteSearch('');
    setCompleteDept('');
    try {
      // Fetch complete details including registered students
      const details = await api.drives.get(drive.id);
      if (details.success) {
        setCompletingDrive(details.data);
        setCompletionData({
          ctc: String(drive.ctc),
          highestCtc: String(drive.ctc),
          averageCtc: String(drive.ctc),
          lowestCtc: String(drive.ctc),
          selectedStudentIds: [],
          participatedStudentIds: details.data.students.map((s: any) => s.studentId), // Default everyone participated
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registered student candidates.');
    }
  };

  const handleStudentCheckbox = (studentId: string, listType: 'participatedStudentIds' | 'selectedStudentIds') => {
    const list = [...completionData[listType]];
    if (list.includes(studentId)) {
      setCompletionData({
        ...completionData,
        [listType]: list.filter((id) => id !== studentId),
      });
    } else {
      // If student is selected, they must have also participated
      const updateObj: any = {
        [listType]: [...list, studentId],
      };
      if (listType === 'selectedStudentIds' && !completionData.participatedStudentIds.includes(studentId)) {
        updateObj.participatedStudentIds = [...completionData.participatedStudentIds, studentId];
      }
      setCompletionData({
        ...completionData,
        ...updateObj,
      });
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingDrive) return;

    setCompletionLoading(true);
    try {
      const res = await api.drives.complete(completingDrive.id, completionData);
      if (res.success) {
        toast.success(res.message);
        setCompletingDrive(null);
        loadDrives();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete drive transaction.');
    } finally {
      setCompletionLoading(false);
    }
  };

  const handleDeptCheckbox = (code: string) => {
    const active = [...formData.eligibleDepartments];
    if (active.includes(code)) {
      setFormData({ ...formData, eligibleDepartments: active.filter((c) => c !== code) });
    } else {
      setFormData({ ...formData, eligibleDepartments: [...active, code] });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <CheckCircle className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'ONGOING') {
      return (
        <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <Clock className="w-3 h-3 animate-pulse" />
          <span>Hot</span>
        </span>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
          <XCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 w-max">
        <Clock className="w-3 h-3" />
        <span>Warm</span>
      </span>
    );
  };

  return (
    <div className="h-full flex relative overflow-hidden text-xs text-slate-800">
      {/* Table grid pane */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Placement Drives</h1>
            <p className="text-xs text-purple-800 uppercase tracking-wider font-extrabold mt-0.5">Schedule and track recruitment sessions</p>
          </div>

          {!isManager && (
            <button
              onClick={handleOpenCreate}
              className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center space-x-2 transition-all shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Schedule Drive</span>
            </button>
          )}
        </div>

        {/* Toolbar Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-700 transition-all"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-700 transition-all"
            >
              <option value="">All Eligible Streams</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-700 transition-all"
            >
              <option value="">All Drive Statuses</option>
              <option value="UPCOMING">Upcoming Drives</option>
              <option value="ONGOING">Ongoing Drives</option>
              <option value="COMPLETED">Completed Drives</option>
              <option value="CANCELLED">Cancelled Drives</option>
            </select>
          </div>
        </div>

        {/* Drives Table */}
        <div className="glass-panel overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <span className="w-8 h-8 border-3 border-purple-800 border-t-transparent rounded-full inline-block animate-spin" />
            </div>
          ) : drives.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-sm text-slate-500 font-medium">No placement drives found.</p>
              {!isManager && (
                <button
                  onClick={handleOpenCreate}
                  className="bg-purple-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-950 transition-all shadow-xs"
                >
                  Schedule a Recruitment Drive
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role & Package</th>
                  <th className="p-4">Drive Date</th>
                  <th className="p-4">Location & Type</th>
                  <th className="p-4">Eligibility</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {drives.map((drive) => (
                  <tr
                    key={drive.id}
                    onClick={() => handleSelectDrive(drive)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-extrabold">
                          {drive.company?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{drive.company?.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{drive.company?.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{drive.jobRole}</div>
                      <div className="text-xs text-purple-800 font-extrabold mt-0.5">{drive.ctc} LPA</div>
                    </td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{new Date(drive.driveDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-purple-700" />
                        <span>{drive.driveLocation}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-1 uppercase font-extrabold tracking-wider">
                        {drive.driveType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <GraduationCap className="w-4 h-4 text-purple-700" />
                        <span className="font-bold text-slate-900">CGPA: {drive.minimumCgpa}+</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(drive.eligibleDepartments || []).map((code: string) => (
                          <span key={code} className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-800 font-extrabold border border-slate-200">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(drive.status)}</td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => handleSelectDrive(drive)}
                          className="text-slate-500 hover:text-slate-900 transition-all p-1 hover:bg-slate-100 rounded"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isManager && drive.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenComplete(drive)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center space-x-1 transition-all shadow-xs"
                            title="Complete Drive"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                        {!isManager && drive.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenEdit(drive)}
                            className="text-slate-500 hover:text-purple-800 transition-all p-1 hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(drive.id)}
                            className="text-slate-400 hover:text-rose-600 transition-all p-1 hover:bg-slate-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details drawer (Floating Backdrop Overlay Modal) */}
      {selectedDrive && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-fade-in"
          onClick={() => setSelectedDrive(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Laptop className="w-4.5 h-4.5 text-purple-700" />
                <span>Drive Overview & Requirements</span>
              </h2>
              <button
                onClick={() => setSelectedDrive(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              <div className="text-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">{selectedDrive.company?.name}</h3>
                <p className="text-xs text-purple-800 font-extrabold uppercase tracking-wider mt-1">{selectedDrive.jobRole}</p>
                <div className="mt-2.5 flex justify-center">{getStatusBadge(selectedDrive.status)}</div>
              </div>

              {/* Criteria */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Eligibility Criteria
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600 font-bold">
                  <div>Min CGPA: <span className="text-slate-900 block mt-0.5 font-mono">{selectedDrive.minimumCgpa}</span></div>
                  <div>Max Backlogs: <span className="text-slate-900 block mt-0.5 font-mono">{selectedDrive.maximumBacklogs}</span></div>
                  <div>Drive Type: <span className="text-slate-900 block mt-0.5 uppercase">{selectedDrive.driveType.replace('_', ' ')}</span></div>
                  <div>Package Offer: <span className="text-purple-800 block mt-0.5 font-mono">{selectedDrive.ctc} LPA</span></div>
                </div>
              </div>

              {/* Company Info Card */}
              {selectedDrive.company && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-700" />
                    <span>Corporate Profile</span>
                  </h4>
                  <div className="space-y-2 text-slate-600 font-semibold">
                    <div className="flex justify-between">
                      <span>Industry:</span>
                      <span className="text-slate-900 font-bold">{selectedDrive.company.industry || 'IT / Software'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-slate-900 font-bold capitalize">{selectedDrive.company.location}</span>
                    </div>
                    {selectedDrive.company.website && (
                      <div className="flex justify-between">
                        <span>Website:</span>
                        <a
                          href={selectedDrive.company.website.startsWith('http') ? selectedDrive.company.website : `https://${selectedDrive.company.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-800 font-bold hover:underline flex items-center space-x-1"
                        >
                          <span>Visit Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {selectedDrive.company.companySize && (
                      <div className="flex justify-between">
                        <span>Staff Size:</span>
                        <span className="text-slate-900 font-bold">{selectedDrive.company.companySize}</span>
                      </div>
                    )}
                    {selectedDrive.company.contactPersonName && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contact Representative</div>
                        <div className="text-slate-900 font-extrabold mt-0.5">{selectedDrive.company.contactPersonName}</div>
                        {selectedDrive.company.contactPersonEmail && (
                          <div className="text-[10px] text-slate-600 flex items-center space-x-1 mt-0.5 font-mono">
                            <Mail className="w-3 h-3 text-purple-700" />
                            <span>{selectedDrive.company.contactPersonEmail}</span>
                          </div>
                        )}
                        {selectedDrive.company.contactPersonPhone && (
                          <div className="text-[10px] text-slate-600 flex items-center space-x-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-purple-700" />
                            <span>{selectedDrive.company.contactPersonPhone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offer Generation & Placed Students Panel */}
              {selectedDrive.offersCount > 0 && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-extrabold text-purple-900 uppercase tracking-wider flex items-center justify-between border-b border-purple-200 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-purple-800" />
                      <span>Hiring Offers ({selectedDrive.offersCount})</span>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300 font-black">
                      VERIFIED OFFERS
                    </span>
                  </h4>

                  <div className="space-y-2">
                    <div className="text-slate-700 font-bold flex justify-between items-center text-xs">
                      <span>Official Offers Issued:</span>
                      <span className="font-mono font-black text-purple-900 text-sm">{selectedDrive.offersCount}</span>
                    </div>

                    {selectedDrive.offers && selectedDrive.offers.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Placed Candidates Roster:</div>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {selectedDrive.offers.map((off: any) => (
                            <div key={off.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-900 font-black flex items-center justify-center text-[10px]">
                                  {off.student?.name?.[0]}
                                </div>
                                <div className="truncate">
                                  <div className="font-extrabold text-slate-900 truncate">{off.student?.name}</div>
                                  <div className="text-[9px] text-slate-500 font-mono">{off.student?.registerNumber}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                {off.ctc || selectedDrive.ctc} LPA
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => exportPlacedStudents(selectedDrive)}
                      className="w-full mt-3 bg-purple-900 hover:bg-purple-950 text-white py-2 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Placed Roster (.xlsx)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Job Description & AI Matching section */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Job Description & AI Matching</span>
                </h4>

                {(() => {
                  return (
                    <div className="space-y-3">
                      {/* JD File Attachment */}
                      {selectedDrive.jobDescriptionUrl ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 truncate">
                            <FileText className="w-5 h-5 text-purple-700 shrink-0" />
                            <div className="truncate">
                              <div className="font-extrabold text-slate-900 truncate">Job Description Document</div>
                              <div className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Document Uploaded</span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={selectedDrive.jobDescriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white hover:bg-slate-100 text-purple-900 border border-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 transition-all shrink-0 shadow-xs"
                          >
                            <span>View JD</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-medium flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>No Job Description PDF attached yet. Upload a JD to enable AI ATS matching.</span>
                        </div>
                      )}

                      {/* AI Extraction state */}
                      {!selectedDrive.jdExtracted ? (
                        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-purple-700" />
                            <span className="font-extrabold text-purple-900 text-xs">Automated AI Requirements Extractor</span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            Extract required skills, keywords, experience, and candidate criteria automatically from the uploaded JD document using AI.
                          </p>

                          {isAdmin ? (
                            <button
                              onClick={() => handleJdExtraction()}
                              disabled={isExtracting}
                              className="w-full bg-purple-900 hover:bg-purple-950 text-white py-2.5 rounded-xl font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-xs text-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{isExtracting ? 'Extracting Requirements...' : 'Extract AI Requirements & Match ATS'}</span>
                            </button>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic text-center">Extraction details pending...</p>
                          )}
                        </div>
                      ) : (
                        /* If extracted, display options */
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setEditedJdInfo(selectedDrive.jdExtractedInfo);
                              setShowJdEditor(true);
                            }}
                            className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 py-2 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 text-xs shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                            <span>Review Requirements (AI)</span>
                          </button>

                          {/* Go to ATS Candidates matching screen */}
                          <button
                            onClick={() => {
                              setSelectedDrive(null);
                              navigate(`/drives/${selectedDrive.id}/ats`);
                            }}
                            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-2.5 rounded-xl font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-md text-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>View ATS Candidate Matching</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {editingDriveId ? 'Update Drive Details' : 'Schedule Recruitment Drive'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Select Corporate Partner *</label>
                  <select
                    disabled={!!editingDriveId}
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Job Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graduate Trainee Engineer"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Drive Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.driveDate}
                    onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Drive Location / Hall *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RGU Seminar Hall A"
                    value={formData.driveLocation}
                    onChange={(e) => setFormData({ ...formData, driveLocation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Recruitment Type *</label>
                  <select
                    value={formData.driveType}
                    onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  >
                    <option value="ON_CAMPUS">On Campus Recruitment</option>
                    <option value="OFF_CAMPUS">Off Campus Recruitment</option>
                    <option value="VIRTUAL">Virtual Recruitment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Drive Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Package CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono focus:outline-none focus:border-purple-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Minimum CGPA Cutoff *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.minimumCgpa}
                    onChange={(e) => setFormData({ ...formData, minimumCgpa: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono focus:outline-none focus:border-purple-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold">Maximum Backlogs Allowed *</label>
                  <input
                    type="number"
                    required
                    value={formData.maximumBacklogs}
                    onChange={(e) => setFormData({ ...formData, maximumBacklogs: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono focus:outline-none focus:border-purple-700"
                  />
                </div>
              </div>

              {/* Eligible departments checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-slate-800 font-extrabold block">Eligible Streams / Departments *</label>
                <div className="flex flex-wrap gap-4">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center space-x-2 cursor-pointer text-slate-700 font-bold hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={formData.eligibleDepartments.includes(d.code)}
                        onChange={() => handleDeptCheckbox(d.code)}
                        className="rounded border-slate-300 text-purple-800 focus:ring-0"
                      />
                      <span>{d.name} ({d.code})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2.5 rounded-xl font-extrabold shadow-md"
                >
                  Schedule Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Complete Drive Stats and Student checkboxes modal */}
      {completingDrive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 overflow-y-auto max-h-[90vh] text-xs text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Mark Drive as Completed — {completingDrive.company?.name}</span>
              </h3>
              <button
                onClick={() => setCompletingDrive(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-6">
              {/* CTC Metrics inputs */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-slate-600 font-extrabold">Base CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.ctc}
                    onChange={(e) => setCompletionData({ ...completionData, ctc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-extrabold">Highest CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.highestCtc}
                    onChange={(e) => setCompletionData({ ...completionData, highestCtc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-extrabold">Average CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.averageCtc}
                    onChange={(e) => setCompletionData({ ...completionData, averageCtc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-extrabold">Lowest CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.lowestCtc}
                    onChange={(e) => setCompletionData({ ...completionData, lowestCtc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Student checkboxes selection list */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider flex justify-between items-center">
                  <span>Student Selectivity List ({completionData.selectedStudentIds.length} Offers Selected)</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Check students who received offers.</span>
                </h4>

                {/* Search & Filter bar for Complete Modal */}
                {completingDrive.students?.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search candidate by name, register number..."
                        value={completeSearch}
                        onChange={(e) => setCompleteSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg h-9 pl-9 pr-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-purple-700 transition-all"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        value={completeDept}
                        onChange={(e) => setCompleteDept(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg h-9 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-purple-700 transition-all"
                      >
                        <option value="">All Departments</option>
                        {Array.from(new Set((completingDrive.students || []).map((item: any) => item.student?.department?.code).filter(Boolean))).map((deptCode: any) => (
                          <option key={deptCode} value={deptCode}>{deptCode}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {completingDrive.students?.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 italic bg-slate-50 rounded-xl border border-slate-200">
                    No eligible students are registered/participated in this drive.
                  </div>
                ) : filteredCompletingStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-xl border border-slate-200">
                    No students match search or department filter criteria.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                        <tr className="font-mono text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                          <th className="p-3 text-center w-20">Selected</th>
                          <th className="p-3 w-32">Register No.</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3 w-32">Department</th>
                          <th className="p-3 w-24 text-right pr-4">CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[10px] text-slate-700">
                        {filteredCompletingStudents.map((item: any) => (
                          <tr key={item.studentId} className="hover:bg-slate-50 transition-all">
                            <td className="p-3 text-center w-20">
                              <input
                                type="checkbox"
                                checked={completionData.selectedStudentIds.includes(item.studentId)}
                                onChange={() => handleStudentCheckbox(item.studentId, 'selectedStudentIds')}
                                className="rounded border-slate-300 text-emerald-700 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900 w-32">{item.student?.registerNumber}</td>
                            <td className="p-3 font-sans font-extrabold text-slate-900">{item.student?.name}</td>
                            <td className="p-3 w-32 font-bold">{item.student?.department?.code}</td>
                            <td className="p-3 text-purple-800 font-extrabold w-24 text-right pr-4">{item.student?.ugPercentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingDrive(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completionLoading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-black transition-all flex items-center space-x-2 disabled:opacity-50 shadow-md text-xs"
                >
                  {completionLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Drive & Save Offers</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Document Viewer Modal */}
      {showPdfViewer && selectedDrive && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Job Description Document</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedDrive.jdFileName}</p>
              </div>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Professional Document Viewer */}
            <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <div className="p-3 bg-slate-200 flex justify-between items-center border-b border-slate-300 font-mono text-[10px]">
                <div className="flex items-center space-x-4">
                  <span>Status: <span className="text-slate-900 font-bold">Document Loaded</span></span>
                </div>
                <a
                  href={selectedDrive.jdFileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-900 hover:bg-purple-950 text-white px-3 py-1 rounded-lg transition-all font-bold shadow-xs text-xs"
                >
                  Download PDF
                </a>
              </div>
              <div className="flex justify-center items-center bg-slate-50 min-h-[500px]">
                <iframe
                  src={selectedDrive.jdFileUrl}
                  title="PDF Viewer"
                  className="w-full min-h-[500px] border-0"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowPdfViewer(false)}
                className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded-xl font-extrabold transition-all text-xs shadow-xs"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted JD Info Editor Modal */}
      {showJdEditor && selectedDrive && editedJdInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 max-h-[90vh] flex flex-col justify-between shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">AI Extracted Requirements</h3>
                <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200 uppercase">AI Extracted</span>
              </div>
              <button
                onClick={() => setShowJdEditor(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Job Description</label>
                <textarea
                  rows={4}
                  value={editedJdInfo.jobDescription || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, jobDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Salary / CTC</label>
                  <input
                    type="text"
                    value={editedJdInfo.salaryCtc || ''}
                    onChange={(e) => setEditedJdInfo({ ...editedJdInfo, salaryCtc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Experience Requirements</label>
                  <input
                    type="text"
                    value={editedJdInfo.experience || ''}
                    onChange={(e) => setEditedJdInfo({ ...editedJdInfo, experience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.requiredSkills) ? editedJdInfo.requiredSkills.join(', ') : editedJdInfo.requiredSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, requiredSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Preferred Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.preferredSkills) ? editedJdInfo.preferredSkills.join(', ') : editedJdInfo.preferredSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, preferredSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.technicalSkills) ? editedJdInfo.technicalSkills.join(', ') : editedJdInfo.technicalSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, technicalSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Key Responsibilities (one per line)</label>
                <textarea
                  rows={3}
                  value={Array.isArray(editedJdInfo.responsibilities) ? editedJdInfo.responsibilities.join('\n') : editedJdInfo.responsibilities || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, responsibilities: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowJdEditor(false)}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJdEdits}
                className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2 rounded-xl font-extrabold shadow-md"
              >
                Save Requirements
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
