// frontend/src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useQuizStore } from "../store/useQuizStore";
import { useNavigate } from "react-router-dom";
import QuestionView from "../components/QuestionView";
import OverviewPanel from "../components/OverviewPanel";
import Timer from "../components/Timer";

export default function QuizPage() {
  const questions = useQuizStore((s) => s.questions);
  const sessionId = useQuizStore((s) => s.sessionId);
  const answers = useQuizStore((s) => s.answers);
  const setFinished = useQuizStore((s) => s.setFinished);
  const [current, setCurrent] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const navigate = useNavigate();
  const autoSubmittingRef = useRef(false);
  const startedAt = useQuizStore((s) => s.startedAt);

  // reset local pagination when session changes (fixes stale session view)
  useEffect(() => {
    setCurrent(0);
    setOverviewOpen(false);
    autoSubmittingRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) navigate("/");
  }, [sessionId, navigate]);

  // keyboard: left/right for prev/next, O toggles overview
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      else if (e.key === "ArrowRight")
        setCurrent((c) => Math.min(questions.length - 1, c + 1));
      else if (e.key.toLowerCase() === "o") setOverviewOpen((s) => !s);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions.length]);

  async function submitQuiz(finishedAtISO = new Date().toISOString()) {
    if (autoSubmittingRef.current) return;
    autoSubmittingRef.current = true;
    try {
      const payload = {
        sessionId,
        answers: Object.keys(answers).map((k) => ({
          questionIndex: Number(k),
          answer: answers[k],
        })),
        finishedAt: finishedAtISO,
      };
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
      const res = await fetch(`${API_BASE}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Submission failed: " + (err.message || res.statusText));
        autoSubmittingRef.current = false;
        return;
      }
      const data = await res.json();
      // update finished state in store (score saved on backend; we still mark finished)
      setFinished(finishedAtISO, {
        score: data.score,
        perQuestionCorrect: data.perQuestionCorrect ?? null,
      });
      navigate(`/report/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Submission error");
      autoSubmittingRef.current = false;
    }
  }

  function handleExpire() {
    submitQuiz(new Date().toISOString());
  }

  if (!questions || questions.length === 0) {
    return <div>Loading quiz... (if this hangs, go back to start)</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <Timer onExpire={handleExpire} />
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setOverviewOpen((s) => !s)}
              className="px-3 py-1 border rounded focus:outline-none focus:ring"
              aria-expanded={overviewOpen}
            >
              Overview
            </button>
            <button
              onClick={() => {
                if (!confirm("Submit quiz now?")) return;
                submitQuiz(new Date().toISOString());
              }}
              className="px-3 py-1 bg-emerald-600 text-white rounded"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded transition-all">
          <div
            className="transition-opacity transform duration-200 ease-out"
            key={current}
          >
            <QuestionView questionObj={questions[current]} index={current} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-between items-center">
          <div>
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              className="px-3 py-1 border rounded mr-2"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrent((c) => Math.min(questions.length - 1, c + 1))
              }
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-slate-500">
            Question {current + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Sidebar (desktop) */}
      <div className="hidden md:block w-72">
        <div className="sticky top-6">
          <OverviewPanel
            currentIndex={current}
            onJump={(i) => {
              setCurrent(i);
              setOverviewOpen(false);
            }}
            onClose={() => setOverviewOpen(false)}
          />
        </div>
      </div>

      {/* Mobile modal overview */}
      {overviewOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOverviewOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md mx-4">
            <OverviewPanel
              currentIndex={current}
              onJump={(i) => {
                setCurrent(i);
                setOverviewOpen(false);
              }}
              onClose={() => setOverviewOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
