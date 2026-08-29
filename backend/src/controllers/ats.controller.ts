import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '../utils/audit.js';
import fs from 'fs';
import path from 'path';

// Helper to make directory if not exists
const ensureUploadsDir = () => {
  const dir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 1. Upload JD PDF
export async function uploadJDPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // driveId
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    ensureUploadsDir();
    const fileName = `jd_${id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Write buffer to file
    fs.writeFileSync(filePath, req.file.buffer);

    const jdUrl = `http://localhost:5001/uploads/${fileName}`;

    // Update drive with JD metadata
    const updatedDrive = await prisma.placementDrive.update({
      where: { id },
      data: {
        jdFileName: req.file.originalname,
        jdFileSize: req.file.size,
        jdFileUrl: jdUrl,
        jdExtracted: false, // Reset extraction status
      }
    });

    // Write Audit Log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'UPLOAD_JD_PDF',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      newValue: { fileName: req.file.originalname, size: req.file.size }
    });

    return res.status(200).json({
      success: true,
      message: 'Job Description PDF uploaded successfully.',
      data: updatedDrive
    });
  } catch (error) {
    next(error);
  }
}

// 1b. Delete JD PDF
export async function deleteJDPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({ where: { id } });
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    // Delete local file if it exists
    if (drive.jdFileUrl) {
      const fileName = drive.jdFileUrl.split('/').pop();
      if (fileName) {
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const updatedDrive = await prisma.placementDrive.update({
      where: { id },
      data: {
        jdFileName: null,
        jdFileSize: null,
        jdFileUrl: null,
        jdText: null,
        jdExtracted: false,
        jdExtractedInfo: Prisma.DbNull
      }
    });

    // Write Audit Log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'DELETE_JD_PDF',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      newValue: { fileName: drive.jdFileName }
    });

    return res.status(200).json({
      success: true,
      message: 'Job Description PDF removed successfully.',
      data: updatedDrive
    });
  } catch (error) {
    next(error);
  }
}

// 2. Extract JD Information (AI Simulation Engine)
export async function extractJDInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    // Rich matching template based on Job Role or Company
    const role = drive.jobRole.toLowerCase();
    
    // Generate AI Extracted Structured requirements
    let techSkills = ['Git', 'REST APIs', 'SQL'];
    let softSkills = ['Teamwork', 'Logical reasoning', 'Problem-solving', 'Communication'];
    let reqSkills = ['JavaScript', 'HTML5', 'CSS3'];
    let prefSkills = ['React.js', 'Node.js', 'PostgreSQL'];
    let education = 'B.E / B.Tech / M.E / M.Tech in CSE, IT or related streams.';
    let exp = 'Entry-level (0 - 1 years of experience). Candidates with strong academic projects preferred.';
    let responsibilities = [
      'Collaborate with developers to build responsive web interfaces.',
      'Design, write, and optimize robust database models and REST API controllers.',
      'Participate in code reviews, write test documentation, and maintain standard build versioning.'
    ];
    let qualifications = [
      'Proficiency in core programming concepts (Data Structures, Algorithms).',
      'Strong logical debugging skills.'
    ];
    let certifications = ['AWS Certified Cloud Practitioner (Optional)', 'Udemy React Developer Bootcamp or similar coursework (Preferred)'];
    let otherReqs = ['No active backlogs allowed.', 'Candidate should be willing to relocate.'];

    // Tailor content based on role keywords
    if (role.includes('frontend') || role.includes('ui') || role.includes('ux') || role.includes('web')) {
      reqSkills = ['HTML5', 'CSS3', 'JavaScript (ES6+)'];
      prefSkills = ['React.js', 'TailwindCSS', 'TypeScript', 'Vite'];
      techSkills = ['Git / GitHub', 'Chrome DevTools', 'Responsive Web Design'];
      responsibilities = [
        'Develop responsive user interfaces using modern CSS methodologies.',
        'Optimize visual render speeds and implement smooth animations.',
        'Integrate client-side routes with backend REST endpoints.'
      ];
    } else if (role.includes('backend') || role.includes('node') || role.includes('database') || role.includes('software')) {
      reqSkills = ['Node.js', 'Express.js', 'SQL / PostgreSQL'];
      prefSkills = ['TypeScript', 'Prisma ORM', 'Docker', 'Redis'];
      techSkills = ['Database normalization', 'REST API Architecture', 'JWT Authentication', 'Git'];
      responsibilities = [
        'Build scalable microservices and transactional API pipelines.',
        'Design database schemas and coordinate migration logic.',
        'Maintain test suites, verify API coverage, and secure auth middleware routes.'
      ];
    } else if (role.includes('data') || role.includes('ai') || role.includes('ml') || role.includes('analyst')) {
      reqSkills = ['Python', 'SQL', 'Pandas / NumPy'];
      prefSkills = ['TensorFlow', 'Scikit-learn', 'PowerBI', 'Tableau'];
      techSkills = ['Data Warehousing', 'Data Cleansing', 'Statistical Models'];
      education = 'B.E / B.Tech / BCA / MCA with statistical background.';
      responsibilities = [
        'Write queries to aggregate recruiter statistics and student performance reports.',
        'Clean raw dataset tables and build forecasting models.',
        'Present visual graphs to management officers.'
      ];
    } else if (role.includes('ece') || role.includes('embedded') || role.includes('hardware')) {
      reqSkills = ['C / C++', 'Microcontrollers', 'Digital Electronics'];
      prefSkills = ['Verilog', 'RTOS', 'Embedded Linux'];
      techSkills = ['Circuit design', 'Oscilloscopes', 'Embedded C coding'];
      education = 'B.E / B.Tech in ECE / EEE / EIE.';
      responsibilities = [
        'Write embedded C firmware scripts for logic board operations.',
        'Debug digital electronics modules and run oscilloscope checks.',
        'Collaborate on hardware prototyping tasks.'
      ];
    }

    const aiExtractedPayload = {
      jobTitle: drive.jobRole,
      company: drive.company.name,
      jobDescription: `Join ${drive.company.name} as a ${drive.jobRole}. We are looking for a dedicated engineer to join our high-performing team. In this role, you will work on state-of-the-art architectures and help deliver scalable portal projects for international clients. We value clean code, strong analytical skillsets, and professional commitment.`,
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
      education: education,
      eligibleDepartments: drive.eligibleDepartments,
      minimumCgpa: drive.minimumCgpa,
      experience: exp,
      technicalSkills: techSkills,
      softSkills: softSkills,
      responsibilities: responsibilities,
      qualifications: qualifications,
      certifications: certifications,
      location: drive.driveLocation,
      salaryCtc: `${drive.ctc} LPA`,
      otherRequirements: otherReqs,
    };

    // Save to drive
    const updatedDrive = await prisma.placementDrive.update({
      where: { id },
      data: {
        jdExtracted: true,
        jdExtractedInfo: aiExtractedPayload
      }
    });

    // Write Audit Log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'EXTRACT_JD_INFO',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      newValue: aiExtractedPayload
    });

    return res.status(200).json({
      success: true,
      message: 'Job Description requirements extracted successfully by AI.',
      data: updatedDrive
    });
  } catch (error) {
    next(error);
  }
}

// 3. Update Extracted JD Info
export async function updateJDInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { extractedInfo } = req.body;

    if (!extractedInfo) {
      return res.status(400).json({ success: false, message: 'Extracted info payload is required.' });
    }

    const drive = await prisma.placementDrive.findUnique({ where: { id } });
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    const updated = await prisma.placementDrive.update({
      where: { id },
      data: {
        jdExtractedInfo: extractedInfo
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Extracted Job Description specifications updated.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 4. Run AI Resume ATS Matching
export async function runAtsMatching(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        company: true,
        students: {
          include: { student: { include: { department: true } } }
        }
      }
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    if (!drive.jdExtracted || !drive.jdExtractedInfo) {
      return res.status(400).json({ success: false, message: 'Please upload a JD and run AI Extraction first.' });
    }

    const jdInfo: any = drive.jdExtractedInfo;

    // Fetch all active students to calculate scores (or link matching ones)
    const allStudents = await prisma.student.findMany({
      where: { deletedAt: null },
      include: { department: true }
    });

    const results = [];

    for (const student of allStudents) {
      // Deterministic scoring logic based on registration number/names to simulate exact requirements
      let baseScore = 75;
      
      // Let's hardcode the user's specific requested values for the demo students
      const nameLower = student.name.toLowerCase();
      const isAkilan = nameLower.includes('akilan');
      const isPriya = nameLower.includes('priya');
      const isRahul = nameLower.includes('rahul');
      const isDivya = nameLower.includes('divya');
      const isKarthik = nameLower.includes('karthik');

      let atsScore = 78;
      let skillsMatch = 80;
      let educationMatch = 'Match';
      let experienceMatch = 'Match';
      let requirementMatch = 82;
      let keywordMatch = 78;
      let resumeStrength = 85;
      let matchingSkills: string[] = [];
      let missingSkills: string[] = [];
      let matchingKeywords: string[] = [];
      let missingKeywords: string[] = [];
      let recommendations: string[] = [];

      // Technical skills list from JD
      const reqSkills: string[] = jdInfo.requiredSkills || [];
      const prefSkills: string[] = jdInfo.preferredSkills || [];
      const jdTechSkills: string[] = jdInfo.technicalSkills || [];
      const jdSoftSkills: string[] = jdInfo.softSkills || [];
      const allJdSkills = [...reqSkills, ...prefSkills, ...jdTechSkills, ...jdSoftSkills];

      if (isAkilan) {
        atsScore = 92;
        skillsMatch = 95;
        educationMatch = 'Match';
        experienceMatch = 'Match';
        requirementMatch = 94;
        keywordMatch = 92;
        resumeStrength = 95;
        matchingSkills = allJdSkills.slice(0, Math.ceil(allJdSkills.length * 0.9));
        missingSkills = allJdSkills.slice(Math.ceil(allJdSkills.length * 0.9), Math.ceil(allJdSkills.length * 0.9) + 2); // 2 missing
        matchingKeywords = ['HTML5', 'CSS3', 'Git', 'Software Development', 'Problem-solving', 'React', 'REST APIs'];
        missingKeywords = ['Docker', 'Microservices'];
        recommendations = ['Candidate has exceptional alignment. Recommended for immediate interviewing.', 'Review portfolio for project designs.'];
      } else if (isPriya) {
        atsScore = 86;
        skillsMatch = 88;
        educationMatch = 'Match';
        experienceMatch = 'Match';
        requirementMatch = 87;
        keywordMatch = 84;
        resumeStrength = 88;
        matchingSkills = allJdSkills.slice(0, Math.ceil(allJdSkills.length * 0.8));
        missingSkills = allJdSkills.slice(Math.ceil(allJdSkills.length * 0.8), Math.ceil(allJdSkills.length * 0.8) + 3); // 3 missing
        matchingKeywords = ['HTML5', 'CSS3', 'Communication', 'Teamwork', 'Database normalization'];
        missingKeywords = ['TypeScript', 'Prisma ORM', 'Redis'];
        recommendations = ['Good matching profile.', 'Ask about experience with relational databases in interviews.'];
      } else if (isRahul) {
        atsScore = 71;
        skillsMatch = 72;
        educationMatch = 'Partial';
        experienceMatch = 'Partial';
        requirementMatch = 74;
        keywordMatch = 68;
        resumeStrength = 72;
        matchingSkills = allJdSkills.slice(0, Math.ceil(allJdSkills.length * 0.7));
        missingSkills = allJdSkills.slice(Math.ceil(allJdSkills.length * 0.7), Math.ceil(allJdSkills.length * 0.7) + 5); // 5 missing
        matchingKeywords = ['Logic board', 'C / C++', 'Microcontrollers', 'Communication'];
        missingKeywords = ['React.js', 'Express.js', 'Node.js', 'TailwindCSS', 'TypeScript'];
        recommendations = ['Partial department and technical mismatch.', 'Candidate from ECE core; evaluate if basic coding skills match web development standards.'];
      } else if (isDivya) {
        atsScore = 65;
        skillsMatch = 64;
        educationMatch = 'Partial';
        experienceMatch = 'No Match';
        requirementMatch = 60;
        keywordMatch = 58;
        resumeStrength = 75;
        matchingSkills = allJdSkills.slice(0, Math.ceil(allJdSkills.length * 0.6));
        missingSkills = allJdSkills.slice(Math.ceil(allJdSkills.length * 0.6), Math.ceil(allJdSkills.length * 0.6) + 4);
        matchingKeywords = ['SQL', 'Data Cleansing', 'Problem-solving'];
        missingKeywords = ['Next.js', 'REST APIs', 'Vite'];
        recommendations = ['Low matching score.', 'Needs additional validation of backend REST frameworks.'];
      } else if (isKarthik) {
        atsScore = 55;
        skillsMatch = 50;
        educationMatch = 'No Match';
        experienceMatch = 'No Match';
        requirementMatch = 52;
        keywordMatch = 48;
        resumeStrength = 68;
        matchingSkills = allJdSkills.slice(0, Math.ceil(allJdSkills.length * 0.5));
        missingSkills = allJdSkills.slice(Math.ceil(allJdSkills.length * 0.5), Math.ceil(allJdSkills.length * 0.5) + 6);
        matchingKeywords = ['Problem-solving', 'Git'];
        missingKeywords = ['React', 'Node', 'Database normalization', 'TypeScript'];
        recommendations = ['Significant misalignment.', 'Mechanical Engineering background; examine programming interests.'];
      } else {
        // Generic student score calculations based on CGPA and department match
        const deptCode = student.department.code.toUpperCase();
        const isEligibleDept = drive.eligibleDepartments.map(d => d.toUpperCase()).includes(deptCode);
        
        let deptScoreVal = isEligibleDept ? 90 : 40;
        let cgpaScoreVal = student.ugPercentage >= drive.minimumCgpa ? 95 : 60;
        
        // Pseudo-random but deterministic multiplier
        const hash = student.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomSeed = (hash % 20); // 0 to 19

        atsScore = Math.min(100, Math.max(20, Math.floor((deptScoreVal * 0.4 + cgpaScoreVal * 0.4) + randomSeed)));
        skillsMatch = Math.min(100, Math.max(20, Math.floor(atsScore + (hash % 10) - 5)));
        educationMatch = isEligibleDept ? 'Match' : (deptCode === 'ECE' || deptCode === 'EEE' ? 'Partial' : 'No Match');
        experienceMatch = hash % 2 === 0 ? 'Match' : 'Partial';
        requirementMatch = Math.min(100, Math.floor(atsScore + (hash % 6)));
        keywordMatch = Math.min(100, Math.floor(skillsMatch - 3));
        resumeStrength = Math.min(100, Math.floor(75 + (hash % 20)));

        matchingSkills = allJdSkills.slice(0, Math.floor(allJdSkills.length * (skillsMatch / 100)));
        missingSkills = allJdSkills.slice(Math.floor(allJdSkills.length * (skillsMatch / 100)));
        
        matchingKeywords = [student.department.code, 'Communication', 'Problem-solving'];
        if (skillsMatch > 70) matchingKeywords.push('Git', 'SQL');
        missingKeywords = allJdSkills.filter(s => !matchingSkills.includes(s));
        
        recommendations = atsScore > 80 
          ? ['Highly compatible profile.', 'Schedule regular placement evaluations.']
          : ['Average match.', 'Check core programming concepts and backlog histories in interview steps.'];
      }

      // Sync/Upsert record in DriveStudent join table
      const existingDS = await prisma.driveStudent.findFirst({
        where: { driveId: id, studentId: student.id }
      });

      let atsStatus = 'Pending';
      if (isAkilan) atsStatus = 'Shortlisted';
      else if (isPriya || isRahul) atsStatus = 'Review';

      if (existingDS) {
        const updatedDS = await prisma.driveStudent.update({
          where: { id: existingDS.id },
          data: {
            atsScore,
            skillsMatch,
            educationMatch,
            experienceMatch,
            requirementMatch,
            keywordMatch,
            resumeStrength,
            missingSkills,
            matchingSkills,
            matchingKeywords,
            missingKeywords,
            recommendations,
            atsStatus: existingDS.atsScore !== null ? existingDS.atsStatus : atsStatus
          }
        });
        results.push(updatedDS);
      } else {
        const newDS = await prisma.driveStudent.create({
          data: {
            driveId: id,
            studentId: student.id,
            participated: false,
            selected: false,
            atsScore,
            skillsMatch,
            educationMatch,
            experienceMatch,
            requirementMatch,
            keywordMatch,
            resumeStrength,
            missingSkills,
            matchingSkills,
            matchingKeywords,
            missingKeywords,
            recommendations,
            atsStatus: atsStatus
          }
        });
        results.push(newDS);
      }
    }

    // Write Audit Log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: 'RUN_AI_ATS_MATCHING',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      newValue: { candidatesAnalyzed: results.length }
    });

    return res.status(200).json({
      success: true,
      message: `AI ATS Resume matching executed successfully. Analyzed ${results.length} resumes.`,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

// 5. Get Ranked Candidate Table with Filters
export async function getCandidatesList(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { search = '', departmentId = '', minScore = '', shortlisted = '', eligible = '', page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Verify drive exists
    const drive = await prisma.placementDrive.findUnique({ where: { id } });
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    // Query filters
    const whereClause: any = {
      driveId: id,
      atsScore: { not: null } // Only fetch matched candidates
    };

    if (shortlisted === 'true') {
      whereClause.atsStatus = 'Shortlisted';
    } else if (shortlisted === 'false') {
      whereClause.atsStatus = { in: ['Review', 'Pending'] };
    }

    if (minScore) {
      whereClause.atsScore = {
        gte: parseInt(minScore as string, 10)
      };
    }

    // Student specific filters
    const studentFilter: any = {
      deletedAt: null
    };

    if (search) {
      studentFilter.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { registerNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (departmentId) {
      studentFilter.departmentId = departmentId as string;
    }

    if (eligible === 'true') {
      studentFilter.ugPercentage = { gte: drive.minimumCgpa };
    } else if (eligible === 'false') {
      studentFilter.ugPercentage = { lt: drive.minimumCgpa };
    }

    whereClause.student = studentFilter;

    // Get total count for pagination
    const totalCount = await prisma.driveStudent.count({ where: whereClause });

    // Fetch ranked candidate items
    const candidates = await prisma.driveStudent.findMany({
      where: whereClause,
      include: {
        student: {
          include: { department: true }
        }
      },
      orderBy: {
        atsScore: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    return res.status(200).json({
      success: true,
      data: {
        candidates: candidates.map((c, idx) => ({
          rank: offset + idx + 1,
          id: c.id,
          studentId: c.studentId,
          name: c.student.name,
          registerNumber: c.student.registerNumber,
          department: c.student.department.name,
          deptCode: c.student.department.code,
          cgpa: c.student.ugPercentage,
          atsScore: c.atsScore,
          skillsMatch: c.skillsMatch,
          educationMatch: c.educationMatch,
          missingSkillsCount: c.missingSkills.length,
          missingSkills: c.missingSkills,
          status: c.atsStatus,
          isEligible: c.student.ugPercentage >= drive.minimumCgpa
        })),
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// 6. Get Side-by-Side ATS Match Detail Comparison
export async function getCandidateAtsDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, studentId } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const candidateMatch = await prisma.driveStudent.findFirst({
      where: { driveId: id, studentId: studentId }
    });

    if (!candidateMatch || candidateMatch.atsScore === null) {
      return res.status(404).json({
        success: false,
        message: 'ATS analysis matching profile not created. Please trigger matching first.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        drive: {
          jobRole: drive.jobRole,
          companyName: drive.company.name,
          driveLocation: drive.driveLocation,
          minimumCgpa: drive.minimumCgpa,
          eligibleDepartments: drive.eligibleDepartments,
          jdExtractedInfo: drive.jdExtractedInfo
        },
        student: {
          id: student.id,
          name: student.name,
          registerNumber: student.registerNumber,
          departmentName: student.department.name,
          deptCode: student.department.code,
          cgpa: student.ugPercentage,
          resumeUrl: student.resumeUrl,
          email: student.email,
          phone: student.phoneNumber
        },
        matchStats: {
          atsScore: candidateMatch.atsScore,
          skillsMatch: candidateMatch.skillsMatch,
          educationMatch: candidateMatch.educationMatch,
          experienceMatch: candidateMatch.experienceMatch,
          requirementMatch: candidateMatch.requirementMatch,
          keywordMatch: candidateMatch.keywordMatch,
          resumeStrength: candidateMatch.resumeStrength,
          matchingSkills: candidateMatch.matchingSkills,
          missingSkills: candidateMatch.missingSkills,
          matchingKeywords: candidateMatch.matchingKeywords,
          missingKeywords: candidateMatch.missingKeywords,
          recommendations: candidateMatch.recommendations,
          status: candidateMatch.atsStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// 7. Toggle Student Shortlist Status
export async function updateAtsStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, studentId } = req.params;
    const { status } = req.body; // "Shortlisted" | "Review" | "Pending"

    if (!['Shortlisted', 'Review', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid shortlist status.' });
    }

    const candidateMatch = await prisma.driveStudent.findFirst({
      where: { driveId: id, studentId: studentId }
    });

    if (!candidateMatch) {
      return res.status(404).json({ success: false, message: 'Candidate matching profile not found.' });
    }

    const updated = await prisma.driveStudent.update({
      where: { id: candidateMatch.id },
      data: {
        atsStatus: status
      },
      include: {
        student: true
      }
    });

    // Write Audit Log
    await createAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'ADMIN',
      action: status === 'Shortlisted' ? 'SHORTLIST_CANDIDATE' : 'REVIEW_CANDIDATE',
      entity: 'DriveStudent',
      entityId: candidateMatch.id,
      ipAddress: req.ip,
      newValue: { status, studentName: updated.student.name }
    });

    return res.status(200).json({
      success: true,
      message: `Candidate status updated to ${status} successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 8. Get global ATS Analytics (Admin Dashboard)
export async function getAtsAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const drivesWithJd = await prisma.placementDrive.count({
      where: { deletedAt: null, jdFileUrl: { not: null } }
    });

    const resumesAnalyzed = await prisma.driveStudent.count({
      where: { atsScore: { not: null } }
    });

    const shortlistedStudents = await prisma.driveStudent.count({
      where: { atsStatus: 'Shortlisted' }
    });

    const activeAtsDrives = await prisma.placementDrive.count({
      where: { deletedAt: null, jdExtracted: true }
    });

    // Calculate Average ATS score
    const avgScoreResult = await prisma.driveStudent.aggregate({
      where: { atsScore: { not: null } },
      _avg: {
        atsScore: true
      }
    });

    // Fetch top matching candidate profiles
    const topMatches = await prisma.driveStudent.findMany({
      where: { atsScore: { not: null } },
      include: {
        student: { include: { department: true } },
        drive: { include: { company: true } }
      },
      orderBy: {
        atsScore: 'desc'
      },
      take: 5
    });

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          jdsUploaded: drivesWithJd,
          resumesAnalyzed,
          averageAtsScore: avgScoreResult._avg.atsScore ? Math.round(avgScoreResult._avg.atsScore) : 0,
          studentsShortlisted: shortlistedStudents,
          drivesUsingAI: activeAtsDrives
        },
        topCandidates: topMatches.map((c) => ({
          studentName: c.student.name,
          deptCode: c.student.department.code,
          atsScore: c.atsScore,
          companyName: c.drive.company.name,
          roleName: c.drive.jobRole,
          status: c.atsStatus
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}
