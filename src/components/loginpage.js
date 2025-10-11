import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const endpoint = isSignup ? `${API_URL}/api/auth/signup` : `${API_URL}/api/auth/login`;
      const res = await axios.post(endpoint, { email, password });
      
      if (res.data.token) {
        localStorage.setItem("authToken", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>{isSignup ? "Create Account" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : (isSignup ? "Sign Up" : "Login")}
          </button>
        </form>
        {error && <p className="error">{error}</p>}

        <p className="toggle-auth">
          {isSignup ? "Already have an account?" : "New user?"}
          <button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
