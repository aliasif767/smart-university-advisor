import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Eye,
  MessageSquare,
  X,
  Menu,
  LogOut,
  User,
  Bell,
  Settings,
  ChevronDown,
  Search,
  TrendingUp,
  Target,
  GraduationCap,
  Users,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
  UserPlus,
  UserCog,
  Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { advisorAPI } from "@/services/api";

export default function AdvisorDashboard() {
  const { user: advisor, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Data States
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherNotifications, setTeacherNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [academicRecords, setAcademicRecords] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    atRiskStudents: 0,
    forwardedToHOP: 0
  });

  // Registration Form States
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRollNo, setRegRollNo] = useState("");
  const [regSemester, setRegSemester] = useState("");
  const [regSection, setRegSection] = useState("");

  // Teacher Assignment States — Section-wise
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);       // kept for individual fallback
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Section-wise assignment modal
  const [showSectionAssign, setShowSectionAssign] = useState(false);
  const [sectionAssignTeacherId, setSectionAssignTeacherId] = useState("");
  const [sectionAssignSections, setSectionAssignSections] = useState<string[]>([]);
  const [advisorSections, setAdvisorSections] = useState<any[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeView === "records") {
      fetchAcademicRecords();
    } else if (activeView === "requests") {
      fetchQueries();
    } else if (activeView === "students") {
      fetchStudents();
    }
  }, [activeView]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, teachersRes, notifRes, teacherRecordsRes, sectionsRes] = await Promise.all([
        advisorAPI.getAdvisorStats(),
        advisorAPI.getTeachers(),
        advisorAPI.getNotifications().catch(() => ({ data: { notifications: [] } })),
        advisorAPI.getTeacherRecords().catch(() => ({ data: { sections: [] } })),
        advisorAPI.getSections().catch(() => ({ data: { sections: [] } }))
      ]);

      setStats(statsRes.data.stats || {});
      setTeachers(teachersRes.data.teachers || []);
      const notifs = notifRes.data.notifications || [];
      setTeacherNotifications(notifs);
      setUnreadNotifications(notifs.filter((n: any) => !n.isRead).length);
      setTeacherRecordSections(teacherRecordsRes.data.sections || []);
      setAdvisorSections(sectionsRes.data.sections || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await advisorAPI.markNotificationRead(id);
      setTeacherNotifications(prev => prev.map((n: any) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await advisorAPI.getStudents();
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicRecords = async () => {
    setLoading(true);
    try {
      const response = await advisorAPI.getAcademicRecords();
      setAcademicRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching academic records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const response = await advisorAPI.getQueries();
      setStudentRequests(response.data.queries || []);
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async () => {
    if (!regFirstName || !regLastName || !regEmail || !regRollNo || !regSemester) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);
    try {
      await advisorAPI.registerStudent({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        rollNo: regRollNo,
        semester: parseInt(regSemester),
        section: regSection
      });

      alert("Student registered successfully!");
      
      // Reset form
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegRollNo("");
      setRegSemester("");
      setRegSection("");
      setShowRegistrationForm(false);
      
      // Refresh students list
      fetchStudents();
      fetchDashboardData();
      
    } catch (error) {
      console.error('Error registering student:', error);
      alert(error.response?.data?.message || "Failed to register student");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      alert("Please select a teacher!");
      return;
    }

    setLoading(true);
    try {
      await advisorAPI.assignTeacher(selectedStudent._id, {
        teacherId: selectedTeacherId
      });

      alert("Teacher assigned successfully!");
      
      setShowAssignTeacher(false);
      setSelectedStudent(null);
      setSelectedTeacherId("");
      
      // Refresh students list
      fetchStudents();
      
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert(error.response?.data?.message || "Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  // ── Section-wise bulk assign ───────────────────────────────────────
  const handleAssignTeacherToSection = async () => {
    if (!sectionAssignTeacherId) { alert("Please select a teacher!"); return; }
    if (sectionAssignSections.length === 0) { alert("Please select at least one section!"); return; }

    setLoading(true);
    try {
      const res = await advisorAPI.assignTeacherToSection({
        teacherId: sectionAssignTeacherId,
        sections: sectionAssignSections
      });
      alert(res.data.message || "Teacher assigned to section(s) successfully!");
      setShowSectionAssign(false);
      setSectionAssignTeacherId("");
      setSectionAssignSections([]);
      // Refresh both lists
      await Promise.all([fetchStudents(), fetchDashboardData()]);
    } catch (error: any) {
      console.error('Error assigning teacher to section:', error);
      alert(error.response?.data?.message || "Failed to assign teacher to section");
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionSelection = (sec: string) => {
    setSectionAssignSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    );
  };

  const handleForwardToHOP = async (queryId) => {
    const remarks = prompt("Enter your remarks for HOP:");
    if (!remarks) return;

    setProcessingId(queryId);
    setLoading(true);
    try {
      await advisorAPI.forwardToHOP(queryId, { remarks });
      alert("Request successfully verified and forwarded to Head of Program.");
      fetchQueries(); // Refresh queries
    } catch (error) {
      console.error('Error forwarding query:', error);
      alert(error.response?.data?.message || "Failed to forward query");
    } finally {
      setProcessingId(null);
      setLoading(false);
    }
  };

  const handleRejectQuery = async (queryId) => {
    const remarks = prompt("Enter reason for rejection:");
    if (!remarks) return;

    setProcessingId(queryId);
    setLoading(true);
    try {
      await advisorAPI.rejectQuery(queryId, { remarks });
      alert("Query rejected successfully.");
      fetchQueries(); // Refresh queries
    } catch (error) {
      console.error('Error rejecting query:', error);
      alert(error.response?.data?.message || "Failed to reject query");
    } finally {
      setProcessingId(null);
      setLoading(false);
    }
  };

  const quickActions = [
    { title: "Register Student", icon: UserPlus, color: "from-blue-500 to-blue-600", action: () => setShowRegistrationForm(true) },
    { title: "Academic Records", icon: BarChart3, color: "from-purple-500 to-purple-600", action: () => setActiveView("records") },
    { title: "Review Requests", icon: FileText, color: "from-green-500 to-green-600", action: () => setActiveView("requests") },
  ];

  const statsDisplay = [
    { 
      label: "Pending Reviews", 
      value: stats.pendingReviews || studentRequests.filter(r => r.advisorStatus === "pending").length || "0", 
      icon: Clock, 
      color: "text-orange-600", 
      bg: "bg-gradient-to-br from-orange-50 to-orange-100", 
      border: "border-orange-200",
      trend: "Needs attention",
      trendIcon: AlertCircle
    },
    { 
      label: "At-Risk Students", 
      value: stats.atRiskStudents || academicRecords.filter(r => r.status === "risk").length || "0", 
      icon: AlertTriangle, 
      color: "text-red-600", 
      bg: "bg-gradient-to-br from-red-50 to-red-100", 
      border: "border-red-200",
      trend: "Low attendance",
      trendIcon: TrendingUp
    },
    { 
      label: "Total Students", 
      value: stats.totalStudents || students.length || "0", 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-gradient-to-br from-blue-50 to-blue-100", 
      border: "border-blue-200",
      trend: "Under your guidance",
      trendIcon: Target
    },
    { 
      label: "Forwarded to HOP", 
      value: stats.forwardedToHOP || studentRequests.filter(r => r.advisorStatus === "approved").length || "0", 
      icon: ShieldCheck, 
      color: "text-green-600", 
      bg: "bg-gradient-to-br from-green-50 to-green-100", 
      border: "border-green-200",
      trend: "This month",
      trendIcon: CheckCircle
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "forwarded_hop": 
        return "default";
      case "pending":
      case "pending_advisor": 
        return "secondary";
      case "rejected": 
        return "destructive";
      default: 
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRecordStatusColor = (status) => {
    switch (status) {
      case "excellent": return "bg-green-100 text-green-700 border-green-200";
      case "good": return "bg-blue-100 text-blue-700 border-blue-200";
      case "risk": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInitials = () => {
    const firstName = advisor?.firstName || "";
    const lastName = advisor?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {advisor?.firstName}!</h2>
          <p className="text-blue-100 font-medium">Manage your students and oversee their academic progress</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsDisplay.map((stat, idx) => (
          <Card key={idx} className={`border-2 ${stat.border} shadow-xl rounded-2xl overflow-hidden transform hover:scale-105 transition-all cursor-pointer`}>
            <div className={`${stat.bg} p-6`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color} mb-2`}>{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <stat.trendIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-bold text-gray-600">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg} shadow-lg`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.color} text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all`}
            >
              <action.icon className="w-8 h-8 mb-3" />
              <span className="font-bold text-lg">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Users className="w-6 h-6 text-blue-600" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {students.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {student.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-600">Roll: {student.rollNo}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 font-bold">
                    Sem {student.semester}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {studentRequests.filter(r => r.advisorStatus === "pending" || r.advisorStatus === "pending_advisor").slice(0, 5).map((req, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-800">{req.studentName}</p>
                    <Badge variant={getStatusColor(req.advisorStatus)} className="font-bold text-xs">
                      {req.advisorStatus || 'pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{req.queryType}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
              {studentRequests.filter(r => r.advisorStatus === "pending" || r.advisorStatus === "pending_advisor").length === 0 && (
                <p className="text-center text-gray-500 py-4">No pending reviews</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Notifications — student records sent by teachers */}
      {teacherNotifications.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Teacher Notifications
            {unreadNotifications > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadNotifications} new</span>
            )}
          </h3>
          <div className="space-y-3">
            {teacherNotifications.slice(0, 10).map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded-xl border-2 ${notif.isRead ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-300'} flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-all`}
                onClick={() => !notif.isRead && markNotificationRead(notif._id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{notif.studentName}</p>
                    <Badge className={`text-xs font-bold ${notif.dataType === 'marks' ? 'bg-green-100 text-green-700' : notif.dataType === 'attendance' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {notif.dataType}
                    </Badge>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                  </div>
                  <p className="text-sm text-gray-600">Roll No: <span className="font-semibold">{notif.rollNo}</span></p>
                  <p className="text-sm text-indigo-700 font-medium">Updated by: {notif.teacherName}</p>
                  {notif.message && <p className="text-xs text-gray-500 mt-1">{notif.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-400 text-indigo-700 hover:bg-indigo-100 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); setActiveView("records"); }}
                >
                  View Records
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Students Management View
  const StudentsView = () => {
    // Group students by section for display
    const sectionMap: Record<string, any[]> = {};
    (students as any[]).forEach(s => {
      const sec = s.section || 'Unassigned';
      if (!sectionMap[sec]) sectionMap[sec] = [];
      sectionMap[sec].push(s);
    });
    const sectionKeys = Object.keys(sectionMap).sort();

    return (
    <div className="space-y-6">

      {/* ── Section Overview + Bulk Assign ─────────────────────────── */}
      {advisorSections.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Section-wise Teacher Assignment</h3>
                  <p className="text-blue-100 text-sm">Assign a teacher to one or more sections at once — all students in those sections will be updated automatically</p>
                </div>
              </div>
              <Button
                onClick={() => { setSectionAssignTeacherId(""); setSectionAssignSections([]); setShowSectionAssign(true); }}
                className="bg-white text-indigo-700 hover:bg-blue-50 font-bold shadow-lg px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <UserCog className="w-4 h-4" />
                Assign Teacher by Section
              </Button>
            </div>

            {/* Section summary pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {advisorSections.map((sec: any) => (
                <div key={sec.section} className="bg-white/15 border border-white/25 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-lg">Section {sec.section}</span>
                    <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{sec.studentCount} students</span>
                  </div>
                  {sec.assignedTeachers.length > 0 ? (
                    <div className="space-y-0.5">
                      {sec.assignedTeachers.map((t: any) => (
                        <p key={t.id} className="text-xs text-blue-100 font-semibold truncate">👨‍🏫 {t.name}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-200 font-semibold">⚠ No teacher assigned</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Student List ─────────────────────────────────────────────── */}
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Users className="w-6 h-6 text-blue-600" />
              All Students ({students.length})
            </CardTitle>
            <div className="flex gap-2">
             
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register New Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-8">
              {sectionKeys.map(sec => (
                <div key={sec}>
                  {/* Section header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 border-2 border-indigo-300 rounded-xl px-4 py-1.5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="font-black text-indigo-700 text-sm">Section {sec}</span>
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{sectionMap[sec].length}</span>
                      </div>
                      {/* Show assigned teacher(s) for this section */}
                      {(() => {
                        const secInfo = advisorSections.find((s: any) => s.section === sec);
                        return secInfo?.assignedTeachers?.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {secInfo.assignedTeachers.map((t: any) => (
                              <span key={t.id} className="bg-green-100 text-green-700 border border-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
                                👨‍🏫 {t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span >
                          </span>
                        );
                      })()}
                    </div>
                    {/* Quick assign button per section */}
                    <button
                      onClick={() => {
                        setSectionAssignTeacherId("");
                        setSectionAssignSections([sec === 'Unassigned' ? '' : sec]);
                        setShowSectionAssign(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-300 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      Assign teacher to this section
                    </button>
                  </div>

                  {/* Students in section */}
                  <div className="space-y-3 pl-2 border-l-4 border-indigo-100">
                    {sectionMap[sec].map((student: any) => (
                      <div key={student._id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{student.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5 flex-wrap">
                                <span className="font-medium">Roll: {student.rollNo}</span>
                                <span>•</span>
                                <span>Sem {student.semester}</span>
                                {student.section && (
                                  <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded-full">
                                    Sec {student.section}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.assignedTeacher ? (
                              <Badge className="bg-green-100 text-green-700 font-bold border border-green-300">
                                👨‍🏫 {student.assignedTeacher}
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-700 font-bold border border-orange-300">
                                No Teacher
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedStudent(student); setShowAssignTeacher(true); }}
                              className="border-2 border-blue-400 text-blue-600 hover:bg-blue-50 text-xs"
                            >
                              <UserCog className="w-3.5 h-3.5 mr-1" />
                              {student.assignedTeacher ? 'Change' : 'Assign'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No students found</p>
              <Button onClick={() => setShowRegistrationForm(true)} className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                Register First Student
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    );
  };

  // Academic records sub-tab state
  const [recordsTab, setRecordsTab] = useState<"overview" | "attendance" | "marks">("overview");

  // Academic Records View
  const AcademicRecordsView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart3 className="w-6 h-6 text-purple-600" />
           Student Academic Records
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            View attendance and exam marks uploaded by teachers for your students.
          </p>
          {/* Sub-tab filter */}
          <div className="flex gap-2 mt-3">
            {[
              { key: "overview", label: "Overview", color: "bg-purple-700 text-white" },
              { key: "attendance", label: "📋 Attendance", color: "bg-blue-600 text-white" },
              { key: "marks", label: "📝 Exam Marks", color: "bg-green-600 text-white" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setRecordsTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  recordsTab === tab.key
                    ? tab.color + " shadow-lg"
                    : "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : academicRecords.length > 0 ? (
            <div className="space-y-4">
              {academicRecords.map((record, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-800">{record.studentName}</h4>
                        <Badge className="bg-blue-100 text-blue-700 font-bold">
                          {record.rollNo}
                        </Badge>
                        
                      </div>
                      
                    </div>
                  </div>

                  {/* Overview Tab: show both attendance & marks summary */}
                  {(recordsTab === "overview" || recordsTab === "attendance") && (
                    <div className={`${recordsTab === "overview" ? "grid grid-cols-2 gap-4" : ""}`}>
                      <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
                        <p className="text-sm font-bold text-gray-600 mb-1">📋 Attendance</p>
                        <p className={`text-3xl font-black ${
                          record.attendance >= 75 ? 'text-green-600' : record.attendance >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>{record.attendance}%</p>
                        {record.attendance < 75 && (
                          <p className="text-xs text-red-600 font-bold mt-1">⚠ Below 75% threshold</p>
                        )}
                      </div>
                      {recordsTab === "overview" && (
                        <div className="p-4 bg-white rounded-xl border-2 border-green-200">
                          <p className="text-sm font-bold text-gray-600 mb-1">📝 Latest Exam</p>
                          {record.latestExam ? (
                            <>
                              <p className="text-lg font-bold text-green-600">{record.latestExam.marks}</p>
                              <p className="text-xs text-gray-600">{record.latestExam.courseName} — {record.latestExam.examType}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No exams yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Marks Tab: show exam marks history */}
                  {recordsTab === "marks" && (
                    <div className="p-4 bg-white rounded-xl border-2 border-green-200">
                      <p className="text-sm font-bold text-gray-600 mb-2">📝 Exam Marks</p>
                      {record.latestExam ? (
                        <div>
                          <p className="text-lg font-bold text-green-600">{record.latestExam.marks}</p>
                          <p className="text-xs text-gray-600">{record.latestExam.courseName} — {record.latestExam.examType}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No exam records yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No academic records available</p>
              <p className="text-sm">Teachers will upload attendance and marks data here once students are assigned to them</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Appointment actions
  const handleConfirmAppointment = async (appointmentId: string) => {
    setProcessingId(appointmentId);
    try {
      await advisorAPI.confirmAppointment(appointmentId, { comments: 'Confirmed by advisor' });
      alert('Appointment confirmed successfully!');
      fetchQueries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const reason = prompt('Enter reason for cancellation (optional):') ?? '';
    setProcessingId(appointmentId);
    try {
      await advisorAPI.cancelAppointment(appointmentId, { comments: reason });
      alert('Appointment cancelled.');
      fetchQueries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setProcessingId(null);
    }
  };

  // Request filter state
  const [requestFilter, setRequestFilter] = useState<"all" | "leave" | "academic" | "other" | "appointment">("all");

  // Requests Review View
  const RequestsView = () => {
    const filtered = requestFilter === "all"
      ? studentRequests
      : studentRequests.filter(r => r.category === requestFilter);

    const leaveCount       = studentRequests.filter(r => r.category === "leave").length;
    const academicCount    = studentRequests.filter(r => r.category === "academic").length;
    const otherCount       = studentRequests.filter(r => r.category === "other").length;
    const appointmentCount = studentRequests.filter(r => r.category === "appointment").length;
    const pendingCount     = studentRequests.filter(r => r.advisorStatus === "pending" || r.advisorStatus === "pending_advisor").length;

    return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <ArrowRightLeft className="w-6 h-6 text-green-600" />
              Student Requests for Review ({studentRequests.length})
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white font-bold">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Leave, academic, other queries, and appointment requests. Exam marks &amp; attendance records are handled by teachers.
            </p>
            {/* Category Filter Tabs */}
            <div className="flex gap-2 mt-3">
              {[
                { key: "all",         label: `All (${studentRequests.length})`,      color: "bg-gray-800 text-white"   },
                { key: "appointment", label: `Appointments (${appointmentCount})`,   color: "bg-blue-600 text-white"   },
                { key: "leave",       label: `Leave (${leaveCount})`,                color: "bg-orange-600 text-white" },
                { key: "academic",    label: `Academic/Course (${academicCount})`,   color: "bg-purple-600 text-white" },
                { key: "other",       label: `Other (${otherCount})`,                color: "bg-teal-600 text-white"   }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setRequestFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    requestFilter === tab.key
                      ? tab.color + " shadow-lg"
                      : "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((req) => (
                <div key={req._id} className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-800">{req.studentName}</h4>
                        <Badge className="bg-blue-100 text-blue-700 font-bold">
                          {req.studentRollNo || req.batch}
                        </Badge>
                        <Badge variant={getStatusColor(req.advisorStatus)} className="font-bold">
                          {req.advisorStatus || 'pending'}
                        </Badge>
                        {/* Category Badge */}
                        <Badge className={`font-bold text-xs ${
                          req.category === 'leave'        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : req.category === 'appointment'? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : req.category === 'other'      ? 'bg-teal-100 text-teal-700 border border-teal-300'
                          : 'bg-purple-100 text-purple-700 border border-purple-300'
                        }`}>
                          {req.category === 'leave'        ? '🏖️ Leave'
                           : req.category === 'appointment' ? '📅 Appointment'
                           : req.category === 'other'       ? '🔧 Other'
                           : '📚 Academic/Course'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getPriorityColor(req.priority)}`}>
                          {req.priority} priority
                        </span>
                        <span className="text-sm text-gray-600 font-medium capitalize">{req.queryType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">{req.description}</p>
                    {/* Leave-specific details */}
                    {req.category === 'leave' && req.startDate && (
                      <div className="flex gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          From: {new Date(req.startDate).toLocaleDateString()}
                        </span>
                        {req.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            To: {new Date(req.endDate).toLocaleDateString()}
                          </span>
                        )}
                        {req.duration && (
                          <span className="font-bold text-orange-600">{req.duration} day(s)</span>
                        )}
                      </div>
                    )}
                    {/* Academic-specific details */}
                    {req.category === 'academic' && req.courseName && (
                      <p className="text-sm font-bold text-purple-700 mt-1">Course: {req.courseName}</p>
                    )}
                    {/* Other-specific details */}
                    {req.category === 'other' && (req as any).issueType && (
                      <p className="text-sm font-bold text-teal-700 mt-1">Issue: {(req as any).issueType}</p>
                    )}
                    {/* Appointment-specific details */}
                    {req.category === 'appointment' && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="flex flex-wrap gap-4">
                          <span className="flex items-center gap-1 text-blue-700 font-medium">
                            <Calendar className="w-4 h-4" />
                            Preferred: {(req as any).preferredDate ? new Date((req as any).preferredDate).toLocaleDateString() : '—'}
                            {(req as any).preferredTime && ` at ${(req as any).preferredTime}`}
                          </span>
                          {(req as any).confirmedDate && (
                            <span className="flex items-center gap-1 text-green-700 font-bold">
                              <CheckCircle className="w-4 h-4" />
                              Confirmed: {new Date((req as any).confirmedDate).toLocaleDateString()}
                              {(req as any).confirmedTime && ` at ${(req as any).confirmedTime}`}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-blue-600 font-medium capitalize">Type: {req.queryType}</p>
                      </div>
                    )}
                  </div>

                  

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {(req.advisorStatus === "pending" || req.advisorStatus === "pending_advisor") && (
                    <div className="flex gap-3 flex-wrap">
                      {req.category === 'appointment' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAppointment(req._id)}
                            disabled={processingId === req._id || loading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
                          >
                            {processingId === req._id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Confirm Appointment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelAppointment(req._id)}
                            disabled={processingId === req._id || loading}
                            className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleForwardToHOP(req._id)}
                            disabled={processingId === req._id || loading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg"
                          >
                            {processingId === req._id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 mr-2" />
                            )}
                            Forward to HOP
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectQuery(req._id)}
                            disabled={processingId === req._id || loading}
                            className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {req.advisorStatus === "approved" && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        {req.category === 'appointment' ? '✅ Appointment Confirmed' : '✅ Forwarded to HOP'}
                      </span>
                    </div>
                  )}

                  {req.advisorStatus === "rejected" && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                      <X className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-bold text-red-700">Rejected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No {requestFilter === "all" ? "" : requestFilter + " "}requests to review</p>
              <p className="text-sm mt-1">
                {requestFilter === "leave"
                  ? "Student leave applications (sick, casual, emergency, etc.) will appear here"
                  : requestFilter === "academic"
                  ? "Course add/drop/freeze requests will appear here"
                  : requestFilter === "appointment"
                  ? "Student appointment booking requests will appear here"
                  : requestFilter === "other"
                  ? "Timetable issues, attendance issues, and other queries will appear here"
                  : "All student queries and appointment requests will appear here. Exam marks & attendance records are handled by teachers."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} bg-white border-r-2 border-gray-200 transition-all duration-300 overflow-hidden shadow-2xl flex flex-col`}>
        {/* Logo Section */}
        <div className="p-6 border-b-2 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Smart Advisor</h3>
              <p className="text-xs text-blue-100 font-medium">Advisor Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "dashboard"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveView("students")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "students"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <Users className="w-5 h-5" />
            Students
          </button>

          <button
            onClick={() => setActiveView("records")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "records"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Academic Records
          </button>

          <button
            onClick={() => setActiveView("requests")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "requests"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            Review Requests
            {studentRequests.filter(q => q.advisorStatus === "pending" || q.advisorStatus === "pending_advisor").length > 0 && (
              <Badge className="ml-auto bg-red-500 text-white">
                {studentRequests.filter(q => q.advisorStatus === "pending" || q.advisorStatus === "pending_advisor").length}
              </Badge>
            )}
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t-2 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Term</p>
              <p className="text-xs text-gray-600">Fall 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Batch</p>
              <p className="text-xs text-gray-600">2022 SE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b-2 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Advisor Dashboard
                </h1>
                <p className="text-xs text-gray-500 font-medium">Batch management & approvals</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search student ID..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-3 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all shadow-sm">
                <Bell className="w-5 h-5 text-gray-600" />
                {studentRequests.filter(q => q.advisorStatus === "pending" || q.advisorStatus === "pending_advisor").length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {getInitials()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-gray-900">
                      {advisor?.firstName} {advisor?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Batch Advisor</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-sm font-bold text-gray-900">
                        {advisor?.firstName} {advisor?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">{advisor?.email}</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r from-blue-50 to-indigo-50 transition-all text-left font-semibold">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r from-blue-50 to-indigo-50 transition-all text-left font-semibold">
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>
                    <div className="border-t-2 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-all text-left text-red-600 font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "students" && <StudentsView />}
          {activeView === "records" && <AcademicRecordsView />}
          {activeView === "requests" && <RequestsView />}
        </div>
      </div>

      {/* Student Registration Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Register New Student</h3>
                  <p className="text-sm text-blue-100 font-medium">Add a new student to your batch</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Roll No *</label>
                  <input
                    type="text"
                    value={regRollNo}
                    onChange={(e) => setRegRollNo(e.target.value)}
                    placeholder="2022-CS-001"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Semester *</label>
                  <input
                    type="number"
                    value={regSemester}
                    onChange={(e) => setRegSemester(e.target.value)}
                    placeholder="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Section</label>
                  <input
                    type="text"
                    value={regSection}
                    onChange={(e) => setRegSection(e.target.value)}
                    placeholder="A"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 py-6 font-bold rounded-xl border-2 hover:bg-gray-100"
                  onClick={() => setShowRegistrationForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterStudent}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 font-bold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Register Student
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border-2 border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <UserCog className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Assign Teacher</h3>
                  <p className="text-sm text-green-100 font-medium">
                    Assign teacher to {selectedStudent?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignTeacher(false);
                  setSelectedStudent(null);
                  setSelectedTeacherId("");
                }}
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Teacher *</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium shadow-sm"
                >
                  <option value="">Choose a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} - {teacher.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 py-6 font-bold rounded-xl border-2 hover:bg-gray-100"
                  onClick={() => {
                    setShowAssignTeacher(false);
                    setSelectedStudent(null);
                    setSelectedTeacherId("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTeacher}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 py-6 font-bold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Assign Teacher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section-wise Teacher Assignment Modal ─────────────────── */}
      {showSectionAssign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <UserCog className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Assign Teacher by Section</h3>
                  <p className="text-sm text-indigo-100 font-medium">
                    All students in the selected section(s) will be assigned automatically
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowSectionAssign(false); setSectionAssignTeacherId(""); setSectionAssignSections([]); }}
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50">
              {/* Teacher select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Teacher *</label>
                <select
                  value={sectionAssignTeacherId}
                  onChange={e => setSectionAssignTeacherId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
                >
                  <option value="">Choose a teacher</option>
                  {(teachers as any[]).map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Section multi-select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Select Section(s) *
                  <span className="ml-2 text-indigo-500 font-normal text-xs">(tap to toggle)</span>
                </label>
                {advisorSections.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {advisorSections.map((sec: any) => {
                      const isSelected = sectionAssignSections.includes(sec.section);
                      const currentTeacher = sec.assignedTeachers?.[0]?.name;
                      return (
                        <button
                          key={sec.section}
                          type="button"
                          onClick={() => toggleSectionSelection(sec.section)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 shadow-md"
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-black text-base ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                              Section {sec.section}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                            }`}>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{sec.studentCount} students</p>
                          {currentTeacher ? (
                            <p className="text-xs text-green-600 font-semibold mt-0.5 truncate">Current: {currentTeacher}</p>
                          ) : (
                            <p className="text-xs text-orange-500 font-semibold mt-0.5">No teacher yet</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">No sections found.</p>
                    <p className="text-xs text-gray-400 mt-1">Register students with a section first.</p>
                  </div>
                )}
              </div>

              {/* Summary preview */}
              {sectionAssignTeacherId && sectionAssignSections.length > 0 && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-indigo-800 mb-1">📋 Assignment Preview</p>
                  <p className="text-sm text-indigo-700">
                    <span className="font-bold">{(teachers as any[]).find(t => t._id === sectionAssignTeacherId)?.name || "Selected teacher"}</span>
                    {" "}will be assigned to section(s){" "}
                    <span className="font-bold">{sectionAssignSections.join(", ")}</span>
                    {" "}(
                    {advisorSections
                      .filter((s: any) => sectionAssignSections.includes(s.section))
                      .reduce((acc: number, s: any) => acc + s.studentCount, 0)
                    } students total)
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 py-6 font-bold rounded-xl border-2 hover:bg-gray-100"
                  onClick={() => { setShowSectionAssign(false); setSectionAssignTeacherId(""); setSectionAssignSections([]); }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTeacherToSection}
                  disabled={loading || !sectionAssignTeacherId || sectionAssignSections.length === 0}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 py-6 font-bold rounded-xl shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Assign to {sectionAssignSections.length} Section{sectionAssignSections.length !== 1 ? "s" : ""}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}