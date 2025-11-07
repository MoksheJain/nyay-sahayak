"use client";
import React, { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulate API call for login
      // NOTE: Replace this mock logic with your actual Firebase/Auth API call
      console.log("Attempting to log in:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (email === "test@nyay.com" && password === "password") {
        console.log("Login successful!");
        // Successful login action (e.g., redirect or update global state)
        alert("Login Successful! (Placeholder Action)");
      } else {
        throw new Error("Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-800 shadow-sm"
      />

      {/* Password Input */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-800 shadow-sm"
      />

      {/* Error Message */}
      {error && (
        <div
          className="text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Logging In...
          </>
        ) : (
          "Log In"
        )}
      </button>

      <div className="text-center pt-2">
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Forgot Password?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
