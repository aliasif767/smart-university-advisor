import { useState, useEffect } from "react";
import {
  BookOpen, Calendar, Clock, CheckCircle, AlertCircle, FileText,
  Send, Eye, MessageSquare, X, Upload, Menu, LogOut, User, Bell,
  Settings, ChevronDown, Search, TrendingUp, Target, GraduationCap,
  UserCheck, ClipboardList, Users, BarChart3, PenTool, Loader2,
  Save, ArrowLeft, Edit2, ChevronRight, BookMarked, Percent,
  Hash, Award, CheckSquare, XSquare, AlertTriangle,
  Megaphone, Volume2, Pin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { teacherAPI } from "@/services/api";

export default function TeacherDashboard() {
  const { user: teacher, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data States
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [sectionGroups, setSectionGroups] = useState<Record<string, any[]>>({});
  const [sections, setSections] = useState<string[]>([]);
  // Separate section selectors for each form — independent from each other
  const [attendanceSection, setAttendanceSection] = useState<string>("");
  const [marksSection, setMarksSection] = useState<string>("");
  const [dashboardSection, setDashboardSection] = useState<string>("all");
  const [studentQueries, setStudentQueries] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, pendingQueries: 0, classesToday: 0, avgAttendance: 0 });

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceCourse, setAttendanceCourse] = useState("");
  const [attendanceCourseCode, setAttendanceCourseCode] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Exam Marks State
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState("");
  const [examCourse, setExamCourse] = useState("");
  const [examCourseCode, setExamCourseCode] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [marksRecords, setMarksRecords] = useState([]);

  // Academic Records States
  const [academicRecordsTab, setAcademicRecordsTab] = useState<"attendance" | "marks">("attendance");
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [marksHistory, setMarksHistory] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Detail / Edit states
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<any>(null);
  const [selectedMarksRecord, setSelectedMarksRecord] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // Edit form state for attendance detail
  const [editAttendanceRows, setEditAttendanceRows] = useState<any[]>([]);
  // Edit form state for marks detail
  const [editMarksRows, setEditMarksRows] = useState<any[]>([]);

  // Query Resolution Modal State
  const [queryModal, setQueryModal] = useState<{
    open: boolean; queryId: string | null; action: "resolved" | "rejected"; remarks: string;
  }>({ open: false, queryId: null, action: "resolved", remarks: "" });

  // Query filter
  const [queryFilter, setQueryFilter] = useState<"all" | "exam" | "attendance">("all");

  useEffect(() => { fetchDashboardData(); fetchAnnouncements(); }, []);

  useEffect(() => {
    if (activeView === "queries") fetchQueries();
    if (activeView === "academic-records") fetchAcademicRecords();
    if (activeView === "announcements") fetchAnnouncements();
  }, [activeView]);

  useEffect(() => {
    if (activeView === "academic-records") fetchAcademicRecords();
  }, [academicRecordsTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        teacherAPI.getAssignedStudents(),
        teacherAPI.getTeacherStats()
      ]);
      const s = studentsRes.data.students || [];
      const sg = studentsRes.data.sectionGroups || {};
      const secs = studentsRes.data.sections || [];
      setAssignedStudents(s);
      setSectionGroups(sg);
      setSections(secs);
      setStats(statsRes.data.stats || {});
      // Default both forms to first section (if any), so teacher always submits per-section
      if (secs.length > 0) {
        setAttendanceSection(secs[0]);
        setMarksSection(secs[0]);
      }
      setAttendanceRecords(s.map((st: any) => ({ id: st._id, studentId: st.rollNo || st.studentId, studentName: st.name, section: st.section, status: "present", remarks: "" })));
      setMarksRecords(s.map((st: any) => ({ id: st._id, studentId: st.rollNo || st.studentId, studentName: st.name, section: st.section, obtainedMarks: "", remarks: "" })));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const r = await teacherAPI.getStudentQueries();
      setStudentQueries(r.data.queries || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await teacherAPI.getHOPAnnouncements();
      setAnnouncements(res.data.announcements || []);
    } catch (e) { console.error(e); } finally { setAnnouncementsLoading(false); }
  };

  // ── Fetch all submitted attendance & marks records ─────────────────
  const fetchAcademicRecords = async () => {
    setRecordsLoading(true);
    try {
      const [attRes, marksRes] = await Promise.all([
        teacherAPI.getAttendanceRecords(),
        teacherAPI.getMarksRecords()
      ]);

      // Group attendance by (date + courseName) → one "session" card per group
      const attRaw: any[] = attRes.data.records || [];
      const attGroups: Record<string, any> = {};
      attRaw.forEach(r => {
        const dateStr = r.date ? new Date(r.date).toISOString().split("T")[0] : "unknown";
        const key = `${dateStr}__${r.courseName}`;
        if (!attGroups[key]) {
          attGroups[key] = {
            key,
            date: r.date,
            courseName: r.courseName,
            courseCode: r.courseCode || "",
            rows: [],
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
          };
        }
        attGroups[key].rows.push(r);
        if (r.status === "present") attGroups[key].presentCount++;
        else if (r.status === "absent") attGroups[key].absentCount++;
        else if (r.status === "late") attGroups[key].lateCount++;
      });
      const attSessions = Object.values(attGroups).sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAttendanceHistory(attSessions as any);

      // Group marks by (examDate + courseName + examType)
      const marksRaw: any[] = marksRes.data.records || [];
      const marksGroups: Record<string, any> = {};
      marksRaw.forEach(r => {
        const dateStr = r.examDate ? new Date(r.examDate).toISOString().split("T")[0] : "unknown";
        const key = `${dateStr}__${r.courseName}__${r.examType}`;
        if (!marksGroups[key]) {
          marksGroups[key] = {
            key,
            examDate: r.examDate,
            courseName: r.courseName,
            courseCode: r.courseCode || "",
            examType: r.examType,
            totalMarks: r.totalMarks,
            rows: [],
            avgObtained: 0,
          };
        }
        marksGroups[key].rows.push(r);
      });
      // Compute averages
      Object.values(marksGroups).forEach((g: any) => {
        const sum = g.rows.reduce((acc: number, r: any) => acc + (r.obtainedMarks || 0), 0);
        g.avgObtained = g.rows.length ? parseFloat((sum / g.rows.length).toFixed(1)) : 0;
      });
      const marksSessions = Object.values(marksGroups).sort(
        (a: any, b: any) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
      );
      setMarksHistory(marksSessions as any);
    } catch (e) { console.error(e); } finally { setRecordsLoading(false); }
  };

  // ── Open attendance detail ─────────────────────────────────────────
  const openAttendanceDetail = (session: any) => {
    setSelectedAttendanceRecord(session);
    setEditAttendanceRows(session.rows.map((r: any) => ({ ...r })));
    setEditMode(false);
    setActiveView("attendance-detail");
  };

  // ── Open marks detail ──────────────────────────────────────────────
  const openMarksDetail = (session: any) => {
    setSelectedMarksRecord(session);
    setEditMarksRows(session.rows.map((r: any) => ({ ...r })));
    setEditMode(false);
    setActiveView("marks-detail");
  };

  // ── Save edited attendance ─────────────────────────────────────────
  const handleSaveAttendanceEdit = async () => {
    setLoading(true);
    try {
      await Promise.all(
        editAttendanceRows.map(row =>
          teacherAPI.updateAttendance(row._id, { status: row.status, remarks: row.remarks || "" })
        )
      );
      alert("Attendance updated successfully!");
      setEditMode(false);
      // Refresh the session data
      const updated = { ...selectedAttendanceRecord };
      updated.rows = editAttendanceRows;
      updated.presentCount = editAttendanceRows.filter(r => r.status === "present").length;
      updated.absentCount  = editAttendanceRows.filter(r => r.status === "absent").length;
      updated.lateCount    = editAttendanceRows.filter(r => r.status === "late").length;
      setSelectedAttendanceRecord(updated);
      fetchAcademicRecords();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to update attendance");
    } finally { setLoading(false); }
  };

  // ── Save edited marks ──────────────────────────────────────────────
  const handleSaveMarksEdit = async () => {
    setLoading(true);
    try {
      await Promise.all(
        editMarksRows.map(row =>
          teacherAPI.updateMarks(row._id, {
            obtainedMarks: parseInt(row.obtainedMarks),
            totalMarks: parseInt(row.totalMarks),
            remarks: row.remarks || ""
          })
        )
      );
      alert("Marks updated successfully!");
      setEditMode(false);
      const updated = { ...selectedMarksRecord };
      updated.rows = editMarksRows;
      const sum = editMarksRows.reduce((acc: number, r: any) => acc + Number(r.obtainedMarks || 0), 0);
      updated.avgObtained = editMarksRows.length ? parseFloat((sum / editMarksRows.length).toFixed(1)) : 0;
      setSelectedMarksRecord(updated);
      fetchAcademicRecords();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to update marks");
    } finally { setLoading(false); }
  };

  const courses = ["Data Structures", "Algorithms", "Database Systems", "Software Engineering", "Operating Systems"];
  const examTypes = ["Quiz 1", "Quiz 2", "Quiz 3", "Midterm", "Final", "Assignment 1", "Assignment 2", "Project"];

  const quickActions = [
    { title: "Mark Attendance",      icon: UserCheck,  color: "from-blue-500 to-blue-600",   action: () => setActiveView("attendance") },
    { title: "Enter Exam Marks",     icon: PenTool,    color: "from-green-500 to-green-600",  action: () => setActiveView("marks") },
    { title: "Academic Records",     icon: BookMarked, color: "from-violet-500 to-violet-600",action: () => setActiveView("academic-records") },
    { title: "View Queries",         icon: MessageSquare, color: "from-purple-500 to-purple-600", action: () => setActiveView("queries") },
  ];

  const statsDisplay = [
    { label: "Pending Queries", value: stats.pendingQueries || "0", icon: Clock, color: "text-orange-600", bg: "bg-gradient-to-br from-orange-50 to-orange-100", border: "border-orange-200", trend: "+3 today", trendIcon: TrendingUp },
    { label: "Classes Today",   value: stats.classesToday || "4",  icon: BookOpen, color: "text-blue-600", bg: "bg-gradient-to-br from-blue-50 to-blue-100", border: "border-blue-200", trend: "2 completed", trendIcon: CheckCircle },
    { label: "Total Students",  value: stats.totalStudents || assignedStudents.length || "0", icon: Users, color: "text-green-600", bg: "bg-gradient-to-br from-green-50 to-green-100", border: "border-green-200", trend: "Assigned to you", trendIcon: Target },
    { label: "Avg Attendance",  value: `${stats.avgAttendance || "0"}%`, icon: BarChart3, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-50 to-purple-100", border: "border-purple-200", trend: "+5% this month", trendIcon: TrendingUp },
  ];

  const getStatusColor = (status: string) => {
    switch (status) { case "resolved": return "default"; case "pending": return "secondary"; case "rejected": return "destructive"; default: return "default"; }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) { case "high": return "bg-red-100 text-red-700 border-red-200"; case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200"; case "low": return "bg-green-100 text-green-700 border-green-200"; default: return "bg-gray-100 text-gray-700 border-gray-200"; }
  };
  const getAttStatusStyle = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700 border-2 border-green-300";
      case "absent":  return "bg-red-100 text-red-700 border-2 border-red-300";
      case "late":    return "bg-yellow-100 text-yellow-700 border-2 border-yellow-300";
      default:        return "bg-gray-100 text-gray-700 border-2 border-gray-300";
    }
  };
  const cycleStatus = (current: string) => {
    const order = ["present", "absent", "late"];
    return order[(order.indexOf(current) + 1) % order.length];
  };

  const handleAttendanceToggle = (id: string) =>
    setAttendanceRecords(prev => prev.map((r: any) => r.id === id ? { ...r, status: r.status === "present" ? "absent" : "present" } : r));
  const handleMarksChange = (id: string, value: string) =>
    setMarksRecords(prev => prev.map((r: any) => r.id === id ? { ...r, obtainedMarks: value } : r));
  const handleRemarksChange = (id: string, value: string, type: string) => {
    if (type === "attendance") setAttendanceRecords(prev => prev.map((r: any) => r.id === id ? { ...r, remarks: value } : r));
    else setMarksRecords(prev => prev.map((r: any) => r.id === id ? { ...r, remarks: value } : r));
  };

  const handleAttendanceSubmit = async () => {
    if (!attendanceDate || !attendanceCourse) { alert("Please select date and course!"); return; }
    if (!attendanceSection) { alert("Please select a section!"); return; }
    // Only submit students from the currently selected section
    const sectionRecords = (attendanceRecords as any[]).filter(r => r.section === attendanceSection);
    if (sectionRecords.length === 0) { alert("No students found in this section!"); return; }
    setLoading(true);
    try {
      await teacherAPI.markAttendance({
        date: attendanceDate,
        courseName: attendanceCourse,
        courseCode: attendanceCourseCode,
        section: attendanceSection,
        attendanceData: sectionRecords.map((r: any) => ({ studentId: r.id, studentRollNo: r.studentId, status: r.status, remarks: r.remarks }))
      });
      alert(`Attendance for Section ${attendanceSection} marked successfully!`);
      setAttendanceDate(""); setAttendanceCourse(""); setAttendanceCourseCode("");
      // Reset only this section's records, keep others untouched
      setAttendanceRecords(prev => prev.map((r: any) =>
        r.section === attendanceSection ? { ...r, status: "present", remarks: "" } : r
      ));
    } catch (e: any) { alert(e.response?.data?.message || "Failed to mark attendance"); } finally { setLoading(false); }
  };

  const handleMarksSubmit = async () => {
    if (!examDate || !examType || !examCourse || !totalMarks) { alert("Please fill in all required fields!"); return; }
    if (!marksSection) { alert("Please select a section!"); return; }
    // Only submit students from the currently selected section
    const sectionRecords = (marksRecords as any[]).filter(r => r.section === marksSection);
    if (sectionRecords.length === 0) { alert("No students found in this section!"); return; }
    if (sectionRecords.some(r => !r.obtainedMarks)) { alert(`Please enter marks for all students in Section ${marksSection}!`); return; }
    setLoading(true);
    try {
      await teacherAPI.uploadMarks({
        examDate, examType,
        courseName: examCourse,
        courseCode: examCourseCode,
        section: marksSection,
        marksData: sectionRecords.map((r: any) => ({ studentId: r.id, studentRollNo: r.studentId, totalMarks: parseInt(totalMarks), obtainedMarks: parseInt(r.obtainedMarks), remarks: r.remarks }))
      });
      alert(`Marks for Section ${marksSection} uploaded successfully!`);
      setExamDate(""); setExamType(""); setExamCourse(""); setExamCourseCode(""); setTotalMarks("");
      // Reset only this section's marks, keep others untouched
      setMarksRecords(prev => prev.map((r: any) =>
        r.section === marksSection ? { ...r, obtainedMarks: "", remarks: "" } : r
      ));
    } catch (e: any) { alert(e.response?.data?.message || "Failed to upload marks"); } finally { setLoading(false); }
  };

  const handleSendToAdvisor = async (studentId: string, dataType: string) => {
    try { await teacherAPI.sendDataToAdvisor({ studentId, dataType, message: `${dataType} records updated` }); alert(`Sent to advisor!`); }
    catch (e: any) { alert(e.response?.data?.message || "Failed to send to advisor"); }
  };

  const handleResolveQuery = (queryId: string, action: "resolved" | "rejected") =>
    setQueryModal({ open: true, queryId, action, remarks: "" });

  const handleQueryModalSubmit = async () => {
    if (!queryModal.remarks.trim()) { alert("Please enter remarks."); return; }
    setLoading(true);
    try {
      await teacherAPI.resolveQuery(queryModal.queryId!, { remarks: queryModal.remarks, action: queryModal.action });
      alert(`Query ${queryModal.action} successfully!`);
      setQueryModal({ open: false, queryId: null, action: "resolved", remarks: "" });
      fetchQueries();
    } catch (e: any) { alert(e.response?.data?.message || "Failed to update query"); } finally { setLoading(false); }
  };

  const getInitials = () => `${(teacher?.firstName || "").charAt(0)}${(teacher?.lastName || "").charAt(0)}`.toUpperCase();

  // ══════════════════════════════════════════════════════════════════════
  // VIEWS
  // ══════════════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {teacher?.firstName}!</h2>
          <p className="text-blue-100 font-medium">Manage your classes and student records efficiently</p>
          {sections.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-blue-200 text-sm font-semibold">Your sections:</span>
              {sections.map(sec => (
                <span key={sec} className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                  Section {sec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsDisplay.map((stat, idx) => (
          <Card key={idx} className={`border-2 ${stat.border} shadow-xl rounded-2xl overflow-hidden transform hover:scale-105 transition-all cursor-pointer`}>
            <div className={`${stat.bg} p-6`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color} mb-2`}>{stat.value}</p>
                  <div className="flex items-center gap-2"><stat.trendIcon className="w-4 h-4 text-gray-600" /><span className="text-xs font-bold text-gray-600">{stat.trend}</span></div>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg} shadow-lg`}><stat.icon className={`w-8 h-8 ${stat.color}`} /></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={action.action} className={`bg-gradient-to-r ${action.color} text-white p-5 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all text-left`}>
              <action.icon className="w-7 h-7 mb-2" />
              <span className="font-bold text-sm">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      

      {sections.length === 0 && !loading && (
        <Card className="border-2 border-dashed border-blue-200 rounded-2xl">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-blue-200" />
            <p className="font-bold text-gray-500">No students assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Ask your advisor to assign students to your sections</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAttendance = () => {
    // Always show only the currently selected section's students
    const sectionRecords = attendanceSection
      ? (attendanceRecords as any[]).filter(r => r.section === attendanceSection)
      : [];

    return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg"><UserCheck className="h-6 w-6 text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-xl">Mark Attendance</h3>
              <p className="text-sm text-blue-100">Attendance is submitted per-section — each section is independent</p>
            </div>
          </div>
        </div>
        <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">

            {/* Section selector — required, prominent, at the top */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Section <span className="text-red-500">*</span>
                <span className="ml-2 text-xs font-normal text-gray-500">Attendance is submitted separately for each section</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {sections.map(sec => (
                  <button key={sec} onClick={() => setAttendanceSection(sec)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      attendanceSection === sec
                        ? "bg-blue-600 text-white shadow-lg scale-105"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}>
                    <Users className="w-4 h-4" />
                    Section {sec}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${attendanceSection === sec ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                      {(sectionGroups[sec] || []).length}
                    </span>
                  </button>
                ))}
              </div>
              {!attendanceSection && (
                <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
                  ⚠ Please select a section to proceed
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Date *</label><input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Course *</label><select value={attendanceCourse} onChange={e => setAttendanceCourse(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"><option value="">Select course</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Course Code</label><input type="text" value={attendanceCourseCode} onChange={e => setAttendanceCourseCode(e.target.value)} placeholder="e.g., CS-201" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" /></div>

            {/* Student list — only shows when a section is selected */}
            {attendanceSection ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800">
                    Section {attendanceSection} Attendance
                    <span className="ml-2 text-sm text-gray-500 font-normal">({sectionRecords.length} students)</span>
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={() => setAttendanceRecords(prev => prev.map((r: any) => r.section === attendanceSection ? { ...r, status: "present" } : r))}
                      className="text-xs font-bold text-green-600 border border-green-300 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all">
                      ✓ All Present
                    </button>
                    <button onClick={() => setAttendanceRecords(prev => prev.map((r: any) => r.section === attendanceSection ? { ...r, status: "absent" } : r))}
                      className="text-xs font-bold text-red-600 border border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                      ✗ All Absent
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {sectionRecords.map(record => (
                    <div key={record.id} className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{record.studentName}</p>
                        <p className="text-sm text-gray-600">Roll: {record.studentId}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Sec {record.section}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleAttendanceToggle(record.id)} className={`px-6 py-2 rounded-lg font-bold transition-all ${record.status === "present" ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-red-100 text-red-700 border-2 border-red-300"}`}>{record.status === "present" ? "Present" : "Absent"}</button>
                        <input type="text" value={record.remarks} onChange={e => handleRemarksChange(record.id, e.target.value, "attendance")} placeholder="Remarks" className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-3 text-blue-300" />
                <p className="font-bold text-blue-400">Select a section above to view students</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1 py-6 font-bold rounded-xl border-2" onClick={() => setActiveView("dashboard")} disabled={loading}>Cancel</Button>
              <Button onClick={handleAttendanceSubmit} disabled={loading || !attendanceSection} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 py-6 font-bold rounded-xl shadow-lg disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Save className="w-4 h-4 mr-2" />Submit Section {attendanceSection} Attendance</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  const renderMarks = () => {
    // Always show only the currently selected section's students
    const sectionRecords = marksSection
      ? (marksRecords as any[]).filter(r => r.section === marksSection)
      : [];

    return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg"><PenTool className="h-6 w-6 text-green-600" /></div>
            <div>
              <h3 className="font-bold text-xl">Enter Exam Marks</h3>
              <p className="text-sm text-green-100">Marks are submitted per-section — each section is independent</p>
            </div>
          </div>
        </div>
        <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">

            {/* Section selector — required, prominent, at the top */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Section <span className="text-red-500">*</span>
                <span className="ml-2 text-xs font-normal text-gray-500">Marks are submitted separately for each section</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {sections.map(sec => (
                  <button key={sec} onClick={() => setMarksSection(sec)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      marksSection === sec
                        ? "bg-green-600 text-white shadow-lg scale-105"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                    }`}>
                    <Users className="w-4 h-4" />
                    Section {sec}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${marksSection === sec ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                      {(sectionGroups[sec] || []).length}
                    </span>
                  </button>
                ))}
              </div>
              {!marksSection && (
                <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
                  ⚠ Please select a section to proceed
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Exam Date *</label><input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Exam Type *</label><select value={examType} onChange={e => setExamType(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium shadow-sm"><option value="">Select type</option>{examTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Course *</label><select value={examCourse} onChange={e => setExamCourse(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium shadow-sm"><option value="">Select course</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Course Code</label><input type="text" value={examCourseCode} onChange={e => setExamCourseCode(e.target.value)} placeholder="e.g., CS-201" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Total Marks *</label><input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} placeholder="e.g., 50" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div>

            {/* Student list — only shows when a section is selected */}
            {marksSection ? (
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Section {marksSection} Marks
                  <span className="ml-2 text-sm text-gray-500 font-normal">({sectionRecords.length} students)</span>
                </h4>
                <div className="space-y-3">
                  {sectionRecords.map(record => (
                    <div key={record.id} className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{record.studentName}</p>
                        <p className="text-sm text-gray-600">Roll: {record.studentId}
                          <span className="ml-2 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Sec {record.section}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="number" value={record.obtainedMarks} onChange={e => handleMarksChange(record.id, e.target.value)} placeholder="Marks" className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg font-bold text-center" />
                        {totalMarks && <span className="text-gray-600 font-medium">/ {totalMarks}</span>}
                        <input type="text" value={record.remarks} onChange={e => handleRemarksChange(record.id, e.target.value, "marks")} placeholder="Remarks" className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-green-50 border-2 border-dashed border-green-200 rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-3 text-green-300" />
                <p className="font-bold text-green-400">Select a section above to view students</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1 py-6 font-bold rounded-xl border-2" onClick={() => setActiveView("dashboard")} disabled={loading}>Cancel</Button>
              <Button onClick={handleMarksSubmit} disabled={loading || !marksSection} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 py-6 font-bold rounded-xl shadow-lg disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Save className="w-4 h-4 mr-2" />Upload Section {marksSection} Marks</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  // ── ACADEMIC RECORDS — card list ───────────────────────────────────
  const renderAcademicRecords = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl"><BookMarked className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-bold">Student Academic Records</h2>
              <p className="text-purple-100 text-sm mt-1">All submitted attendance sessions & exam marks — click any card to view details or edit</p>
            </div>
          </div>
          <Button onClick={fetchAcademicRecords} variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30 font-bold">
            <Loader2 className={`w-4 h-4 mr-2 ${recordsLoading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3">
        {[
          { key: "attendance", label: "📋 Attendance Sessions", count: attendanceHistory.length, color: "bg-blue-600" },
          { key: "marks",      label: "📝 Exam Marks",          count: marksHistory.length,      color: "bg-green-600" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setAcademicRecordsTab(tab.key as any)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${academicRecordsTab === tab.key ? tab.color + " text-white shadow-lg" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400"}`}>
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${academicRecordsTab === tab.key ? "bg-white/30" : "bg-gray-200 text-gray-700"}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {recordsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-violet-600" /></div>
      ) : academicRecordsTab === "attendance" ? (
        /* ── ATTENDANCE CARDS ── */
        attendanceHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-500 text-lg">No attendance records yet</p>
            <p className="text-gray-400 text-sm mt-1">Submit attendance using "Mark Attendance" to see records here</p>
            <Button onClick={() => setActiveView("attendance")} className="mt-4 bg-blue-600 text-white">Mark Attendance Now</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(attendanceHistory as any[]).map((session, idx) => {
              const total = session.rows.length;
              const pct = total > 0 ? Math.round((session.presentCount / total) * 100) : 0;
              return (
                <div key={idx} onClick={() => openAttendanceDetail(session)}
                  className="group bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xl cursor-pointer transition-all relative overflow-hidden">
                  {/* Top color bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`} />
                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{session.courseName}</p>
                        {session.courseCode && <p className="text-xs text-gray-500 font-medium">{session.courseCode}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">{new Date(session.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-green-700">{session.presentCount}</p>
                      <p className="text-xs font-bold text-green-600">Present</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-red-700">{session.absentCount}</p>
                      <p className="text-xs font-bold text-red-600">Absent</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-yellow-700">{session.lateCount}</p>
                      <p className="text-xs font-bold text-yellow-600">Late</p>
                    </div>
                  </div>
                  {/* Attendance % */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">{total} students</span>
                    <span className={`text-sm font-black px-3 py-1 rounded-full ${pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{pct}% present</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── MARKS CARDS ── */
        marksHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-500 text-lg">No marks records yet</p>
            <p className="text-gray-400 text-sm mt-1">Upload exam marks to see records here</p>
            <Button onClick={() => setActiveView("marks")} className="mt-4 bg-green-600 text-white">Upload Marks Now</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(marksHistory as any[]).map((session, idx) => {
              const pct = session.totalMarks > 0 ? Math.round((session.avgObtained / session.totalMarks) * 100) : 0;
              return (
                <div key={idx} onClick={() => openMarksDetail(session)}
                  className="group bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-green-400 hover:shadow-xl cursor-pointer transition-all relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${pct >= 70 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`} />
                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{session.courseName}</p>
                        {session.courseCode && <p className="text-xs text-gray-500 font-medium">{session.courseCode}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors mt-1" />
                  </div>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600"><Calendar className="w-4 h-4" /><span className="font-semibold">{new Date(session.examDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                    <Badge className="bg-purple-100 text-purple-700 font-bold border border-purple-300">{session.examType}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-gray-500 mb-1">Avg Score</p>
                      <p className="text-2xl font-black text-gray-800">{session.avgObtained}<span className="text-sm font-bold text-gray-500">/{session.totalMarks}</span></p>
                    </div>
                    <div className={`rounded-lg p-3 ${pct >= 70 ? "bg-green-50 border border-green-200" : pct >= 50 ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
                      <p className="text-xs font-bold text-gray-500 mb-1">Class Avg %</p>
                      <p className={`text-2xl font-black ${pct >= 70 ? "text-green-700" : pct >= 50 ? "text-yellow-700" : "text-red-700"}`}>{pct}%</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500">{session.rows.length} students</div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );

  // ── ATTENDANCE DETAIL + EDIT ───────────────────────────────────────
  const renderAttendanceDetail = () => {
    if (!selectedAttendanceRecord) return null;
    const session = selectedAttendanceRecord;
    const total = editMode ? editAttendanceRows.length : session.rows.length;
    const presentNow = editMode ? editAttendanceRows.filter(r => r.status === "present").length : session.presentCount;
    const absentNow  = editMode ? editAttendanceRows.filter(r => r.status === "absent").length  : session.absentCount;
    const lateNow    = editMode ? editAttendanceRows.filter(r => r.status === "late").length    : session.lateCount;
    const pct = total > 0 ? Math.round((presentNow / total) * 100) : 0;
    return (
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveView("academic-records"); setEditMode(false); }} className="p-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{session.courseName} — Attendance Detail</h2>
            <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold gap-2">
              <Edit2 className="w-4 h-4" />Edit Records
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditMode(false); setEditAttendanceRows(session.rows.map((r: any) => ({ ...r }))); }} disabled={loading} className="border-2 font-bold">Discard</Button>
              <Button onClick={handleSaveAttendanceEdit} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
              </Button>
            </div>
          )}
        </div>

        {editMode && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-bold text-amber-800">Edit mode active — click a student's status button to cycle through Present → Absent → Late. Click "Save Changes" when done.</p>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Present", value: presentNow, color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Absent",  value: absentNow,  color: "bg-red-50 border-red-200 text-red-700" },
            { label: "Late",    value: lateNow,    color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { label: "Attendance %", value: `${pct}%`, color: pct >= 75 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700" },
          ].map(s => (
            <div key={s.label} className={`border-2 rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-sm font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Student rows */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Student-wise Attendance ({total} students)
              {editMode && <Badge className="ml-2 bg-amber-100 text-amber-700 border border-amber-300 font-bold">Editing</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {(editMode ? editAttendanceRows : session.rows).map((row: any, idx: number) => {
                const studentName = row.studentId?.firstName
                  ? `${row.studentId.firstName} ${row.studentId.lastName}`
                  : row.studentRollNo || `Student ${idx + 1}`;
                const rollNo = row.studentId?.rollNo || row.studentRollNo || "—";
                return (
                  <div key={row._id || idx} className={`flex items-center gap-4 px-6 py-4 ${editMode ? "hover:bg-blue-50" : "hover:bg-gray-50"} transition-colors`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(studentName).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{studentName}</p>
                      <p className="text-sm text-gray-500">Roll: {rollNo}</p>
                    </div>
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditAttendanceRows(prev => prev.map(r => r === row ? { ...r, status: cycleStatus(r.status) } : r))}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[90px] ${getAttStatusStyle(row.status)}`}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </button>
                        <input type="text" value={row.remarks || ""} onChange={e => setEditAttendanceRows(prev => prev.map(r => r === row ? { ...r, remarks: e.target.value } : r))}
                          placeholder="Remarks..." className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm w-36 focus:border-blue-400 outline-none" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-lg font-bold text-sm min-w-[90px] text-center ${getAttStatusStyle(row.status)}`}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                        {row.remarks && <span className="text-sm text-gray-500 italic">"{row.remarks}"</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── MARKS DETAIL + EDIT ────────────────────────────────────────────
  const renderMarksDetail = () => {
    if (!selectedMarksRecord) return null;
    const session = selectedMarksRecord;
    const rows = editMode ? editMarksRows : session.rows;
    const sum = rows.reduce((a: number, r: any) => a + Number(r.obtainedMarks || 0), 0);
    const avg = rows.length ? parseFloat((sum / rows.length).toFixed(1)) : 0;
    const pct = session.totalMarks > 0 ? Math.round((avg / session.totalMarks) * 100) : 0;
    const highest = rows.length ? Math.max(...rows.map((r: any) => Number(r.obtainedMarks || 0))) : 0;
    const lowest  = rows.length ? Math.min(...rows.map((r: any) => Number(r.obtainedMarks || 0))) : 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveView("academic-records"); setEditMode(false); }} className="p-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{session.courseName} — {session.examType} Detail</h2>
            <p className="text-sm text-gray-500">{new Date(session.examDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold gap-2">
              <Edit2 className="w-4 h-4" />Edit Marks
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditMode(false); setEditMarksRows(session.rows.map((r: any) => ({ ...r }))); }} disabled={loading} className="border-2 font-bold">Discard</Button>
              <Button onClick={handleSaveMarksEdit} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
              </Button>
            </div>
          )}
        </div>

        {editMode && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-bold text-amber-800">Edit mode active — update marks or total marks for any student. Click "Save Changes" when done.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Class Average", value: `${avg}/${session.totalMarks}`, sub: `${pct}%`, color: pct >= 70 ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50" },
            { label: "Highest Score",  value: highest, sub: `/${session.totalMarks}`, color: "border-blue-200 bg-blue-50" },
            { label: "Lowest Score",   value: lowest,  sub: `/${session.totalMarks}`, color: "border-red-200 bg-red-50" },
            { label: "Students",       value: rows.length, sub: "submitted", color: "border-purple-200 bg-purple-50" },
          ].map(s => (
            <div key={s.label} className={`border-2 rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-500 font-semibold">{s.sub}</p>
              <p className="text-xs font-bold text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
              <Award className="w-5 h-5 text-green-600" />
              Student-wise Marks ({rows.length} students) — Total: {session.totalMarks}
              {editMode && <Badge className="ml-2 bg-amber-100 text-amber-700 border border-amber-300 font-bold">Editing</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {rows.map((row: any, idx: number) => {
                const studentName = row.studentId?.firstName
                  ? `${row.studentId.firstName} ${row.studentId.lastName}`
                  : row.studentRollNo || `Student ${idx + 1}`;
                const rollNo = row.studentId?.rollNo || row.studentRollNo || "—";
                const obtained = Number(row.obtainedMarks || 0);
                const total = Number(row.totalMarks || session.totalMarks);
                const rowPct = total > 0 ? Math.round((obtained / total) * 100) : 0;
                return (
                  <div key={row._id || idx} className={`flex items-center gap-4 px-6 py-4 ${editMode ? "hover:bg-green-50" : "hover:bg-gray-50"} transition-colors`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(studentName).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{studentName}</p>
                      <p className="text-sm text-gray-500">Roll: {rollNo}</p>
                    </div>
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <input type="number" value={row.obtainedMarks ?? ""} min={0} max={row.totalMarks || session.totalMarks}
                            onChange={e => setEditMarksRows(prev => prev.map(r => r === row ? { ...r, obtainedMarks: e.target.value } : r))}
                            className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg font-black text-center text-lg focus:border-green-400 outline-none" />
                          <span className="text-gray-500 font-bold">/ {row.totalMarks || session.totalMarks}</span>
                        </div>
                        <input type="text" value={row.remarks || ""} onChange={e => setEditMarksRows(prev => prev.map(r => r === row ? { ...r, remarks: e.target.value } : r))}
                          placeholder="Remarks..." className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm w-36 focus:border-green-400 outline-none" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-black text-gray-800">{obtained}<span className="text-sm font-bold text-gray-400">/{total}</span></p>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${rowPct >= 70 ? "bg-green-100 text-green-700" : rowPct >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{rowPct}%</span>
                        </div>
                        {row.remarks && <span className="text-sm text-gray-400 italic max-w-[120px] truncate">"{row.remarks}"</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── QUERIES VIEW ───────────────────────────────────────────────────
  const renderQueries = () => {
    const filteredQueries = queryFilter === "all" ? studentQueries : studentQueries.filter((q: any) => q.category === queryFilter);
    const examCount       = (studentQueries as any[]).filter(q => q.category === "exam").length;
    const attendanceCount = (studentQueries as any[]).filter(q => q.category === "attendance").length;
    const pendingCount    = (studentQueries as any[]).filter(q => q.teacherStatus === "pending").length;
    return (
      <div className="space-y-6">
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Student Queries — Attendance & Exam Marks
              {pendingCount > 0 && <Badge className="ml-2 bg-red-500 text-white font-bold">{pendingCount} pending</Badge>}
            </CardTitle>
            <div className="flex gap-2 mt-3">
              {[
                { key: "all", label: `All (${(studentQueries as any[]).length})`, color: "bg-gray-800 text-white" },
                { key: "exam", label: `Exam Marks (${examCount})`, color: "bg-green-600 text-white" },
                { key: "attendance", label: `Attendance (${attendanceCount})`, color: "bg-blue-600 text-white" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setQueryFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${queryFilter === tab.key ? tab.color + " shadow-lg" : "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
              : (filteredQueries as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(filteredQueries as any[]).map(query => (
                    <div key={query._id} className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-bold text-gray-800">{query.studentName}</h4>
                            <Badge className="bg-blue-100 text-blue-700 font-bold">{query.studentRollNo}</Badge>
                            <Badge variant={getStatusColor(query.teacherStatus)} className="font-bold">{query.teacherStatus || "pending"}</Badge>
                            <Badge className={`font-bold text-xs ${query.category === "exam" ? "bg-green-100 text-green-700 border border-green-300" : "bg-blue-100 text-blue-700 border border-blue-300"}`}>
                              {query.category === "exam" ? "📝 Exam Marks" : "📋 Attendance"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getPriorityColor(query.priority)}`}>{query.priority} priority</span>
                            <span className="text-sm text-gray-600 font-medium">{query.queryType}</span>
                          </div>
                        </div>
                      </div>
                      {query.courseName && <p className="text-sm font-bold text-gray-700 mb-1">Course: {query.courseName}</p>}
                      <p className="text-sm text-gray-700 mb-3">{query.description}</p>
                      {query.teacherStatus !== "pending" && query.teacherRemarks && (
                        <div className={`mb-3 p-3 rounded-lg border-2 text-sm font-medium ${query.teacherStatus === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                          <span className="font-bold">Your remarks:</span> {query.teacherRemarks}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(query.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(query.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {query.teacherStatus === "pending" && (
                        <div className="flex gap-3 flex-wrap">
                          <Button size="sm" onClick={() => handleResolveQuery(query._id, "resolved")} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                            <CheckCircle className="h-4 w-4 mr-2" />Resolve & Update Records
                          </Button>
                          <Button size="sm" onClick={() => handleResolveQuery(query._id, "rejected")} disabled={loading} variant="destructive" className="rounded-lg">
                            <X className="h-4 w-4 mr-2" />Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setActiveView("academic-records"); setAcademicRecordsTab(query.category === "exam" ? "marks" : "attendance"); }}
                            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="h-4 w-4 mr-2" />View Records
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No {queryFilter === "all" ? "" : queryFilter + " "}queries to display</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── ANNOUNCEMENTS VIEW ─────────────────────────────────────────────
  const renderAnnouncements = () => {
    const typeConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
      urgent:  { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-300",    icon: "🚨" },
      exam:    { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300",   icon: "📝" },
      event:   { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300", icon: "📅" },
      general: { color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300",  icon: "📢" },
    };

    return (
      <div className="space-y-6">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-7 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Megaphone className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">HOP Announcements</h2>
                <p className="text-blue-100 text-sm mt-1">Official notices from the Head of Program</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {announcements.length > 0 && (
                <span className="bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl border border-white/30">
                  {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={fetchAnnouncements}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Volume2 className={`w-4 h-4 ${announcementsLoading ? "animate-pulse" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {announcementsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-gray-500 font-medium">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Megaphone className="w-10 h-10 text-indigo-300" />
            </div>
            <p className="font-bold text-gray-500 text-xl">No announcements yet</p>
            <p className="text-gray-400 text-sm mt-2">Announcements from the Head of Program will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(announcements as any[]).map((ann, idx) => {
              const cfg = typeConfig[ann.type] || typeConfig.general;
              const isNew = new Date(ann.createdAt) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
              return (
                <div key={ann._id || idx}
                  className={`relative bg-white border-2 ${cfg.border} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all`}>
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${cfg.bg.replace("bg-", "bg-").replace("50", "400")}`} />

                  <div className="flex items-start gap-4 pl-2">
                    {/* Type icon */}
                    <div className={`w-12 h-12 ${cfg.bg} border-2 ${cfg.border} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">{ann.title}</h3>
                          {isNew && (
                            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} capitalize`}>
                            {ann.type}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-line">{ann.content}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold">
                            <Pin className="w-3 h-3" />
                            Posted by: <span className="text-gray-600 font-bold ml-1">{ann.postedByName || "Head of Program"}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="font-medium">
                            {new Date(ann.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            {" · "}
                            {new Date(ann.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // ══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Query Resolution Modal */}
      {queryModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-gray-200 overflow-hidden">
            <div className={`p-5 ${queryModal.action === "resolved" ? "bg-gradient-to-r from-green-600 to-emerald-700" : "bg-gradient-to-r from-red-600 to-rose-700"} text-white`}>
              <div className="flex items-center gap-3">
                {queryModal.action === "resolved" ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
                <h3 className="text-xl font-bold">{queryModal.action === "resolved" ? "Resolve Query" : "Reject Query"}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Remarks <span className="text-red-500">*</span></label>
                <textarea value={queryModal.remarks} onChange={e => setQueryModal(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter detailed remarks..." rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-2 font-bold rounded-xl" onClick={() => setQueryModal({ open: false, queryId: null, action: "resolved", remarks: "" })} disabled={loading}>Cancel</Button>
                <Button onClick={handleQueryModalSubmit} disabled={loading}
                  className={`flex-1 font-bold rounded-xl ${queryModal.action === "resolved" ? "bg-gradient-to-r from-green-600 to-emerald-700" : "bg-gradient-to-r from-red-600 to-rose-700"}`}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : queryModal.action === "resolved" ? <><CheckCircle className="w-4 h-4 mr-2" />Confirm</> : <><X className="w-4 h-4 mr-2" />Confirm Reject</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} bg-white border-r-2 border-gray-200 transition-all duration-300 overflow-hidden shadow-2xl flex flex-col`}>
        <div className="p-6 border-b-2 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"><GraduationCap className="w-7 h-7 text-blue-600" /></div>
            <div><h3 className="font-bold text-xl">Smart Advisor</h3><p className="text-xs text-blue-100 font-medium">Teacher Portal</p></div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { key: "dashboard",         label: "Dashboard",                icon: BookOpen,    badge: null },
            { key: "attendance",        label: "Mark Attendance",          icon: UserCheck,   badge: null },
            { key: "marks",             label: "Enter Exam Marks",         icon: PenTool,     badge: null },
            { key: "academic-records",  label: "Student Academic Records", icon: BookMarked,  badge: null },
            { key: "announcements",      label: "HOP Announcements",        icon: Megaphone,   badge: null },
    { key: "queries",           label: "Student Queries",          icon: MessageSquare, badge: (studentQueries as any[]).filter(q => q.teacherStatus === "pending").length || null },
          ].map(item => (
            <button key={item.key}
              onClick={() => { setActiveView(item.key); setEditMode(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
                activeView === item.key || (item.key === "academic-records" && ["attendance-detail","marks-detail"].includes(activeView))
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "text-gray-700 hover:bg-gray-100 hover:shadow"
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.badge ? <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-2 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3"><Calendar className="w-4 h-4 text-gray-600" /><div><p className="text-xs font-bold text-gray-900">Today's Date</p><p className="text-xs text-gray-600">{new Date().toLocaleDateString()}</p></div></div>
          <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-gray-600" /><div><p className="text-xs font-bold text-gray-900">Active Classes</p><p className="text-xs text-gray-600">{stats.classesToday || 4} Today</p></div></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b-2 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><Menu className="w-6 h-6 text-gray-700" /></button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Teacher Dashboard</h1>
                <p className="text-xs text-gray-500 font-medium">Manage academics efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-gray-100 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input type="text" placeholder="Search students..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
              </div>
              <button className="relative p-3 hover:bg-gray-100 rounded-xl transition-all">
                <Bell className="w-5 h-5 text-gray-600" />
                {(studentQueries as any[]).filter(q => q.teacherStatus === "pending").length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{getInitials()}</div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-gray-900">{teacher?.firstName} {teacher?.lastName}</p>
                    <p className="text-xs text-gray-500 font-medium">{teacher?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-sm font-bold text-gray-900">{teacher?.firstName} {teacher?.lastName}</p>
                      <p className="text-xs text-gray-500">{teacher?.email}</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-semibold"><User className="w-4 h-4 text-gray-600" /><span className="text-sm text-gray-700">Profile</span></button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-semibold"><Settings className="w-4 h-4 text-gray-600" /><span className="text-sm text-gray-700">Settings</span></button>
                    <div className="border-t-2 my-2" />
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-red-600 font-bold"><LogOut className="w-4 h-4" /><span className="text-sm">Logout</span></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeView === "dashboard"         && renderDashboard()}
          {activeView === "attendance"        && renderAttendance()}
          {activeView === "marks"             && renderMarks()}
          {activeView === "academic-records"  && renderAcademicRecords()}
          {activeView === "attendance-detail" && renderAttendanceDetail()}
          {activeView === "marks-detail"      && renderMarksDetail()}
          {activeView === "queries"           && renderQueries()}
          {activeView === "announcements"      && renderAnnouncements()}
        </div>
      </div>
    </div>
  );
}