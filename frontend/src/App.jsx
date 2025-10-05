import React from "react";
import { Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import QuizPage from "./pages/QuizPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-6">
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/report/:sessionId" element={<ReportPage />} />
        </Routes>
      </div>
    </div>
  );
}
