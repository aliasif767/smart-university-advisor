import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Eye,
  Bot,
  CalendarCheck,
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
  FileCheck,
  Loader2,
  UserCheck,
  BarChart3,
  ClipboardList,
  ChevronRight,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { queryAPI, appointmentAPI, statsAPI, studentAcademicAPI } from "@/services/api";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("academic");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedQueryType, setSelectedQueryType] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [examType, setExamType] = useState("");
  const [currentMarks, setCurrentMarks] = useState("");
  const [issueType, setIssueType] = useState("");
  const [attendancePercentage, setAttendancePercentage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const fileInputRef = useRef(null);

  // Data States
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [marksSummary, setMarksSummary] = useState(null);
  const [hopAnnouncements, setHopAnnouncements] = useState([]);
  const [queryFilter, setQueryFilter] = useState("all");

  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch attendance data when view changes
  useEffect(() => {
    if (activeView === "attendance") {
      fetchAttendanceData();
    }
  }, [activeView]);

  // Fetch marks data when view changes
  useEffect(() => {
    if (activeView === "marks") {
      fetchMarksData();
    }
  }, [activeView]);

  // Re-fetch queries when switching to my-queries view
  useEffect(() => {
    if (activeView === "myQueries") {
      fetchDashboardData();
    }
  }, [activeView]);

  const fetchDashboardData = async () => {
    try {
      const [queriesRes, statsRes, announcementsRes] = await Promise.all([
        queryAPI.getMyQueries(),
        statsAPI.getDashboard(),
        studentAcademicAPI.getAnnouncements().catch(() => ({ data: { announcements: [] } }))
      ]);
      
      setQueries(queriesRes.data.queries || []);
      setStats(statsRes.data.stats || {});
      setHopAnnouncements(announcementsRes.data.announcements || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        studentAcademicAPI.getMyAttendance(),
        studentAcademicAPI.getAttendanceSummary()
      ]);
      
      setAttendanceRecords(recordsRes.data.attendance || []);
      setAttendanceSummary(summaryRes.data.summary || {});
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarksData = async () => {
    setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        studentAcademicAPI.getMyMarks(),
        studentAcademicAPI.getMarksSummary()
      ]);
      
      setMarksRecords(recordsRes.data.marks || []);
      setMarksSummary(summaryRes.data.summary || {});
    } catch (error) {
      console.error('Error fetching marks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const queryForms = [
    { id: "add-drop", title: "Course Add/Drop", category: "academic" },
    { id: "freeze-course", title: "Course Freeze", category: "academic" },
    { id: "mid-retake", title: "Mid Retake", category: "exam" },
    { id: "final-retake", title: "Final Retake", category: "exam" },
    { id: "update-marks", title: "Update marks", category: "exam" },
    { id: "sick-leave", title: "Sick Leave", category: "leave" },
    { id: "marriage-leave", title: "Marriage Leave", category: "leave" },
    { id: "urgent-leave", title: "Urgent Leave", category: "leave" },
    { id: "timetable", title: "Timetable Issue", category: "other" },
    { id: "attendance", title: "Attendance Issue", category: "other" },
  ];

  const statsDisplay = [
    { 
      label: "Pending Requests", 
      value: stats?.pendingQueries || "0", 
      icon: Clock, 
      color: "text-orange-600", 
      bg: "bg-gradient-to-br from-orange-50 to-orange-100", 
      border: "border-orange-200",
      trend: `${stats?.totalQueries || 0} total`,
      trendIcon: TrendingUp
    },
    { 
      label: "Approved", 
      value: stats?.approvedQueries || "0", 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-gradient-to-br from-green-50 to-green-100", 
      border: "border-green-200",
      trend: "This semester",
      trendIcon: Target
    },
    { 
      label: "Active Courses", 
      value: "6", 
      icon: BookOpen, 
      color: "text-blue-600", 
      bg: "bg-gradient-to-br from-blue-50 to-blue-100", 
      border: "border-blue-200",
      trend: "Spring 2024",
      trendIcon: GraduationCap
    },
  ];

  const recentApplications = queries.slice(0, 4).map(q => ({
    id: q._id,
    type: q.queryType,
    status: q.finalStatus,
    date: new Date(q.createdAt).toISOString().split('T')[0],
    description: q.description,
    time: new Date(q.createdAt).toLocaleTimeString(),
    priority: q.priority
  }));

  // announcements are fetched from HOP (hopAnnouncements state)
  const announcementTypeStyle = (type) => {
    if (type === 'exam')    return { color: "bg-gradient-to-r from-red-50 to-red-100",    textColor: "text-red-900",    timeColor: "text-red-600",    iconBg: "bg-red-500",    icon: FileText };
    if (type === 'urgent')  return { color: "bg-gradient-to-r from-orange-50 to-orange-100", textColor: "text-orange-900", timeColor: "text-orange-600", iconBg: "bg-orange-500", icon: AlertCircle };
    if (type === 'event')   return { color: "bg-gradient-to-r from-purple-50 to-purple-100", textColor: "text-purple-900", timeColor: "text-purple-600", iconBg: "bg-purple-500", icon: Calendar };
    return { color: "bg-gradient-to-r from-green-50 to-green-100", textColor: "text-green-900", timeColor: "text-green-600", iconBg: "bg-green-500", icon: Bell };
  };

  const quickActions = [
    { title: "Submit New Query", icon: FileText, color: "from-blue-500 to-blue-600", action: () => setActiveView("queryForm") },
    { title: "Book Appointment", icon: CalendarCheck, color: "from-green-500 to-green-600", action: () => setShowAppointmentForm(true) },
    { title: "AI Assistant", icon: Bot, color: "from-purple-500 to-purple-600", action: () => setShowChatbot(true) },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "default";
      case "resolved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "default";
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

  const getVerificationBadge = () => {
    if (user?.verificationStatus === "verified") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
  };

  const filteredForms = queryForms.filter(form => form.category === selectedCategory);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const resetForm = () => {
    setSelectedQueryType("");
    setCourseName("");
    setCourseCode("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setLeaveType("");
    setExamType("");
    setCurrentMarks("");
    setIssueType("");
    setAttendancePercentage("");
    setSelectedFile(null);
  };

  const handleFormSubmit = async () => {
    if (!selectedQueryType || !description) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Common fields
      formData.append('queryType', selectedQueryType);
      formData.append('description', description);
      formData.append('priority', 'medium');
      
      // Add file if exists
      if (selectedFile) {
        formData.append('documents', selectedFile);
      }

      let response;
      
      if (selectedCategory === 'academic') {
        if (!courseName) {
          alert("Please enter course name");
          setLoading(false);
          return;
        }
        formData.append('courseName', courseName);
        formData.append('courseCode', courseCode);
        formData.append('semester', 'Fall 2024');
        response = await queryAPI.submitAcademic(formData);
        
      } else if (selectedCategory === 'exam') {
        if (!courseName) {
          alert("Please enter course name");
          setLoading(false);
          return;
        }
        formData.append('courseName', courseName);
        formData.append('courseCode', courseCode);
        formData.append('examType', examType || 'mid');
        if (currentMarks) formData.append('currentMarks', currentMarks);
        response = await queryAPI.submitExam(formData);
        
      } else if (selectedCategory === 'leave') {
        if (!startDate || !endDate) {
          alert("Please select start and end dates");
          setLoading(false);
          return;
        }
        formData.append('leaveType', leaveType || 'sick');
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        response = await queryAPI.submitLeave(formData);
        
      } else if (selectedCategory === 'other') {
        formData.append('issueType', issueType || selectedQueryType);
        if (attendancePercentage) formData.append('attendancePercentage', attendancePercentage);
        response = await queryAPI.submitOther(formData);
      }

      alert("Query submitted successfully!");
      resetForm();
      setActiveView('dashboard');
      fetchDashboardData(); // Refresh data
      
    } catch (error) {
      console.error('Error submitting query:', error);
      alert(error.response?.data?.message || "Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentSubmit = async () => {
    const appointmentType = document.getElementById('appointment-type')?.value;
    const preferredDate = document.getElementById('appointment-date')?.value;
    const preferredTime = document.getElementById('appointment-time')?.value;
    const reason = document.getElementById('appointment-reason')?.value;

    if (!appointmentType || !preferredDate || !preferredTime || !reason) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await appointmentAPI.book({
        appointmentType,
        preferredDate,
        preferredTime,
        reason
      });
      
      alert("Appointment booked successfully!");
      setShowAppointmentForm(false);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Add an empty assistant message that we will "fill" with the stream
    setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: chatInput }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        accumulatedResponse += chunk;

        // Update the LAST message in the array with the new text
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            role: "assistant", 
            content: accumulatedResponse 
          };
          return updated;
        });
        setIsTyping(false); // Hide loader once text starts appearing
      }
    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
          <p className="text-blue-100 font-medium">Here's what's happening with your academic journey today</p>
          <div className="mt-6 flex items-center gap-2">
            {getVerificationBadge()}
            <Badge className="bg-blue-500 text-white border-blue-300">
              Student ID: {user?.studentId || "N/A"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileCheck className="w-6 h-6 text-blue-600" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="font-bold text-gray-800">{app.type}</span>
                        <Badge variant={getStatusColor(app.status)} className="font-bold">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 ml-8 font-medium">{app.description}</p>
                      <div className="flex items-center gap-4 mt-2 ml-8">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.date}
                        </span>
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {app.time}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No applications yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Bell className="w-6 h-6 text-green-600" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {hopAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No announcements yet</p>
                </div>
              ) : (
                hopAnnouncements.map((ann) => {
                  const style = announcementTypeStyle(ann.type);
                  const IconComp = style.icon;
                  return (
                    <div key={ann._id} className={`${style.color} p-4 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all`}>
                      <div className="flex items-start gap-3">
                        <div className={`${style.iconBg} p-2 rounded-lg flex-shrink-0`}>
                          <IconComp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold ${style.textColor} mb-1`}>{ann.title}</h4>
                          <p className={`text-sm ${style.textColor} opacity-80 mb-1`}>{ann.content}</p>
                          <p className={`text-xs ${style.timeColor} font-medium`}>
                            {ann.postedByName ? `By ${ann.postedByName} · ` : ""}
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {ann.type === 'urgent' && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold flex-shrink-0">URGENT</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Attendance View
  const AttendanceView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl">My Attendance Records</h3>
              <p className="text-sm text-blue-100 font-medium">View your attendance across all courses</p>
            </div>
          </div>
        </div>

        

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map((record, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-800">{record.courseName}</span>
                        <Badge className={`font-bold ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 ml-8">
                        <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No attendance records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Marks View
  const MarksView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl">My Exam Marks</h3>
              <p className="text-sm text-green-100 font-medium">View your performance across all assessments</p>
            </div>
          </div>
        </div>

        

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : marksRecords.length > 0 ? (
            <div className="space-y-4">
              {marksRecords.map((record, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-gray-800">{record.courseName}</span>
                        <Badge className="bg-purple-100 text-purple-700 font-bold">
                          {record.examType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 ml-8">
                        <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.examDate).toLocaleDateString()}
                        </span>
                        
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-600">Score</p>
                      <p className="text-3xl font-black text-green-600">{record.obtainedMarks}/{record.totalMarks}</p>
                      <p className="text-sm font-bold text-gray-600">({record.percentage}%)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No exam marks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Query Form View - keeping original implementation
  const QueryFormView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {[
          { id: "academic", label: "Academic", icon: BookOpen, gradient: "from-blue-500 to-blue-600" },
          { id: "leave", label: "Leave", icon: Calendar, gradient: "from-green-500 to-green-600" },
          { id: "exam", label: "Exam", icon: FileText, gradient: "from-purple-500 to-purple-600" },
          { id: "other", label: "Other", icon: AlertCircle, gradient: "from-orange-500 to-orange-600" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSelectedQueryType("");
            }}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              selectedCategory === cat.id
                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-xl`
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg"
            }`}
          >
            <cat.icon className="w-5 h-5" />
            {cat.label}
          </button>
        ))}
      </div>

      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Submit Your Query
          </h3>
          <p className="text-blue-100 text-sm mt-1">Fill out the form below with accurate information</p>
        </div>
        <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Student ID</label>
                <input
                  type="text"
                  value={user?.studentId|| "N/A"}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 font-medium shadow-inner"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Student Name</label>
                <input
                  type="text"
                  value={`${user?.firstName || ""} ${user?.lastName || ""}`}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 font-medium shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Query Type *</label>
              <select
                value={selectedQueryType}
                onChange={(e) => setSelectedQueryType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"
              >
                <option value="">Select query type</option>
                {filteredForms.map((form) => (
                  <option key={form.id} value={form.title}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCategory === 'academic' || selectedCategory === 'exam') && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Course Name *</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Data Structures"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g., CS-201"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            {selectedCategory === 'exam' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"
                  >
                    <option value="">Select type</option>
                    <option value="mid">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Current Marks</label>
                  <input
                    type="number"
                    value={currentMarks}
                    onChange={(e) => setCurrentMarks(e.target.value)}
                    placeholder="e.g., 45/50"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            {selectedCategory === 'leave' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Leave Type *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"
                  >
                    <option value="">Select type</option>
                    <option value="sick">Sick Leave</option>
                    <option value="marriage">Marriage Leave</option>
                    <option value="urgent">Urgent Leave</option>
                  </select>
                </div>
              </div>
            )}

            {selectedCategory === 'leave' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide detailed information about your request..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Attachment (Optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleFileClick}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-all bg-gray-50 flex items-center justify-center gap-2 font-semibold text-gray-700"
              >
                <Upload className="w-5 h-5" />
                {selectedFile ? selectedFile.name : "Click to upload document"}
              </button>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1 py-6 font-bold rounded-xl border-2 hover:bg-gray-100"
                onClick={() => {
                  resetForm();
                  setActiveView('dashboard');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 font-bold rounded-xl shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Query"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ── My Queries View ─────────────────────────────────────────────────
  const MyQueriesView = () => {
    const categoryColors = {
      academic:    { bg: "bg-purple-50",  border: "border-purple-200",  badge: "bg-purple-100 text-purple-700",  icon: "📚" },
      exam:        { bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-700",      icon: "✏️" },
      leave:       { bg: "bg-orange-50",  border: "border-orange-200",  badge: "bg-orange-100 text-orange-700",  icon: "🏖️" },
      other:       { bg: "bg-teal-50",    border: "border-teal-200",    badge: "bg-teal-100 text-teal-700",      icon: "🔧" },
    };

    const statusStep = (status) => {
      if (status === "approved") return { dot: "bg-green-500",  text: "text-green-700",  label: "Approved" };
      if (status === "rejected") return { dot: "bg-red-500",    text: "text-red-700",    label: "Rejected" };
      return                             { dot: "bg-yellow-400", text: "text-yellow-700", label: "Pending"  };
    };

    const filtered = queryFilter === "all"
      ? queries
      : queryFilter === "approved"
      ? queries.filter(q => q.finalStatus === "approved")
      : queryFilter === "pending"
      ? queries.filter(q => q.finalStatus === "pending")
      : queryFilter === "rejected"
      ? queries.filter(q => q.finalStatus === "rejected")
      : queries.filter(q => q.category === queryFilter);

    const counts = {
      all:      queries.length,
      pending:  queries.filter(q => q.finalStatus === "pending").length,
      approved: queries.filter(q => q.finalStatus === "approved").length,
      rejected: queries.filter(q => q.finalStatus === "rejected").length,
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">My Queries</h2>
              <p className="text-indigo-100">Track all your submitted requests and their approval status</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-black">{counts.pending}</p>
                <p className="text-xs text-indigo-100">Pending</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-black">{counts.approved}</p>
                <p className="text-xs text-indigo-100">Approved</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-black">{counts.rejected}</p>
                <p className="text-xs text-indigo-100">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all",      label: `All (${counts.all})`,           color: "bg-gray-800 text-white"     },
            { key: "pending",  label: `Pending (${counts.pending})`,   color: "bg-yellow-500 text-white"   },
            { key: "approved", label: `Approved (${counts.approved})`, color: "bg-green-600 text-white"    },
            { key: "rejected", label: `Rejected (${counts.rejected})`, color: "bg-red-600 text-white"      },
            
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setQueryFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                queryFilter === tab.key
                  ? tab.color + " shadow-lg scale-105"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Query Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-gray-200 shadow">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-bold text-gray-600">No queries found</p>
            <p className="text-sm mt-1">Submit a query from the sidebar to get started</p>
            <button
              onClick={() => setActiveView("queryForm")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Submit New Query
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => {
              const cat = categoryColors[q.category] || categoryColors.other;
              const advisor  = q.advisorApproval  || {};
              const hod      = q.hodApproval      || {};
              const teacher  = q.teacherApproval  || {};

              const advisorStep  = statusStep(advisor.status  || "pending");
              const hodStep      = statusStep(hod.status      || "pending");
              const teacherStep  = statusStep(teacher.status  || "pending");
              const finalStep    = statusStep(q.finalStatus   || "pending");

              return (
                <div key={q._id} className={`${cat.bg} ${cat.border} border-2 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden`}>
                  {/* Card Header */}
                  <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl mt-1">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-black text-gray-800 text-lg capitalize">{q.queryType || q.leaveType || q.category}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.badge}`}>
                            {q.category}
                          </span>
                          {q.priority && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(q.priority)}`}>
                              {q.priority} priority
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{q.description}</p>
                        {/* Extra fields */}
                        {q.courseName && (
                          <p className="text-sm font-semibold text-purple-700 mt-1">📖 Course: {q.courseName}</p>
                        )}
                        {q.leaveType && (
                          <p className="text-sm font-semibold text-orange-700 mt-1">🏖️ Leave type: {q.leaveType}</p>
                        )}
                        {q.startDate && q.endDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {new Date(q.startDate).toLocaleDateString()} → {new Date(q.endDate).toLocaleDateString()}
                            {q.duration && <span className="font-bold text-orange-600 ml-2">({q.duration} day{q.duration > 1 ? "s" : ""})</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Final Status Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm flex-shrink-0 ml-4 ${
                      q.finalStatus === "approved" ? "bg-green-100 text-green-700 border-2 border-green-300"
                      : q.finalStatus === "rejected" ? "bg-red-100 text-red-700 border-2 border-red-300"
                      : "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                    }`}>
                      {q.finalStatus === "approved" ? <CheckCircle className="w-4 h-4" />
                        : q.finalStatus === "rejected" ? <XCircle className="w-4 h-4" />
                        : <RefreshCw className="w-4 h-4" />}
                      {q.finalStatus?.toUpperCase() || "PENDING"}
                    </div>
                  </div>

                  {/* Approval Pipeline */}
                  <div className="mx-5 mb-4 p-4 bg-white/70 rounded-xl border border-gray-200">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Approval Pipeline</p>
                    <div className="flex items-center gap-1">

                      {/* Step 1: Advisor */}
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
                          advisor.status === "approved" ? "bg-green-50 border-green-300"
                          : advisor.status === "rejected" ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${advisorStep.dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-700">Advisor</p>
                            <p className={`text-xs font-bold ${advisorStep.text}`}>{advisorStep.label}</p>
                            {advisor.approvedBy && (
                              <p className="text-xs text-gray-500 truncate">{advisor.approvedBy}</p>
                            )}
                           
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

                      {/* Step 2: HOP */}
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
                          hod.status === "approved" ? "bg-green-50 border-green-300"
                          : hod.status === "rejected" ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${hodStep.dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-700">HOP</p>
                            <p className={`text-xs font-bold ${hodStep.text}`}>{hodStep.label}</p>
                            {hod.approvedBy && (
                              <p className="text-xs text-gray-500 truncate">{hod.approvedBy}</p>
                            )}
                            
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

                      
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 pb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Submitted: {new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {q.finalStatus === "pending" && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this query?")) return;
                          try {
                            await queryAPI.deleteQuery(q._id);
                            await fetchDashboardData();
                          } catch {}
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              <p className="text-xs text-blue-100 font-medium">Student Portal</p>
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
            onClick={() => setActiveView("queryForm")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "queryForm"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <FileText className="w-5 h-5" />
            Submit Query
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
            My Attendance
          </button>

          <button
            onClick={() => setActiveView("marks")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "marks"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            My Marks
          </button>

          <button
            onClick={() => setActiveView("myQueries")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${
              activeView === "myQueries"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-gray-700 hover:bg-gray-100 hover:shadow"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            My Queries
            {queries.filter(q => q.finalStatus === "pending").length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {queries.filter(q => q.finalStatus === "pending").length}
              </span>
            )}
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t-2 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Current Semester</p>
              <p className="text-xs text-gray-600">Fall 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Batch</p>
              <p className="text-xs text-gray-600">2022</p>
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
                  Student Dashboard
                </h1>
                <p className="text-xs text-gray-500 font-medium">Your academic journey starts here</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search queries..."
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
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-sm font-bold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
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

        <div className="flex-1 overflow-auto p-6">
          {activeView === "dashboard" && DashboardView()}
          {activeView === "queryForm" && QueryFormView()}
          {activeView === "attendance" && AttendanceView()}
          {activeView === "marks" && MarksView()}
          {activeView === "myQueries" && MyQueriesView()}
        </div>
      </div>

      {/* Appointment Form Modal - keeping original */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <CalendarCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Book Appointment</h3>
                  <p className="text-sm text-green-100 font-medium">Schedule a meeting with your advisor</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentForm(false)}
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Appointment Type *</label>
                <select id="appointment-type" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium shadow-sm">
                  <option value="">Select type</option>
                  <option value="academic">Academic Counseling</option>
                  <option value="course">Course Guidance</option>
                  <option value="career">Career Advice</option>
                  <option value="personal">Personal Issue</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date *</label>
                  <input
                    id="appointment-date"
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Time *</label>
                  <input
                    id="appointment-time"
                    type="time"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Appointment *</label>
                <textarea
                  id="appointment-reason"
                  rows={4}
                  placeholder="Briefly describe what you'd like to discuss..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none shadow-sm"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 py-6 font-bold rounded-xl border-2 hover:bg-gray-100"
                  onClick={() => setShowAppointmentForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAppointmentSubmit} 
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 py-6 font-bold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Book Appointment"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal - keeping original */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">AI Assistant</h3>
                  <p className="text-sm text-blue-100 font-medium">Ask me anything about applications, courses, or policies</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-white text-gray-800 border-2 border-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 p-5 bg-white rounded-b-3xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Type your question here..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
                />
                <Button onClick={handleChatSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 rounded-xl shadow-lg">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-medium">
                💡 Try asking: "How do I submit a leave application?" or "What's the deadline for course add/drop?"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}