import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

useEffect(() => {
    const handleGoogleLogin = async () => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        console.log("AuthContext loaded, token:", token); // debug

        if (token) {
            window.history.replaceState({}, "", window.location.pathname);
            try {
                console.log("Calling exchange endpoint..."); // debug
                const res = await fetch(`/api/auth/google/exchange?token=${token}`, {
                    credentials: "include"
                });
                console.log("Exchange response status:", res.status); // debug
                if (res.ok) {
                    const data = await res.json();
                    console.log("Exchange data:", data); // debug
                    localStorage.setItem("role", data.role);
                    localStorage.setItem("email", data.email);
                    setUser({ role: data.role, email: data.email });
                } else {
                    const err = await res.text();
                    console.error("Exchange failed:", err); // debug
                }
            } catch (err) {
                console.error("Google exchange error:", err);
            }
            return;
        }

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