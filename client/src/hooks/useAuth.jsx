import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithGoogle } from '../../firebase'; // Import signInWithGoogle

// Create the authentication context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // User state

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));  // Save user to localStorage
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');  // Remove user from localStorage
  };

  // Google Sign-In function
  const handleGoogleSignIn = async () => {
    try {
      const userData = await signInWithGoogle(); // Call imported signInWithGoogle
      login({
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
      });
    } catch (error) {
      console.error("Google Sign-In error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, handleGoogleSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
