// routes/studentDashboard.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import {
  AcademicQuery,
  ExamQuery,
  LeaveQuery,
  OtherQuery,
  Appointment
} from '../models/studentQueries.js';

const router = express.Router();

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files allowed!'));
    }
  }
});

// ==================== QUERY SUBMISSION ROUTES ====================

// Submit Academic Query (Add/Drop, Freeze Course)
router.post('/queries/academic', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const { 
      queryType, 
      courseName, 
      courseCode, 
      semester, 
      description, 
      reason, 
      priority 
    } = req.body;

    const documents = req.files ? req.files.map(file => file.path) : [];

    const query = new AcademicQuery({
      studentId: req.user.studentId,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      batch: req.user.batch,
      queryType,
      courseName,
      courseCode,
      semester,
      description,
      reason,
      documents,
      priority: priority || 'medium'
    });

    await query.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Academic query submitted successfully', 
      queryId: query._id,
      query 
    });
  } catch (error) {
    console.error('Error submitting academic query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting query', 
      error: error.message 
    });
  }
});

// Submit Exam Query (Retakes, Update Marks)
router.post('/queries/exam', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const { 
      queryType, 
      courseName, 
      courseCode, 
      examType, 
      currentMarks, 
      expectedMarks, 
      examDate, 
      description, 
      reason, 
      priority 
    } = req.body;

    const documents = req.files ? req.files.map(file => file.path) : [];

    const query = new ExamQuery({
      studentId: req.user.studentId,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      batch: req.user.batch,
      queryType,
      courseName,
      courseCode,
      examType,
      currentMarks: currentMarks ? Number(currentMarks) : undefined,
      expectedMarks: expectedMarks ? Number(expectedMarks) : undefined,
      examDate: examDate ? new Date(examDate) : undefined,
      description,
      reason,
      documents,
      priority: priority || 'medium'
    });

    await query.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Exam query submitted successfully', 
      queryId: query._id,
      query 
    });
  } catch (error) {
    console.error('Error submitting exam query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting query', 
      error: error.message 
    });
  }
});

// Submit Leave Query
router.post('/queries/leave', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const { 
      queryType, 
      leaveType, 
      startDate, 
      endDate, 
      description, 
      contactDuringLeave, 
      emergencyContact, 
      priority 
    } = req.body;

    const documents = req.files ? req.files.map(file => file.path) : [];

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const query = new LeaveQuery({
      studentId: req.user.studentId,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      batch: req.user.batch,
      queryType,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      description,
      contactDuringLeave,
      emergencyContact,
      documents,
      priority: priority || 'medium'
    });

    await query.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Leave query submitted successfully', 
      queryId: query._id,
      query 
    });
  } catch (error) {
    console.error('Error submitting leave query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting query', 
      error: error.message 
    });
  }
});

// Submit Other Query (Attendance, Timetable, etc.)
router.post('/queries/other', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const { 
      queryType, 
      issueType, 
      attendancePercentage, 
      subject, 
      description, 
      details, 
      priority 
    } = req.body;

    const documents = req.files ? req.files.map(file => file.path) : [];

    const query = new OtherQuery({
      studentId: req.user.studentId,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      batch: req.user.batch,
      queryType,
      issueType,
      attendancePercentage: attendancePercentage ? Number(attendancePercentage) : undefined,
      subject,
      description,
      details,
      documents,
      priority: priority || 'medium'
    });

    await query.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Query submitted successfully', 
      queryId: query._id,
      query 
    });
  } catch (error) {
    console.error('Error submitting other query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting query', 
      error: error.message 
    });
  }
});

// ==================== QUERY RETRIEVAL ROUTES ====================

// Get all queries for logged-in student
router.get('/queries/my-queries', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { status, category, limit = 50, page = 1 } = req.query;

    const filter = { studentId };
    if (status) filter.finalStatus = status;

    const skip = (page - 1) * limit;

    const [academic, exam, leave, other] = await Promise.all([
      category === 'academic' || !category 
        ? AcademicQuery.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip)
        : [],
      category === 'exam' || !category
        ? ExamQuery.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip)
        : [],
      category === 'leave' || !category
        ? LeaveQuery.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip)
        : [],
      category === 'other' || !category
        ? OtherQuery.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip)
        : []
    ]);

    const allQueries = [...academic, ...exam, ...leave, ...other].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json({ 
      success: true,
      queries: allQueries,
      total: allQueries.length,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching queries', 
      error: error.message 
    });
  }
});

// Get single query by ID
router.get('/queries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = await AcademicQuery.findById(id) ||
                 await ExamQuery.findById(id) ||
                 await LeaveQuery.findById(id) ||
                 await OtherQuery.findById(id);

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Query not found' 
      });
    }

    // Check if query belongs to the logged-in student
    if (query.studentId !== req.user.studentId && req.user.role === 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({ 
      success: true,
      query 
    });
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching query', 
      error: error.message 
    });
  }
});

// Delete query (only if pending)
router.delete('/queries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = await AcademicQuery.findById(id) ||
                 await ExamQuery.findById(id) ||
                 await LeaveQuery.findById(id) ||
                 await OtherQuery.findById(id);

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Query not found' 
      });
    }

    // Check ownership
    if (query.studentId !== req.user.studentId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Only allow deletion if pending
    if (query.finalStatus !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete query that has been processed' 
      });
    }

    await query.deleteOne();

    res.json({ 
      success: true,
      message: 'Query deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting query', 
      error: error.message 
    });
  }
});

// ==================== APPROVAL ROUTES (For Advisors/HOD) ====================

// Update approval status
router.patch('/queries/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalType, status, comments } = req.body;

    // Validate approvalType
    if (!['advisor', 'hod', 'teacher'].includes(approvalType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid approval type' 
      });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    let query = await AcademicQuery.findById(id) ||
                 await ExamQuery.findById(id) ||
                 await LeaveQuery.findById(id) ||
                 await OtherQuery.findById(id);

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Query not found' 
      });
    }

    // Update approval
    const approvalField = `${approvalType}Approval`;
    query[approvalField] = {
      status,
      comments: comments || '',
      approvedBy: `${req.user.firstName} ${req.user.lastName}`,
      approvedAt: new Date()
    };

    // Update final status based on all approvals
    const { advisorApproval, hodApproval, teacherApproval } = query;
    
    if (advisorApproval.status === 'rejected' || 
        hodApproval.status === 'rejected' || 
        teacherApproval.status === 'rejected') {
      query.finalStatus = 'rejected';
    } else if (advisorApproval.status === 'approved' && 
               hodApproval.status === 'approved' && 
               teacherApproval.status === 'approved') {
      query.finalStatus = 'approved';
    } else {
      query.finalStatus = 'pending';
    }

    query.updatedAt = new Date();
    await query.save();

    res.json({ 
      success: true,
      message: 'Approval updated successfully', 
      query 
    });
  } catch (error) {
    console.error('Error updating approval:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating approval', 
      error: error.message 
    });
  }
});

// ==================== APPOINTMENT ROUTES ====================

// Book appointment
router.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const { appointmentType, preferredDate, preferredTime, reason } = req.body;

    const appointment = new Appointment({
      studentId: req.user.studentId,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      appointmentType,
      preferredDate: new Date(preferredDate),
      preferredTime,
      reason
    });

    await appointment.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Appointment booked successfully', 
      appointmentId: appointment._id,
      appointment 
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error booking appointment', 
      error: error.message 
    });
  }
});

// Get my appointments
router.get('/appointments/my-appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      studentId: req.user.studentId 
    }).sort({ createdAt: -1 });
    
    res.json({ 
      success: true,
      appointments 
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
});

// Cancel appointment
router.patch('/appointments/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: 'Appointment not found' 
      });
    }

    if (appointment.studentId !== req.user.studentId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ 
      success: true,
      message: 'Appointment cancelled successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error cancelling appointment', 
      error: error.message 
    });
  }
});

// ==================== STATISTICS ROUTES ====================

// Get dashboard statistics
router.get('/statistics/dashboard', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const [academic, exam, leave, other, appointments] = await Promise.all([
      AcademicQuery.find({ studentId }),
      ExamQuery.find({ studentId }),
      LeaveQuery.find({ studentId }),
      OtherQuery.find({ studentId }),
      Appointment.find({ studentId })
    ]);

    const allQueries = [...academic, ...exam, ...leave, ...other];

    const stats = {
      totalQueries: allQueries.length,
      pendingQueries: allQueries.filter(q => q.finalStatus === 'pending').length,
      approvedQueries: allQueries.filter(q => q.finalStatus === 'approved').length,
      rejectedQueries: allQueries.filter(q => q.finalStatus === 'rejected').length,
      
      // By category
      academicQueries: academic.length,
      examQueries: exam.length,
      leaveQueries: leave.length,
      otherQueries: other.length,
      
      // Appointments
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
      
      // Recent activity
      recentQueries: allQueries.slice(0, 5).map(q => ({
        id: q._id,
        type: q.queryType,
        category: q.category,
        status: q.finalStatus,
        date: q.createdAt
      }))
    };

    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

// ==================== ADVISOR ROUTES ====================
// These routes handle advisor-specific actions

// GET /advisors/queries — Returns only leave and academic queries (excludes exam/attendance)
router.get('/advisors/queries', authenticateToken, async (req, res) => {
  try {
    const { status, category } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.finalStatus = status;

    // Advisor only sees: leave queries and academic queries (course add/drop/freeze)
    // Excludes: exam queries and attendance/other queries (handled by teacher)
    const [leaveQueries, academicQueries] = await Promise.all([
      LeaveQuery.find(filter).sort({ createdAt: -1 }).lean(),
      AcademicQuery.find(filter).sort({ createdAt: -1 }).lean()
    ]);

    const normalize = (q, cat) => {
      const aa = q.advisorApproval || {};
      return {
        _id:           q._id,
        studentId:     q.studentId,
        studentName:   q.studentName || 'Unknown',
        studentRollNo: q.studentId || '',
        batch:         q.batch || '',
        queryType:     q.queryType || q.leaveType || cat,
        category:      cat,
        description:   q.description || '',
        priority:      q.priority || 'medium',
        advisorStatus: aa.status || 'pending',
        advisorRemarks: aa.comments || '',
        finalStatus:   q.finalStatus || 'pending',
        // Extra fields
        courseName:    q.courseName || '',
        leaveType:     q.leaveType || '',
        startDate:     q.startDate || null,
        endDate:       q.endDate || null,
        duration:      q.duration || null,
        documents:     q.documents || [],
        createdAt:     q.createdAt
      };
    };

    let allQueries = [
      ...leaveQueries.map(q => normalize(q, 'leave')),
      ...academicQueries.map(q => normalize(q, 'academic'))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter by category if provided
    if (category) {
      allQueries = allQueries.filter(q => q.category === category);
    }

    res.json({ success: true, queries: allQueries });
  } catch (error) {
    console.error('Error fetching advisor queries:', error);
    res.status(500).json({ success: false, message: 'Error fetching queries', error: error.message });
  }
});

// PATCH /advisors/queries/:queryId/forward — Forward to HOP
router.patch('/advisors/queries/:queryId/forward', authenticateToken, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide remarks' });
    }

    const advisorApproval = {
      status: 'approved',
      comments: remarks.trim(),
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

// PATCH /advisors/queries/:queryId/reject — Reject a query
router.patch('/advisors/queries/:queryId/reject', authenticateToken, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide remarks' });
    }

    const advisorApproval = {
      status: 'rejected',
      comments: remarks.trim(),
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


// ============================================================
// STUDENT ACADEMIC ROUTES — Attendance & Marks (uploaded by teacher)
// ============================================================

// GET /students/academic/attendance — student's own attendance records
router.get('/academic/attendance', authenticateToken, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Attendance = mongoose.models.Attendance;
    if (!Attendance) {
      return res.json({ success: true, attendance: [] });
    }

    const studentObjectId = req.user._id;
    const { course } = req.query;
    const filter = { studentId: studentObjectId };
    if (course) filter.courseName = { $regex: course, $options: 'i' };

    const records = await Attendance.find(filter).sort({ date: -1 }).lean();

    // Format for frontend
    const attendance = records.map(r => ({
      _id:        r._id,
      date:       r.date,
      courseName: r.courseName,
      courseCode: r.courseCode || '',
      status:     r.status,
      remarks:    r.remarks || ''
    }));

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Student attendance fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
});

// GET /students/academic/attendance/summary
router.get('/academic/attendance/summary', authenticateToken, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Attendance = mongoose.models.Attendance;
    if (!Attendance) {
      return res.json({ success: true, summary: { overallPercentage: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, byCourse: [] } });
    }

    const records = await Attendance.find({ studentId: req.user._id }).lean();

    const total   = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent  = records.filter(r => r.status === 'absent').length;
    const late    = records.filter(r => r.status === 'late').length;

    // Group by course
    const courseMap = {};
    records.forEach(r => {
      const key = r.courseName || 'Unknown';
      if (!courseMap[key]) courseMap[key] = { courseName: key, total: 0, present: 0, absent: 0, late: 0 };
      courseMap[key].total++;
      courseMap[key][r.status]++;
    });
    const byCourse = Object.values(courseMap).map(c => ({
      ...c,
      percentage: c.total > 0 ? parseFloat(((c.present / c.total) * 100).toFixed(1)) : 0
    }));

    res.json({
      success: true,
      summary: {
        overallPercentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0,
        totalPresent: present,
        totalAbsent:  absent,
        totalLate:    late,
        totalClasses: total,
        byCourse
      }
    });
  } catch (error) {
    console.error('Student attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed', error: error.message });
  }
});

// GET /students/academic/marks
router.get('/academic/marks', authenticateToken, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Marks = mongoose.models.Marks;
    if (!Marks) {
      return res.json({ success: true, marks: [] });
    }

    const { course, examType } = req.query;
    const filter = { studentId: req.user._id };
    if (course)    filter.courseName = { $regex: course, $options: 'i' };
    if (examType)  filter.examType   = examType;

    const records = await Marks.find(filter).sort({ examDate: -1 }).lean();

    const marks = records.map(r => ({
      _id:           r._id,
      courseName:    r.courseName,
      courseCode:    r.courseCode || '',
      examType:      r.examType,
      examDate:      r.examDate,
      obtainedMarks: r.obtainedMarks,
      totalMarks:    r.totalMarks,
      percentage:    r.totalMarks > 0 ? parseFloat(((r.obtainedMarks / r.totalMarks) * 100).toFixed(1)) : 0,
      remarks:       r.remarks || ''
    }));

    res.json({ success: true, marks });
  } catch (error) {
    console.error('Student marks fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks', error: error.message });
  }
});

// GET /students/academic/marks/summary
router.get('/academic/marks/summary', authenticateToken, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Marks = mongoose.models.Marks;
    if (!Marks) {
      return res.json({ success: true, summary: { overallPercentage: 0, totalExams: 0, byCourse: [] } });
    }

    const records = await Marks.find({ studentId: req.user._id }).lean();

    const totalExams = records.length;
    const overallPct = totalExams > 0
      ? parseFloat((records.reduce((sum, r) => sum + (r.totalMarks > 0 ? (r.obtainedMarks / r.totalMarks) * 100 : 0), 0) / totalExams).toFixed(1))
      : 0;

    // Group by course
    const courseMap = {};
    records.forEach(r => {
      const key = r.courseName || 'Unknown';
      if (!courseMap[key]) courseMap[key] = { courseName: key, exams: [], totalObtained: 0, totalMax: 0 };
      courseMap[key].exams.push({ examType: r.examType, obtained: r.obtainedMarks, total: r.totalMarks, date: r.examDate });
      courseMap[key].totalObtained += r.obtainedMarks;
      courseMap[key].totalMax      += r.totalMarks;
    });
    const byCourse = Object.values(courseMap).map(c => ({
      courseName:  c.courseName,
      examCount:   c.exams.length,
      percentage:  c.totalMax > 0 ? parseFloat(((c.totalObtained / c.totalMax) * 100).toFixed(1)) : 0,
      exams:       c.exams
    }));

    res.json({
      success: true,
      summary: { overallPercentage: overallPct, totalExams, byCourse }
    });
  } catch (error) {
    console.error('Student marks summary error:', error);
    res.status(500).json({ success: false, message: 'Failed', error: error.message });
  }
});

// ============================================================
// PUBLIC ANNOUNCEMENTS — No role restriction, any authenticated user
// ============================================================
router.get('/announcements/public', authenticateToken, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Announcement = mongoose.models.Announcement;
    if (!Announcement) {
      return res.json({ success: true, announcements: [] });
    }

    const announcements = await Announcement
      .find({ isActive: true, targetRoles: 'student' })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Student announcements error:', error);
    res.status(500).json({ success: false, message: 'Failed', error: error.message });
  }
});

export default router;