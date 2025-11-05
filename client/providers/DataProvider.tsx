"use client";
import useLocalState from "@/hooks/useLocalState";
import { LoaderCircleIcon } from "lucide-react";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

type DataContextType = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [expanded, setExpanded] = useLocalState<boolean>(
    "navbar_expanded",
    false,
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <LoaderCircleIcon className="size-20 animate-spin" />
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
