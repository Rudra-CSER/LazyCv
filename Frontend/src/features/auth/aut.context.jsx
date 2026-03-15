import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api.js";
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [Loading, setLoading] = useState(true);

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await getMe();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getAndSetUser();
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, Loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
