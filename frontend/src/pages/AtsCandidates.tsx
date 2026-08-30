import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Award,
  Search,
  CheckCircle,
  Eye,
  AlertCircle,
  Briefcase,
  X,
  XCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface Candidate {
  rank: number;
  id: string;
  studentId: string;
  name: string;
  registerNumber: string;
  department: string;
  deptCode: string;
  cgpa: number;
  atsScore: number;
  skillsMatch: number;
  educationMatch: string;
  missingSkillsCount: number;
  missingSkills: string[];
  status: 'Shortlisted' | 'Review' | 'Pending';
  isEligible: boolean;
}

export const AtsCandidates: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isTeam = user?.role === 'PLACEMENT_TEAM';
  const isAuthorized = isAdmin || isTeam;

  const [drive, setDrive] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingState, setMatchingState] = useState<string | null>(null); // "Uploading..." | "Extracting..." | etc.
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [shortlistFilter, setShortlistFilter] = useState('');
  const [eligibleFilter, setEligibleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalCount: 0, totalPages: 1, currentPage: 1 });

  // Detail Modal Comparison State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDriveAndDepts = async () => {
    try {
      const driveRes = await api.drives.get(driveId!);
      if (driveRes.success) {
        setDrive(driveRes.data);
      }
      const deptRes = await api.students.departments();
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch placement drive specifications.');
    }
  };

  const fetchCandidates = async () => {
    if (!driveId) return;
    try {
      setLoading(true);
      const res = await api.ats.listCandidates(driveId, {
        search,
        departmentId: selectedDept,
        minScore: minScore > 0 ? minScore : undefined,
        shortlisted: shortlistFilter === 'shortlisted' ? true : (shortlistFilter === 'review' ? false : undefined),
        eligible: eligibleFilter === 'eligible' ? true : (eligibleFilter === 'ineligible' ? false : undefined),
        page,
        limit: 10
      });
      if (res.success) {
        setCandidates(res.data.candidates);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error(err);
      // Don't show error if matching was never run yet (just displays trigger panel)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveAndDepts();
  }, [driveId]);

  useEffect(() => {
    fetchCandidates();
  }, [search, selectedDept, minScore, shortlistFilter, eligibleFilter, page]);

  // Trigger matching sequence with ultra-fast parallel visual loaders
  const handleTriggerAtsMatching = async () => {
    if (!driveId) return;
    try {
      setError(null);
      setMatchingState('Analyzing student resumes & JD specifications...');
      
      const states = [
        'Extracting job description parameters...',
        'Analyzing student academic benchmarks...',
        'Matching technical and soft skill keywords...',
        'Generating final ATS matching scores...'
      ];

      // Fire API call concurrently with visual progress
      const matchPromise = api.ats.matchResumes(driveId);

      for (const st of states) {
        setMatchingState(st);
        await new Promise((r) => setTimeout(r, 150));
      }

      const res = await matchPromise;
      if (res.success) {
        setMatchingState('Analysis Complete.');
        setTimeout(() => setMatchingState(null), 300);
        setPage(1);
        fetchCandidates();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ATS Resume matching algorithm failed.');
      setMatchingState(null);
    }
  };

  // Open side-by-side comparison modal
  const handleOpenDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    try {
      setDetailLoading(true);
      const res = await api.ats.getCandidateDetail(driveId!, studentId);
      if (res.success) {
        setDetailData(res.data);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to load side-by-side matching details.');
      setSelectedStudentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Update shortlist status
  const handleUpdateStatus = async (studentId: string, status: 'Shortlisted' | 'Review' | 'Pending') => {
    try {
      const res = await api.ats.updateStatus(driveId!, studentId, status);
      if (res.success) {
        // Refresh detail view if open
        if (selectedStudentId === studentId && detailData) {
          setDetailData({
            ...detailData,
            matchStats: { ...detailData.matchStats, status }
          });
        }
        // Refresh candidate list
        fetchCandidates();
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to update shortlist status.');
    }
  };

  return (
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/drives')}
              className="text-slate-500 hover:text-purple-900 p-1 rounded-lg hover:bg-slate-100 transition-all mr-1"
              title="Back to Drives"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-700 animate-pulse" />
              <span>AI Resume Matching & ATS Rankings</span>
            </h1>
          </div>
          <p className="text-xs text-purple-800 uppercase tracking-wider font-extrabold mt-0.5 ml-8">
            {drive ? `${drive.company.name} • ${drive.jobRole}` : 'Analyzing Placement Drive Credentials'}
          </p>
        </div>

        {isAuthorized && drive?.jdExtracted && !matchingState && (
          <button
            onClick={handleTriggerAtsMatching}
            className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2.5 rounded-xl font-extrabold flex items-center space-x-2 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-Run ATS Analysis</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress / Loading Modal Overlay */}
      {matchingState && (
        <div className="p-10 bg-white border border-purple-200 shadow-xl rounded-2xl text-center space-y-4 max-w-md mx-auto animate-fade-in">
          <div className="w-12 h-12 border-3 border-purple-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">AI Matching in Progress</h4>
          <p className="text-xs text-purple-800 font-mono font-bold animate-pulse">{matchingState}</p>
        </div>
      )}

      {!matchingState && (
        <>
          {/* If JD not uploaded/extracted yet */}
          {drive && !drive.jdExtracted ? (
            <div className="p-12 bg-white border border-slate-200 shadow-xl rounded-2xl text-center space-y-5 max-w-xl mx-auto">
              <FolderOpen className="w-12 h-12 text-purple-700 mx-auto opacity-75" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Job Description Not Analyzed</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                ATS Matching requires a Job Description. Please return to the Placement Drive page, upload the JD PDF, and trigger the AI Info Extraction first.
              </p>
              <button
                onClick={() => navigate('/drives')}
                className="bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-6 rounded-xl font-extrabold transition-all shadow-md text-xs"
              >
                Go to Placement Drives
              </button>
            </div>
          ) : candidates.length === 0 && !loading ? (
            /* Match trigger starting screen */
            <div className="p-12 bg-white border border-slate-200 shadow-xl rounded-2xl text-center space-y-5 max-w-xl mx-auto">
              <Sparkles className="w-12 h-12 text-purple-700 mx-auto animate-pulse" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">AI Resume Analysis Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-medium">
                Analyze student resumes against the extracted Job Description parameters to calculate ATS matching ranks, compatibility, and keyword matches.
              </p>
              {isAuthorized ? (
                <button
                  type="button"
                  onClick={handleTriggerAtsMatching}
                  className="bg-purple-900 hover:bg-purple-950 text-white py-3 px-8 rounded-xl font-black transition-all shadow-lg text-xs flex items-center space-x-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Trigger Resume ATS Matching</span>
                </button>
              ) : (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-bold">
                  Awaiting Placement Officer to run AI Matching analysis.
                </div>
              )}
            </div>
          ) : (
            /* Main Ranked Candidates Dashboard */
            <div className="space-y-6">
              {/* Filter Row */}
              <div className="p-5 bg-white border border-slate-200 shadow-xs rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search bar */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Search Candidate</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or roll no..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Department filter */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                {/* Minimum ATS slider */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1">
                    Min ATS Score: <span className="text-purple-900 font-mono font-black">{minScore}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => { setMinScore(parseInt(e.target.value, 10)); setPage(1); }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-800 mt-3"
                  />
                </div>

                {/* Shortlist Filter */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Shortlist Status</label>
                  <select
                    value={shortlistFilter}
                    onChange={(e) => { setShortlistFilter(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="review">Review Queue</option>
                  </select>
                </div>

                {/* Eligibility Filter */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Academic Eligibility</label>
                  <select
                    value={eligibleFilter}
                    onChange={(e) => { setEligibleFilter(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                  >
                    <option value="">All Candidates</option>
                    <option value="eligible">Eligible Only (CGPA &gt;= Cutoff)</option>
                    <option value="ineligible">Ineligible Only (CGPA &lt; Cutoff)</option>
                  </select>
                </div>
              </div>

              {/* Table Rankings */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="py-20 text-center">
                    <span className="w-8 h-8 border-3 border-purple-800 border-t-transparent rounded-full inline-block animate-spin" />
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-medium">
                    No candidates match the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-extrabold text-[10px] whitespace-nowrap">
                          <th className="p-3.5 text-center w-14">Rank</th>
                          <th className="p-3.5">Student</th>
                          <th className="p-3.5">Department</th>
                          <th className="p-3.5 text-center">ATS Match</th>
                          <th className="p-3.5 text-center">Skills Score</th>
                          <th className="p-3.5 text-center">Education</th>
                          <th className="p-3.5 text-center">Missing Skills</th>
                          <th className="p-3.5 text-center">Eligibility</th>
                          <th className="p-3.5 text-center min-w-[130px]">Shortlist Status</th>
                          <th className="p-3.5 text-center min-w-[180px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {candidates.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 text-center font-black text-sm text-purple-900 font-mono">#{c.rank}</td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.registerNumber}</span>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-600 whitespace-nowrap">{c.department} ({c.deptCode})</td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs shadow-xs ${
                                c.atsScore >= 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                c.atsScore >= 75 ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {c.atsScore}%
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap">{c.skillsMatch}%</td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.educationMatch === 'Match' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                c.educationMatch === 'Partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {c.educationMatch}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-semibold text-purple-900 whitespace-nowrap">
                              {c.missingSkillsCount > 0 ? `${c.missingSkillsCount} missing` : 'Fully Matched'}
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                c.isEligible ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {c.isEligible ? 'Eligible' : 'Ineligible'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap min-w-[130px]">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                c.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                c.status === 'Review' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap min-w-[180px]">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleOpenDetail(c.studentId)}
                                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all font-semibold shadow-xs text-xs"
                                  title="Side-by-Side Comparison"
                                >
                                  <Eye className="w-3.5 h-3.5 text-purple-700" />
                                  <span>Inspect Match</span>
                                </button>

                                {isAuthorized && (
                                  <>
                                    {c.status !== 'Shortlisted' ? (
                                      <button
                                        onClick={() => handleUpdateStatus(c.studentId, 'Shortlisted')}
                                        className="bg-purple-900 hover:bg-purple-950 text-white px-2.5 py-1 rounded-lg transition-all font-bold text-xs shadow-xs"
                                      >
                                        Shortlist
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUpdateStatus(c.studentId, 'Review')}
                                        className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-lg transition-all font-bold text-xs shadow-xs"
                                        title="Remove from shortlist and review"
                                      >
                                        Remove
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
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} Candidates)</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg disabled:opacity-40 font-bold text-xs shadow-xs transition-all"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg disabled:opacity-40 font-bold text-xs shadow-xs transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Side-by-Side ATS Comparison Modal Detail Overlay */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 text-xs text-slate-800 h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
                  <span>ATS Match Analysis & Side-by-Side Comparison</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {detailData ? `${detailData.student.name} • ${detailData.student.registerNumber}` : 'Evaluating profiles...'}
                </p>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !detailData ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <span className="w-10 h-10 border-3 border-purple-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 my-2">
                {/* 1. Score Summary Header Panel */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-xs">
                  <div className="flex items-center space-x-5">
                    {/* Circular Score progress ring */}
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-purple-700"
                          strokeWidth="3.5"
                          strokeDasharray={`${detailData.matchStats.atsScore}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-purple-900 text-base font-mono">
                        {detailData.matchStats.atsScore}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900">Overall ATS Match Score</h4>
                      <p className="text-[10px] text-slate-500 font-medium max-w-md leading-relaxed">
                        Calculated from candidate required skills alignment, CGPA cutoff eligibility, department compatibility, and resume keywords strength.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto text-center font-mono">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Skills Match</div>
                      <div className="text-purple-900 text-sm font-black">{detailData.matchStats.skillsMatch}%</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Keywords</div>
                      <div className="text-purple-900 text-sm font-black">{detailData.matchStats.keywordMatch}%</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Resume strength</div>
                      <div className="text-purple-900 text-sm font-black">{detailData.matchStats.resumeStrength}%</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Status</div>
                      <div className="text-purple-900 text-[10px] font-black uppercase mt-0.5">{detailData.matchStats.status}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Side-by-Side Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Job Description details */}
                  <div className="p-5 space-y-4 border border-slate-200 bg-white rounded-2xl shadow-xs">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-purple-700" />
                      <span>Job Requirements (JD)</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Role & Company</span>
                        <div className="text-slate-900 font-extrabold text-sm">{detailData.drive.jobRole}</div>
                        <div className="text-purple-800 font-bold mt-0.5">{detailData.drive.companyName}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Required Academic Thresholds</span>
                        <div className="space-y-1 text-slate-700">
                          <div>Min CGPA: <span className="font-bold text-slate-900 font-mono">{detailData.drive.minimumCgpa}</span></div>
                          <div>Eligible Streams: <span className="font-bold text-slate-900">{(detailData.drive.eligibleDepartments || []).join(', ')}</span></div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Eligible Experience</span>
                        <p className="text-slate-600 font-medium leading-relaxed">{detailData.drive.jdExtractedInfo?.experience || 'Not specified'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Primary Skill Requirements</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(detailData.drive.jdExtractedInfo?.requiredSkills || []).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs">
                              {sk}
                            </span>
                          ))}
                          {(detailData.drive.jdExtractedInfo?.preferredSkills || []).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Student Profile details */}
                  <div className="p-5 space-y-4 border border-slate-200 shadow-xs bg-white rounded-2xl">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-purple-700" />
                      <span>Student Roster Profile</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Name & Register Number</span>
                        <div className="text-slate-900 font-extrabold text-sm">{detailData.student.name}</div>
                        <div className="text-slate-500 mt-0.5 font-mono">{detailData.student.registerNumber}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Student Academic Scores</span>
                        <div className="space-y-1 text-slate-700">
                          <div>UG CGPA: <span className="font-bold text-slate-900 font-mono">{detailData.student.cgpa}</span></div>
                          <div>Stream: <span className="font-bold text-slate-900">{detailData.student.departmentName} ({detailData.student.deptCode})</span></div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Resume Document Reference</span>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-600 truncate max-w-[200px] font-mono text-xs">
                            {detailData.student.resumeUrl ? detailData.student.resumeUrl.split('/').pop() : 'No resume document linked'}
                          </span>
                          {detailData.student.resumeUrl && (
                            <a
                              href={detailData.student.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-800 hover:text-purple-950 flex items-center space-x-1 font-bold text-xs"
                            >
                              <span>Review File</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Academic Match Checks</span>
                        <div className="flex space-x-3 text-xs">
                          <div className="flex items-center space-x-1.5">
                            {detailData.matchStats?.educationMatch === 'Match' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : detailData.matchStats?.educationMatch === 'Partial' ? (
                              <Clock className="w-4 h-4 text-amber-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span>Stream Match: <span className="font-bold text-slate-900">{detailData.matchStats?.educationMatch || 'N/A'}</span></span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            {detailData.student.cgpa >= detailData.drive.minimumCgpa ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span>CGPA Match: <span className="font-bold text-slate-900">
                              {detailData.student.cgpa >= detailData.drive.minimumCgpa ? 'Eligible' : 'Cutoff Mismatch'}
                            </span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Skill & Keywords Matrices Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matching/Missing Skills lists */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                    <span className="font-extrabold text-slate-900 block mb-2 uppercase tracking-wide text-[10px]">Skills Compatibility Match Matrix</span>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block mb-1.5">Matched Skills ({(detailData.matchStats?.matchingSkills || []).length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(detailData.matchStats?.matchingSkills || []).length === 0 ? (
                            <span className="text-slate-400 italic text-xs">No direct skills matched.</span>
                          ) : (
                            (detailData.matchStats?.matchingSkills || []).map((sk: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs">
                                {sk}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-rose-700 font-bold block mb-1.5">Missing Skills ({(detailData.matchStats?.missingSkills || []).length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(detailData.matchStats?.missingSkills || []).length === 0 ? (
                            <span className="text-emerald-700 font-semibold text-xs">All technical requirements matched!</span>
                          ) : (
                            (detailData.matchStats?.missingSkills || []).map((sk: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs">
                                {sk}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matching/Missing Keywords and Recommendations */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                    <span className="font-extrabold text-slate-900 block mb-2 uppercase tracking-wide text-[10px]">AI Matching Evaluation Feedbacks</span>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Keywords Strength Matrix</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(detailData.matchStats?.matchingKeywords || []).map((kw: string, i: number) => (
                            <span key={i} className="text-[10px] text-emerald-700 font-mono font-bold">+{kw}</span>
                          ))}
                          {(detailData.matchStats?.missingKeywords || []).map((kw: string, i: number) => (
                            <span key={i} className="text-[10px] text-rose-700 font-mono font-bold">-{kw}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Placement Recommendations Checklist</span>
                        <ul className="space-y-1.5">
                          {(detailData.matchStats?.recommendations || []).map((rec: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-slate-600 leading-normal text-xs font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-purple-700 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-slate-100 pt-4 mt-4 gap-4">
              <div className="text-slate-500 text-[10px] font-mono">
                Candidate ID: {selectedStudentId}
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all w-full md:w-auto text-center shadow-xs text-xs"
                >
                  Close
                </button>

                {isAuthorized && detailData && (
                  <>
                    {detailData?.matchStats?.status !== 'Shortlisted' ? (
                      <button
                        onClick={() => handleUpdateStatus(detailData.student.id, 'Shortlisted')}
                        className="bg-purple-900 text-white hover:bg-purple-950 px-5 py-2.5 rounded-xl font-extrabold transition-all w-full md:w-auto text-center flex items-center justify-center space-x-1.5 shadow-md text-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Shortlist Candidate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(detailData.student.id, 'Review')}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 px-5 py-2.5 rounded-xl font-bold transition-all w-full md:w-auto text-center flex items-center justify-center space-x-1.5 shadow-xs text-xs"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Remove from Shortlist</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
