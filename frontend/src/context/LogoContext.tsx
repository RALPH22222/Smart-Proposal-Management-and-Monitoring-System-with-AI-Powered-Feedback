import React, { createContext, useContext, useState, useEffect } from "react";
import { type LogosInfo, DEFAULT_LOGOS } from "../schemas/logo-schema";
import { LogosApi } from "../services/admin/LogosApi";

interface LogoContextType {
  logos: LogosInfo;
  isLoading: boolean;
  refreshLogos: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logos, setLogos] = useState<LogosInfo>(DEFAULT_LOGOS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogos = async () => {
    try {
      setIsLoading(true);
      const data = await LogosApi.getLogos();
      setLogos(data);
    } catch (error) {
      console.error("Failed to fetch logos:", error);
      // Keep default logos on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  return (
    <LogoContext.Provider value={{ logos, isLoading, refreshLogos: fetchLogos }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogos = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogos must be used within a LogoProvider");
  }
  return context;
};
