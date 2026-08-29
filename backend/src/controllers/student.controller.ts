import { Request, Response, NextFunction } from 'express';
import * as xlsx from 'xlsx';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { PlacementStatus } from '@prisma/client';

// Email & URL Validation Regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

// 1. Get all students with search, filter, sort, and pagination
export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      search,
      departmentId,
      studentType,
      placementStatus,
      minUg,
      page = '1',
      limit = '10',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const { isTerminated } = req.query;

    const whereClause: any = {
      deletedAt: null,
    };

    if (isTerminated !== undefined) {
      whereClause.isTerminated = isTerminated === 'true';
    } else if (placementStatus === 'TERMINATED') {
      whereClause.isTerminated = true;
    } else {
      // Default to active non-terminated students unless explicitly filtering
      whereClause.isTerminated = false;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { registerNumber: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phoneNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (departmentId) {
      whereClause.departmentId = departmentId as string;
    }

    if (studentType) {
      whereClause.studentType = studentType as string;
    }

    if (placementStatus) {
      whereClause.placementStatus = placementStatus as PlacementStatus;
    }

    if (minUg) {
      whereClause.ugPercentage = { gte: parseFloat(minUg as string) };
    }

    // Get total count
    const totalCount = await prisma.student.count({ where: whereClause });

    // Fetch students
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        department: true,
        offers: {
          include: {
            company: true
          }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// 2. Get detailed student profile by ID
export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        offers: {
          include: {
            company: true,
            drive: true,
          },
        },
        drives: {
          include: {
            drive: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
}

// 3. Manually create a student
export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    // Check unique register number
    const existingReg = await prisma.student.findUnique({
      where: { registerNumber: data.registerNumber },
    });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: `Student with register number ${data.registerNumber} already exists.`,
      });
    }

    // Check unique email
    const existingEmail = await prisma.student.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Student with email ${data.email} already exists.`,
      });
    }

    const student = await prisma.student.create({
      data: {
        name: data.name,
        registerNumber: data.registerNumber,
        departmentId: data.departmentId,
        studentType: data.studentType,
        email: data.email,
        collegeEmail: data.collegeEmail || data.email,
        personalEmail: data.personalEmail || null,
        phoneNumber: data.phoneNumber,
        sslcPercentage: parseFloat(data.sslcPercentage),
        hscPercentage: parseFloat(data.hscPercentage),
        ugPercentage: parseFloat(data.ugPercentage),
        pgPercentage: data.pgPercentage ? parseFloat(data.pgPercentage) : null,
        resumeUrl: data.resumeUrl || '',
        selfIntroUrl: data.selfIntroUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        linkedinId: data.linkedinId || null,
        githubUrl: data.githubUrl || '',
        githubId: data.githubId || null,
        portfolioUrl: data.portfolioUrl || '',
        photoUrl: data.photoUrl || null,
        graduationDate: data.graduationDate ? new Date(data.graduationDate) : null,
        placementStatus: data.placementStatus || 'NOT_PLACED',
        extraAcademicFields: data.extraAcademicFields || {},
      },
    });

    // Write audit log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'MANUAL_CREATE_STUDENT',
      entity: 'Student',
      entityId: student.id,
      ipAddress: req.ip,
      newValue: student,
    });

    return res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update student
export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // Check unique registers/emails if changed
    if (data.registerNumber && data.registerNumber !== existingStudent.registerNumber) {
      const regDup = await prisma.student.findUnique({ where: { registerNumber: data.registerNumber } });
      if (regDup) {
        return res.status(400).json({ success: false, message: `Register number ${data.registerNumber} already taken.` });
      }
    }

    if (data.email && data.email !== existingStudent.email) {
      const emailDup = await prisma.student.findUnique({ where: { email: data.email } });
      if (emailDup) {
        return res.status(400).json({ success: false, message: `Email ${data.email} already in use.` });
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name: data.name,
        registerNumber: data.registerNumber,
        departmentId: data.departmentId,
        studentType: data.studentType,
        email: data.email,
        collegeEmail: data.collegeEmail,
        personalEmail: data.personalEmail,
        phoneNumber: data.phoneNumber,
        sslcPercentage: data.sslcPercentage ? parseFloat(data.sslcPercentage) : undefined,
        hscPercentage: data.hscPercentage ? parseFloat(data.hscPercentage) : undefined,
        ugPercentage: data.ugPercentage ? parseFloat(data.ugPercentage) : undefined,
        pgPercentage: data.pgPercentage !== undefined ? (data.pgPercentage ? parseFloat(data.pgPercentage) : null) : undefined,
        resumeUrl: data.resumeUrl,
        selfIntroUrl: data.selfIntroUrl,
        linkedinUrl: data.linkedinUrl,
        linkedinId: data.linkedinId,
        githubUrl: data.githubUrl,
        githubId: data.githubId,
        portfolioUrl: data.portfolioUrl,
        photoUrl: data.photoUrl,
        graduationDate: data.graduationDate ? new Date(data.graduationDate) : undefined,
        placementStatus: data.placementStatus,
        extraAcademicFields: data.extraAcademicFields,
      },
    });

    // Write audit log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
      oldValue: existingStudent,
      newValue: updated,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 5. Soft delete student
export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Write audit log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'SOFT_DELETE_STUDENT',
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Student soft-deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Helper to extract clean field value from flexible column names or fuzzy key matching
function getFlexibleValue(row: any, primaryKeys: string[], keywords: string[]): any {
  for (const key of primaryKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  for (const rowKey of Object.keys(row)) {
    const lowerKey = rowKey.toLowerCase();
    for (const kw of keywords) {
      if (lowerKey.includes(kw)) {
        if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== '') {
          return row[rowKey];
        }
      }
    }
  }
  return null;
}

// Helper to parse Excel dates (handles serial numbers like 46538 and standard strings)
function parseExcelDate(val: any): Date | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    if (val > 10000 && val < 100000) {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    if (val >= 2000 && val <= 2100) {
      return new Date(`${val}-05-31`);
    }
  }
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
    return d;
  }
  return null;
}

// Helper to normalize social profile URLs & IDs
function normalizeSocial(inputVal: any, platform: 'github' | 'linkedin'): { id: string | null; url: string } {
  if (!inputVal) return { id: null, url: '' };
  const str = String(inputVal).trim();
  if (!str) return { id: null, url: '' };

  if (str.startsWith('http://') || str.startsWith('https://')) {
    const cleanUrl = str.replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    const handle = parts[parts.length - 1];
    return { id: handle || null, url: str };
  }

  const cleanHandle = str.replace(/^@/, '');
  const baseUrl = platform === 'github' ? 'https://github.com/' : 'https://linkedin.com/in/';
  return { id: cleanHandle, url: `${baseUrl}${cleanHandle}` };
}

// 6. Upload and Validate Excel file for preview
export async function uploadPreview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty.',
      });
    }

    // Normalize keys: trim and lowercase all headers
    const normalizedRows = rawRows.map((row: any) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        normalized[cleanKey] = row[key];
      });
      return normalized;
    });

    // Validate core columns
    const requiredCols = ['name', 'register_number', 'department', 'student_type', 'email', 'phone_number', 'sslc_percentage', 'hsc_percentage', 'ug_percentage'];
    const actualCols = Object.keys(normalizedRows[0]);
    const missingCols = requiredCols.filter((col) => !actualCols.includes(col));

    if (missingCols.length > 0) {
      return res.status(400).json({ success: false, message: `Missing columns: ${missingCols.join(', ')}` });
    }

    const allStudents = await prisma.student.findMany({ select: { registerNumber: true, email: true } });
    const existingRegs = new Set(allStudents.map(s => s.registerNumber));
    const existingEmails = new Set(allStudents.map(s => s.email.toLowerCase()));

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const sheetRegs = new Set<string>();
    const sheetEmails = new Set<string>();

    normalizedRows.forEach((row: any, idx: number) => {
      const rowNum = idx + 2;
      const errors: string[] = [];

      if (!row.name || String(row.name).trim() === '') errors.push('Name is required.');
      if (!row.register_number || String(row.register_number).trim() === '') errors.push('Register number is required.');
      if (!row.department || String(row.department).trim() === '') errors.push('Department is required.');
      if (!row.email || !emailRegex.test(String(row.email).trim())) errors.push('Valid email is required.');
      
      const sslc = parseFloat(row.sslc_percentage);
      const hsc = parseFloat(row.hsc_percentage);
      const ug = parseFloat(row.ug_percentage);
      const pg = row.pg_percentage ? parseFloat(row.pg_percentage) : null;

      if (isNaN(sslc) || sslc < 0 || sslc > 100) errors.push('SSLC % must be 0-100.');
      if (isNaN(hsc) || hsc < 0 || hsc > 100) errors.push('HSC % must be 0-100.');
      if (isNaN(ug) || ug < 0 || ug > 100) errors.push('UG % must be 0-100.');

      if (row.register_number) {
        const regStr = String(row.register_number).trim();
        if (sheetRegs.has(regStr)) errors.push('Duplicate register number in sheet.');
        else if (existingRegs.has(regStr)) errors.push('Register number exists in DB.');
        else sheetRegs.add(regStr);
      }

      if (row.email) {
        const emailStr = String(row.email).trim().toLowerCase();
        if (sheetEmails.has(emailStr)) errors.push('Duplicate email in sheet.');
        else if (existingEmails.has(emailStr)) errors.push('Email exists in DB.');
        else sheetEmails.add(emailStr);
      }

      const photoRaw = getFlexibleValue(row, ['photo_url', 'photo url', 'photourl', 'photo', 'drive_photo_url', 'drive_photo', 'drive photo', 'student_photo', 'student photo'], ['photo', 'drive', 'image', 'picture', 'avatar']);
      const gradDateRaw = getFlexibleValue(row, ['graduation_date', 'graduation date', 'graduationdate', 'grad_date', 'grad_year'], ['grad', 'year']);
      const githubRaw = getFlexibleValue(row, ['github_id', 'github id', 'githubid', 'github', 'github_url', 'github url'], ['github']);
      const linkedinRaw = getFlexibleValue(row, ['linkedin_id', 'linkedin id', 'linkedinid', 'linkedin', 'linkedin_url', 'linkedin url'], ['linkedin']);
      const portfolioRaw = getFlexibleValue(row, ['portfolio_url', 'portfolio url', 'portfoliourl', 'portfolio', 'website'], ['portfolio', 'website']);
      const collegeEmailRaw = getFlexibleValue(row, ['college_email', 'college email', 'collegeemail', 'official_email'], ['college', 'official']);
      const personalEmailRaw = getFlexibleValue(row, ['personal_email', 'personal email', 'personalemail'], ['personal']);

      const parsedGradDate = parseExcelDate(gradDateRaw);
      const githubObj = normalizeSocial(githubRaw, 'github');
      const linkedinObj = normalizeSocial(linkedinRaw, 'linkedin');

      const formattedRow = {
        name: row.name,
        registerNumber: String(row.register_number).trim(),
        department: String(row.department).trim(),
        studentType: String(row.student_type || 'DAY_SCHOLAR').trim().toUpperCase() === 'HOSTEL' ? 'HOSTEL' : 'DAY_SCHOLAR',
        email: String(row.email).trim(),
        collegeEmail: collegeEmailRaw ? String(collegeEmailRaw).trim() : String(row.email).trim(),
        personalEmail: personalEmailRaw ? String(personalEmailRaw).trim() : null,
        phoneNumber: String(row.phone_number || '').trim(),
        sslcPercentage: sslc,
        hscPercentage: hsc,
        ugPercentage: ug,
        pgPercentage: pg,
        resumeUrl: row.resume_url || row['resume url'] || '',
        selfIntroUrl: row.self_intro_url || row['self intro url'] || '',
        linkedinUrl: linkedinObj.url,
        linkedinId: linkedinObj.id,
        githubUrl: githubObj.url,
        githubId: githubObj.id,
        portfolioUrl: portfolioRaw ? String(portfolioRaw).trim() : '',
        photoUrl: photoRaw ? String(photoRaw).trim() : null,
        graduationDate: parsedGradDate,
      };

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, data: formattedRow, errors });
      } else {
        validRows.push({ rowNumber: rowNum, data: formattedRow });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        validRows,
        invalidRows,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 7. Confirm and Commit bulk import
export async function importConfirm(req: Request, res: Response, next: NextFunction) {
  try {
    const { students } = req.body; // Expects array of valid student records

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student data received for confirmation.',
      });
    }

    // Pre-fetch departments and index by both code and name (case-insensitive)
    const allDepts = await prisma.department.findMany();
    const deptMap = new Map<string, string>();
    allDepts.forEach(d => {
      deptMap.set(d.code.trim().toLowerCase(), d.id);
      deptMap.set(d.name.trim().toLowerCase(), d.id);
    });

    // 1. Resolve or create missing departments first
    for (const item of students) {
      const deptStr = String(item.department || '').trim();
      if (!deptStr) continue;

      let deptId = deptMap.get(deptStr.toLowerCase());
      if (!deptId) {
        let existing = await prisma.department.findFirst({
          where: {
            OR: [
              { code: { equals: deptStr, mode: 'insensitive' } },
              { name: { equals: deptStr, mode: 'insensitive' } }
            ]
          }
        });

        if (existing) {
          deptId = existing.id;
        } else {
          // Generate clean department code if long name is provided
          let generatedCode = deptStr.length <= 10
            ? deptStr.toUpperCase().replace(/\s+/g, '_')
            : deptStr.split(' ').map(w => w[0]).join('').toUpperCase() || 'DEPT';

          const codeExists = await prisma.department.findUnique({ where: { code: generatedCode } });
          if (codeExists) {
            generatedCode = `${generatedCode}_${Math.floor(100 + Math.random() * 900)}`;
          }

          const newDept = await prisma.department.create({
            data: {
              code: generatedCode,
              name: deptStr,
            },
          });
          deptId = newDept.id;
        }
        deptMap.set(deptStr.toLowerCase(), deptId);
      }
    }

    // 2. Format student records for high-speed batch insert
    const studentRecords = students.map((item) => {
      const deptStr = String(item.department || '').trim();
      const deptId = deptMap.get(deptStr.toLowerCase());

      return {
        name: item.name,
        registerNumber: item.registerNumber,
        departmentId: deptId!,
        studentType: item.studentType || 'DAY_SCHOLAR',
        email: item.email,
        collegeEmail: item.collegeEmail || item.email,
        personalEmail: item.personalEmail || null,
        phoneNumber: item.phoneNumber,
        sslcPercentage: item.sslcPercentage,
        hscPercentage: item.hscPercentage,
        ugPercentage: item.ugPercentage,
        pgPercentage: item.pgPercentage || null,
        resumeUrl: item.resumeUrl || '',
        selfIntroUrl: item.selfIntroUrl || '',
        linkedinUrl: item.linkedinUrl || '',
        linkedinId: item.linkedinId || null,
        githubUrl: item.githubUrl || '',
        githubId: item.githubId || null,
        portfolioUrl: item.portfolioUrl || '',
        photoUrl: item.photoUrl || null,
        graduationDate: item.graduationDate ? new Date(item.graduationDate) : null,
      };
    });

    // 3. Perform High-Speed Batch Insert
    const result = await prisma.student.createMany({
      data: studentRecords,
      skipDuplicates: true,
    });

    // Write audit log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'EXCEL_IMPORT_STUDENTS',
      entity: 'Student',
      entityId: 'Multiple',
      ipAddress: req.ip,
      newValue: { count: result.count },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${result.count} students.`,
      data: {
        importedCount: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 9. Terminate Student (Admin only)
export async function terminateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Admins can terminate student records.' });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        isTerminated: true,
        placementStatus: PlacementStatus.TERMINATED,
        terminationReason: reason || 'Terminated by Administrator',
        terminatedAt: new Date()
      }
    });

    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'TERMINATE_STUDENT',
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
      newValue: { reason: updated.terminationReason, registerNumber: student.registerNumber }
    });

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} (${student.registerNumber}) has been terminated.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 10. Restore / Reinstate Terminated Student (Admin only)
export async function restoreStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Admins can restore terminated students.' });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        isTerminated: false,
        placementStatus: PlacementStatus.NOT_PLACED,
        terminationReason: null,
        terminatedAt: null
      }
    });

    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'RESTORE_STUDENT',
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
      newValue: { registerNumber: student.registerNumber }
    });

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} has been reinstated to active status.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 8. Fetch all departments
export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' },
    });
    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}
