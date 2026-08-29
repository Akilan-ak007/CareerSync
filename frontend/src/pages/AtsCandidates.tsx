import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Award,
  Search,
  Sliders,
  CheckCircle,
  FileCheck,
  Eye,
  AlertCircle,
  TrendingUp,
  Briefcase,
  X,
  XCircle,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Clock
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
        await new Promise((r) => setTimeout(r, 100));
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

  const getAtsColorClass = (score: number) => {
    if (score >= 85) return 'text-green-400 border-green-800';
    if (score >= 70) return 'text-amber-400 border-amber-800';
    return 'text-red-400 border-red-800';
  };

  return (
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-gray-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-rosy animate-pulse" />
            <span>AI Resume Matching & ATS Rankings</span>
          </h1>
          <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
            {drive ? `${drive.company.name} • ${drive.jobRole}` : 'Analyzing Placement Drive Credentials'}
          </p>
        </div>

        {isAuthorized && drive?.jdExtracted && !matchingState && (
          <button
            onClick={handleTriggerAtsMatching}
            className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2.5 rounded-lg font-bold flex items-center space-x-2 transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-Run ATS Analysis</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950 bg-opacity-35 border border-red-900 rounded-lg text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress / Loading Modal Overlay */}
      {matchingState && (
        <div className="p-8 glass-panel border border-brand-rosy border-opacity-40 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 border-3 border-brand-rosy border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Matching in Progress</h4>
          <p className="text-xs text-brand-rosy font-mono animate-pulse">{matchingState}</p>
        </div>
      )}

      {!matchingState && (
        <>
          {/* If JD not uploaded/extracted yet */}
          {drive && !drive.jdExtracted ? (
            <div className="p-12 glass-panel border border-brand-cocoa border-opacity-35 text-center space-y-5 max-w-xl mx-auto">
              <FolderOpen className="w-12 h-12 text-brand-rosy mx-auto opacity-75" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Job Description Not Analyzed</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm mx-auto">
                ATS Matching requires a Job Description. Please return to the Placement Drive page, upload the JD PDF, and trigger the AI Info Extraction first.
              </p>
              <button
                onClick={() => navigate('/drives')}
                className="bg-brand-cocoa text-white hover:bg-brand-rosy hover:text-brand-black py-2 px-5 rounded-lg font-bold transition-all"
              >
                Go to Placement Drives
              </button>
            </div>
          ) : candidates.length === 0 && !loading ? (
            /* Match trigger starting screen */
            <div className="p-12 glass-panel border border-brand-cocoa border-opacity-35 text-center space-y-5 max-w-xl mx-auto">
              <Sparkles className="w-12 h-12 text-brand-rosy mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Resume Analysis Required</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm mx-auto">
                Analyze student resumes against the extracted Job Description parameters to calculate ATS matching ranks, compatibility, and keyword matches.
              </p>
              {isAuthorized ? (
                <button
                  onClick={handleTriggerAtsMatching}
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2.5 px-6 rounded-lg font-bold transition-all shadow-md"
                >
                  Trigger Resume ATS Matching
                </button>
              ) : (
                <div className="p-3 bg-brand-dark bg-opacity-40 rounded-lg text-xs text-brand-rosy font-medium">
                  Awaiting Placement Officer to run AI Matching analysis.
                </div>
              )}
            </div>
          ) : (
            /* Main Ranked Candidates Dashboard */
            <div className="space-y-6">
              {/* Filter Row */}
              <div className="p-5 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-25 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search bar */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Search Candidate</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or roll no..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded-lg py-2 px-3 pl-9 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-rosy transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Department filter */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                {/* Minimum ATS slider */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Min ATS Score: <span className="text-white font-mono">{minScore}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => { setMinScore(parseInt(e.target.value, 10)); setPage(1); }}
                    className="w-full h-1 bg-brand-darker rounded-lg appearance-none cursor-pointer accent-brand-rosy mt-3"
                  />
                </div>

                {/* Shortlist Filter */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Shortlist Status</label>
                  <select
                    value={shortlistFilter}
                    onChange={(e) => { setShortlistFilter(e.target.value); setPage(1); }}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="review">Review Queue</option>
                  </select>
                </div>

                {/* Eligibility Filter */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Academic Eligibility</label>
                  <select
                    value={eligibleFilter}
                    onChange={(e) => { setEligibleFilter(e.target.value); setPage(1); }}
                    className="w-full bg-brand-darker border border-brand-cocoa border-opacity-30 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none focus:border-brand-rosy transition-all"
                  >
                    <option value="">All Candidates</option>
                    <option value="eligible">Eligible Only (CGPA &gt;= Cutoff)</option>
                    <option value="ineligible">Ineligible Only (CGPA &lt; Cutoff)</option>
                  </select>
                </div>
              </div>

              {/* Table Rankings */}
              <div className="glass-panel overflow-hidden">
                {loading ? (
                  <div className="py-20 text-center">
                    <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 font-medium">
                    No candidates match the selected filters.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-card text-gray-400 border-b border-brand-cocoa border-opacity-30 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="p-4 text-center w-16">Rank</th>
                        <th className="p-4">Student</th>
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">ATS Match</th>
                        <th className="p-4 text-center">Skills Score</th>
                        <th className="p-4 text-center">Education</th>
                        <th className="p-4 text-center">Missing Skills</th>
                        <th className="p-4 text-center">Eligibility</th>
                        <th className="p-4 text-center">Shortlist Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-cocoa divide-opacity-25 text-gray-300">
                      {candidates.map((c) => (
                        <tr key={c.id} className="hover:bg-brand-card hover:bg-opacity-20 transition-colors">
                          <td className="p-4 text-center font-bold text-sm text-brand-rosy font-mono">#{c.rank}</td>
                          <td className="p-4">
                            <span className="font-bold text-white block">{c.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{c.registerNumber}</span>
                          </td>
                          <td className="p-4 font-semibold text-gray-400">{c.department} ({c.deptCode})</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded bg-brand-dark border font-mono font-bold ${getAtsColorClass(c.atsScore)}`}>
                              {c.atsScore}%
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-semibold text-white">{c.skillsMatch}%</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.educationMatch === 'Match' ? 'bg-green-950 text-green-300' :
                              c.educationMatch === 'Partial' ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
                            }`}>
                              {c.educationMatch}
                            </span>
                          </td>
                          <td className="p-4 text-center font-medium text-brand-rosy">
                            {c.missingSkillsCount > 0 ? `${c.missingSkillsCount} missing` : 'Fully Matched'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              c.isEligible ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'
                            }`}>
                              {c.isEligible ? 'Eligible' : 'Ineligible'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              c.status === 'Shortlisted' ? 'bg-green-950 text-green-300 border border-green-800' :
                              c.status === 'Review' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleOpenDetail(c.studentId)}
                                className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-gray-300 px-2 py-1 rounded flex items-center space-x-1.5 transition-all font-semibold"
                                title="Side-by-Side Comparison"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-rosy" />
                                <span>Inspect Match</span>
                              </button>

                              {isAuthorized && (
                                <>
                                  {c.status !== 'Shortlisted' ? (
                                    <button
                                      onClick={() => handleUpdateStatus(c.studentId, 'Shortlisted')}
                                      className="bg-brand-cocoa text-white hover:bg-brand-rosy hover:text-brand-black px-2 py-1 rounded transition-all font-bold"
                                    >
                                      Shortlist
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateStatus(c.studentId, 'Review')}
                                      className="bg-red-950 hover:bg-red-900 text-red-300 px-2 py-1 rounded transition-all font-bold"
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
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} Candidates)</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 rounded-lg disabled:opacity-40 font-semibold"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300 h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-rosy animate-pulse" />
                  <span>ATS Match Analysis & Side-by-Side Comparison</span>
                </h3>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {detailData ? `${detailData.student.name} • ${detailData.student.registerNumber}` : 'Evaluating profiles...'}
                </p>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !detailData ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <span className="w-10 h-10 border-3 border-brand-rosy border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 my-2">
                {/* 1. Score Summary Header Panel */}
                <div className="p-5 bg-brand-dark bg-opacity-50 rounded-xl border border-brand-cocoa border-opacity-25 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                  <div className="flex items-center space-x-5">
                    {/* Circular Score progress ring */}
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-brand-darker"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-brand-rosy"
                          strokeWidth="3.5"
                          strokeDasharray={`${detailData.matchStats.atsScore}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-white text-base font-mono">
                        {detailData.matchStats.atsScore}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Overall ATS Score</h4>
                      <p className="text-[10px] text-gray-500 font-medium max-w-md leading-relaxed">
                        This score determines the candidate's alignment based on required skills matching, academic cgpa cutoffs, education requirements, and keyword strength.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto text-center font-mono">
                    <div className="p-3 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-15">
                      <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Skills Match</div>
                      <div className="text-white text-sm font-black">{detailData.matchStats.skillsMatch}%</div>
                    </div>
                    <div className="p-3 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-15">
                      <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Keywords</div>
                      <div className="text-white text-sm font-black">{detailData.matchStats.keywordMatch}%</div>
                    </div>
                    <div className="p-3 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-15">
                      <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Resume strength</div>
                      <div className="text-white text-sm font-black">{detailData.matchStats.resumeStrength}%</div>
                    </div>
                    <div className="p-3 bg-brand-card rounded-lg border border-brand-cocoa border-opacity-15">
                      <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Status</div>
                      <div className="text-brand-rosy text-[10px] font-black uppercase mt-0.5">{detailData.matchStats.status}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Side-by-Side Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Job Description details */}
                  <div className="glass-panel p-5 space-y-4 border border-brand-cocoa border-opacity-35">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-20 pb-2 flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-brand-rosy" />
                      <span>Job Requirements (JD)</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Role & Company</span>
                        <div className="text-white font-bold">{detailData.drive.jobRole}</div>
                        <div className="text-brand-rosy font-medium mt-0.5">{detailData.drive.companyName}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Required Academic Thresholds</span>
                        <div className="space-y-1 text-gray-300">
                          <div>Min CGPA: <span className="font-bold text-white font-mono">{detailData.drive.minimumCgpa}</span></div>
                          <div>Eligible Streams: <span className="font-bold text-white">{detailData.drive.eligibleDepartments.join(', ')}</span></div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Eligible Experience</span>
                        <p className="text-gray-400 font-medium leading-relaxed">{detailData.drive.jdExtractedInfo?.experience}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Primary Skill Requirements</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(detailData.drive.jdExtractedInfo?.requiredSkills || []).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-brand-dark border border-brand-cocoa border-opacity-35 text-white font-medium">
                              {sk}
                            </span>
                          ))}
                          {(detailData.drive.jdExtractedInfo?.preferredSkills || []).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-brand-dark border border-brand-cocoa border-opacity-15 text-gray-400 font-medium">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Student Profile details */}
                  <div className="glass-panel p-5 space-y-4 border border-brand-cocoa border-opacity-35">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-brand-cocoa border-opacity-20 pb-2 flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-brand-rosy" />
                      <span>Student Roster Profile</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Name & Register Number</span>
                        <div className="text-white font-bold">{detailData.student.name}</div>
                        <div className="text-gray-400 mt-0.5 font-mono">{detailData.student.registerNumber}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Student Academic Scores</span>
                        <div className="space-y-1 text-gray-300">
                          <div>UG CGPA: <span className="font-bold text-white font-mono">{detailData.student.cgpa}</span></div>
                          <div>Stream: <span className="font-bold text-white">{detailData.student.departmentName} ({detailData.student.deptCode})</span></div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Resume Document Reference</span>
                        <div className="flex items-center justify-between p-2 bg-brand-dark bg-opacity-40 rounded border border-brand-cocoa border-opacity-20">
                          <span className="text-gray-400 truncate max-w-[200px] font-mono">
                            {detailData.student.resumeUrl ? detailData.student.resumeUrl.split('/').pop() : 'No resume document linked'}
                          </span>
                          {detailData.student.resumeUrl && (
                            <a
                              href={detailData.student.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-rosy hover:text-white flex items-center space-x-1 font-bold"
                            >
                              <span>Review File</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Academic Match Checks</span>
                        <div className="flex space-x-3">
                          <div className="flex items-center space-x-1.5">
                            {detailData.matchStats.educationMatch === 'Match' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : detailData.matchStats.educationMatch === 'Partial' ? (
                              <Clock className="w-4 h-4 text-amber-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span>Stream Match: <span className="font-bold text-white">{detailData.matchStats.educationMatch}</span></span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            {detailData.student.cgpa >= detailData.drive.minimumCgpa ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span>CGPA Match: <span className="font-bold text-white">
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
                  <div className="p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-xl space-y-4">
                    <span className="font-bold text-white block mb-2 uppercase tracking-wide text-[10px]">Skills Compatibility Match Matrix</span>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-green-400 font-bold block mb-1.5">Matched Skills ({detailData.matchStats.matchingSkills.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailData.matchStats.matchingSkills.length === 0 ? (
                            <span className="text-gray-500 italic">No direct skills matched.</span>
                          ) : (
                            detailData.matchStats.matchingSkills.map((sk: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-green-950 bg-opacity-40 border border-green-900 text-green-300 font-medium">
                                {sk}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-red-400 font-bold block mb-1.5">Missing Skills ({detailData.matchStats.missingSkills.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailData.matchStats.missingSkills.length === 0 ? (
                            <span className="text-green-500 font-medium">All technical requirements matched!</span>
                          ) : (
                            detailData.matchStats.missingSkills.map((sk: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-red-950 bg-opacity-40 border border-red-900 text-red-300 font-medium">
                                {sk}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matching/Missing Keywords and Recommendations */}
                  <div className="p-4 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-20 rounded-xl space-y-4">
                    <span className="font-bold text-white block mb-2 uppercase tracking-wide text-[10px]">AI Matching Evaluation Feedbacks</span>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Keywords Strength Matrix</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailData.matchStats.matchingKeywords.map((kw: string, i: number) => (
                            <span key={i} className="text-[10px] text-green-400 font-mono">+{kw}</span>
                          ))}
                          {detailData.matchStats.missingKeywords.map((kw: string, i: number) => (
                            <span key={i} className="text-[10px] text-red-400 font-mono">-{kw}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Placement Recommendations Checklist</span>
                        <ul className="space-y-1.5">
                          {detailData.matchStats.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-gray-400 leading-normal">
                              <Sparkles className="w-3.5 h-3.5 text-brand-rosy mt-0.5 shrink-0" />
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
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-brand-cocoa border-opacity-25 pt-4 mt-4 gap-4">
              <div className="text-gray-500 text-[10px] font-mono">
                Candidate ID: {selectedStudentId}
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-35 text-gray-300 px-5 py-2 rounded-lg font-bold transition-all w-full md:w-auto text-center"
                >
                  Done
                </button>

                {isAuthorized && detailData && (
                  <>
                    {detailData.matchStats.status !== 'Shortlisted' ? (
                      <button
                        onClick={() => handleUpdateStatus(detailData.student.id, 'Shortlisted')}
                        className="bg-brand-cocoa text-white hover:bg-brand-rosy hover:text-brand-black px-5 py-2 rounded-lg font-bold transition-all w-full md:w-auto text-center flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Shortlist Candidate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(detailData.student.id, 'Review')}
                        className="bg-red-950 hover:bg-red-900 text-red-300 px-5 py-2 rounded-lg font-bold transition-all w-full md:w-auto text-center flex items-center justify-center space-x-1.5"
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
