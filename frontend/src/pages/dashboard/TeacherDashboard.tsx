import { useState, useRef } from "react";
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
  Bot,
  Filter,
  X,
  Upload,
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
  UserCheck,
  ClipboardList,
  Users,
  BarChart3,
  PenTool
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// --- CHANGE 1: Import the real Auth Context instead of mocking it ---
import { useAuth } from "@/contexts/AuthContext"; 

export default function TeacherDashboard() {
  // --- CHANGE 2: Use the real hook. We alias 'user' to 'teacher' to keep your JSX working ---
  const { user: teacher, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceCourse, setAttendanceCourse] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, studentId: "S-001", studentName: "Ali Hassan", status: "present" },
    { id: 2, studentId: "S-002", studentName: "Fatima Khan", status: "present" },
    { id: 3, studentId: "S-003", studentName: "Ahmed Raza", status: "absent" },
    { id: 4, studentId: "S-004", studentName: "Ayesha Malik", status: "present" },
  ]);

  // Exam Marks State
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState("");
  const [examCourse, setExamCourse] = useState("");
  const [marksRecords, setMarksRecords] = useState([
    { id: 1, studentId: "S-001", studentName: "Ali Hassan", marks: "" },
    { id: 2, studentId: "S-002", studentName: "Fatima Khan", marks: "" },
    { id: 3, studentId: "S-003", studentName: "Ahmed Raza", marks: "" },
    { id: 4, studentId: "S-004", studentName: "Ayesha Malik", marks: "" },
  ]);

  const stats = [
    { 
      label: "Pending Queries", 
      value: "8", 
      icon: Clock, 
      color: "text-orange-600", 
      bg: "bg-gradient-to-br from-orange-50 to-orange-100", 
      border: "border-orange-200",
      trend: "+3 today",
      trendIcon: TrendingUp
    },
    { 
      label: "Classes Today", 
      value: "4", 
      icon: BookOpen, 
      color: "text-blue-600", 
      bg: "bg-gradient-to-br from-blue-50 to-blue-100", 
      border: "border-blue-200",
      trend: "2 completed",
      trendIcon: CheckCircle
    },
    { 
      label: "Total Students", 
      value: "156", 
      icon: Users, 
      color: "text-green-600", 
      bg: "bg-gradient-to-br from-green-50 to-green-100", 
      border: "border-green-200",
      trend: "Across 5 courses",
      trendIcon: Target
    },
    { 
      label: "Avg Attendance", 
      value: "87%", 
      icon: BarChart3, 
      color: "text-purple-600", 
      bg: "bg-gradient-to-br from-purple-50 to-purple-100", 
      border: "border-purple-200",
      trend: "+5% this month",
      trendIcon: TrendingUp
    },
  ];

  const studentQueries = [
    { 
      id: 1, 
      studentName: "Ali Hassan", 
      studentId: "S-001",
      type: "Attendance Issue", 
      course: "Data Structures",
      status: "pending", 
      date: "2024-11-16",
      description: "Attendance not marked on Nov 10th",
      priority: "high",
      time: "10:30 AM"
    },
    { 
      id: 2, 
      studentName: "Fatima Khan", 
      studentId: "S-002",
      type: "Update marks", 
      course: "Algorithms",
      status: "pending", 
      date: "2024-11-15",
      description: "Request to review midterm marks",
      priority: "medium",
      time: "2:15 PM"
    },
    { 
      id: 3, 
      studentName: "Ahmed Raza", 
      studentId: "S-003",
      type: "Attendance Issue", 
      course: "Database Systems",
      status: "resolved", 
      date: "2024-11-14",
      description: "Late attendance entry request",
      priority: "low",
      time: "11:45 AM"
    },
  ];

  const courses = [
    "Data Structures",
    "Algorithms",
    "Database Systems",
    "Software Engineering",
    "Operating Systems"
  ];

  const examTypes = [
    "Quiz 1",
    "Quiz 2",
    "Quiz 3",
    "Midterm",
    "Final",
    "Assignment 1",
    "Assignment 2",
    "Project"
  ];

  const quickActions = [
    { title: "Mark Attendance", icon: UserCheck, color: "from-blue-500 to-blue-600", action: () => setActiveView("attendance") },
    { title: "Enter Exam Marks", icon: PenTool, color: "from-green-500 to-green-600", action: () => setActiveView("marks") },
    { title: "View Queries", icon: MessageSquare, color: "from-purple-500 to-purple-600", action: () => setActiveView("queries") },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleAttendanceToggle = (id: number) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === id 
          ? { ...record, status: record.status === "present" ? "absent" : "present" }
          : record
      )
    );
  };

  const handleMarksChange = (id: number, value: string) => {
    setMarksRecords(prev =>
      prev.map(record =>
        record.id === id ? { ...record, marks: value } : record
      )
    );
  };

  const handleAttendanceSubmit = () => {
    if (!attendanceDate || !attendanceCourse) {
      alert("Please select date and course!");
      return;
    }
    console.log("Attendance Data:", {
      date: attendanceDate,
      course: attendanceCourse,
      records: attendanceRecords
    });
    alert("Attendance submitted successfully!");
    setAttendanceDate("");
    setAttendanceCourse("");
    setActiveView("dashboard");
  };

  const handleMarksSubmit = () => {
    if (!examDate || !examType || !examCourse) {
      alert("Please fill all required fields!");
      return;
    }
    console.log("Marks Data:", {
      date: examDate,
      type: examType,
      course: examCourse,
      records: marksRecords
    });
    alert("Exam marks submitted successfully!");
    setExamDate("");
    setExamType("");
    setExamCourse("");
    setMarksRecords(prev => prev.map(r => ({ ...r, marks: "" })));
    setActiveView("dashboard");
  };

  const handleForwardToAdvisor = (queryId: number) => {
    alert(`Query #${queryId} forwarded to Academic Advisor successfully!`);
  };

  const getInitials = () => {
    const firstName = teacher?.firstName || "";
    const lastName = teacher?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {teacher?.firstName}! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Manage attendance, grades, and student queries efficiently
            </p>
            <div className="flex items-center mt-6 space-x-6">
              
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-14 h-14 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Card 
            key={index}
            onClick={action.action}
            className="border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 rounded-2xl overflow-hidden group"
          >
            <div className={`h-2 bg-gradient-to-r ${action.color}`}></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Quick Action</p>
                  <p className="text-xl font-bold text-gray-900">{action.title}</p>
                </div>
                <div className={`bg-gradient-to-br ${action.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`border-2 ${stat.border} shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className={`${stat.bg} rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <stat.trendIcon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
              <p className={`text-xs font-semibold ${stat.color}`}>{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Queries */}
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Student Queries</span>
            </div>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
              {studentQueries.filter(q => q.status === "pending").length} Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="space-y-4">
            {studentQueries.map((query) => (
              <div
                key={query.id}
                className="flex items-center justify-between p-6 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-bold text-gray-900 text-lg">{query.type}</p>
                    <Badge variant={getStatusColor(query.status) as any} className="text-xs font-semibold">
                      {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                    </Badge>
                    <Badge className={`text-xs font-semibold border ${getPriorityColor(query.priority)}`}>
                      {query.priority.charAt(0).toUpperCase() + query.priority.slice(1)} Priority
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Student: {query.studentName} ({query.studentId}) • Course: {query.course}
                  </p>
                  <p className="text-sm text-gray-600 mb-3 font-medium">{query.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {query.date}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {query.time}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {(query.type === "Attendance Issue" || query.type === "Update marks") && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleForwardToAdvisor(query.id)}
                      className="border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Forward to Advisor
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AttendanceView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Mark Student Attendance
          </h3>
          <p className="text-blue-100 text-sm mt-1">Select date, course and mark attendance</p>
        </div>
        <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course Name *
                </label>
                <select 
                  value={attendanceCourse}
                  onChange={(e) => setAttendanceCourse(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student List
              </h4>
              <div className="space-y-3">
                {attendanceRecords.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {student.studentName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{student.studentName}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAttendanceToggle(student.id)}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${
                          student.status === "present"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {student.status === "present" ? "Present" : "Absent"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1 py-6 text-base font-semibold rounded-xl border-2 hover:bg-gray-100"
                onClick={() => setActiveView("dashboard")}
              >
                Cancel
              </Button>
              <Button onClick={handleAttendanceSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 py-6 text-base font-semibold rounded-xl shadow-lg">
                Submit Attendance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MarksView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PenTool className="w-6 h-6" />
            Enter Exam Marks
          </h3>
          <p className="text-green-100 text-sm mt-1">Fill exam details and enter marks for each student</p>
        </div>
        <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Exam Date *
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Exam Type *
                </label>
                <select 
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                >
                  <option value="">Select exam type</option>
                  {examTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course Name *
                </label>
                <select 
                  value={examCourse}
                  onChange={(e) => setExamCourse(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Enter Student Marks
              </h4>
              <div className="space-y-3">
                {marksRecords.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {student.studentName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{student.studentName}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-gray-700">Marks:</label>
                      <input
                        type="number"
                        value={student.marks}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-center"
                      />
                      <span className="text-sm font-bold text-gray-600">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1 py-6 text-base font-semibold rounded-xl border-2 hover:bg-gray-100"
                onClick={() => setActiveView("dashboard")}
              >
                Cancel
              </Button>
              <Button onClick={handleMarksSubmit} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 py-6 text-base font-semibold rounded-xl shadow-lg">
                Submit Marks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const QueriesView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">All Student Queries</span>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-orange-100 text-orange-700">
                {studentQueries.filter(q => q.status === "pending").length} Pending
              </Badge>
              <Badge className="bg-green-100 text-green-700">
                {studentQueries.filter(q => q.status === "resolved").length} Resolved
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="space-y-4">
            {studentQueries.map((query) => (
              <div
                key={query.id}
                className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-gray-900 text-lg">{query.type}</p>
                      <Badge variant={getStatusColor(query.status) as any} className="text-xs font-semibold">
                        {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                      </Badge>
                      <Badge className={`text-xs font-semibold border ${getPriorityColor(query.priority)}`}>
                        {query.priority.charAt(0).toUpperCase() + query.priority.slice(1)} Priority
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Student: {query.studentName} ({query.studentId})
                    </p>
                    <p className="text-sm font-bold text-blue-600 mb-3">Course: {query.course}</p>
                    <p className="text-sm text-gray-600 mb-3 font-medium">{query.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {query.date}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {query.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg whitespace-nowrap">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {(query.type === "Attendance Issue" || query.type === "Update marks") && query.status === "pending" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleForwardToAdvisor(query.id)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg whitespace-nowrap"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Forward to Advisor
                      </Button>
                    )}
                    {query.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
              <p className="text-xs text-blue-100 font-medium">Teacher Portal</p>
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
            onClick={() => setActiveView("attendance")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "attendance"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Mark Attendance
          </button>

          <button
            onClick={() => setActiveView("marks")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "marks"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <PenTool className="w-5 h-5" />
            Enter Exam Marks
          </button>

          <button
            onClick={() => setActiveView("queries")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "queries"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Student Queries
            {studentQueries.filter(q => q.status === "pending").length > 0 && (
              <Badge className="ml-auto bg-red-500 text-white">
                {studentQueries.filter(q => q.status === "pending").length}
              </Badge>
            )}
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t-2 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Today's Date</p>
              <p className="text-xs text-gray-600">Nov 18, 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Active Classes</p>
              <p className="text-xs text-gray-600">4 Today</p>
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
                  Teacher Dashboard
                </h1>
                <p className="text-xs text-gray-500 font-medium">Manage academics efficiently</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-3 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all shadow-sm">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
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
                      {teacher?.firstName} {teacher?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{teacher?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-sm font-bold text-gray-900">
                        {teacher?.firstName} {teacher?.lastName}
                      </p>
                     
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
          {activeView === "attendance" && <AttendanceView />}
          {activeView === "marks" && <MarksView />}
          {activeView === "queries" && <QueriesView />}
        </div>
      </div>
    </div>
  );
}