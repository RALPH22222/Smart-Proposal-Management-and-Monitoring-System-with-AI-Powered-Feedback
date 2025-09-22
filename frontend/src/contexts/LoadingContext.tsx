import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

type LoadingCtx = {
  loading: boolean;
  setLoading: (v: boolean) => void;
};

const LoadingContext = createContext<LoadingCtx>({ loading: false, setLoading: () => {} });

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return <LoadingContext.Provider value={{ loading, setLoading }}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => useContext(LoadingContext);

export const LocationWatcher: React.FC = () => {
  const { setLoading } = useLoading();
  const location = useLocation();
  useEffect(() => {
    setLoading(false);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [location.pathname]);
  return null;
};

export const LoadingOverlay: React.FC = () => {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            border: "6px solid rgba(200,16,46,0.15)",
            borderTopColor: "#C8102E",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div style={{ color: "#374151", fontSize: 15 }}>Loading...</div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingContext;