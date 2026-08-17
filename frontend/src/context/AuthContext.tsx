import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Range Forest Officer" | "Forest Guard" | "Villager" | string;
  is_verified: boolean;
  is_active: boolean;
  village_id?: number;
  designation_id?: number;
  station_id?: number;
  station?: string;
  station_name?: string;
  district_name?: string;
  state_name?: string;
  work_status?: string;
  avatar_url?: string;
  profile_image?: string;
  village_name?: string;
  designation_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasNetworkError: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("gaia_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasNetworkError, setHasNetworkError] = useState<boolean>(false);

  const fetchUser = async () => {
    setHasNetworkError(false);
    try {
      const me = await api.getMe();
      setUser(me);
      localStorage.setItem("gaia_user", JSON.stringify(me));
    } catch {
      if (!localStorage.getItem("gaia_token")) {
        logout();
      } else {
        setHasNetworkError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  // Synchronize logouts across multiple tabs and handle bfcache / unauthorized events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gaia_token" && !e.newValue) {
        // Token was deleted by another tab logging out
        setToken(null);
        setUser(null);
        setHasNetworkError(false);
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page restored from browser back-forward cache: reload/bootstrap to verify auth
        window.location.reload();
      }
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("gaia_unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("gaia_unauthorized", handleUnauthorized);
    };
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("gaia_token", newToken);
    localStorage.setItem("gaia_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setHasNetworkError(false);
  };

  const logout = () => {
    localStorage.removeItem("gaia_token");
    localStorage.removeItem("gaia_user");
    setToken(null);
    setUser(null);
    setHasNetworkError(false);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser();
    }
  };

  const updateUser = (userData: User) => {
    localStorage.setItem("gaia_user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        hasNetworkError,
        login,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
