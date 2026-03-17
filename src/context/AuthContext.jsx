import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleInit = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        window.history.replaceState({}, "", window.location.pathname);
        try {
          const res = await fetch(`/api/auth/google/exchange?token=${token}`, {
            credentials: "include"
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", data.email);
            setUser({ role: data.role, email: data.email });
          }
        } catch { }
         finally {
          setLoading(false);
        }
        return;
      }

      // Normal login check
      const role  = localStorage.getItem("role");
      const email = localStorage.getItem("email");
      if (role) setUser({ role, email });
      setLoading(false);
    };

    handleInit();
  }, []);

  const login = ({ role }, email) => {
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
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);