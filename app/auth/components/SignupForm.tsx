"use client";
import React, { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // NOTE: This URL should be the actual API endpoint for sign up.
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        // Assuming API sends JSON error message
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Signup failed with an unknown error."
        );
      }

      // If successful (response.ok is true)
      // const data = await response.json();
      setSuccess(true);
      // Optional: Automatically switch to login after success
      // setTimeout(onSwitchToLogin, 2000);
    } catch (err: any) {
      setError(
        err.message || "Network or parsing error. Check server console!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Input */}
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-800 shadow-sm"
      />
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
        placeholder="Password (Min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
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

      {/* Success Message */}
      {success && (
        <div
          className="text-sm text-green-700 bg-green-100 p-3 rounded-lg border border-green-200"
          role="alert"
        >
          Success! Your account has been created. Please log in.
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
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing Up...
          </>
        ) : (
          "Sign Up"
        )}
      </button>
    </form>
  );
};

export default SignupForm;
