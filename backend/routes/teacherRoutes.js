// routes/teacherRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import {
  AcademicQuery,
  ExamQuery,
  LeaveQuery,
  OtherQuery
} from '../models/studentQueries.js';

const router = express.Router();

// ============================================================
// INLINE MODELS
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

// ==================== TEACHER NOTIFICATION MODEL ====================
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

async function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const mod = await import('../models/User.js');
  return mod.default;
}

// ==================== GET ASSIGNED STUDENTS ====================
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const User = await getUserModel();

    // Get ONLY students directly assigned to this teacher
    const assignedStudents = await User.find({
      role: 'student',
      assignedTeacher: req.user._id
    })
      .select('_id studentId firstName lastName rollNo semester section batch email assignedTeacher')
      .sort({ section: 1, rollNo: 1 })
      .lean();

    const formatted = assignedStudents.map(s => ({
      _id:             s._id,
      studentId:       s.studentId || s._id.toString(),
      name:            `${s.firstName} ${s.lastName}`,
      rollNo:          s.rollNo || s.studentId || '',
      semester:        s.semester,
      section:         s.section || '',
      batch:           s.batch,
      email:           s.email,
      assignedTeacher: s.assignedTeacher ? String(s.assignedTeacher) : null
    }));

    // Group students by section for the response
    const sectionGroups = {};
    formatted.forEach(s => {
      const sec = s.section || 'Unassigned';
      if (!sectionGroups[sec]) sectionGroups[sec] = [];
      sectionGroups[sec].push(s);
    });

    res.status(200).json({
      success: true,
      students: formatted,
      sectionGroups,
      sections: Object.keys(sectionGroups).sort()
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

// ==================== MARK ATTENDANCE ====================
router.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const { date, courseName, courseCode, attendanceData } = req.body;

    if (!date || !courseName || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ success: false, message: 'Please provide date, course name, and attendance data' });
    }

    const ops = attendanceData.map(record => ({
      updateOne: {
        filter: { teacherId: req.user._id, studentId: record.studentId, date: new Date(date), courseName },
        update: {
          $set: {
            teacherId:     req.user._id,
            studentId:     record.studentId,
            studentRollNo: record.studentRollNo || '',
            date:          new Date(date),
            courseName,
            courseCode:    courseCode || '',
            status:        record.status,
            remarks:       record.remarks || ''
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(ops);

    const present = attendanceData.filter(r => r.status === 'present').length;
    const absent  = attendanceData.filter(r => r.status === 'absent').length;

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { date, courseName, courseCode, recordCount: attendanceData.length, present, absent }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: error.message });
  }
});

router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const filter = { teacherId: req.user._id };
    if (req.query.date) filter.date = new Date(req.query.date);
    if (req.query.courseName) filter.courseName = req.query.courseName;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const records = await Attendance.find(filter)
      .populate('studentId', 'firstName lastName rollNo studentId')
      .sort({ date: -1 }).lean();

    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
});

router.patch('/attendance/:id', authenticateToken, async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { $set: req.body }, { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.status(200).json({ success: true, message: 'Attendance updated', record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update attendance', error: error.message });
  }
});

// ==================== UPLOAD MARKS ====================
router.post('/marks', authenticateToken, async (req, res) => {
  try {
    const { examDate, examType, courseName, courseCode, marksData } = req.body;

    if (!examDate || !examType || !courseName || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const ops = marksData.map(record => ({
      updateOne: {
        filter: { teacherId: req.user._id, studentId: record.studentId, examDate: new Date(examDate), examType, courseName },
        update: {
          $set: {
            teacherId:     req.user._id,
            studentId:     record.studentId,
            studentRollNo: record.studentRollNo || '',
            examDate:      new Date(examDate),
            examType,
            courseName,
            courseCode:    courseCode || '',
            totalMarks:    parseInt(record.totalMarks),
            obtainedMarks: parseInt(record.obtainedMarks),
            remarks:       record.remarks || ''
          }
        },
        upsert: true
      }
    }));

    await Marks.bulkWrite(ops);

    const totalObtained = marksData.reduce((s, r) => s + (parseInt(r.obtainedMarks) || 0), 0);
    const totalPossible = marksData.reduce((s, r) => s + (parseInt(r.totalMarks) || 0), 0);
    const avgPct = totalPossible > 0 ? ((totalObtained / totalPossible) * 100).toFixed(2) : 0;

    res.status(201).json({
      success: true,
      message: 'Marks uploaded successfully',
      data: { examDate, examType, courseName, courseCode, recordCount: marksData.length, averagePercentage: avgPct }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload marks', error: error.message });
  }
});

router.get('/marks', authenticateToken, async (req, res) => {
  try {
    const filter = { teacherId: req.user._id };
    if (req.query.examType) filter.examType = req.query.examType;
    if (req.query.courseName) filter.courseName = req.query.courseName;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const records = await Marks.find(filter)
      .populate('studentId', 'firstName lastName rollNo studentId')
      .sort({ examDate: -1 }).lean();

    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch marks', error: error.message });
  }
});

router.patch('/marks/:id', authenticateToken, async (req, res) => {
  try {
    const record = await Marks.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { $set: req.body }, { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.status(200).json({ success: true, message: 'Marks updated', record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update marks', error: error.message });
  }
});

// ==================== GET STUDENT QUERIES ====================
//
// MATCHING STRATEGY:
//   Queries store studentId = req.user.studentId from the student's JWT.
//   The JWT studentId comes from the User document's .studentId field.
//   Students registered via advisor have studentId = rollNo (e.g. "22-SE-01").
//
//   We fetch queries for:
//     1. Students explicitly assigned to this teacher (assignedTeacher = teacher._id)
//     2. Students with NO teacher assigned yet (newly registered, not yet assigned)
//
//   For each student we collect ALL possible id strings they might have stored:
//     - s.studentId  (the main field used in JWT and queries)
//     - s.rollNo     (same value, belt-and-suspenders)
//     - s.batch      (some legacy setups store batch as studentId)
//     - s._id.toString() (MongoDB ObjectId as string)
//   Plus studentName as a final fallback.
//
router.get('/queries', authenticateToken, async (req, res) => {
  try {
    const User = await getUserModel();

    // Get ONLY students assigned to THIS teacher
    const allRelevantStudents = await User.find({
      role: 'student',
      assignedTeacher: req.user._id
    }).select('_id studentId firstName lastName rollNo batch section').lean();

    if (allRelevantStudents.length === 0) {
      return res.status(200).json({ success: true, queries: [] });
    }

    // Step 3: Build every possible identifier for each student
    const idSet = new Set();
    const nameSet = new Set();
    const studentInfoMap = {};

    allRelevantStudents.forEach(s => {
      const name = `${s.firstName} ${s.lastName}`.trim();
      nameSet.add(name);

      // All possible values that might have been stored as studentId in a query
      [s.studentId, s.rollNo, s.batch, s._id.toString()].forEach(id => {
        if (id && String(id).trim()) {
          const key = String(id).trim();
          idSet.add(key);
          studentInfoMap[key] = {
            name,
            rollNo: s.rollNo || s.studentId || ''
          };
        }
      });
      // Name-keyed fallback
      studentInfoMap[name] = {
        name,
        rollNo: s.rollNo || s.studentId || ''
      };
    });

    const queryIds   = Array.from(idSet);
    const queryNames = Array.from(nameSet);

    // Step 4: Fetch only exam + attendance (other) queries for teacher
    const matchFilter = {
      $or: [
        { studentId:   { $in: queryIds   } },
        { studentName: { $in: queryNames } }
      ]
    };

    const [examQueries, otherQueries] = await Promise.all([
      ExamQuery.find(matchFilter).sort({ createdAt: -1 }).lean(),
      OtherQuery.find(matchFilter).sort({ createdAt: -1 }).lean()
    ]);

    // Step 5: Normalize to a unified shape
    const normalize = (q, category) => {
      const ta = q.teacherApproval || {};
      const idKey   = String(q.studentId || '').trim();
      const nameKey = String(q.studentName || '').trim();
      const info = studentInfoMap[idKey] ||
                   studentInfoMap[nameKey] ||
                   { name: q.studentName || 'Unknown', rollNo: q.studentId || '' };

      return {
        _id:            q._id,
        studentId:      q.studentId,
        studentName:    q.studentName || info.name,
        studentRollNo:  info.rollNo,
        queryType:      q.queryType || q.issueType || category,
        category,
        courseName:     q.courseName || q.subject || '',
        description:    q.description || q.details || '',
        priority:       q.priority || 'medium',
        teacherStatus:  ta.status   || 'pending',
        teacherRemarks: ta.comments || '',
        finalStatus:    q.finalStatus || 'pending',
        createdAt:      q.createdAt
      };
    };

    const allQueries = [
      ...examQueries.map(q => normalize(q, 'exam')),
      ...otherQueries.map(q => normalize(q, 'attendance'))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, queries: allQueries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queries', error: error.message });
  }
});

// ==================== RESOLVE / REJECT QUERY ====================
router.patch('/queries/:queryId/resolve', authenticateToken, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks, action } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide remarks' });
    }

    const resolvedStatus = action === 'rejected' ? 'rejected' : 'approved';
    const finalStatus    = resolvedStatus === 'rejected' ? 'rejected' : 'approved';

    const teacherApproval = {
      status:     resolvedStatus,
      comments:   remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`,
      approvedAt: new Date()
    };

    const updatePayload = {
      $set: { teacherApproval, finalStatus, updatedAt: new Date() }
    };

    const updated =
      await ExamQuery.findByIdAndUpdate(queryId, updatePayload, { new: true }) ||
      await OtherQuery.findByIdAndUpdate(queryId, updatePayload, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.status(200).json({
      success: true,
      message: `Query ${resolvedStatus} successfully`,
      query: updated
    });
  } catch (error) {
    console.error('Error resolving query:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve query', error: error.message });
  }
});

// ==================== DASHBOARD STATISTICS ====================
router.get('/statistics/dashboard', authenticateToken, async (req, res) => {
  try {
    const User = await getUserModel();

    // Only count students assigned to this teacher
    const assignedStudents = await User.find({
      role: 'student',
      assignedTeacher: req.user._id
    }).select('_id studentId rollNo batch firstName lastName').lean();

    const totalStudents = assignedStudents.length;
    const allStudents = assignedStudents;

    // Build id/name sets
    const idSet   = new Set();
    const nameSet = new Set();
    allStudents.forEach(s => {
      nameSet.add(`${s.firstName} ${s.lastName}`.trim());
      [s.studentId, s.rollNo, s.batch, s._id.toString()].forEach(id => {
        if (id && String(id).trim()) idSet.add(String(id).trim());
      });
    });

    let pendingQueries = 0;
    let avgAttendance  = 0;

    if (idSet.size > 0) {
      // Only count exam + attendance (other) queries — not academic/course queries
      const teacherPendingFilter = {
        $and: [
          { $or: [
            { studentId:   { $in: Array.from(idSet)   } },
            { studentName: { $in: Array.from(nameSet) } }
          ]},
          { $or: [
            { 'teacherApproval.status': 'pending' },
            { teacherApproval: { $exists: false } }
          ]}
        ]
      };

      const [ep, op] = await Promise.all([
        ExamQuery.countDocuments(teacherPendingFilter),
        OtherQuery.countDocuments(teacherPendingFilter)
      ]);
      pendingQueries = ep + op;

      // Average attendance last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const agg = await Attendance.aggregate([
        { $match: { teacherId: req.user._id, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id:     null,
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
          }
        }
      ]);

      if (agg.length > 0 && agg[0].total > 0) {
        avgAttendance = parseFloat(((agg[0].present / agg[0].total) * 100).toFixed(1));
      }
    }

    res.status(200).json({
      success: true,
      stats: { totalStudents, pendingQueries, classesToday: 0, avgAttendance }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// ==================== SEND TO ADVISOR ====================
router.post('/send-to-advisor', authenticateToken, async (req, res) => {
  try {
    const { studentId, dataType, message } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId required' });

    // Lazy-load User model
    let User;
    if (mongoose.models.User) {
      User = mongoose.models.User;
    } else {
      const mod = await import('../models/User.js');
      User = mod.default;
    }

    const student = await User.findById(studentId).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const notification = new TeacherNotification({
      teacherId:   req.user._id,
      teacherName: `${req.user.firstName} ${req.user.lastName}`,
      studentId:   student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNo:      student.rollNo || student.studentId || '',
      section:     student.section || '',
      batch:       student.batch || '',
      semester:    student.semester || null,
      dataType:    dataType || 'both',
      message:     message || '',
      advisorId:   student.advisorId || null,
      isRead:      false
    });
    await notification.save();

    res.status(200).json({ success: true, message: 'Record sent to advisor successfully' });
  } catch (error) {
    console.error('Send to advisor error:', error);
    res.status(500).json({ success: false, message: 'Failed to send to advisor', error: error.message });
  }
});

export { Attendance, Marks, TeacherNotification };
export default router;