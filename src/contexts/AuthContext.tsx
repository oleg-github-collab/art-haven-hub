import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiGet, apiPost, setTokens, clearTokens, getAccessToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  city?: string;
  location?: string;
  roles?: string[];
  tags?: string[];
  is_verified?: boolean;
  follower_count: number;
  following_count: number;
  artwork_count: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterInput {
  email: string;
  password: string;
  handle: string;
  display_name: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    if (!getAccessToken()) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await apiGet<User>("/api/v1/auth/me");
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      clearTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const data = await apiPost<{ access_token: string; refresh_token: string; user: User }>(
      "/api/v1/auth/login",
      { email, password },
      { noAuth: true }
    );
    setTokens(data.access_token, data.refresh_token);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  };

  const register = async (input: RegisterInput) => {
    const data = await apiPost<{ access_token: string; refresh_token: string; user: User }>(
      "/api/v1/auth/register",
      input,
      { noAuth: true }
    );
    setTokens(data.access_token, data.refresh_token);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  };

  const googleLogin = async (idToken: string) => {
    const data = await apiPost<{ access_token: string; refresh_token: string; user: User }>(
      "/api/v1/auth/google",
      { id_token: idToken },
      { noAuth: true }
    );
    setTokens(data.access_token, data.refresh_token);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await apiPost("/api/v1/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // ignore
    }
    clearTokens();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, googleLogin, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
