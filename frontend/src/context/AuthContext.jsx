import { createContext, useEffect, useMemo, useState } from "react";
import {
  handleLoadCurrentUser,
  handleLogout,
} from "../controllers/authController";
import { initSocket, disconnectSocket } from "../socket";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const isAuthenticated = !!token;

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await handleLoadCurrentUser();
        setUser(data.user);
      } catch (error) {
        console.error(error);
        handleLogout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  useEffect(() => {
    if (user && user._id) {
      const s = initSocket(user._id);
      setSocket(s);
    } else {
      disconnectSocket();
      setSocket(null);
    }

    // Sync auth across tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === "token" && !e.newValue) {
        logout();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Watchdog for same-tab manual deletion
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (token && !currentToken) {
        logout();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
      // Don't disconnect socket in cleanup — it will reconnect properly
      // via initSocket's same-user check. Only disconnect on logout.
    };
  }, [user, token]);

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    handleLogout();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
      socket,
    }),
    [user, token, loading, socket]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}