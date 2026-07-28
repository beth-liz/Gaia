import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"

// Layouts
import AdminDashboardLayout from "@/layouts/AdminDashboardLayout"
import OfficerDashboardLayout from "@/layouts/OfficerDashboardLayout"
import VillagerDashboardLayout from "@/layouts/VillagerDashboardLayout"

// Admin Pages
import AdminDashboardHome from "@/pages/admin/AdminDashboardHome"
import VillagersManagement from "@/pages/admin/VillagersManagement"
import AdminOfficersPage from "@/pages/admin/AdminOfficersPage"
import SubOfficersPage from "@/pages/admin/SubOfficersPage"
import AdminIncidents from "@/pages/admin/AdminIncidents"

// Officer & Villager Pages
import OfficerDashboardHome from "@/pages/officer/OfficerDashboardHome"
import VillagerDashboardHome from "@/pages/villager/VillagerDashboardHome"

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Public Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Centered Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardHome />} />
          <Route path="users" element={<VillagersManagement />} />
          <Route path="officers" element={<AdminOfficersPage />} />
          <Route path="sub-officers" element={<SubOfficersPage />} />
          <Route path="incidents" element={<AdminIncidents />} />
        </Route>

        {/* Officer Routes */}
        <Route path="/officer" element={<OfficerDashboardLayout />}>
          <Route index element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="dashboard" element={<OfficerDashboardHome />} />
          <Route path="incidents" element={<AdminIncidents />} />
          <Route path="sub-officers" element={<SubOfficersPage />} />
        </Route>

        {/* Villager Routes */}
        <Route path="/villager" element={<VillagerDashboardLayout />}>
          <Route index element={<Navigate to="/villager/dashboard" replace />} />
          <Route path="dashboard" element={<VillagerDashboardHome />} />
          <Route path="report-wildlife" element={<VillagerDashboardHome />} />
          <Route path="my-reports" element={<VillagerDashboardHome />} />
          <Route path="profile" element={<VillagerDashboardHome />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
