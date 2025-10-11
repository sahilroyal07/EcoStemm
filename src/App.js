// src/App.js
import React, { useState, useEffect } from "react";
import MainApp from "./components/MainApp";
import LoginPage from "./components/loginpage";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    
    // If there's a code in URL, auto-login as guest
    if (codeFromUrl) {
      // Store code for later retrieval
      sessionStorage.setItem('pendingCode', codeFromUrl);
      // Auto-login as test user
      fetch('https://ecosystem-file-share-2.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setIsAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
      return;
    }
    
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f4f6fb'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <MainApp onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
