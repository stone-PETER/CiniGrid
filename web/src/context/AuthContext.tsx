import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { authService } from "../services/locationService";

interface AuthResponse {
  user: {
    _id?: string;
    id?: string;
    username: string;
  };
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on app load
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    console.log("🔐 Auth Check - Token:", token ? "exists" : "none");
    console.log("🔐 Auth Check - User data:", userData ? "exists" : "none");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
        console.log("🔐 Auth restored for user:", parsedUser.username);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log("🔐 Attempting login for:", username);
      const response = await authService.login({ username, password });

      if (response.success && response.data) {
        // Backend returns: { success: true, data: { user: {...}, token: "..." } }
        // Need to extract user and token from response.data
        const authData = response.data as unknown as AuthResponse;
        const userData = {
          ...authData.user,
          id: authData.user.id || authData.user._id || "",
          token: authData.token,
        };

        localStorage.setItem("auth_token", authData.token || "");
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        console.log("🔐 Login successful for:", userData.username);
      } else {
        console.log("🔐 Login failed:", response.message);
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await authService.register({ username, password });

      if (response.success && response.data) {
        // Backend returns: { success: true, data: { user: {...}, token: "..." } }
        // Need to extract user and token from response.data
        const authData = response.data as unknown as AuthResponse;
        const userData = {
          ...authData.user,
          id: authData.user.id || authData.user._id || "",
          token: authData.token,
        };

        localStorage.setItem("auth_token", authData.token || "");
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
