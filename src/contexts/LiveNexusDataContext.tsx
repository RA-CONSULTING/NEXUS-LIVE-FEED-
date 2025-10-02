import { createContext, useContext, type ReactNode } from "react";

import { type RealtimeNexusData, useResampledNexusData } from "@/hooks/useResampledNexusData";

const LiveNexusDataContext = createContext<RealtimeNexusData | null>(null);

interface LiveNexusDataProviderProps {
  children: ReactNode;
  refreshInterval?: number;
}

export const LiveNexusDataProvider = ({
  children,
  refreshInterval,
}: LiveNexusDataProviderProps) => {
  const data = useResampledNexusData(refreshInterval);

  return (
    <LiveNexusDataContext.Provider value={data}>
      {children}
    </LiveNexusDataContext.Provider>
  );
};

export const useLiveNexusData = (): RealtimeNexusData => {
  const context = useContext(LiveNexusDataContext);
  if (!context) {
    throw new Error("useLiveNexusData must be used within a LiveNexusDataProvider");
  }

  return context;
};
