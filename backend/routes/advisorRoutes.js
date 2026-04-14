// routes/advisorRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import {
  AcademicQuery,
  ExamQuery,
  LeaveQuery,
  OtherQuery,
  Appointment
} from '../models/studentQueries.js';

const router = express.Router();

// ============================================================
// HELPER: Lazy-load User model (avoids circular imports)
// ============================================================
async function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const mod = await import('../models/User.js');
  return mod.default;
}

// ============================================================
// INLINE: Attendance & Marks models (shared with teacherRoutes)
// ============================================================
const attendanceSchema = new mongoose.Schema({
  teacherId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentRollNo: { type: String, required: true },
  date:          { type: Date, required: true },
  courseName:    { type: String, required: true },
  courseCode:    { type: String, default: '' },
  status:        { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  remarks:       { type: String, default: '' }
}, { timestamps: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

const marksSchema = new mongoose.Schema({
  teacherId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentRollNo: { type: String, required: true },
  examDate:      { type: Date, required: true },
  examType:      { type: String, required: true },
  courseName:    { type: String, required: true },
  courseCode:    { type: String, default: '' },
  totalMarks:    { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  remarks:       { type: String, default: '' }
}, { timestamps: true });

const Marks = mongoose.models.Marks || mongoose.model('Marks', marksSchema);

// ============================================================
// MIDDLEWARE: Ensure only advisors can access these routes
// ============================================================
router.use(authenticateToken);
router.use((req, res, next) => {
  if (req.user.role !== 'advisor') {
    return res.status(403).json({ success: false, message: 'Access denied. Advisor only.' });
  }
  next();
});

// ==================== DEBUG: See all students in DB ====================
// GET /api/advisors/debug/students  — TEMPORARY, remove after fixing
router.get('/debug/students', async (req, res) => {
  try {
    const User = await getUserModel();
    const allStudents = await User.find({ role: 'student' })
      .select('_id firstName lastName email rollNo studentId batch semester advisorId assignedTeacher')
      .lean();
    
    res.json({
      success: true,
      currentAdvisorId: req.user._id,
      totalStudents: allStudents.length,
      students: allStudents.map(s => ({
        _id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        rollNo: s.rollNo,
        studentId: s.studentId,
        batch: s.batch,
        advisorId: s.advisorId,
        advisorIdMatch: s.advisorId ? s.advisorId.toString() === req.user._id.toString() : false,
        assignedTeacher: s.assignedTeacher
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REGISTER STUDENT ====================
// POST /api/advisors/students/register
router.post('/students/register', async (req, res) => {
  try {
    const User = await getUserModel();
    const { firstName, lastName, email, rollNo, semester, section, batch, password } = req.body;

    if (!firstName || !lastName || !email || !rollNo || !semester) {
      return res.status(400).json({ success: false, message: 'Please provide firstName, lastName, email, rollNo, and semester' });
    }

    // Check duplicate email or rollNo
    const existing = await User.findOne({ $or: [{ email }, { rollNo }, { studentId: rollNo }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.email === email ? 'Email already registered' : 'Roll number already registered'
      });
    }

    // Default password is rollNo. Pre-save hook in User model hashes it.
    // Pad to 6 chars minimum so bcrypt & any future minlength checks never fail.
    // Students log in with this value (e.g. rollNo "232" → password "232***").
    const rawPassword = (password || rollNo).padEnd(6, '*');
    const batchValue  = batch || req.user.batch || `Sem${semester}`;

    const student = new User({
      firstName,
      lastName,
      email,
      password:        rawPassword,   // pre-save hook hashes this
      role:            'student',
      rollNo:          rollNo,
      studentId:       rollNo,        // used in query matching
      semester:        parseInt(semester),
      section:         section || '',
      batch:           batchValue,
      advisorId:       req.user._id,  // link to this advisor
      isVerified:      true,          // auto-verify advisor-registered students
      verificationStatus: 'verified'
    });

    await student.save();

    // SAFETY NET: bypass strict schema via native driver to guarantee advisorId is saved
    await User.collection.updateOne(
      { _id: student._id },
      { $set: {
          advisorId: req.user._id,
          rollNo: rollNo,
          studentId: rollNo,
          semester: parseInt(semester),
          section: section || '',
          batch: batchValue,
          isVerified: true,
          verificationStatus: 'verified'
      }}
    );

    console.log(`✅ Student registered: ${firstName} ${lastName} (${rollNo}), advisorId: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: `Student registered successfully. Login: ${email} / Password: ${rawPassword}`,
      student: {
        _id:      student._id,
        name:     `${student.firstName} ${student.lastName}`,
        email:    student.email,
        rollNo:   student.rollNo,
        semester: student.semester,
        section:  student.section,
        batch:    student.batch
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    // Return the actual mongoose validation error so it's visible in the browser
    res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(k => ({
        field: k,
        message: error.errors[k].message
      })) : []
    });
  }
});

// ==================== GET ALL STUDENTS (all students in system) ====================
// GET /api/advisors/students
router.get('/students', async (req, res) => {
  try {
    const User = await getUserModel();
    const { search, semester, section } = req.query;

    // Fetch ALL students (advisor sees everyone so they can assign sections/teachers)
    let students = await User.find({ role: 'student' })
      .select('_id firstName lastName email rollNo studentId semester section batch assignedTeacher advisorId')
      .sort({ createdAt: -1 })
      .lean();

    // Apply optional filters
    if (semester) students = students.filter(s => s.semester === parseInt(semester));
    if (section)  students = students.filter(s => s.section === section);
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.email  || '').toLowerCase().includes(q)
      );
    }

    // Resolve teacher names
    const teacherIds = [...new Set(students.filter(s => s.assignedTeacher).map(s => String(s.assignedTeacher)))];
    let teacherMap = {};
    if (teacherIds.length) {
      const teachers = await User.find({ _id: { $in: teacherIds } }).select('_id firstName lastName').lean();
      teachers.forEach(t => { teacherMap[String(t._id)] = `${t.firstName} ${t.lastName}`; });
    }

    const advisorIdStr = req.user._id.toString();
    const formatted = students.map(s => ({
      _id:             s._id,
      name:            `${s.firstName} ${s.lastName}`,
      email:           s.email,
      rollNo:          s.rollNo || s.studentId || '',
      studentId:       s.studentId || s.rollNo || '',
      semester:        s.semester,
      section:         s.section,
      batch:           s.batch,
      assignedTeacher: s.assignedTeacher ? teacherMap[String(s.assignedTeacher)] || 'Assigned' : null,
      isMyStudent:     s.advisorId ? s.advisorId.toString() === advisorIdStr : false
    }));

    res.json({ success: true, students: formatted, total: formatted.length });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

// ==================== GET SINGLE STUDENT DETAILS ====================
// GET /api/advisors/students/:studentId
router.get('/students/:studentId', async (req, res) => {
  try {
    const User = await getUserModel();
    const student = await User.findOne({ _id: req.params.studentId, role: 'student', advisorId: req.user._id })
      .select('-password')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student', error: error.message });
  }
});

// ==================== ASSIGN TEACHER TO SECTION (BULK) ====================
// PATCH /api/advisors/sections/assign-teacher
router.patch('/sections/assign-teacher', async (req, res) => {
  try {
    const User = await getUserModel();
    const { teacherId, sections } = req.body; // sections: string[]

    if (!teacherId || !sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide teacherId and at least one section' });
    }

    // Verify teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Bulk-update all students in the given sections that belong to this advisor
    const result = await User.updateMany(
      {
        role: 'student',
        advisorId: req.user._id,
        section: { $in: sections }
      },
      { $set: { assignedTeacher: teacherId } }
    );

    res.json({
      success: true,
      message: `${teacher.firstName} ${teacher.lastName} assigned to section(s) ${sections.join(', ')} — ${result.modifiedCount} student(s) updated`,
      modifiedCount: result.modifiedCount,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      sections
    });
  } catch (error) {
    console.error('Error assigning teacher to section:', error);
    res.status(500).json({ success: false, message: 'Failed to assign teacher to section', error: error.message });
  }
});

// ==================== GET SECTIONS (distinct sections for this advisor's students) ====================
// GET /api/advisors/sections
router.get('/sections', async (req, res) => {
  try {
    const User = await getUserModel();

    // Show sections from ALL students (advisor sees all)
    const allStudents = await User.find({ role: 'student' })
      .select('section assignedTeacher advisorId')
      .lean();

    // Build section summary
    const sectionMap = {};
    const teacherIds = new Set();

    allStudents.forEach(s => {
      const sec = s.section || 'Unassigned';
      if (!sectionMap[sec]) sectionMap[sec] = { section: sec, studentCount: 0, teacherIds: new Set() };
      sectionMap[sec].studentCount++;
      if (s.assignedTeacher) {
        sectionMap[sec].teacherIds.add(String(s.assignedTeacher));
        teacherIds.add(String(s.assignedTeacher));
      }
    });

    // Resolve teacher names
    let teacherMap = {};
    if (teacherIds.size > 0) {
      const teachers = await User.find({ _id: { $in: Array.from(teacherIds) } }).select('_id firstName lastName').lean();
      teachers.forEach(t => { teacherMap[String(t._id)] = `${t.firstName} ${t.lastName}`; });
    }

    const sections = Object.values(sectionMap).map(s => ({
      section: s.section,
      studentCount: s.studentCount,
      assignedTeachers: Array.from(s.teacherIds).map(id => ({ id, name: teacherMap[id] || 'Unknown' }))
    })).sort((a, b) => a.section.localeCompare(b.section));

    res.json({ success: true, sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sections', error: error.message });
  }
});

// ==================== ASSIGN SECTION TO STUDENT ====================
// PATCH /api/advisors/students/:studentId/assign-section
router.patch('/students/:studentId/assign-section', async (req, res) => {
  try {
    const User = await getUserModel();
    const { section, semester } = req.body;

    if (!section) {
      return res.status(400).json({ success: false, message: 'Please provide section' });
    }

    const updateData = {
      section: section.trim(),
      advisorId: req.user._id  // claim this student as belonging to this advisor
    };
    if (semester) updateData.semester = parseInt(semester);

    const student = await User.findOneAndUpdate(
      { _id: req.params.studentId, role: 'student' },
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: `Section ${section} assigned to ${student.firstName} ${student.lastName}`,
      student
    });
  } catch (error) {
    console.error('Error assigning section:', error);
    res.status(500).json({ success: false, message: 'Failed to assign section', error: error.message });
  }
});
router.patch('/students/:studentId/assign-teacher', async (req, res) => {
  try {
    const User = await getUserModel();
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'Please provide teacherId' });
    }

    // Verify teacher exists and has correct role
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Allow any advisor to assign a teacher (ownership is set via assign-section)
    const student = await User.findOneAndUpdate(
      { _id: req.params.studentId, role: 'student' },
      { $set: { assignedTeacher: teacherId } },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: `${teacher.firstName} ${teacher.lastName} assigned to ${student.firstName} ${student.lastName}`,
      student
    });
  } catch (error) {
    console.error('Error assigning teacher:', error);
    res.status(500).json({ success: false, message: 'Failed to assign teacher', error: error.message });
  }
});

// ==================== GET ALL TEACHERS ====================
// GET /api/advisors/teachers
router.get('/teachers', async (req, res) => {
  try {
    const User = await getUserModel();
    const teachers = await User.find({ role: 'teacher' })
      .select('_id firstName lastName email')
      .sort({ firstName: 1 })
      .lean();

    const formatted = teachers.map(t => ({
      _id:   t._id,
      name:  `${t.firstName} ${t.lastName}`,
      email: t.email
    }));

    res.json({ success: true, teachers: formatted });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers', error: error.message });
  }
});

// ==================== GET QUERIES (Leave + Academic only) ====================
// GET /api/advisors/queries
router.get('/queries', async (req, res) => {
  try {
    const { status, category } = req.query;

    const queryFilter = {};
    if (status) queryFilter.finalStatus = status;

    // Advisor sees: leave and academic/course queries + appointments ONLY
    // ExamQuery (update-marks, retakes) and OtherQuery (attendance/timetable) are teacher-only
    const otherQueries = []; // teacher-only — excluded from advisor view
    const [leaveQueries, academicQueries, appointments] = await Promise.all([
      (!category || category === 'leave')       ? LeaveQuery.find(queryFilter).sort({ createdAt: -1 }).lean()    : [],
      (!category || category === 'academic')    ? AcademicQuery.find(queryFilter).sort({ createdAt: -1 }).lean() : [],
      (!category || category === 'appointment') ? Appointment.find(status ? { status } : {}).sort({ createdAt: -1 }).lean() : []
    ]);

    const normalize = (q, cat) => {
      const aa = q.advisorApproval || {};
      return {
        _id:            q._id,
        studentId:      q.studentId,
        studentName:    q.studentName || 'Unknown',
        studentRollNo:  q.studentId || '',
        batch:          q.batch || '',
        queryType:      q.queryType || q.leaveType || q.issueType || cat,
        category:       cat,
        description:    q.description || q.details || '',
        priority:       q.priority || 'medium',
        advisorStatus:  aa.status || 'pending',
        advisorRemarks: aa.comments || '',
        finalStatus:    q.finalStatus || 'pending',
        courseName:     q.courseName || '',
        leaveType:      q.leaveType  || '',
        issueType:      q.issueType  || '',
        startDate:      q.startDate  || null,
        endDate:        q.endDate    || null,
        duration:       q.duration   || null,
        documents:      q.documents  || [],
        createdAt:      q.createdAt
      };
    };

    // Normalize appointments separately (different schema)
    const normalizeAppointment = (a) => ({
      _id:             a._id,
      studentId:       a.studentId,
      studentName:     a.studentName || 'Unknown',
      studentRollNo:   a.studentId   || '',
      batch:           '',
      queryType:       a.appointmentType,
      category:        'appointment',
      description:     a.reason || '',
      priority:        'medium',
      advisorStatus:   a.status === 'confirmed' ? 'approved'
                     : a.status === 'cancelled' ? 'rejected'
                     : 'pending',
      advisorRemarks:  a.advisorComments || '',
      finalStatus:     a.status === 'confirmed' ? 'approved'
                     : a.status === 'cancelled' ? 'rejected'
                     : 'pending',
      appointmentStatus: a.status,
      preferredDate:   a.preferredDate  || null,
      preferredTime:   a.preferredTime  || '',
      confirmedDate:   a.confirmedDate  || null,
      confirmedTime:   a.confirmedTime  || '',
      createdAt:       a.createdAt
    });

    let allQueries = [
      ...leaveQueries.map(q => normalize(q, 'leave')),
      ...academicQueries.map(q => normalize(q, 'academic')),
      ...otherQueries.map(q => normalize(q, 'other')),
      ...appointments.map(normalizeAppointment)
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, queries: allQueries });
  } catch (error) {
    console.error('Error fetching advisor queries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queries', error: error.message });
  }
});

// ==================== REVIEW / FORWARD QUERY TO HOP ====================
// PATCH /api/advisors/queries/:queryId/forward
router.patch('/queries/:queryId/forward', async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide remarks' });
    }

    const advisorApproval = {
      status:     'approved',
      comments:   remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`,
      approvedAt: new Date()
    };

    const updatePayload = { $set: { advisorApproval, finalStatus: 'pending', updatedAt: new Date() } };

    const updated =
      await LeaveQuery.findByIdAndUpdate(queryId, updatePayload, { new: true }) ||
      await AcademicQuery.findByIdAndUpdate(queryId, updatePayload, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.json({ success: true, message: 'Query forwarded to HOP successfully', query: updated });
  } catch (error) {
    console.error('Error forwarding query:', error);
    res.status(500).json({ success: false, message: 'Failed to forward query', error: error.message });
  }
});

// ==================== REVIEW QUERY (generic patch) ====================
// PATCH /api/advisors/queries/:queryId/review
router.patch('/queries/:queryId/review', async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks, status } = req.body; // status: 'approved' | 'rejected'

    if (!remarks || !remarks.trim() || !status) {
      return res.status(400).json({ success: false, message: 'Please provide remarks and status' });
    }

    const advisorApproval = {
      status:     status,
      comments:   remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`,
      approvedAt: new Date()
    };

    const finalStatus = status === 'rejected' ? 'rejected' : 'pending';
    const updatePayload = { $set: { advisorApproval, finalStatus, updatedAt: new Date() } };

    const updated =
      await LeaveQuery.findByIdAndUpdate(queryId, updatePayload, { new: true }) ||
      await AcademicQuery.findByIdAndUpdate(queryId, updatePayload, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.json({ success: true, message: `Query ${status} successfully`, query: updated });
  } catch (error) {
    console.error('Error reviewing query:', error);
    res.status(500).json({ success: false, message: 'Failed to review query', error: error.message });
  }
});

// ==================== REJECT QUERY ====================
// PATCH /api/advisors/queries/:queryId/reject
router.patch('/queries/:queryId/reject', async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide rejection remarks' });
    }

    const advisorApproval = {
      status:     'rejected',
      comments:   remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`,
      approvedAt: new Date()
    };

    const updatePayload = { $set: { advisorApproval, finalStatus: 'rejected', updatedAt: new Date() } };

    const updated =
      await LeaveQuery.findByIdAndUpdate(queryId, updatePayload, { new: true }) ||
      await AcademicQuery.findByIdAndUpdate(queryId, updatePayload, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.json({ success: true, message: 'Query rejected successfully', query: updated });
  } catch (error) {
    console.error('Error rejecting query:', error);
    res.status(500).json({ success: false, message: 'Failed to reject query', error: error.message });
  }
});

// ==================== GET ACADEMIC RECORDS (Attendance + Marks from teachers) ====================
// GET /api/advisors/academic-records
router.get('/academic-records', async (req, res) => {
  try {
    const User = await getUserModel();
    const advisorIdStr = req.user._id.toString();

    // Robust fetch: try advisorId filter first, fallback to in-memory
    let students = await User.find({
      role: 'student',
      $or: [{ advisorId: req.user._id }, { advisorId: advisorIdStr }]
    })
      .select('_id firstName lastName rollNo studentId semester section batch assignedTeacher advisorId')
      .lean();

    if (students.length === 0) {
      const all = await User.find({ role: 'student' })
        .select('_id firstName lastName rollNo studentId semester section batch assignedTeacher advisorId')
        .lean();
      students = all.filter(s => s.advisorId && s.advisorId.toString() === advisorIdStr);
    }

    if (!students.length) {
      return res.json({ success: true, records: [] });
    }

    const studentIds = students.map(s => s._id);

    // Get teacher names
    const teacherIds = [...new Set(students.filter(s => s.assignedTeacher).map(s => String(s.assignedTeacher)))];
    let teacherMap = {};
    if (teacherIds.length) {
      const teachers = await User.find({ _id: { $in: teacherIds } }).select('_id firstName lastName').lean();
      teachers.forEach(t => { teacherMap[String(t._id)] = `${t.firstName} ${t.lastName}`; });
    }

    // Get attendance records for all students
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attendanceAgg, latestMarks] = await Promise.all([
      Attendance.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
          $group: {
            _id:     '$studentId',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
          }
        }
      ]),
      Marks.find({ studentId: { $in: studentIds } })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Build attendance map
    const attMap = {};
    attendanceAgg.forEach(a => {
      attMap[String(a._id)] = a.total > 0 ? parseFloat(((a.present / a.total) * 100).toFixed(1)) : 0;
    });

    // Build latest marks map (most recent mark per student)
    const marksMap = {};
    latestMarks.forEach(m => {
      const sid = String(m.studentId);
      if (!marksMap[sid]) {
        marksMap[sid] = {
          marks:      `${m.obtainedMarks}/${m.totalMarks}`,
          percentage: parseFloat(((m.obtainedMarks / m.totalMarks) * 100).toFixed(1)),
          courseName: m.courseName,
          examType:   m.examType,
          examDate:   m.examDate
        };
      }
    });

    // Build final records
    const records = students.map(s => {
      const sid = String(s._id);
      const attendance = attMap[sid] ?? null;
      const latestExam  = marksMap[sid] || null;

      // Determine status
      let status = 'good';
      if (attendance !== null && attendance < 60) status = 'critical';
      else if (attendance !== null && attendance < 75) status = 'risk';

      return {
        studentId:   s._id,
        studentName: `${s.firstName} ${s.lastName}`,
        rollNo:      s.rollNo || s.studentId || '',
        semester:    s.semester,
        section:     s.section,
        batch:       s.batch,
        teacher:     s.assignedTeacher ? teacherMap[String(s.assignedTeacher)] || 'Assigned' : 'Not Assigned',
        attendance:  attendance ?? 0,
        latestExam,
        status
      };
    });

    // Sort: critical first, then risk, then good
    const order = { critical: 0, risk: 1, good: 2 };
    records.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching academic records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch academic records', error: error.message });
  }
});

// ==================== GET STUDENT ATTENDANCE ====================
// GET /api/advisors/students/:studentId/attendance
router.get('/students/:studentId/attendance', async (req, res) => {
  try {
    const { page = 1, limit = 50, courseName } = req.query;
    const filter = { studentId: req.params.studentId };
    if (courseName) filter.courseName = courseName;

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Attendance.countDocuments(filter);
    const present = records.filter(r => r.status === 'present').length;
    const percentage = records.length > 0 ? parseFloat(((present / records.length) * 100).toFixed(1)) : 0;

    res.json({ success: true, records, total, percentage });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
});

// ==================== GET STUDENT MARKS ====================
// GET /api/advisors/students/:studentId/marks
router.get('/students/:studentId/marks', async (req, res) => {
  try {
    const { courseName, examType } = req.query;
    const filter = { studentId: req.params.studentId };
    if (courseName) filter.courseName = courseName;
    if (examType)   filter.examType = examType;

    const records = await Marks.find(filter).sort({ examDate: -1 }).lean();

    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks', error: error.message });
  }
});

// ==================== DASHBOARD STATISTICS ====================
// GET /api/advisors/statistics/dashboard
router.get('/statistics/dashboard', async (req, res) => {
  try {
    const User = await getUserModel();
    const advisorIdStr = req.user._id.toString();

    // Robust fetch with fallback
    let studentDocs = await User.find({
      role: 'student',
      $or: [{ advisorId: req.user._id }, { advisorId: advisorIdStr }]
    }).select('_id').lean();

    if (studentDocs.length === 0) {
      const all = await User.find({ role: 'student' }).select('_id advisorId').lean();
      studentDocs = all.filter(s => s.advisorId && s.advisorId.toString() === advisorIdStr);
    }

    const [leaveQ, academicQ] = await Promise.all([
      LeaveQuery.countDocuments({ 'advisorApproval.status': 'pending' }),
      AcademicQuery.countDocuments({ 'advisorApproval.status': 'pending' })
    ]);

    const studentIds = studentDocs.map(s => s._id);
    const totalStudents = studentDocs.length;
    const pendingReviews = leaveQ + academicQ;

    // Count at-risk students (attendance < 75%)
    let atRiskStudents = 0;
    if (studentIds.length) {
      const attAgg = await Attendance.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
          $group: {
            _id:     '$studentId',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
          }
        }
      ]);
      atRiskStudents = attAgg.filter(a => a.total > 0 && (a.present / a.total) < 0.75).length;
    }

    // Count forwarded to HOP
    const [lFwd, aFwd] = await Promise.all([
      LeaveQuery.countDocuments({ 'advisorApproval.status': 'approved' }),
      AcademicQuery.countDocuments({ 'advisorApproval.status': 'approved' })
    ]);
    const forwardedToHOP = lFwd + aFwd;

    res.json({
      success: true,
      stats: { totalStudents, pendingReviews, atRiskStudents, forwardedToHOP }
    });
  } catch (error) {
    console.error('Error fetching advisor stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// ==================== ADVISOR APPOINTMENT ACTIONS ====================

// PATCH /api/advisors/appointments/:id/confirm
router.patch('/appointments/:id/confirm', async (req, res) => {
  try {
    const { comments, confirmedDate, confirmedTime } = req.body;
    const update = {
      status:          'confirmed',
      advisorId:       req.user._id,
      advisorComments: comments || '',
      confirmedDate:   confirmedDate ? new Date(confirmedDate) : undefined,
      confirmedTime:   confirmedTime || undefined
    };
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment confirmed', appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to confirm', error: err.message });
  }
});

// PATCH /api/advisors/appointments/:id/cancel
router.patch('/appointments/:id/cancel', async (req, res) => {
  try {
    const { comments } = req.body;
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelled', advisorComments: comments || '' } },
      { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment cancelled', appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel', error: err.message });
  }
});


// ── TeacherNotification model ────────────────────────────────────────
const teacherNotificationSchema = new mongoose.Schema({
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, default: '' },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  rollNo:      { type: String, default: '' },
  section:     { type: String, default: '' },
  batch:       { type: String, default: '' },
  semester:    { type: Number, default: null },
  dataType:    { type: String, enum: ['attendance', 'marks', 'both'], default: 'both' },
  message:     { type: String, default: '' },
  isRead:      { type: Boolean, default: false },
  advisorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const TeacherNotification = mongoose.models.TeacherNotification
  || mongoose.model('TeacherNotification', teacherNotificationSchema);

// GET /api/advisors/notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await TeacherNotification.find({ advisorId: req.user._id })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// PATCH /api/advisors/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await TeacherNotification.findOneAndUpdate(
      { _id: req.params.id, advisorId: req.user._id },
      { $set: { isRead: true } }, { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
});

// GET /api/advisors/teacher-records  — teacher-sent records grouped by section
router.get('/teacher-records', async (req, res) => {
  try {
    const notifications = await TeacherNotification.find({ advisorId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Group by section
    const sectionMap = {};
    notifications.forEach(n => {
      const sec = n.section || 'Unassigned';
      if (!sectionMap[sec]) {
        sectionMap[sec] = {
          section: sec,
          records: [],
          teachers: new Set(),
          unreadCount: 0
        };
      }
      sectionMap[sec].records.push(n);
      if (n.teacherName) sectionMap[sec].teachers.add(n.teacherName);
      if (!n.isRead) sectionMap[sec].unreadCount++;
    });

    // Convert Sets to arrays for JSON serialization
    const sections = Object.values(sectionMap).map(s => ({
      ...s,
      teachers: Array.from(s.teachers)
    }));

    // Sort sections alphabetically
    sections.sort((a, b) => a.section.localeCompare(b.section));

    res.json({ success: true, sections, total: notifications.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teacher records', error: error.message });
  }
});

export default router;