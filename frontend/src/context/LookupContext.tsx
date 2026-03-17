import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchAllLookups,
  type AllLookups,
  type AgencyItem,
  type LookupItem,
} from "../services/proposal.api";

type LookupContextValue = AllLookups & {
  loading: boolean;
  refresh: () => Promise<void>;
};

const emptyLookups: AllLookups = {
  agencies: [],
  departments: [],
  disciplines: [],
  sectors: [],
  tags: [],
  priorities: [],
  stations: [],
};

const LookupContext = createContext<LookupContextValue>({
  ...emptyLookups,
  loading: true,
  refresh: async () => {},
});

export const useLookups = () => useContext(LookupContext);

export const LookupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AllLookups>(emptyLookups);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lookups = await fetchAllLookups();
      setData(lookups);
    } catch (err) {
      console.error("Failed to fetch lookups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LookupContext.Provider value={{ ...data, loading, refresh: load }}>
      {children}
    </LookupContext.Provider>
  );
};
