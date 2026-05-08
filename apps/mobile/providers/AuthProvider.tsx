import React, { createContext, useContext, useEffect, useState } from "react";
import { getStoredUser, AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
