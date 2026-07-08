import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, TOKEN_KEY } from "@/lib/api";
import { resetApiAvailabilityCache } from "@/lib/ordersService";

export type UserRole = "customer" | "staff";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone: string;
  address: string;
  role: UserRole;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

type ProfileUpdate = Partial<Pick<AuthUser, "name" | "email" | "phone" | "address" | "passwordHash">>;

type AuthContextValue = {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  loading: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (userData: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  updateProfile: (updatedFields: ProfileUpdate) => Promise<AuthUser>;
};

const CURRENT_USER_KEY = "ibnsina_current_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string) {
  let clean = email.trim().toLowerCase();
  // Strip common French/Tunisian keyboard typos (e.g. trailing 'à' after .tn)
  if (clean.endsWith(".tnà")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

function saveCurrentUser(user: AuthUser | null) {
  if (user) {
    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? "",
      address: user.address ?? "",
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  saveCurrentUser(null);
}

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  address?: string;
};

function mapApiRole(role?: string): UserRole {
  if (role === "admin" || role === "staff") return "staff";
  return "customer";
}

function mapApiUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? "",
    address: apiUser.address ?? "",
    role: mapApiRole(apiUser.role),
  } as AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        clearAuthSession();
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        const apiUser = response.data?.user as ApiUser | undefined;
        if (!apiUser) throw new Error("Invalid session response.");

        const mapped = mapApiUser(apiUser);
        setCurrentUser(mapped);
        saveCurrentUser(mapped);
      } catch {
        clearAuthSession();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();

    const handleUnauthorized = () => {
      setCurrentUser(null);
      clearAuthSession();
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email);
    try {
      const response = await authApi.login({ email: cleanEmail, password });
      const apiUser = response.data?.user as ApiUser | undefined;
      const token = response.data?.token as string | undefined;
      if (!apiUser || !token) {
        throw new Error("Invalid login response.");
      }

      localStorage.setItem(TOKEN_KEY, token);
      const mapped = mapApiUser(apiUser);
      setCurrentUser(mapped);
      saveCurrentUser(mapped);
      return mapped;
    } catch (error) {
      clearAuthSession();
      setCurrentUser(null);
      if (error instanceof TypeError) {
        throw new Error(
          `Network error: ${error.message}. Check that VITE_API_BASE_URL points to your deployed backend (e.g. https://your-backend.vercel.app/api).`,
        );
      }
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Invalid email or password.");
    }
  };

  const register = async (userData: RegisterPayload) => {
    const cleanEmail = normalizeEmail(userData.email);
    const response = await authApi.register({
      name: userData.name.trim(),
      email: cleanEmail,
      password: userData.password,
      phone: userData.phone.trim(),
      address: userData.address.trim(),
    });
    const apiUser = response.data?.user as ApiUser | undefined;
    const token = response.data?.token as string | undefined;
    if (!apiUser || !token) {
      throw new Error("Invalid registration response.");
    }

    localStorage.setItem(TOKEN_KEY, token);
    const mapped = mapApiUser(apiUser);
    setCurrentUser(mapped);
    saveCurrentUser(mapped);
    return mapped;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    resetApiAvailabilityCache();
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  const updateProfile = async (updatedFields: ProfileUpdate) => {
    if (!currentUser) throw new Error("Please sign in to update your profile.");
    const response = await authApi.updateMe(updatedFields);
    const apiUser = response.data?.user as ApiUser | undefined;
    if (!apiUser) throw new Error("Invalid profile response.");

    const mapped = mapApiUser(apiUser);
    setCurrentUser(mapped);
    saveCurrentUser(mapped);
    return mapped;
  };

  const value = {
    currentUser,
    user: currentUser,
    loading,
    isStaff: currentUser?.role === "staff",
    isCustomer: currentUser?.role === "customer",
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
