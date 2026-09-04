import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const DEMO_USERS = {
  CALLER: { email: "caller@emergency.net", password: "password123", role: "CALLER", name: "Sarah Jenkins (Caller)" },
  DRIVER: { email: "driver1@dispatch.net", password: "password123", role: "DRIVER", name: "Marcus Vance (Driver)" },
  HOSPITAL: { email: "hospital1@metrohealth.org", password: "password123", role: "HOSPITAL", name: "Metro Hospital Staff" },
  DISPATCHER: { email: "dispatcher@controlcenter.gov", password: "password123", role: "DISPATCHER", name: "Command Center Dispatcher" },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      const currentUser = { id: data.user_id, email: data.email, full_name: data.full_name, role: data.role };
      setUser(currentUser);
      return currentUser;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      try {
        await login(demo.email, demo.password);
      } catch (e) {
        // Fallback to local state if backend not reachable yet
        setUser({ id: 99, email: demo.email, full_name: demo.name, role: demo.role });
        setLoading(false);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
