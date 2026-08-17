import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireApproval?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireApproval = true,
}) => {
  const { user, isAuthenticated, isLoading, hasNetworkError, refreshUser } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-800 animate-spin mb-3" />
        <p className="text-emerald-950 font-medium tracking-wide">Securing Gaia Session...</p>
      </div>
    );
  }

  if (hasNetworkError) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-xl space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <span className="text-amber-600 text-3xl font-black">!</span>
          </div>
          <h3 className="text-lg font-black text-emerald-950">Connection Interrupted</h3>
          <p className="text-xs font-semibold text-gray-500 leading-relaxed">
            Gaia could not reach the secure validation server. Your session is active, but a network or server error is preventing authentication checks.
          </p>
          <button
            onClick={() => refreshUser()}
            className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login, replacing history entry so browser back button won't return to protected page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle Villager pending approval status
  if (user.role === "Villager" && !user.is_verified && requireApproval && location.pathname !== "/pending-approval") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Handle role restrictions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's actual role
    if (user.role === "Admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "Range Forest Officer" || user.role === "Forest Guard") return <Navigate to="/officer/dashboard" replace />;
    if (user.role === "Villager") {
      return user.is_verified ? <Navigate to="/villager/dashboard" replace /> : <Navigate to="/pending-approval" replace />;
    }
  }

  return (
    <React.Fragment key={user ? `${user.id}-${user.role}` : "unauthenticated"}>
      {children}
    </React.Fragment>
  );
};

// Route wrapper to prevent logged-in users from visiting Login / Register again
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === "Admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "Range Forest Officer" || user.role === "Forest Guard") return <Navigate to="/officer/dashboard" replace />;
    if (user.role === "Villager") {
      return user.is_verified ? <Navigate to="/villager/dashboard" replace /> : <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};
