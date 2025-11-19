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

export default router;