import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type UserRole = "admin" | "employee" | "customer" | null;

interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: "admin" | "employee" | "customer") => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("fab-token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("fab-user");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("fab-user");
        localStorage.removeItem("fab-token");
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, role: "admin" | "employee" | "customer") => {
    let endpoint: string;
    let body: Record<string, string>;

    if (role === "admin") {
      endpoint = "/admin/login";
      body = { username: email, password };
    } else if (role === "employee") {
      endpoint = "/employee/login";
      body = { email, password };
    } else {
      endpoint = "/auth/login";
      body = { email, password };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();

    const newUser: User = {
      id: role === "admin" ? 0 : (data.worker?.id ?? data.customer?.id ?? 0),
      name: role === "admin" ? "Admin" : (data.worker?.name ?? data.customer?.name ?? ""),
      email,
      role,
    };

    const newToken = data.token || "admin-session";

    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("fab-user", JSON.stringify(newUser));
    localStorage.setItem("fab-token", newToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("fab-user");
    localStorage.removeItem("fab-token");
    localStorage.removeItem("employee_token");
    localStorage.removeItem("fabEmployeeToken");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
