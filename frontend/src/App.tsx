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
import AdminStatesPage from "@/pages/admin/AdminStatesPage";
import AdminDistrictsPage from "@/pages/admin/AdminDistrictsPage";
import AdminMonitoringStationsPage from "@/pages/admin/AdminMonitoringStationsPage";
import AdminAnimalSpeciesPage from "@/pages/admin/AdminAnimalSpeciesPage";
import VillagersManagement from "@/pages/admin/VillagersManagement";
import AdminOfficersPage from "@/pages/admin/AdminOfficersPage";
import DesignationsManagement from "@/pages/admin/DesignationsManagement";
import AdminIncidentsPage from "@/pages/admin/AdminIncidentsPage";

// Officer & Guard Pages
import OfficerDashboardHome from "@/pages/officer/OfficerDashboardHome";
import OfficerCreateIncidentPage from "@/pages/officer/OfficerCreateIncidentPage";
import RFOIncidentsPage from "@/pages/officer/RFOIncidentsPage";
import RFOForestGuardsPage from "@/pages/officer/RFOForestGuardsPage";
import RFOStationOverviewPage from "@/pages/officer/RFOStationOverviewPage";
import GuardDashboardHome from "@/pages/officer/GuardDashboardHome";
import GuardIncidentsPage from "@/pages/officer/GuardIncidentsPage";
import GuardCompletedReportsPage from "@/pages/officer/GuardCompletedReportsPage";
import GuardMissionExecutionPage from "@/pages/officer/GuardMissionExecutionPage";

// Villager Pages
import VillagerDashboardHome from "@/pages/villager/VillagerDashboardHome";
import VillagerReportIncident from "@/pages/villager/VillagerReportIncident";
import MyReportsPage from "@/pages/villager/MyReportsPage";

// Shared Pages
import IncidentReviewPage from "@/pages/shared/IncidentReviewPage";
import NotificationsPage from "@/pages/shared/NotificationsPage";
import ProfilePage from "@/pages/shared/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes */}
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
            <Route path="states" element={<AdminStatesPage />} />
            <Route path="districts" element={<AdminDistrictsPage />} />
            <Route path="monitoring-stations" element={<AdminMonitoringStationsPage />} />
            <Route path="animal-species" element={<AdminAnimalSpeciesPage />} />
            <Route path="villagers" element={<VillagersManagement />} />
            <Route path="officers" element={<AdminOfficersPage />} />
            <Route path="designations" element={<DesignationsManagement />} />
            <Route path="incidents" element={<AdminIncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentReviewPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<ProfilePage />} />
          </Route>

          {/* Range Forest Officer (RFO) Protected Routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["Range Forest Officer", "Forest Guard", "Admin"]}>
                <OfficerDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboardHome />} />
            <Route path="incidents" element={<RFOIncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentReviewPage />} />
            <Route path="mission/:id" element={<GuardMissionExecutionPage />} />
            <Route path="guards" element={<RFOForestGuardsPage />} />
            <Route path="station" element={<RFOStationOverviewPage />} />
            <Route path="create-incident" element={<OfficerCreateIncidentPage />} />
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
            <Route path="assignments" element={<GuardIncidentsPage />} />
            <Route path="incidents" element={<GuardIncidentsPage />} />
            <Route path="mission/:id" element={<GuardMissionExecutionPage />} />
            <Route path="incidents/:id" element={<GuardMissionExecutionPage />} />
            <Route path="completed" element={<GuardCompletedReportsPage />} />
            <Route path="reports" element={<GuardCompletedReportsPage />} />
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
            <Route path="my-reports/:id" element={<IncidentReviewPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Global Incident Direct Link */}
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute requireApproval={true}>
                <IncidentReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Profile & Settings fallback route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireApproval={false}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
