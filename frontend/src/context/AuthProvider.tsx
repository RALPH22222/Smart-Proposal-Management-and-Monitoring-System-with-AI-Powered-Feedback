import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext, { type AuthUser } from "./AuthContext";
import { api } from "@utils/axios";
import type { SupabaseAuthToken } from "src/types/auth";
import Swal from "sweetalert2";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() => {
    // Initialize from localStorage on first render
    const stored = localStorage.getItem("user");
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;

  const verifyToken = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<SupabaseAuthToken>("/auth/verify-token");

      const { email, user_metadata } = data;
      const flattenedUser: AuthUser = {
        email,
        ...user_metadata, // role + anything else from user_metadata
      };

      setUser(flattenedUser);
      localStorage.setItem("user", JSON.stringify(flattenedUser));
      return flattenedUser;
    } catch (error) {
      console.error("verifyToken failed:", error);
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unauthorized access",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );
    } catch (error) {
      console.error("logout error (ignored):", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      console.log("Successfully logged out...");
      navigate("/");
    }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, verifyToken, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};