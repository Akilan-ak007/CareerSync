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
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-gray-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white">Reports Generator</h1>
        <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
          Export spreadsheet databases for institutional records and audits
        </p>
      </div>

      {/* Reports Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Student report card */}
        <div className="glass-panel p-6 border border-brand-cocoa border-opacity-35 flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="p-3 bg-brand-cocoa bg-opacity-15 text-brand-rosy w-max rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Student Roster Database</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Export complete student demographics, academic percentages, contact information, links, and placement status profiles.
            </p>
          </div>
          <button
            onClick={handleDownloadStudents}
            disabled={!!downloading}
            className="w-full mt-4 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 px-4 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md disabled:opacity-50"
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
        <div className="glass-panel p-6 border border-brand-cocoa border-opacity-35 flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="p-3 bg-brand-cocoa bg-opacity-15 text-brand-rosy w-max rounded-xl">
              <Building className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Companies Directory</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Export complete list of approved, pending, and draft corporate recruiters including address, maps coordinates, and HR contacts.
            </p>
          </div>
          <button
            onClick={handleDownloadCompanies}
            disabled={!!downloading}
            className="w-full mt-4 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 px-4 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md disabled:opacity-50"
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
        <div className="glass-panel p-6 border border-brand-cocoa border-opacity-35 flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="p-3 bg-brand-cocoa bg-opacity-15 text-brand-rosy w-max rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Placement Drive Logs</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Export detailed statistics of scheduled placement drives, cgpa requirements, CTC packages (LPA), and headcount of offers.
            </p>
          </div>
          <button
            onClick={handleDownloadDrives}
            disabled={!!downloading}
            className="w-full mt-4 bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white py-2 px-4 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md disabled:opacity-50"
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
