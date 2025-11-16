import { useState } from "react";
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
  Award,
  Bot,
  CalendarCheck,
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
  Zap,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface QueryForm {
  id: string;
  title: string;
  category: 'academic' | 'leave' | 'exam' | 'other';
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("academic");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const queryForms: QueryForm[] = [
    { id: "add-drop", title: "Course Add/Drop", category: "academic" },
    { id: "freeze-course", title: "Course Freeze", category: "academic" },
    { id: "mid-retake", title: "Mid Retake", category: "exam" },
    { id: "final-retake", title: "Final Retake", category: "exam" },
    { id: "sick-leave", title: "Sick Leave", category: "leave" },
    { id: "marriage-leave", title: "Marriage Leave", category: "leave" },
    { id: "urgent-leave", title: "Urgent Leave", category: "leave" },
    { id: "timetable", title: "Timetable Issue", category: "other" },
  ];

  const stats = [
    { 
      label: "Pending Requests", 
      value: "3", 
      icon: Clock, 
      color: "text-orange-600", 
      bg: "bg-gradient-to-br from-orange-50 to-orange-100", 
      border: "border-orange-200",
      trend: "+2 this week",
      trendIcon: TrendingUp
    },
    { 
      label: "Approved", 
      value: "12", 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-gradient-to-br from-green-50 to-green-100", 
      border: "border-green-200",
      trend: "85% approval rate",
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

  const recentApplications = [
    { id: 1, type: "Sick Leave", status: "pending", date: "2024-11-05", description: "Medical leave for 2 days", time: "10:30 AM", priority: "high" },
    { id: 2, type: "Course Freeze", status: "approved", date: "2024-11-03", description: "Freeze Software Engineering", time: "2:15 PM", priority: "medium" },
    { id: 3, type: "Add/Drop Course", status: "pending", date: "2024-11-02", description: "Drop Database Systems", time: "11:45 AM", priority: "medium" },
    { id: 4, type: "Exam Retake", status: "approved", date: "2024-10-28", description: "Retake Data Structures exam", time: "9:00 AM", priority: "low" },
  ];

  const announcements = [
    { 
      id: 1, 
      title: "Mid-term exam schedule released", 
      time: "2 hours ago", 
      color: "bg-gradient-to-r from-blue-50 to-blue-100", 
      textColor: "text-blue-900", 
      timeColor: "text-blue-600",
      icon: Calendar,
      iconBg: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "New course registration open", 
      time: "1 day ago", 
      color: "bg-gradient-to-r from-green-50 to-green-100", 
      textColor: "text-green-900", 
      timeColor: "text-green-600",
      icon: BookOpen,
      iconBg: "bg-green-500"
    },
    { 
      id: 3, 
      title: "Sports week starting next Monday", 
      time: "2 days ago", 
      color: "bg-gradient-to-r from-purple-50 to-purple-100", 
      textColor: "text-purple-900", 
      timeColor: "text-purple-600",
      icon: Award,
      iconBg: "bg-purple-500"
    },
  ];

  const quickActions = [
    { title: "Submit New Query", icon: FileText, color: "from-blue-500 to-blue-600", action: () => setActiveView("queryForm") },
    { title: "Book Appointment", icon: CalendarCheck, color: "from-green-500 to-green-600", action: () => setShowAppointmentForm(true) },
    { title: "AI Assistant", icon: Bot, color: "from-purple-500 to-purple-600", action: () => setShowChatbot(true) },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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

  const handleFormSubmit = () => {
    alert("Query form submitted successfully!");
    setActiveView("dashboard");
  };

  const handleAppointmentSubmit = () => {
    alert("Appointment booked successfully!");
    setShowAppointmentForm(false);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    
    setTimeout(() => {
      const responses = [
        "To submit a leave application, click on 'Query Forms' in the sidebar and select the 'Leave' category.",
        "For course add/drop, go to Query Forms and select 'Academic' category. The deadline is usually 2 weeks after semester starts.",
        "Your attendance and CGPA information can be found in your student portal under Academic Records.",
        "You can book an appointment with your advisor using the 'Book Appointment' button in the sidebar.",
        "Course freeze applications require proper documentation. Make sure to attach supporting documents when submitting."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
    }, 1000);

    setChatInput("");
  };

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const QueryFormView = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: "academic", label: "Academic", icon: BookOpen, gradient: "from-blue-500 to-blue-600" },
          { id: "leave", label: "Leave", icon: Calendar, gradient: "from-green-500 to-green-600" },
          { id: "exam", label: "Exam", icon: FileText, gradient: "from-purple-500 to-purple-600" },
          { id: "other", label: "Other", icon: AlertCircle, gradient: "from-orange-500 to-orange-600" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
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

      {/* Form */}
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
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student ID
                </label>
                <input
                  type="text"
                  value={user?.studentId || "N/A"}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 font-medium shadow-inner"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student Name
                </label>
                <input
                  type="text"
                  value={`${user?.firstName || ""} ${user?.lastName || ""}`}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 font-medium shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Query Type *
              </label>
              <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                <option value="">Select query type</option>
                {filteredForms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory === "academic" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter course name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
            )}

            {selectedCategory === "leave" && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={5}
                placeholder="Provide detailed information about your query..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition-all cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-blue-100">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-2">PDF, DOC, or Image files (Max 5MB)</p>
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
              <Button onClick={handleFormSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 py-6 text-base font-semibold rounded-xl shadow-lg">
                Submit Query
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.firstName}! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Manage your academic requests and track your progress seamlessly
            </p>
            <div className="flex items-center mt-6 space-x-6">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">ID: {user?.studentId || "N/A"}</span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Batch: {user?.batch || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                {getVerificationBadge()}
              </div>
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

      {/* Recent Applications */}
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Recent Applications</span>
            </div>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              {recentApplications.length} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-6 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-bold text-gray-900 text-lg">{app.type}</p>
                    <Badge variant={getStatusColor(app.status) as any} className="text-xs font-semibold">
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                    <Badge className={`text-xs font-semibold border ${getPriorityColor(app.priority)}`}>
                      {app.priority.charAt(0).toUpperCase() + app.priority.slice(1)} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">{app.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {app.date}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {app.time}
                    </span>
                  </div>
                </div>
                <Button size="sm" className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
          <Button variant="link" className="w-full mt-4 text-blue-600 font-bold text-base hover:text-blue-700">
            View All Applications <ArrowRight className="w-4 h-4 ml-2 inline" />
          </Button>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
          <CardTitle className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Latest Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className={`${announcement.color} rounded-xl p-5 border-2 border-opacity-50 hover:shadow-lg transition-all group`}>
                <div className="flex items-start gap-4">
                  <div className={`${announcement.iconBg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <announcement.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${announcement.textColor} mb-2`}>
                      {announcement.title}
                    </p>
                    <p className={`text-xs font-semibold ${announcement.timeColor}`}>{announcement.time}</p>
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
            Query Forms
          </button>

          <button
            onClick={() => setShowAppointmentForm(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:shadow transition-all font-semibold"
          >
            <CalendarCheck className="w-5 h-5" />
            Book Appointment
          </button>

          <button
            onClick={() => setShowChatbot(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:shadow transition-all font-semibold"
          >
            <Bot className="w-5 h-5" />
            AI Assistance
          </button>
        </nav>
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
                <p className="text-xs text-gray-500 font-medium">Your academic command center</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
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

                {/* Dropdown Menu */}
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

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === "dashboard" ? <DashboardView /> : <QueryFormView />}
        </div>
      </div>

      {/* Appointment Modal */}
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
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium shadow-sm">
                  <option value="">Select type</option>
                  <option value="academic">Academic Counseling</option>
                  <option value="course">Course Guidance</option>
                  <option value="career">Career Advice</option>
                  <option value="personal">Personal Issue</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reason for Appointment *
                </label>
                <textarea
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
                >
                  Cancel
                </Button>
                <Button onClick={handleAppointmentSubmit} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 py-6 font-bold rounded-xl shadow-lg">
                  Book Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
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