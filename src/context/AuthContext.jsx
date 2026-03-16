import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for Google OAuth redirect query params
    const params = new URLSearchParams(window.location.search);
    const isGoogle = params.get("google");
    const googleRole  = params.get("role");
    const googleEmail = params.get("email");

    if (isGoogle && googleRole && googleEmail) {
      // Store in localStorage like normal login
      localStorage.setItem("role", googleRole);
      localStorage.setItem("email", googleEmail);
      setUser({ role: googleRole, email: googleEmail });

      // Clean up URL — remove query params without page reload
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Normal login check from localStorage
    const role  = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    if (role) setUser({ role, email });
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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);