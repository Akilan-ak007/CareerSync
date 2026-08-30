import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api.js';
import { utils, writeFile } from 'xlsx';
import {
  FileText,
  Download,
  Users,
  Building,
  CalendarDays,
  Award,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  // General helper to trigger browser download of Excel workbook
  const exportToExcel = (data: any[], fileName: string, sheetName: string) => {
    try {
      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Trigger download using SheetJS's official cross-browser writeFile helper
      writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${sheetName} report exported successfully!`);
    } catch (excelErr: any) {
      console.error("exportToExcel failed:", excelErr);
      toast.error("Excel generation failed: " + String(excelErr));
    }
  };

  const handleDownloadStudents = async () => {
    setDownloading('students');
    try {
      const res = await api.students.list({ limit: 1000 });
      if (res.success) {
        const formatted = res.data.students.map((s: any) => ({
          'Name': s.name,
          'Register Number': s.registerNumber,
          'Department': s.department?.name || 'N/A',
          'Dept Code': s.department?.code || 'N/A',
          'Type': s.studentType,
          'Email': s.email,
          'Phone': s.phoneNumber,
          'SSLC %': s.sslcPercentage,
          'HSC %': s.hscPercentage,
          'UG CGPA': s.ugPercentage,
          'PG CGPA': s.pgPercentage || 'N/A',
          'Status': s.placementStatus,
          'Resume URL': s.resumeUrl || '',
          'Portfolio URL': s.portfolioUrl || ''
        }));
        exportToExcel(formatted, 'Placement_Student_Roster', 'Students');
      } else {
        toast.error("Failed to fetch students dataset.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to construct student report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCompanies = async () => {
    setDownloading('companies');
    try {
      const res = await api.companies.list({ limit: 1000 });
      if (res.success) {
        const formatted = res.data.companies.map((c: any) => ({
          'Company Name': c.name,
          'Location': c.location,
          'Industry': c.industry || 'Information Technology',
          'Company Size': c.companySize,
          'Website': c.website,
          'Contact Person': c.contactPersonName,
          'Contact Phone': c.contactPersonPhone,
          'Contact Email': c.contactPersonEmail,
          'HQ Address': c.companyAddress,
          'Approval Status': c.status,
          'Latitude': c.latitude || 'N/A',
          'Longitude': c.longitude || 'N/A'
        }));
        exportToExcel(formatted, 'Placement_Company_Directory', 'Companies');
      } else {
        toast.error("Failed to fetch corporate partners directory.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to construct company report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDrives = async () => {
    setDownloading('drives');
    try {
      const res = await api.drives.list({ limit: 1000 });
      if (res.success) {
        const formatted = res.data.drives.map((d: any) => ({
          'Company': d.company?.name || 'N/A',
          'Drive Date': new Date(d.driveDate).toLocaleDateString(),
          'Location': d.driveLocation,
          'Recruitment Type': d.driveType,
          'Job Role': d.jobRole,
          'Min CGPA Cutoff': d.minimumCgpa,
          'Max Backlogs Allowed': d.maximumBacklogs,
          'CTC Package (LPA)': d.ctc,
          'Total Offers': d.offersCount,
          'Drive Status': d.status
        }));
        exportToExcel(formatted, 'Placement_Drive_Log', 'Drives');
      } else {
        toast.error("Failed to fetch placement drive logs.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to construct drive report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadOffers = async () => {
    setDownloading('offers');
    try {
      const res = await api.offers.list({ limit: 1000 });
      if (res.success) {
        const formatted = (res.data.offers || res.data || []).map((o: any) => ({
          'Student Name': o.student?.name || 'N/A',
          'Register Number': o.student?.registerNumber || 'N/A',
          'Department': o.student?.department?.code || 'N/A',
          'Company': o.company?.name || o.drive?.company?.name || 'N/A',
          'Job Role': o.jobRole || o.drive?.jobRole || 'N/A',
          'Package CTC (LPA)': o.ctc || o.drive?.ctc || 'N/A',
          'Offer Date': o.offerDate ? new Date(o.offerDate).toLocaleDateString() : 'N/A',
          'Status': o.status || 'OFFERED'
        }));
        exportToExcel(formatted, 'Placement_Offers_Ledger', 'Offers');
      } else {
        toast.error("Failed to fetch offer ledger.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to construct offer report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="h-full p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
              Institutional Reports Center
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Excel (.xlsx) Format</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mt-1">
            Reports & Spreadsheet Analytics Generator
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl mt-1">
            Export institutional datasets, audit spreadsheets, recruitment statistics, and offer ledgers for NAAC, NIRF, and internal placement reviews.
          </p>
        </div>
      </div>

      {/* Reports Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Student Roster Report Card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between hover:border-purple-300 transition-all space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3.5 bg-purple-100 text-purple-900 rounded-2xl border border-purple-200 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-extrabold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                STUDENTS ROSTER
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">Student Roster & Academic Database</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export complete student profiles including Register Numbers, Department/Stream, Hostel vs Day Scholar classifications, SSLC/HSC marks, UG/PG CGPA cutoffs, and placement statuses.
            </p>
          </div>
          <button
            onClick={handleDownloadStudents}
            disabled={!!downloading}
            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'students' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Students Database (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Corporate Partners Directory Card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between hover:border-purple-300 transition-all space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3.5 bg-sky-100 text-sky-900 rounded-2xl border border-sky-200 shadow-xs">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                CORPORATE DIRECTORY
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">Corporate Placement Partners Directory</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export complete corporate recruiter directories including HQ addresses, geolocation coordinates, industry sectors, company size, website links, and primary HR contact details.
            </p>
          </div>
          <button
            onClick={handleDownloadCompanies}
            disabled={!!downloading}
            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'companies' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Corporate Directory (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Drive Execution Logs Card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between hover:border-purple-300 transition-all space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3.5 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 shadow-xs">
                <CalendarDays className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                PLACEMENT DRIVES
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">Placement Drive Execution Logs</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export comprehensive drive session records including drive dates, venue locations, job role designations, minimum CGPA eligibility cutoffs, max backlog limits, and CTC packages.
            </p>
          </div>
          <button
            onClick={handleDownloadDrives}
            disabled={!!downloading}
            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'drives' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Placement Drive Logs (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Student Offers Ledger Card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between hover:border-purple-300 transition-all space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3.5 bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                OFFER CONVERSIONS
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">Student Offers & CTC Salary Ledger</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export official offer letter issuance logs including candidate register numbers, hiring corporate partners, job titles, CTC compensation packages (LPA), and offer dates.
            </p>
          </div>
          <button
            onClick={handleDownloadOffers}
            disabled={!!downloading}
            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'offers' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Offers Ledger (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
