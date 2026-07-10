import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch Current User (Restore Session) ───────────────────────────────────
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setError(null);
    } catch (err) {
      console.error("Session restore failed:", err.message);
      // Remove invalid token
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Login Action ───────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/auth/login", { email, password });
      
      const { token, user: userData } = res.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.message || "Login failed";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Register Action ────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/auth/register", userData);

      const { token, user: newUser } = res.data;
      localStorage.setItem("token", token);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const errMsg = err.message || "Registration failed";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Logout Action ──────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
  };

  // Clear errors manually if needed
  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
