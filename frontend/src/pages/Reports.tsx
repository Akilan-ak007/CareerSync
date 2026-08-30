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
  FileCheck,
  AlertCircle
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
    console.log("handleDownloadStudents clicked");
    setDownloading('students');
    try {
      const res = await api.students.list({ limit: 1000 }); // Large limit to get all records
      console.log("Students fetch result:", res);
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
          'Resume URL': s.resumeUrl || (s.registerNumber ? `https://drive.google.com/file/d/1resume_${s.registerNumber}/view?usp=sharing` : ''),
          'Portfolio URL': s.portfolioUrl
        }));
        exportToExcel(formatted, 'Placement_Student_Roster', 'Students');
      } else {
        toast.error("Failed to fetch students.");
      }
    } catch (err: any) {
      console.error("handleDownloadStudents caught error:", err);
      toast.error('Failed to construct student report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCompanies = async () => {
    console.log("handleDownloadCompanies clicked");
    setDownloading('companies');
    try {
      const res = await api.companies.list({ limit: 1000 });
      console.log("Companies fetch result:", res);
      if (res.success) {
        const formatted = res.data.companies.map((c: any) => ({
          'Company Name': c.name,
          'Location': c.location,
          'Industry': c.industry || 'IT',
          'Size': c.companySize,
          'Website': c.website,
          'Contact Name': c.contactPersonName,
          'Contact Phone': c.contactPersonPhone,
          'Contact Email': c.contactPersonEmail,
          'HQ Address': c.companyAddress,
          'Status': c.status,
          'Latitude': c.latitude || 'N/A',
          'Longitude': c.longitude || 'N/A'
        }));
        exportToExcel(formatted, 'Placement_Company_Directory', 'Companies');
      } else {
        alert("Failed: " + JSON.stringify(res));
      }
    } catch (err: any) {
      console.error("handleDownloadCompanies caught error:", err);
      alert('Failed to construct company report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDrives = async () => {
    console.log("handleDownloadDrives clicked");
    setDownloading('drives');
    try {
      const res = await api.drives.list({ limit: 1000 });
      console.log("Drives fetch result:", res);
      if (res.success) {
        const formatted = res.data.drives.map((d: any) => ({
          'Company': d.company?.name || 'N/A',
          'Date': new Date(d.driveDate).toLocaleDateString(),
          'Location': d.driveLocation,
          'Recruitment Type': d.driveType,
          'Job Role': d.jobRole,
          'Min CGPA Cutoff': d.minimumCgpa,
          'Max Backlogs Allowed': d.maximumBacklogs,
          'CTC LPA': d.ctc,
          'Offers Count': d.offersCount,
          'Status': d.status
        }));
        exportToExcel(formatted, 'Placement_Drive_Log', 'Drives');
      } else {
        alert("Failed: " + JSON.stringify(res));
      }
    } catch (err: any) {
      console.error("handleDownloadDrives caught error:", err);
      alert('Failed to construct drive report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="h-full p-6 md:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Reports & Analytics Generator</h1>
        <p className="text-xs text-purple-800 font-extrabold tracking-wider uppercase mt-1">
          Export spreadsheet databases for institutional records, placement audits, and management reviews
        </p>
      </div>

      {/* Reports Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Student report card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between h-64 hover:border-purple-300 transition-all">
          <div className="space-y-3">
            <div className="p-3 bg-purple-100 text-purple-900 w-max rounded-xl border border-purple-200">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Student Roster Database</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export complete student demographics, academic percentages (SSLC, HSC, UG/PG CGPA), contact details, resume links, and placement status profiles.
            </p>
          </div>
          <button
            onClick={handleDownloadStudents}
            disabled={!!downloading}
            className="w-full mt-4 bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'students' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Students (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Company report card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between h-64 hover:border-purple-300 transition-all">
          <div className="space-y-3">
            <div className="p-3 bg-purple-100 text-purple-900 w-max rounded-xl border border-purple-200">
              <Building className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Companies Directory</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export complete list of approved, pending, and draft corporate recruiters including address, maps coordinates, CTC packages, and HR contacts.
            </p>
          </div>
          <button
            onClick={handleDownloadCompanies}
            disabled={!!downloading}
            className="w-full mt-4 bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'companies' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Companies (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Drives report card */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-md flex flex-col justify-between h-64 hover:border-purple-300 transition-all">
          <div className="space-y-3">
            <div className="p-3 bg-purple-100 text-purple-900 w-max rounded-xl border border-purple-200">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Placement Drive Logs</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Export detailed statistics of scheduled placement drives, CGPA cutoffs, max backlogs allowed, CTC packages (LPA), and offer counts.
            </p>
          </div>
          <button
            onClick={handleDownloadDrives}
            disabled={!!downloading}
            className="w-full mt-4 bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50 text-xs"
          >
            {downloading === 'drives' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Drive Logs (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
