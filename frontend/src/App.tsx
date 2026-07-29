import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";

// Public Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PendingApprovalPage from "@/pages/PendingApprovalPage";

// Dashboard Layouts
import AdminDashboardLayout from "@/layouts/AdminDashboardLayout";
import OfficerDashboardLayout from "@/layouts/OfficerDashboardLayout";
import GuardDashboardLayout from "@/layouts/GuardDashboardLayout";
import VillagerDashboardLayout from "@/layouts/VillagerDashboardLayout";

// Admin Pages
import AdminDashboardHome from "@/pages/admin/AdminDashboardHome";
import VillagersManagement from "@/pages/admin/VillagersManagement";
import AdminOfficersPage from "@/pages/admin/AdminOfficersPage";
import DesignationsManagement from "@/pages/admin/DesignationsManagement";

// Officer & Guard Pages
import OfficerDashboardHome from "@/pages/officer/OfficerDashboardHome";
import RFOIncidentsPage from "@/pages/officer/RFOIncidentsPage";
import GuardDashboardHome from "@/pages/officer/GuardDashboardHome";
import GuardIncidentsPage from "@/pages/officer/GuardIncidentsPage";

// Villager Pages
import VillagerDashboardHome from "@/pages/villager/VillagerDashboardHome";
import VillagerReportIncident from "@/pages/villager/VillagerReportIncident";
import MyReportsPage from "@/pages/villager/MyReportsPage";

// Shared Pages
import NotificationsPage from "@/pages/shared/NotificationsPage";
import ProfilePage from "@/pages/shared/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes (Redirects if already authenticated) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Villager Pending Approval Screen */}
          <Route
            path="/pending-approval"
            element={
              <ProtectedRoute requireApproval={false}>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardHome />} />
            <Route path="villagers" element={<VillagersManagement />} />
            <Route path="officers" element={<AdminOfficersPage />} />
            <Route path="designations" element={<DesignationsManagement />} />
            <Route path="incidents" element={<RFOIncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<ProfilePage />} />
          </Route>

          {/* Range Forest Officer (RFO) Protected Routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["Range Forest Officer", "Admin"]}>
                <OfficerDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboardHome />} />
            <Route path="incidents" element={<RFOIncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Forest Guard Protected Routes */}
          <Route
            path="/guard"
            element={
              <ProtectedRoute allowedRoles={["Forest Guard", "Range Forest Officer", "Admin"]}>
                <GuardDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/guard/dashboard" replace />} />
            <Route path="dashboard" element={<GuardDashboardHome />} />
            <Route path="incidents" element={<GuardIncidentsPage />} />
            <Route path="reports" element={<GuardIncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Villager Protected Routes */}
          <Route
            path="/villager"
            element={
              <ProtectedRoute allowedRoles={["Villager"]}>
                <VillagerDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/villager/dashboard" replace />} />
            <Route path="dashboard" element={<VillagerDashboardHome />} />
            <Route path="report-incident" element={<VillagerReportIncident />} />
            <Route path="my-reports" element={<MyReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
