import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink
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
      alert('AI Extraction failed: ' + err.message);
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
        setSelectedDrive({
          ...selectedDrive,
          jdExtractedInfo: editedJdInfo
        });
        setShowJdEditor(false);
        loadDrives();
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to save Job Description edits.');
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
      alert("No students are marked as Placed (Selected) in this drive yet.");
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
      } else {
        await api.drives.create(formData);
      }
      setShowFormModal(false);
      loadDrives();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete Placement Drive record? This cannot be undone.')) return;
    try {
      await api.drives.delete(id);
      loadDrives();
      if (selectedDrive?.id === id) setSelectedDrive(null);
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
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
      alert('Failed to load registered student candidates.');
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
        alert(res.message);
        setCompletingDrive(null);
        loadDrives();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete drive transaction.');
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
    <div className="h-full flex relative overflow-hidden text-xs text-gray-300">
      {/* Table grid pane */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">Placement Drives</h1>
            <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">Schedule and track recruitment sessions</p>
          </div>

          {!isManager && (
            <button
              onClick={handleOpenCreate}
              className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Schedule Drive</span>
            </button>
          )}
        </div>

        {/* Toolbar Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-30 rounded-xl">
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
              <option value="">All Eligible Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
            >
              <option value="">All Drive Statuses</option>
              <option value="UPCOMING">Warm Only</option>
              <option value="ONGOING">Hot Only</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="CANCELLED">Cancelled Only</option>
            </select>
          </div>
        </div>

        {/* Drives Table */}
        <div className="glass-panel overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
            </div>
          ) : drives.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-sm text-gray-400">No placement drives found.</p>
              {!isManager && (
                <button
                  onClick={handleOpenCreate}
                  className="bg-brand-cocoa text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-rosy hover:text-brand-black transition-all"
                >
                  Schedule a Recruitment Drive
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role & Package</th>
                  <th className="p-4">Drive Date</th>
                  <th className="p-4">Location & Type</th>
                  <th className="p-4">Eligibility</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cocoa divide-opacity-20 text-gray-300">
                {drives.map((drive) => (
                  <tr
                    key={drive.id}
                    onClick={() => handleSelectDrive(drive)}
                    className="hover:bg-brand-card hover:bg-opacity-30 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-brand-cocoa bg-opacity-10 border border-brand-cocoa border-opacity-20 flex items-center justify-center text-brand-rosy font-bold">
                          {drive.company?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{drive.company?.name}</div>
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5">{drive.company?.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{drive.jobRole}</div>
                      <div className="text-[10px] text-brand-rosy font-semibold mt-0.5">{drive.ctc} LPA</div>
                    </td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{new Date(drive.driveDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-rosy" />
                        <span>{drive.driveLocation}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 block mt-1 uppercase font-semibold tracking-wider">
                        {drive.driveType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 text-gray-400">
                        <GraduationCap className="w-4 h-4 text-brand-rosy" />
                        <span className="font-semibold text-white">CGPA: {drive.minimumCgpa}+</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {drive.eligibleDepartments.map((code: string) => (
                          <span key={code} className="bg-brand-dark px-1.5 py-0.5 rounded text-[8px] text-gray-500 font-bold border border-brand-cocoa border-opacity-10">
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
                          className="text-gray-400 hover:text-white transition-all"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isManager && drive.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenComplete(drive)}
                            className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all"
                            title="Complete Drive"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                        {!isManager && drive.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenEdit(drive)}
                            className="text-gray-400 hover:text-brand-rosy transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(drive.id)}
                            className="text-gray-500 hover:text-red-400 transition-all"
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

      {/* Details drawer (slides in on right) */}
      {selectedDrive && (
        <div className="w-96 bg-brand-card border-l border-brand-cocoa border-opacity-45 h-full flex flex-col z-30 animate-fade-in relative">
          <div className="p-6 border-b border-brand-cocoa border-opacity-35 flex items-center justify-between bg-brand-black">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Laptop className="w-4.5 h-4.5 text-brand-rosy" />
              <span>Drive Details</span>
            </h2>
            <button
              onClick={() => setSelectedDrive(null)}
              className="p-1 rounded hover:bg-brand-cocoa text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-400">
            <div className="text-center pb-4 border-b border-brand-cocoa border-opacity-20">
              <h3 className="text-base font-bold text-white">{selectedDrive.company?.name}</h3>
              <p className="text-[10px] text-brand-rosy font-semibold uppercase tracking-wider mt-1">{selectedDrive.jobRole}</p>
              <div className="mt-2.5 flex justify-center">{getStatusBadge(selectedDrive.status)}</div>
            </div>

            {/* Criteria */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1">
                Eligibility Criteria
              </h4>
              <div className="grid grid-cols-2 gap-3 text-gray-500 font-medium">
                <div>Min CGPA: <span className="text-white block mt-0.5">{selectedDrive.minimumCgpa}</span></div>
                <div>Max Backlogs: <span className="text-white block mt-0.5">{selectedDrive.maximumBacklogs}</span></div>
                <div>Drive Type: <span className="text-white block mt-0.5 uppercase">{selectedDrive.driveType.replace('_', ' ')}</span></div>
                <div>Package Offer: <span className="text-brand-rosy block mt-0.5 font-bold">{selectedDrive.ctc} LPA</span></div>
              </div>
            </div>

            {/* Company Info Card */}
            {selectedDrive.company && (
              <div className="space-y-3 bg-brand-dark bg-opacity-35 p-4 rounded-xl border border-brand-cocoa border-opacity-15">
                <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-brand-cocoa border-opacity-20 pb-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-rosy" />
                  <span>Company Profile</span>
                </h4>
                <div className="space-y-2 text-gray-500 font-medium">
                  <div className="flex justify-between">
                    <span>Industry:</span>
                    <span className="text-white">{selectedDrive.company.industry || 'IT / Software'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-white capitalize">{selectedDrive.company.location}</span>
                  </div>
                  {selectedDrive.company.website && (
                    <div className="flex justify-between">
                      <span>Website:</span>
                      <a href={selectedDrive.company.website} target="_blank" rel="noopener noreferrer" className="text-brand-rosy hover:underline flex items-center space-x-0.5">
                        <span>Visit Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedDrive.company.companySize && (
                    <div className="flex justify-between">
                      <span>Staff Size:</span>
                      <span className="text-white">{selectedDrive.company.companySize}</span>
                    </div>
                  )}
                  {selectedDrive.company.contactPersonName && (
                    <div className="pt-1.5 border-t border-brand-cocoa border-opacity-10 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">Contact Person</div>
                      <div className="text-white font-bold">{selectedDrive.company.contactPersonName}</div>
                      {selectedDrive.company.contactPersonEmail && <div className="text-gray-400 flex items-center space-x-1"><Mail className="w-3 h-3" /> <span>{selectedDrive.company.contactPersonEmail}</span></div>}
                      {selectedDrive.company.contactPersonPhone && <div className="text-gray-400 flex items-center space-x-1"><Phone className="w-3 h-3" /> <span>{selectedDrive.company.contactPersonPhone}</span></div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats if completed */}
            {selectedDrive.status === 'COMPLETED' && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1">
                  Placement Statistics
                </h4>
                
                {/* Number of Placed Students Highlight Box */}
                <div className="p-3 bg-emerald-950 bg-opacity-40 border border-emerald-800 border-opacity-60 rounded-lg flex items-center justify-between shadow-inner">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-emerald-300 font-bold text-xs block">No. of Placed Students</span>
                      <span className="text-[10px] text-emerald-400 opacity-80">Confirmed offer letters issued</span>
                    </div>
                  </div>
                  <span className="text-xl font-black font-mono text-white bg-emerald-900 bg-opacity-60 px-3 py-1 rounded border border-emerald-700">
                    {selectedDrive.offersCount ?? selectedDrive.offers?.length ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-25 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span>Total Offers Generated:</span>
                    <span className="text-white font-bold">{selectedDrive.offersCount ?? selectedDrive.offers?.length ?? 0}</span>
                  </div>
                  {selectedDrive.highestCtc && (
                    <div className="flex justify-between">
                      <span>Highest CTC:</span>
                      <span className="text-brand-rosy font-bold">{selectedDrive.highestCtc} LPA</span>
                    </div>
                  )}
                  {selectedDrive.averageCtc && (
                    <div className="flex justify-between">
                      <span>Average CTC:</span>
                      <span className="text-gray-300 font-bold">{selectedDrive.averageCtc} LPA</span>
                    </div>
                  )}
                  {selectedDrive.lowestCtc && (
                    <div className="flex justify-between">
                      <span>Lowest CTC:</span>
                      <span className="text-gray-400 font-bold">{selectedDrive.lowestCtc} LPA</span>
                    </div>
                  )}

                  {/* List of Placed Students */}
                  {selectedDrive.offers && selectedDrive.offers.length > 0 && (
                    <div className="pt-2 border-t border-brand-cocoa border-opacity-20 space-y-2 font-sans text-left">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Placed Candidates ({selectedDrive.offers.length}):</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {selectedDrive.offers.map((off: any) => (
                          <div key={off.id} className="p-2 bg-brand-dark bg-opacity-60 rounded border border-brand-cocoa border-opacity-20 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 truncate">
                              <PlacementStudentAvatar name={off.student?.name || 'Student'} photoUrl={off.student?.photoUrl} className="w-6 h-6 text-[10px]" />
                              <div className="truncate">
                                <div className="font-bold text-white truncate">{off.student?.name}</div>
                                <div className="text-[9px] text-gray-400 font-mono">{off.student?.registerNumber}</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900 shrink-0">
                              {off.ctc || selectedDrive.ctc} LPA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => exportPlacedStudents(selectedDrive)}
                    className="w-full mt-3 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Placed List (.xlsx)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Job Description & AI Matching section */}
            <div className="space-y-3 pt-4 border-t border-brand-cocoa border-opacity-20">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-brand-rosy" />
                <span>Job Description & AI Matching</span>
              </h4>

            {/* Job Description & AI Matching section */}
            <div className="space-y-3 pt-4 border-t border-brand-cocoa border-opacity-20">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-25 pb-1 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-brand-rosy" />
                <span>Job Description & AI Matching</span>
              </h4>

              {(() => {
                const effectiveJdUrl = selectedDrive.jdFileUrl || selectedDrive.company?.sampleResumeUrl;
                const effectiveJdFileName = selectedDrive.jdFileName || (selectedDrive.company?.sampleResumeUrl ? `${selectedDrive.company.name}_JD_Document` : null);

                if (!effectiveJdUrl) {
                  return (
                    <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-lg space-y-2 text-center">
                      <p className="text-[10px] text-gray-500">No Job Description PDF or Google Drive link attached yet.</p>
                      {(isAdmin || isTeam) ? (
                        <div className="space-y-2 pt-1">
                          <label className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-3 py-1.5 rounded cursor-pointer transition-all inline-block font-bold">
                            <span>Upload JD PDF</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleJdUpload}
                              className="hidden"
                            />
                          </label>
                          {uploadStatus && <p className="text-[9px] text-brand-rosy font-mono mt-1">{uploadStatus}</p>}
                        </div>
                      ) : (
                        <p className="text-[10px] text-brand-rosy font-semibold">Recruiter/Officer action required</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-gray-300 truncate max-w-[180px]">
                          {effectiveJdFileName}
                        </span>
                        <span className="text-brand-rosy font-mono text-[9px] bg-brand-cocoa bg-opacity-20 px-1.5 py-0.5 rounded border border-brand-cocoa border-opacity-30">
                          {selectedDrive.jdFileUrl ? 'PDF File' : 'Google Drive Link'}
                        </span>
                      </div>

                      <div className="flex space-x-1.5 pt-1">
                        <button
                          onClick={() => {
                            if (selectedDrive.jdFileUrl) {
                              setShowPdfViewer(true);
                            } else if (effectiveJdUrl) {
                              window.open(effectiveJdUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-2 py-1.5 rounded flex-1 text-center font-bold flex items-center justify-center space-x-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Job Description</span>
                        </button>

                        {(isAdmin || isTeam) && (
                          <label className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-2 py-1.5 rounded flex-1 text-center font-bold cursor-pointer flex items-center justify-center">
                            <span>{selectedDrive.jdFileUrl ? 'Replace' : 'Upload Local PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleJdUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {uploadStatus && <p className="text-[9px] text-brand-rosy font-mono my-1 text-center animate-pulse">{uploadStatus}</p>}

                    {/* AI Extraction segment */}
                    {!selectedDrive.jdExtracted ? (
                      <div className="space-y-2">
                        {(isAdmin || isTeam) ? (
                          <button
                            disabled={isExtracting}
                            onClick={handleJdExtraction}
                            className="w-full bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 shadow"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isExtracting ? 'Extracting AI Requirements...' : 'Extract AI Requirements & Match ATS'}</span>
                          </button>
                        ) : (
                          <p className="text-[10px] text-gray-500 italic text-center">Extraction details pending...</p>
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
                          className="w-full bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-rosy" />
                          <span>Review Requirements (AI)</span>
                        </button>

                        {/* Go to ATS Candidates matching screen */}
                        <button
                          onClick={() => {
                            setSelectedDrive(null);
                            navigate(`/drives/${selectedDrive.id}/ats`);
                          }}
                          className="w-full bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 shadow"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingDriveId ? 'Update Drive Details' : 'Schedule Recruitment Drive'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Select Company *</label>
                  <select
                    disabled={!!editingDriveId}
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Job Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graduate Engineer Trainee"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Drive Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.driveDate}
                    onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Drive Location / Hall *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBA Seminar Hall"
                    value={formData.driveLocation}
                    onChange={(e) => setFormData({ ...formData, driveLocation: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Recruitment Type *</label>
                  <select
                    value={formData.driveType}
                    onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                  >
                    <option value="ON_CAMPUS">On Campus Recruitment</option>
                    <option value="OFF_CAMPUS">Off Campus Recruitment</option>
                    <option value="VIRTUAL">Virtual Recruitment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Drive Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                  >
                    <option value="UPCOMING">Warm (Upcoming)</option>
                    <option value="ONGOING">Hot (Ongoing)</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Package CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Minimum CGPA Cutoff *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.minimumCgpa}
                    onChange={(e) => setFormData({ ...formData, minimumCgpa: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold">Maximum Backlogs Allowed *</label>
                  <input
                    type="number"
                    required
                    value={formData.maximumBacklogs}
                    onChange={(e) => setFormData({ ...formData, maximumBacklogs: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Eligible departments checkboxes */}
              <div className="space-y-2 pt-2 border-t border-brand-cocoa border-opacity-20">
                <label className="text-gray-400 font-semibold block">Eligible Departments *</label>
                <div className="flex flex-wrap gap-4">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={formData.eligibleDepartments.includes(d.code)}
                        onChange={() => handleDeptCheckbox(d.code)}
                        className="rounded bg-brand-dark border-brand-cocoa text-brand-rosy focus:ring-0"
                      />
                      <span>{d.name} ({d.code})</span>
                    </label>
                  ))}
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
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2.5 rounded-lg font-bold shadow-lg"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 overflow-y-auto max-h-[90vh] text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-brand-rosy" />
                <span>Mark Drive as Completed — {completingDrive.company?.name}</span>
              </h3>
              <button
                onClick={() => setCompletingDrive(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-6">
              {/* CTC Metrics inputs */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-brand-dark bg-opacity-35 rounded-lg border border-brand-cocoa border-opacity-25">
                <div className="space-y-1">
                  <label className="text-gray-500">Base CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.ctc}
                    onChange={(e) => setCompletionData({ ...completionData, ctc: e.target.value })}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded py-2 px-3 text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500">Highest CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.highestCtc}
                    onChange={(e) => setCompletionData({ ...completionData, highestCtc: e.target.value })}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded py-2 px-3 text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500">Average CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.averageCtc}
                    onChange={(e) => setCompletionData({ ...completionData, averageCtc: e.target.value })}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded py-2 px-3 text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500">Lowest CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={completionData.lowestCtc}
                    onChange={(e) => setCompletionData({ ...completionData, lowestCtc: e.target.value })}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded py-2 px-3 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Student checkboxes selection list */}
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Student Selectivity List ({completionData.selectedStudentIds.length} Offers Selected)</span>
                  <span className="text-[10px] text-gray-500 font-normal">Check students who received offers.</span>
                </h4>

                {/* Search & Filter bar for Complete Modal */}
                {completingDrive.students?.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search candidate by name, register number..."
                        value={completeSearch}
                        onChange={(e) => setCompleteSearch(e.target.value)}
                        className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg h-9 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy transition-all"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        value={completeDept}
                        onChange={(e) => setCompleteDept(e.target.value)}
                        className="w-full bg-brand-darker border border-brand-cocoa border-opacity-35 rounded-lg h-9 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
                      >
                        <option value="">All Departments</option>
                        {Array.from(new Set(completingDrive.students.map((item: any) => item.student?.department?.code).filter(Boolean))).map((deptCode: any) => (
                          <option key={deptCode} value={deptCode}>{deptCode}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {completingDrive.students?.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 italic bg-brand-dark bg-opacity-20 rounded-lg">
                    No eligible students are registered/participated in this drive.
                  </div>
                ) : filteredCompletingStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic bg-brand-dark bg-opacity-20 rounded-lg border border-brand-cocoa border-opacity-10">
                    No students match search or department filter criteria.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-brand-cocoa border-opacity-25 rounded-lg bg-brand-dark bg-opacity-10">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-dark border-b border-brand-cocoa border-opacity-20 sticky top-0 z-10">
                        <tr className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                          <th className="p-3 text-center w-20">Selected</th>
                          <th className="p-3 w-32">Register No.</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3 w-32">Department</th>
                          <th className="p-3 w-24 text-right pr-4">CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-cocoa divide-opacity-10 font-mono text-[10px] text-gray-400">
                        {filteredCompletingStudents.map((item: any) => (
                          <tr key={item.studentId} className="hover:bg-brand-card hover:bg-opacity-25 transition-all">
                            <td className="p-3 text-center w-20">
                              <input
                                type="checkbox"
                                checked={completionData.selectedStudentIds.includes(item.studentId)}
                                onChange={() => handleStudentCheckbox(item.studentId, 'selectedStudentIds')}
                                className="rounded bg-brand-darker border-brand-cocoa border-opacity-40 text-brand-rosy focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-white w-32">{item.student?.registerNumber}</td>
                            <td className="p-3 font-sans font-bold text-white">{item.student?.name}</td>
                            <td className="p-3 w-32">{item.student?.department?.code}</td>
                            <td className="p-3 text-brand-rosy font-bold w-24 text-right pr-4">{item.student?.ugPercentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                <button
                  type="button"
                  onClick={() => setCompletingDrive(null)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2.5 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completionLoading}
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-6 py-2.5 rounded-lg font-black transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-5 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Job Description Document</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{selectedDrive.jdFileName}</p>
              </div>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Professional Document Viewer */}
            <div className="bg-brand-dark bg-opacity-40 rounded-lg overflow-hidden border border-brand-cocoa border-opacity-20">
              <div className="p-3 bg-brand-black flex justify-between items-center border-b border-brand-cocoa border-opacity-15 font-mono text-[10px]">
                <div className="flex items-center space-x-4">
                  <span>Zoom: <span className="text-white font-bold">100%</span></span>
                  <span>Pages: <span className="text-white font-bold">1 of 1</span></span>
                </div>
                <a
                  href={selectedDrive.jdFileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-3 py-1 rounded transition-all font-bold"
                >
                  Download PDF
                </a>
              </div>
              <div className="flex justify-center items-center bg-zinc-900 min-h-[500px]">
                {/* Embed PDF inside frame */}
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
                className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2 rounded font-bold transition-all"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted JD Info Editor Modal */}
      {showJdEditor && selectedDrive && editedJdInfo && (
        <div className="fixed inset-0 bg-brand-black bg-opacity-85 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300 max-h-[90vh] flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-rosy animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Extracted JD Requirements</h3>
                <span className="bg-brand-cocoa text-[8px] font-bold text-white px-1.5 py-0.5 rounded tracking-widest uppercase">AI Extracted</span>
              </div>
              <button
                onClick={() => setShowJdEditor(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Job Description</label>
                <textarea
                  rows={4}
                  value={editedJdInfo.jobDescription || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, jobDescription: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded p-2 text-white focus:outline-none focus:border-brand-rosy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Salary / CTC</label>
                  <input
                    type="text"
                    value={editedJdInfo.salaryCtc || ''}
                    onChange={(e) => setEditedJdInfo({ ...editedJdInfo, salaryCtc: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Experience Requirements</label>
                  <input
                    type="text"
                    value={editedJdInfo.experience || ''}
                    onChange={(e) => setEditedJdInfo({ ...editedJdInfo, experience: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.requiredSkills) ? editedJdInfo.requiredSkills.join(', ') : editedJdInfo.requiredSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, requiredSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none focus:border-brand-rosy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Preferred Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.preferredSkills) ? editedJdInfo.preferredSkills.join(', ') : editedJdInfo.preferredSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, preferredSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none focus:border-brand-rosy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editedJdInfo.technicalSkills) ? editedJdInfo.technicalSkills.join(', ') : editedJdInfo.technicalSkills || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, technicalSkills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none focus:border-brand-rosy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Key Responsibilities (one per line)</label>
                <textarea
                  rows={3}
                  value={Array.isArray(editedJdInfo.responsibilities) ? editedJdInfo.responsibilities.join('\n') : editedJdInfo.responsibilities || ''}
                  onChange={(e) => setEditedJdInfo({ ...editedJdInfo, responsibilities: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean) })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded p-2 text-white focus:outline-none focus:border-brand-rosy"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
              <button
                type="button"
                onClick={() => setShowJdEditor(false)}
                className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJdEdits}
                className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2 rounded-lg font-bold shadow-lg"
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
