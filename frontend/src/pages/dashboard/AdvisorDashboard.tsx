import { useState } from "react";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Bell,
  TrendingUp,
  BookOpen,
  Send,
  Eye,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const stats = [
    {
      title: "My Batch Students",
      value: "45",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Requests",
      value: "12",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Approved Today",
      value: "8",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Urgent Matters",
      value: "3",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const recentRequests = [
    {
      id: 1,
      student: "Mahnoor Sajjad (22-SE-015)",
      type: "Leave Application",
      date: "2024-11-05",
      status: "pending",
      priority: "high",
    },
    {
      id: 2,
      student: "Mahvish Barkat (22-SE-101)",
      type: "Course Freeze",
      date: "2024-11-04",
      status: "pending",
      priority: "medium",
    },
    {
      id: 3,
      student: "Maryum Tariq (22-SE-103)",
      type: "Add/Drop Course",
      date: "2024-11-03",
      status: "approved",
      priority: "low",
    },
    {
      id: 4,
      student: "Ahmed Khan",
      type: "Complaint",
      date: "2024-11-02",
      status: "pending",
      priority: "high",
    },
  ];

  const upcomingMeetings = [
    { student: "Mahnoor Sajjad", time: "10:00 AM", topic: "Academic Performance", date: "Today" },
    { student: "Ahmed Khan", time: "2:00 PM", topic: "Course Selection", date: "Today" },
    { student: "Sara Fatima", time: "11:00 AM", topic: "Career Guidance", date: "Tomorrow" },
  ];

  const batchPerformance = {
    avgCGPA: 3.2,
    attendance: 92,
    activeStudents: 45,
    onTrack: 42,
    needsAttention: 3,
  };

  if (loading) {
    return (
      <DashboardLayout title="Advisor Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Batch Advisor Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {user?.firstName}! 👋
              </h2>
              <p className="text-purple-100 mt-1">
                Batch Advisor - SE {user?.batch || "2022"}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-6">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">45 Students under supervision</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Student Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{request.student}</p>
                        <Badge variant={request.priority === "high" ? "destructive" : "default"}>
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{request.type}</p>
                      <p className="text-xs text-gray-500">{request.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === "pending" ? (
                        <>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" className="bg-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </>
                      ) : (
                        <Badge variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Requests →
              </Button>
            </CardContent>
          </Card>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Upcoming Meetings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMeetings.map((meeting, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">{meeting.student}</p>
                    <p className="text-xs text-blue-700">{meeting.topic}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {meeting.date} at {meeting.time}
                    </p>
                  </div>
                ))}
                <Button className="w-full" variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Schedule New Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Student List
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Forward to HOP
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      New leave request from Mahnoor
                    </p>
                    <p className="text-xs text-blue-600">10 min ago</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">
                      Request approved by HOP
                    </p>
                    <p className="text-xs text-green-600">2 hours ago</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-900">
                      Teacher attendance update
                    </p>
                    <p className="text-xs text-orange-600">5 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Batch Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Batch SE-{user?.batch} Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{batchPerformance.activeStudents}</p>
                <p className="text-sm text-gray-600 mt-1">Active Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{batchPerformance.avgCGPA}</p>
                <p className="text-sm text-gray-600 mt-1">Average CGPA</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{batchPerformance.attendance}%</p>
                <p className="text-sm text-gray-600 mt-1">Avg Attendance</p>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <p className="text-3xl font-bold text-teal-600">{batchPerformance.onTrack}</p>
                <p className="text-sm text-gray-600 mt-1">On Track</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{batchPerformance.needsAttention}</p>
                <p className="text-sm text-gray-600 mt-1">Needs Attention</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-semibold text-blue-600">93%</span>
              </div>
              <Progress value={93} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Communication Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Recent Student Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Mahnoor Sajjad</p>
                  <p className="text-sm text-gray-600">Query about course registration</p>
                  <p className="text-xs text-gray-500">15 min ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Ahmed Khan</p>
                  <p className="text-sm text-gray-600">Request for academic guidance</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Sara Fatima</p>
                  <p className="text-sm text-gray-600">Leave application follow-up</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Messages →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Teacher Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Dr. Ahmed - Software Eng.</p>
                  <p className="text-sm text-gray-600">Attendance concern for 3 students</p>
                  <p className="text-xs text-gray-500">30 min ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Dr. Ali - Database Systems</p>
                  <p className="text-sm text-gray-600">Grade update completed</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Dr. Hassan - Web Dev</p>
                  <p className="text-sm text-gray-600">Project submission reminder</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Communications →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}