import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext, { type AuthUser } from "./AuthContext";
import { api } from "@utils/axios";
import { broadcastAuthChange, onAuthChange } from "@utils/auth-broadcast";
import Swal from "sweetalert2";

type VerifyTokenResponse = {
  session?: { exp?: number; iat?: number };
  user: {
    id: string;
    email: string;
    roles: string[];
    account_type?: "internal" | "external";
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    department_id?: number | null;
    department_name?: string | null;
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const { data } = await api.get<VerifyTokenResponse>("/auth/verify-token", {
        withCredentials: true, // IMPORTANT: cookie auth
      });

      const hydratedUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        roles: data.user.roles,
        account_type: data.user.account_type ?? "internal",
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        profile_photo_url: data.user.profile_photo_url,
        department_id: data.user.department_id ?? null,
        department_name: data.user.department_name ?? null,
      };

      setUser(hydratedUser);
      localStorage.setItem("user", JSON.stringify(hydratedUser));
      return hydratedUser;
    } catch (error) {
      console.error("verifyToken failed:", error);
      setUser(null);
      localStorage.removeItem("user");
      // Let /login show a friendly "session ended" notice instead of a
      // red error. Covers the case where this tab was idle while another
      // tab invalidated the session (invite completion, logout, etc.).
      sessionStorage.setItem("auth_redirect_reason", "session_ended");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Cross-tab session sync: if another tab signs in or out, this tab's
  // cached React state is now stale and would happily speak for the wrong
  // user. Show a brief notice and hard-reload so we re-hydrate from the
  // current cookie/localStorage (which the other tab just updated).
  useEffect(() => {
    return onAuthChange(() => {
      Swal.fire({
        icon: "info",
        title: "Session changed",
        text: "You signed in or out in another tab. This tab will reload.",
        timer: 2000,
        showConfirmButton: false,
        allowOutsideClick: false,
      }).then(() => {
        window.location.href = "/login";
      });
    });
  }, []);

  // Proactive token refresh — refresh the access token before it expires (every 50 minutes)
  // The access token TTL is 1 hour; refreshing at 50 min prevents 401s during normal usage.
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) {
      // Not logged in — clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    // Start the proactive refresh interval
    refreshTimerRef.current = setInterval(async () => {
      try {
        await api.post('/auth/refresh-token', {}, { withCredentials: true });
      } catch {
        // Refresh failed — the reactive interceptor will handle it on the next API call
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user]);

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
      sessionStorage.removeItem("auth_verified");
      setUser(null);
      broadcastAuthChange();
      console.log("Successfully logged out...");
      // Hard reload instead of SPA nav so module-level caches (proposal.api
      // lookupCache, ProjectMonitoringApi projectCache) and any lingering
      // React state are fully wiped. Matches login's hardNavigate behavior.
      window.location.href = "/";
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, verifyToken, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};