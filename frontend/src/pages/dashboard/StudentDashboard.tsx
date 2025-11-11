import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  TrendingUp,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Application {
  _id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  description: string;
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

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

  const getVerificationStatus = () => {
    if (user?.verificationStatus === "verified") {
      return { color: "green", text: "Verified", icon: CheckCircle };
    } else if (user?.verificationStatus === "pending") {
      return { color: "yellow", text: "Pending", icon: Clock };
    } else {
      return { color: "red", text: "Not Verified", icon: AlertCircle };
    }
  };

  const verificationStatus = getVerificationStatus();

  // Mock data for demonstration
  const stats = [
    { label: "Pending Requests", value: "3", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Approved", value: "12", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Attendance", value: "92%", icon: Award, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "CGPA", value: "3.2", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const recentApplications = [
    { id: 1, type: "Leave Application", status: "pending", date: "2024-11-05", description: "Medical leave for 2 days" },
    { id: 2, type: "Course Freeze", status: "approved", date: "2024-11-03", description: "Freeze Software Engineering" },
    { id: 3, type: "Add/Drop Course", status: "pending", date: "2024-11-02", description: "Drop Database Systems" },
  ];

  const quickActions = [
    { label: "Submit Leave Application", icon: Send, link: "/applications/leave" },
    { label: "Course Add/Drop", icon: FileText, link: "/applications/course" },
    { label: "View Attendance", icon: Eye, link: "/attendance" },
    { label: "Contact Advisor", icon: MessageSquare, link: "/advisor" },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome, {user?.firstName}!
              </h2>
              <p className="text-blue-100 mt-1">
                Manage your academic requests and track your progress
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
                alt="Student"
                className="w-16 h-16 rounded-full border-3 border-white"
              />
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-6">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="text-sm">Student ID: {user?.studentId}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">Batch: {user?.batch}</span>
            </div>
            <div className="flex items-center">
              <verificationStatus.icon className="w-4 h-4 mr-2" />
              <span className="text-sm">{verificationStatus.text}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{app.type}</p>
                        <Badge variant={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{app.date}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Applications →
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    className="w-full justify-start"
                    variant="outline"
                    asChild
                  >
                    <Link to={action.link}>
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      Mid-term exam schedule released
                    </p>
                    <p className="text-xs text-blue-600">2 hours ago</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900 font-medium">
                      New course registration open
                    </p>
                    <p className="text-xs text-green-600">1 day ago</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 font-medium">
                      Sports week starting next Monday
                    </p>
                    <p className="text-xs text-purple-600">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Academic Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Academic Progress - Semester {new Date().getMonth() < 6 ? "Spring" : "Fall"} 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Attendance</span>
                  <span className="text-sm font-semibold text-blue-600">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Assignments Completed</span>
                  <span className="text-sm font-semibold text-green-600">15/18</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm font-semibold text-purple-600">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advisor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Your Batch Advisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                SA
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Sir Syed Shahzad Hassan</p>
                <p className="text-sm text-gray-600">Batch Advisor - SE {user?.batch}</p>
                <p className="text-sm text-gray-500">shahzad@hitec.edu.pk</p>
              </div>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Contact
              </Button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Office Hours:</strong> Monday - Friday, 2:00 PM - 4:00 PM
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Location:</strong> Faculty Block, Room 204
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}