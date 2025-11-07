"use client";
import React, { useState } from "react";
import { Bot } from "lucide-react";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";

// Main Page Component for Login/Signup
const AuthPage: React.FC = () => {
  // State to toggle between Login (true) and Signup (false) views
  const [isLogin, setIsLogin] = useState<boolean>(true);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header (Consistent with Landing Page) */}
      <header className="py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href="#"
            className="flex items-center text-xl font-bold text-gray-900"
          >
            <Bot className="w-6 h-6 mr-2 text-blue-600" />
            Nyay Sahayak
          </a>
        </div>
      </header>

      {/* Main Content Area - Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-2xl border border-gray-100 transition-all duration-300">
          {/* Title and Toggle */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="text-gray-500">
              {isLogin
                ? "Access your legal research co-pilot."
                : "Start your journey to smarter legal insights."}
            </p>
          </div>

          {/* Form Area */}
          <div className="mb-6">
            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </div>

          {/* Switch Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Nyay Sahayak Co-Pilot.
      </footer>
    </div>
  );
};

export default AuthPage;
