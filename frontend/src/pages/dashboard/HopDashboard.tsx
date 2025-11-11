import { useState } from "react";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Shield,
  Briefcase,
  GraduationCap,
  Calendar,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function HopDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock statistics
  const stats = [
    {
      title: "Total Students",
      value: "450",
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12 this semester",
    },
    {
      title: "Active Advisors",
      value: "15",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "All batches covered",
    },
    {
      title: "Pending Approvals",
      value: "23",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Requires attention",
    },
    {
      title: "Avg. Response Time",
      value: "2.5 hrs",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "↓ 15% improvement",
    },
  ];

  const pendingApprovals = [
    { id: 1, type: "Course Freeze", student: "Mahnoor Sajjad", advisor: "Dr. Ahmed", batch: "SE-2022", priority: "high" },
    { id: 2, type: "Semester Freeze", student: "Mahvish Barkat", advisor: "Dr. Ali", batch: "SE-2022", priority: "high" },
    { id: 3, type: "Leave Application", student: "Ahmed Khan", advisor: "Dr. Hassan", batch: "SE-2023", priority: "medium" },
    { id: 4, type: "Course Add/Drop", student: "Sara Fatima", advisor: "Dr. Ahmed", batch: "SE-2023", priority: "low" },
  ];

  const batchPerformance = [
    { batch: "SE-2022", students: 45, avgCGPA: 3.2, attendance: 92, advisorEfficiency: 95 },
    { batch: "SE-2023", students: 50, avgCGPA: 3.1, attendance: 89, advisorEfficiency: 88 },
    { batch: "SE-2024", students: 48, avgCGPA: 3.3, attendance: 94, advisorEfficiency: 92 },
  ];

  const recentActivities = [
    { action: "Course freeze approved", student: "Ali Raza", time: "10 min ago", type: "approval" },
    { action: "New leave request", student: "Fatima Khan", time: "25 min ago", type: "request" },
    { action: "Complaint resolved", student: "Hassan Ahmed", time: "1 hour ago", type: "resolution" },
    { action: "Advisor meeting scheduled", advisor: "Dr. Ahmed", time: "2 hours ago", type: "meeting" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="HOP Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Head of Program Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome, {user?.firstName}!
              </h2>
              <p className="text-indigo-100 mt-1">
                Overview of the entire batch advisory system
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-6">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
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
                <div className="flex items-center justify-between mb-2">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Pending Final Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{approval.type}</p>
                        <Badge variant={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Student: {approval.student} | Batch: {approval.batch}
                      </p>
                      <p className="text-xs text-gray-500">
                        Forwarded by: {approval.advisor}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                      <Button size="sm" className="bg-green-600">
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Pending Approvals →
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.student || activity.advisor}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4">
                View All Activity →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Batch Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Batch Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {batchPerformance.map((batch, index) => (
                <div key={index} className="border-b last:border-0 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{batch.batch}</h4>
                      <p className="text-sm text-gray-600">{batch.students} Students</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Avg CGPA</p>
                      <p className="text-lg font-bold text-blue-600">{batch.avgCGPA}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Attendance</p>
                      <p className="text-lg font-bold text-green-600">{batch.attendance}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Advisor Efficiency</p>
                      <p className="text-lg font-bold text-purple-600">{batch.advisorEfficiency}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={batch.advisorEfficiency} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage all system users</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">View Reports</h3>
              <p className="text-sm text-gray-600">Access comprehensive analytics</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-sm text-gray-600">Configure system parameters</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}