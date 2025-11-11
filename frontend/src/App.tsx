import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";

// Public pages
import HomePage from "@/pages/HomePage";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Dashboard pages
import HopDashboard from "@/pages/dashboard/HopDashboard";
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import AdvisorDashboard from "@/pages/dashboard/AdvisorDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";

import NotFound from "@/pages/NotFound";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Dashboard Router Component
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "hop":
      return <HopDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "advisor":
      return <AdvisorDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <HomePage />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* HOP routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["hop"]}>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <p>This feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Advisor & HOP routes */}
      <Route
        path="/applications"
        element={
          <ProtectedRoute allowedRoles={["hop", "advisor"]}>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Application Management</h2>
              <p>This feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/monitoring"
        element={
          <ProtectedRoute allowedRoles={["hop", "advisor", "teacher"]}>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Student Monitoring</h2>
              <p>This feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["hop", "advisor", "teacher"]}>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
              <p>This feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Profile route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <p>This feature is coming soon!</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header />
            <AppRoutes />
            <Toaster position="top-right" />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;