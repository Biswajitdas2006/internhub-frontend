import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

useEffect(() => {
    const handleGoogleLogin = async () => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            // Clean URL immediately
            window.history.replaceState({}, "", window.location.pathname);
            try {
                // Exchange token for role and email
                const res = await fetch(`/api/auth/google/exchange?token=${token}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("role", data.role);
                    localStorage.setItem("email", data.email);
                    setUser({ role: data.role, email: data.email });
                }
            } catch (err) {
                console.error("Google exchange failed:", err);
            }
            return;
        }

        // Normal login check from localStorage
        const role  = localStorage.getItem("role");
        const email = localStorage.getItem("email");
        if (role) setUser({ role, email });
    };

    handleGoogleLogin();
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