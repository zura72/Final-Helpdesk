// App.jsx
import React, { createContext, useState, useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
import AppRoutes from "./routes.jsx";

// Buat AuthContext
export const AuthContext = createContext();

function AppContent() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true"
  );
  const [msalReady, setMsalReady] = useState(false);

  // Pastikan MSAL siap sebelum render
  useEffect(() => {
    if (instance && inProgress === "none") {
      setMsalReady(true);
    }
  }, [instance, inProgress]);

  // Tampilkan loading jika MSAL belum ready
  if (!msalReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg className="animate-pulse h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Menyiapkan sistem autentikasi...</p>
          <p className="mt-2 text-sm text-gray-500">Harap tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ rememberMe, setRememberMe }}>
      <ThemeProvider>
        <Router>
          {!isAuthenticated ? <Login /> : <AppRoutes />}
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

export default AppContent;