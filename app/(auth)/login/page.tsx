"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("student@example.com");
    setPassword("password123");
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", password: "password123" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to log in with demo account");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Failed to connect to server");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Welcome back to HabitTrack
        </h2>
        <p className="mt-1 text-xs text-gray-500 font-medium">
          Sign in to review your streaks, habits, and daily goals.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-elevated border border-gray-100">
          {/* Quick Demo Login Option */}
          <div className="mb-6 p-4 rounded-2xl bg-forest-50 border border-forest-100 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-forest-600" />
                Quick Demo Access
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-200 text-forest-800">
                1-Click
              </span>
            </div>
            <p className="text-xs text-forest-700 font-medium mb-3">
              Explore with the pre-seeded student account (12-day streak, 30 days of data).
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
            >
              Sign In as Student Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-semibold uppercase tracking-wider">
                Or sign in with email
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              <p className="font-bold mb-1">Login Issue:</p>
              <p className="font-medium text-red-800">{error}</p>
              {(error.toLowerCase().includes("mongo") ||
                error.toLowerCase().includes("timeout") ||
                error.toLowerCase().includes("whitelist") ||
                error.toLowerCase().includes("connection") ||
                error.toLowerCase().includes("timed out") ||
                error.toLowerCase().includes("cluster")) && (
                <div className="mt-2.5 pt-2 border-t border-red-200 text-[11px] font-normal text-red-800 space-y-1">
                  <p className="font-semibold text-red-900">💡 MongoDB Atlas Connection Check:</p>
                  <p>1. Open <strong>MongoDB Atlas → Network Access</strong>.</p>
                  <p>2. Add IP <code>0.0.0.0/0</code> (Allow Access from Anywhere).</p>
                  <p>3. Check <code>/api/health</code> to verify server status.</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@student.edu"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-forest-700 hover:text-forest-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-50 mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 font-medium">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-forest-700 hover:text-forest-800 hover:underline"
            >
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
