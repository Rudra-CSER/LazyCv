import { createContext, useState, useEffect } from "react";
import { getMe, logout } from "./services/auth.api.js";
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const CLOSED_AT_KEY = "lazycv_closed_at";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [Loading, setLoading] = useState(true);

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const closedAt = localStorage.getItem(CLOSED_AT_KEY);
        if (closedAt && Date.now() - Number(closedAt) >= SESSION_TIMEOUT_MS) {
          localStorage.removeItem(CLOSED_AT_KEY);
          await logout().catch(() => {});
          setUser(null);
          return;
        }
        localStorage.removeItem(CLOSED_AT_KEY);
        const data = await getMe();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getAndSetUser();

    const handleClose = () => {
      localStorage.setItem(CLOSED_AT_KEY, String(Date.now()));
    };
    window.addEventListener("pagehide", handleClose);
    return () => window.removeEventListener("pagehide", handleClose);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, Loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
