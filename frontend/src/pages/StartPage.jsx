import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizStore } from "../store/useQuizStore";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-indigo-600 text-white w-9 h-9 flex items-center justify-center rounded-lg font-bold text-lg">
        Q
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Quizi</h1>
        <p className="text-xs text-slate-500 tracking-wide -mt-1">
          CasualFunnel Assignment
        </p>
      </div>
    </div>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.15"
      />
      <path
        d="M22 12a10 10 0 10-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StartPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useQuizStore((s) => s.setSession);
  const clear = useQuizStore((s) => s.clear);
  const navigate = useNavigate();

  async function handleStart(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      return alert(
        "Please enter a valid email address (e.g. jane@company.com)."
      );
    }
    setLoading(true);
    clear();
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
      const res = await fetch(`${API_BASE}/api/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      setSession({
        sessionId: data.sessionId,
        email: trimmed,
        questions: data.questions,
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
      });
      navigate("/quiz");
    } catch (err) {
      console.error(err);
      alert("Could not start quiz — please try again.");
      clear();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden border border-slate-100">
        {/* background accent */}
        <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-indigo-100 opacity-40 blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <div className="hidden sm:block text-xs text-slate-400">
            © {new Date().getFullYear()} CasualFunnel Project
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left section */}
          <div className="md:col-span-2 space-y-5">
            <h2 className="text-3xl font-semibold text-slate-800 leading-snug">
              Take the{" "}
              <span className="text-indigo-600 font-bold">Quizi Challenge</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              A simple, time-bound quiz created as part of the{" "}
              <strong>CasualFunnel</strong> assignment. You’ll get 15 random
              questions from various topics — answer them all before the
              30-minute timer ends.
            </p>

            <form
              onSubmit={handleStart}
              className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center"
            >
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                autoComplete="email"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              >
                {loading && <Spinner className="w-4 h-4 text-white" />}
                <span>{loading ? "Starting..." : "Start Quiz"}</span>
              </button>
            </form>

            <p className="text-xs text-slate-500 mt-3">
              Entering your email creates a new session. Your progress and
              results remain private.
            </p>
          </div>

          {/* Right section - project info */}
          <aside className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-inner">
            <h3 className="text-sm font-semibold text-slate-700">
              Project Info
            </h3>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt className="text-slate-500">Project</dt>
                <dd className="font-medium">CasualFunnel - Quizi</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Mode</dt>
                <dd className="font-medium">Timed Quiz (30 min)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Questions</dt>
                <dd className="font-medium">15 randomized</dd>
              </div>
            </dl>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Tech Stack
              </h4>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• React (Vite) + Tailwind CSS</li>
                <li>• Zustand for state management</li>
                <li>• Node.js + Express backend</li>
              </ul>
            </div>

            <div className="mt-6 text-xs text-slate-400 leading-relaxed">
              This quiz demo is part of a full-stack assignment showcasing user
              session handling, live question fetching, and auto-submit
              features.
            </div>
          </aside>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-400">
          Built with ❤️ for CasualFunnel — Designed by Ravjot Singh
        </footer>
      </div>
    </div>
  );
}
