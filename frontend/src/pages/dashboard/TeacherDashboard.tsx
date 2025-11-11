import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Calendar,
  MessageSquare,
  Bell,
  Award,
  Eye,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TeacherDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock statistics
  const stats = [
    {
      title: "Total Students",
      value: "120",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Updates",
      value: "8",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Classes This Week",
      value: "15",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Avg. Attendance",
      value: "91%",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const courses = [
    { 
      id: 1, 
      name: "Software Engineering", 
      code: "SE-301", 
      students: 45, 
      attendance: 92,
      batch: "SE-2022" 
    },
    { 
      id: 2, 
      name: "Database Systems", 
      code: "CS-401", 
      students: 38, 
      attendance: 88,
      batch: "SE-2023" 
    },
    { 
      id: 3, 
      name: "Web Development", 
      code: "CS-302", 
      students: 42, 
      attendance: 94,
      batch: "SE-2023" 
    },
  ];

  const attendanceRequests = [
    { id: 1, student: "Mahnoor Sajjad", batch: "SE-2022", date: "2024-11-05", status: "pending" },
    { id: 2, student: "Ahmed Khan", batch: "SE-2023", date: "2024-11-04", status: "pending" },
    { id: 3, student: "Sara Fatima", batch: "SE-2023", date: "2024-11-03", status: "approved" },
  ];

  const recentMessages = [
    { from: "Dr. Ahmed (Advisor)", message: "Student attendance concern", time: "30 min ago" },
    { from: "HOP Office", message: "Semester evaluation meeting", time: "2 hours ago" },
    { from: "Student Affairs", message: "Updated grading policy", time: "1 day ago" },
  ];

  const upcomingClasses = [
    { course: "Software Engineering", time: "10:00 AM", room: "LR-201", batch: "SE-2022" },
    { course: "Database Systems", time: "2:00 PM", room: "LR-305", batch: "SE-2023" },
    { course: "Web Development", time: "4:00 PM", room: "Lab-102", batch: "SE-2023" },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Teacher Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome, {user?.firstName}!
              </h2>
              <p className="text-teal-100 mt-1">
                Manage your courses and student interactions
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-6">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="text-sm">Software Engineering Department</span>
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
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
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
          {/* My Courses */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                My Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{course.name}</h4>
                        <p className="text-sm text-gray-600">
                          {course.code} | Batch: {course.batch}
                        </p>
                      </div>
                      <Badge>{course.students} Students</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Attendance Rate</span>
                          <span className="font-semibold text-green-600">{course.attendance}%</span>
                        </div>
                        <Progress value={course.attendance} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((cls, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">{cls.course}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {cls.time} | {cls.room}
                    </p>
                    <p className="text-xs text-blue-600">Batch: {cls.batch}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Updates & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Update Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Attendance Update Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{request.student}</p>
                      <p className="text-xs text-gray-600">
                        {request.batch} | {request.date}
                      </p>
                    </div>
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" className="bg-green-600 h-8">
                          Update
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Updated
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Requests →
              </Button>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMessages.map((msg, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">{msg.from}</p>
                    <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{msg.time}</p>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Messages →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col" variant="outline">
                <Send className="h-5 w-5 mb-2" />
                <span className="text-sm">Update Attendance</span>
              </Button>
              <Button className="h-20 flex-col" variant="outline">
                <MessageSquare className="h-5 w-5 mb-2" />
                <span className="text-sm">Contact Advisor</span>
              </Button>
              <Button className="h-20 flex-col" variant="outline">
                <FileText className="h-5 w-5 mb-2" />
                <span className="text-sm">Submit Report</span>
              </Button>
              <Button className="h-20 flex-col" variant="outline">
                <Users className="h-5 w-5 mb-2" />
                <span className="text-sm">View Students</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Student Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">3.1</p>
                <p className="text-sm text-gray-600 mt-1">Average CGPA</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">91%</p>
                <p className="text-sm text-gray-600 mt-1">Average Attendance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">87%</p>
                <p className="text-sm text-gray-600 mt-1">Assignment Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}