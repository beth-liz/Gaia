import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Range Forest Officer" | "Forest Guard" | "Villager";
  is_verified: boolean;
  is_active: boolean;
  village_id?: number;
  designation_id?: number;
  station?: string;
  work_status?: string;
  avatar_url?: string;
  village_name?: string;
  designation_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("gaia_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("gaia_token");
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      const userData = await api.getMe();
      setUser(userData);
      setToken(storedToken);
    } catch {
      // Invalid token or server error -> clear session
      localStorage.removeItem("gaia_token");
      localStorage.removeItem("gaia_user");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("gaia_token", newToken);
    localStorage.setItem("gaia_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("gaia_token");
    localStorage.removeItem("gaia_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
