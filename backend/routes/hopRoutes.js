// routes/hopRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import {
  AcademicQuery,
  LeaveQuery,
  Appointment
} from '../models/studentQueries.js';

const router = express.Router();

async function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const mod = await import('../models/User.js');
  return mod.default;
}

const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  content:      { type: String, required: true },
  type:         { type: String, enum: ['exam', 'event', 'general', 'urgent'], default: 'general' },
  postedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedByName: { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
  targetRoles:  { type: [String], default: ['student', 'teacher', 'advisor'] }
}, { timestamps: true });

const Announcement = mongoose.models.Announcement
  || mongoose.model('Announcement', announcementSchema);

// ── Public route — accessible by ALL authenticated users (students, teachers, advisors) ──
// Must be registered BEFORE the HOP-only middleware below.
router.get('/announcements/public', async (req, res) => {
  try {
    const list = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, announcements: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

// HOP only middleware
router.use(authenticateToken);
router.use((req, res, next) => {
  if (req.user.role !== 'hop') {
    return res.status(403).json({ success: false, message: 'Access denied. HOP only.' });
  }
  next();
});

// ============================================================
// QUERIES — Only advisor-approved (forwarded to HOP)
// ============================================================

router.get('/queries', async (req, res) => {
  try {
    const { category } = req.query;
    const baseFilter = { 'advisorApproval.status': 'approved' };

    let leaveQueries = [];
    let academicQueries = [];

    if (!category || category === 'leave') {
      leaveQueries = await LeaveQuery.find(baseFilter).sort({ createdAt: -1 }).lean();
    }
    if (!category || category === 'academic') {
      academicQueries = await AcademicQuery.find(baseFilter).sort({ createdAt: -1 }).lean();
    }

    const normalize = (q, cat) => {
      const aa = q.advisorApproval || {};
      const ha = q.hodApproval     || {};
      return {
        _id:            q._id,
        studentId:      q.studentId   || '',
        studentName:    q.studentName  || 'Unknown',
        batch:          q.batch        || '',
        queryType:      q.queryType    || q.leaveType || cat,
        category:       cat,
        description:    q.description  || '',
        priority:       q.priority     || 'medium',
        advisorStatus:  aa.status      || 'pending',
        advisorRemarks: aa.comments    || '',
        advisorName:    aa.approvedBy  || '',
        advisorDate:    aa.approvedAt  || null,
        hopStatus:      ha.status      || 'pending',
        hopRemarks:     ha.comments    || '',
        finalStatus:    q.finalStatus  || 'pending',
        courseName:     q.courseName   || '',
        leaveType:      q.leaveType    || '',
        startDate:      q.startDate    || null,
        endDate:        q.endDate      || null,
        duration:       q.duration     || null,
        documents:      q.documents    || [],
        createdAt:      q.createdAt
      };
    };

    const all = [
      ...leaveQueries.map(q => normalize(q, 'leave')),
      ...academicQueries.map(q => normalize(q, 'academic'))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, queries: all });
  } catch (err) {
    console.error('HOP queries error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch queries', error: err.message });
  }
});

router.patch('/queries/:id/approve', async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks?.trim()) return res.status(400).json({ success: false, message: 'Remarks required' });

    const hodApproval = {
      status: 'approved', comments: remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`, approvedAt: new Date()
    };
    const update = { $set: { hodApproval, finalStatus: 'approved' } };

    const updated =
      await LeaveQuery.findOneAndUpdate({ _id: req.params.id, 'advisorApproval.status': 'approved' }, update, { new: true }) ||
      await AcademicQuery.findOneAndUpdate({ _id: req.params.id, 'advisorApproval.status': 'approved' }, update, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: 'Query not found' });
    res.json({ success: true, message: 'Approved by HOP', query: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve', error: err.message });
  }
});

router.patch('/queries/:id/reject', async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks?.trim()) return res.status(400).json({ success: false, message: 'Remarks required' });

    const hodApproval = {
      status: 'rejected', comments: remarks.trim(),
      approvedBy: `${req.user.firstName} ${req.user.lastName}`, approvedAt: new Date()
    };
    const update = { $set: { hodApproval, finalStatus: 'rejected' } };

    const updated =
      await LeaveQuery.findOneAndUpdate({ _id: req.params.id, 'advisorApproval.status': 'approved' }, update, { new: true }) ||
      await AcademicQuery.findOneAndUpdate({ _id: req.params.id, 'advisorApproval.status': 'approved' }, update, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: 'Query not found' });
    res.json({ success: true, message: 'Rejected by HOP', query: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject', error: err.message });
  }
});

// ============================================================
// APPOINTMENTS — Advisor-confirmed only
// ============================================================

router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: { $in: ['confirmed', 'completed', 'rescheduled'] }
    }).sort({ preferredDate: 1, preferredTime: 1 }).lean();

    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch', error: err.message });
  }
});

router.patch('/appointments/:id/complete', async (req, res) => {
  try {
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['confirmed', 'rescheduled'] } },
      { $set: { status: 'completed' } }, { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Completed', appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

router.patch('/appointments/:id/cancel', async (req, res) => {
  try {
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { status: 'cancelled' } }, { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Cancelled', appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

// ============================================================
// ANNOUNCEMENTS — Full CRUD
// ============================================================

router.get('/announcements', async (req, res) => {
  try {
    const list = await Announcement.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, announcements: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});


router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, targetRoles } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content required' });
    }
    const ann = new Announcement({
      title: title.trim(), content: content.trim(),
      type: type || 'general',
      postedBy: req.user._id,
      postedByName: `${req.user.firstName} ${req.user.lastName}`,
      targetRoles: targetRoles || ['student', 'teacher', 'advisor'],
      isActive: true
    });
    await ann.save();
    res.status(201).json({ success: true, message: 'Posted', announcement: ann });
  } catch (err) {
    console.error('Announcement error:', err);
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const { title, content, type, isActive } = req.body;
    const update = {};
    if (title    !== undefined) update.title    = title.trim();
    if (content  !== undefined) update.content  = content.trim();
    if (type     !== undefined) update.type     = type;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id }, { $set: update }, { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated', announcement: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const deleted = await Announcement.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

// ============================================================
// DASHBOARD STATISTICS
// ============================================================

router.get('/statistics/dashboard', async (req, res) => {
  try {
    const User = await getUserModel();

    const [totalStudents, pendingCounts, approvedCounts, confirmedAppointments, activeAnnouncements] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),

        Promise.all([
          LeaveQuery.countDocuments({
            'advisorApproval.status': 'approved',
            $or: [{ 'hodApproval.status': 'pending' }, { hodApproval: { $exists: false } }]
          }),
          AcademicQuery.countDocuments({
            'advisorApproval.status': 'approved',
            $or: [{ 'hodApproval.status': 'pending' }, { hodApproval: { $exists: false } }]
          })
        ]).then(([l, a]) => l + a),

        Promise.all([
          LeaveQuery.countDocuments({ 'hodApproval.status': 'approved' }),
          AcademicQuery.countDocuments({ 'hodApproval.status': 'approved' })
        ]).then(([l, a]) => l + a),

        Appointment.countDocuments({ status: { $in: ['confirmed', 'rescheduled'] } }),
        Announcement.countDocuments({ postedBy: req.user._id, isActive: true })
      ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        pendingHOP:             pendingCounts,
        approvedByHOP:          approvedCounts,
        confirmedAppointments,
        activeAnnouncements
      }
    });
  } catch (err) {
    console.error('HOP stats error:', err);
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

export default router;
export { Announcement };