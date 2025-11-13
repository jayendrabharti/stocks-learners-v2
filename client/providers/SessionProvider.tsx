"use client";

import getUser from "@/auth/getUser";
import ApiClient from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  SetStateAction,
  Dispatch,
  useRef,
} from "react";
import { toast } from "sonner";

export interface SessionContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
  logOut: (redirect?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  isAuthenticated: false,
  error: null,
  refreshSession: async () => {},
  setUser: () => {},
  logOut: async (redirect: boolean = false) => {},
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<SessionContextType["user"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionContextType["status"]>("loading");

  const isFetchingSession = useRef(false);

  const fetchSession = async () => {
    // Prevent concurrent fetches
    if (isFetchingSession.current) {
      return;
    }

    isFetchingSession.current = true;

    try {
      const fetchedUser = await getUser();

      if (fetchedUser) {
        setUser(fetchedUser);
        console.log(fetchedUser);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
      setError(null);
    } catch (error) {
      setUser(null);
      setStatus("unauthenticated");
    } finally {
      isFetchingSession.current = false;
    }
  };

  const logOut = async (redirect: boolean = false) => {
    try {
      const response = await ApiClient.post("/auth/logout");
      if (response.status === 200) {
        // Clear all user data immediately (NO localStorage)
        setUser(null);
        setError(null);
        setStatus("unauthenticated");
        toast.success("Signed out !!");
        if (redirect) {
          router.push("/login");
        }
      } else {
        toast.error("Error signing out");
      }
    } catch (error) {
      // Even if API call fails, clear local session
      setUser(null);
      setError(null);
      setStatus("unauthenticated");
      toast.error("Error signing out, but local session cleared");
      if (redirect) {
        router.push("/login");
      }
    }
  };

  const updateUser = (value: SetStateAction<User | null>) => {
    const newUser = typeof value === "function" ? value(user) : value;
    setUser(newUser);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const contextValue: SessionContextType = {
    user,
    status,
    isAuthenticated: status === "authenticated" && user !== null,
    error,
    refreshSession: fetchSession,
    setUser: updateUser,
    logOut,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
