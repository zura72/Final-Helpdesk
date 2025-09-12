import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    // Cek jika window tersedia (untuk menghindari error SSR)
    if (typeof window === "undefined") {
      return false;
    }
    
    // Cek localStorage terlebih dahulu
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    // Jika tidak ada, gunakan preferensi sistem
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    console.log("ThemeContext: Theme changed to:", dark ? "dark" : "light");
    
    // Update HTML class
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const toggleDark = () => {
    console.log("ThemeContext: Toggling dark mode");
    setDark(prevDark => !prevDark);
  };

  const value = {
    dark,
    toggleDark,
    isDark: dark,
    isLight: !dark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;