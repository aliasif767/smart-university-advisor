// models/studentQueries.js
import mongoose from 'mongoose';

// Base Query Schema - Common fields for all query types
const baseQuerySchema = {
  studentId: { 
    type: String, 
    required: true,
    index: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  batch: { 
    type: String, 
    required: true,
    index: true 
  },
  queryType: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  documents: [{ 
    type: String 
  }],
  
  // Three-level Approval System
  advisorApproval: {
    status: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'approved', 'rejected'] 
    },
    comments: { 
      type: String, 
      default: '' 
    },
    approvedBy: { 
      type: String, 
      default: '' 
    },
    approvedAt: { 
      type: Date 
    }
  },
  
  hodApproval: {
    status: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'approved', 'rejected'] 
    },
    comments: { 
      type: String, 
      default: '' 
    },
    approvedBy: { 
      type: String, 
      default: '' 
    },
    approvedAt: { 
      type: Date 
    }
  },
  
  teacherApproval: {
    status: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'approved', 'rejected'] 
    },
    comments: { 
      type: String, 
      default: '' 
    },
    approvedBy: { 
      type: String, 
      default: '' 
    },
    approvedAt: { 
      type: Date 
    }
  },
  
  finalStatus: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'rejected'],
    index: true 
  },
  priority: { 
    type: String, 
    default: 'medium', 
    enum: ['low', 'medium', 'high'] 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
};

// Academic Query Schema (Add/Drop Course, Freeze Course)
const academicQuerySchema = new mongoose.Schema({
  ...baseQuerySchema,
  category: { 
    type: String, 
    default: 'academic',
    immutable: true 
  },
  courseName: { 
    type: String, 
    required: true 
  },
  courseCode: { 
    type: String 
  },
  semester: { 
    type: String 
  },
  reason: { 
    type: String 
  }
}, {
  timestamps: true
});

// Exam Query Schema (Retakes, Update Marks)
const examQuerySchema = new mongoose.Schema({
  ...baseQuerySchema,
  category: { 
    type: String, 
    default: 'exam',
    immutable: true 
  },
  courseName: { 
    type: String, 
    required: true 
  },
  courseCode: { 
    type: String 
  },
  examType: { 
    type: String, 
    enum: ['mid', 'final', 'quiz', 'assignment', 'other'] 
  },
  currentMarks: { 
    type: Number 
  },
  expectedMarks: { 
    type: Number 
  },
  examDate: { 
    type: Date 
  },
  reason: { 
    type: String 
  }
}, {
  timestamps: true
});

// Leave Query Schema (Sick, Marriage, Urgent, Casual)
const leaveQuerySchema = new mongoose.Schema({
  ...baseQuerySchema,
  category: { 
    type: String, 
    default: 'leave',
    immutable: true 
  },
  leaveType: { 
    type: String, 
    required: true, 
    enum: ['sick', 'marriage', 'urgent', 'casual', 'emergency'] 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number 
  }, // In days
  contactDuringLeave: { 
    type: String 
  },
  emergencyContact: { 
    type: String 
  }
}, {
  timestamps: true
});

// Other Query Schema (Attendance Issues, Timetable Issues, etc.)
const otherQuerySchema = new mongoose.Schema({
  ...baseQuerySchema,
  category: { 
    type: String, 
    default: 'other',
    immutable: true 
  },
  issueType: { 
    type: String, 
    required: true 
  },
  attendancePercentage: { 
    type: Number,
    min: 0,
    max: 100 
  },
  subject: { 
    type: String 
  },
  details: { 
    type: String 
  }
}, {
  timestamps: true
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true,
    index: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  appointmentType: { 
    type: String, 
    required: true, 
    enum: ['academic', 'course', 'career', 'personal', 'counseling'] 
  },
  preferredDate: { 
    type: Date, 
    required: true 
  },
  preferredTime: { 
    type: String, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'] 
  },
  advisorId: { 
    type: String 
  },
  advisorComments: { 
    type: String 
  },
  confirmedDate: { 
    type: Date 
  },
  confirmedTime: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
academicQuerySchema.index({ studentId: 1, createdAt: -1 });
examQuerySchema.index({ studentId: 1, createdAt: -1 });
leaveQuerySchema.index({ studentId: 1, createdAt: -1 });
otherQuerySchema.index({ studentId: 1, createdAt: -1 });
appointmentSchema.index({ studentId: 1, createdAt: -1 });

// Add indexes for status filtering
academicQuerySchema.index({ finalStatus: 1 });
examQuerySchema.index({ finalStatus: 1 });
leaveQuerySchema.index({ finalStatus: 1 });
otherQuerySchema.index({ finalStatus: 1 });

// Create Models
export const AcademicQuery = mongoose.model('AcademicQuery', academicQuerySchema);
export const ExamQuery = mongoose.model('ExamQuery', examQuerySchema);
export const LeaveQuery = mongoose.model('LeaveQuery', leaveQuerySchema);
export const OtherQuery = mongoose.model('OtherQuery', otherQuerySchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);