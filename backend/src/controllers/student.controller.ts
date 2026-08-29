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
    const whereClause: any = {
      deletedAt: null,
    };

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

// 6. Excel Upload Preview
export async function uploadPreview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file.',
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json<any>(sheet);

    if (rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty.',
      });
    }

    // Normalize keys: trim and lowercase all headers to handle whitespace/casing variations
    const normalizedRows = rawRows.map((row: any) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase();
        normalized[cleanKey] = row[key];
      });
      return normalized;
    });

    // 1. Column names validation: only enforce core academic/personal fields
    const requiredCols = [
      'name', 'register_number', 'department', 'student_type', 'email', 'phone_number',
      'sslc_percentage', 'hsc_percentage', 'ug_percentage'
    ];

    const actualCols = Object.keys(normalizedRows[0]);
    const missingCols = requiredCols.filter((col) => !actualCols.includes(col));

    if (missingCols.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingCols.join(', ')}`,
      });
    }

    // Fetch existing records for database uniqueness checks
    const allStudents = await prisma.student.findMany({ select: { registerNumber: true, email: true } });
    const existingRegs = new Set(allStudents.map(s => s.registerNumber));
    const existingEmails = new Set(allStudents.map(s => s.email.toLowerCase()));

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const sheetRegs = new Set<string>();
    const sheetEmails = new Set<string>();

    // 2. Validate rows
    normalizedRows.forEach((row: any, idx: number) => {
      const rowNum = idx + 2; // 1-indexed + header row
      const errors: string[] = [];

      // Required fields
      if (!row.name || String(row.name).trim() === '') errors.push('Name is required.');
      if (!row.register_number || String(row.register_number).trim() === '') errors.push('Register number is required.');
      if (!row.department || String(row.department).trim() === '') errors.push('Department is required.');
      if (!row.student_type || String(row.student_type).trim() === '') errors.push('Student Type (HOSTEL/DAY_SCHOLAR) is required.');
      if (!row.email || String(row.email).trim() === '') errors.push('Email is required.');
      if (!row.phone_number) errors.push('Phone number is required.');

      // Numeric validations
      const sslc = parseFloat(row.sslc_percentage);
      const hsc = parseFloat(row.hsc_percentage);
      const ug = parseFloat(row.ug_percentage);
      const pg = row.pg_percentage ? parseFloat(row.pg_percentage) : null;

      if (isNaN(sslc) || sslc < 0 || sslc > 100) errors.push('SSLC percentage must be between 0 and 100.');
      if (isNaN(hsc) || hsc < 0 || hsc > 100) errors.push('HSC percentage must be between 0 and 100.');
      if (isNaN(ug) || ug < 0 || ug > 100) errors.push('UG percentage must be between 0 and 100.');
      if (pg !== null && (isNaN(pg) || pg < 0 || pg > 100)) errors.push('PG percentage must be between 0 and 100.');

      // Email format
      if (row.email && !emailRegex.test(String(row.email).trim())) {
        errors.push('Invalid email format.');
      }

      // URL formats (Bypassed from blocking row imports)

      // Duplicate Register checks
      if (row.register_number) {
        const regStr = String(row.register_number).trim();
        if (sheetRegs.has(regStr)) {
          errors.push('Duplicate register number within the sheet.');
        } else if (existingRegs.has(regStr)) {
          errors.push('Register number already exists in the database.');
        } else {
          sheetRegs.add(regStr);
        }
      }

      // Duplicate Email checks
      if (row.email) {
        const emailStr = String(row.email).trim().toLowerCase();
        if (sheetEmails.has(emailStr)) {
          errors.push('Duplicate email within the sheet.');
        } else if (existingEmails.has(emailStr)) {
          errors.push('Email already exists in the database.');
        } else {
          sheetEmails.add(emailStr);
        }
      }

      // Flexible column aliases parsing
      const photoVal = row.photo_url || row['photo url'] || row.photourl || row.photo || row.drive_photo_url || row.drive_photo || row['drive photo'] || row.student_photo || row['student photo'] || row.image || row.image_url || row.picture || row.avatar || null;
      const gradDateVal = row.graduation_date || row['graduation date'] || row.graduationdate || row.grad_date || row.grad_year || null;
      const githubVal = row.github_id || row['github id'] || row.githubid || row.github || row.github_url || row.github_link || null;
      const linkedinVal = row.linkedin_id || row['linkedin id'] || row.linkedinid || row.linkedin || row.linkedin_url || row.linkedin_link || null;
      const portfolioVal = row.portfolio_url || row['portfolio url'] || row.portfoliourl || row.portfolio || row.website || null;
      const collegeEmailVal = row.college_email || row['college email'] || row.collegeemail || row.official_email || row.email || null;
      const personalEmailVal = row.personal_email || row['personal email'] || row.personalemail || null;

      let parsedGradDate: Date | null = null;
      if (gradDateVal) {
        const d = new Date(gradDateVal);
        if (!isNaN(d.getTime())) parsedGradDate = d;
      }

      const formattedRow = {
        name: row.name,
        registerNumber: String(row.register_number).trim(),
        department: String(row.department).trim(),
        studentType: String(row.student_type || 'DAY_SCHOLAR').trim().toUpperCase() === 'HOSTEL' ? 'HOSTEL' : 'DAY_SCHOLAR',
        email: String(row.email).trim(),
        collegeEmail: collegeEmailVal ? String(collegeEmailVal).trim() : String(row.email).trim(),
        personalEmail: personalEmailVal ? String(personalEmailVal).trim() : null,
        phoneNumber: String(row.phone_number || '').trim(),
        sslcPercentage: sslc,
        hscPercentage: hsc,
        ugPercentage: ug,
        pgPercentage: pg,
        resumeUrl: row.resume_url || row['resume url'] || '',
        selfIntroUrl: row.self_intro_url || row['self intro url'] || '',
        linkedinUrl: row.linkedin_url || row['linkedin url'] || (linkedinVal ? `https://linkedin.com/in/${linkedinVal}` : ''),
        linkedinId: linkedinVal ? String(linkedinVal).trim() : null,
        githubUrl: row.github_url || row['github url'] || (githubVal ? `https://github.com/${githubVal}` : ''),
        githubId: githubVal ? String(githubVal).trim() : null,
        portfolioUrl: portfolioVal ? String(portfolioVal).trim() : '',
        photoUrl: photoVal ? String(photoVal).trim() : null,
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
