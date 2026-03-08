import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Only store role in localStorage, token is in httpOnly cookie
    const role  = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    if (role) setUser({ role, email });
  }, []);

  const login = ({ role }, email) => {
    // Don't store token — it's in httpOnly cookie set by backend
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);
    setUser({ role, email });
  };

  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
