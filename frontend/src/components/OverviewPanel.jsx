import React from "react";
import { useQuizStore } from "../store/useQuizStore";

function StatPill({
  label,
  value,
  bg = "bg-slate-100",
  color = "text-slate-700",
}) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${bg}`}
    >
      <span className={`${color} font-semibold`}>{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

export default function OverviewPanel({ currentIndex, onJump, onClose }) {
  const questions = useQuizStore((s) => s.questions);
  const visited = useQuizStore((s) => s.visited);
  const answers = useQuizStore((s) => s.answers);

  const total = questions.length;
  const attempted = Object.keys(answers).length;
  const visitedCount = Object.keys(visited).length;

  return (
    <aside className="w-full p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Overview</h3>
          <div className="text-xs text-slate-500">Jump to any question</div>
        </div>
        <div className="flex items-center gap-2">
          <StatPill
            label="Attempted"
            value={attempted}
            bg="bg-emerald-50"
            color="text-emerald-700"
          />
          <StatPill label="Visited" value={visitedCount} />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5">
        {questions.map((q, i) => {
          const idx = i;
          const isVisited = !!visited[idx];
          const isAttempted = !!answers[idx];
          const isCurrent = idx === currentIndex;
          let base =
            "p-2 rounded flex items-center justify-center text-sm transition-transform transform";
          let extra = "bg-slate-100 text-slate-700";
          if (isCurrent)
            extra = "bg-indigo-600 text-white scale-105 ring-2 ring-indigo-100";
          else if (isAttempted) extra = "bg-emerald-500 text-white";
          else if (isVisited) extra = "bg-amber-300 text-slate-800";
          return (
            <button
              key={i}
              onClick={() => onJump(idx)}
              className={`${base} ${extra} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
              aria-label={`Question ${i + 1} ${
                isAttempted
                  ? "attempted"
                  : isVisited
                  ? "visited"
                  : "not visited"
              }`}
              title={`Q${i + 1} • ${q.difficulty ?? ""} ${
                isAttempted ? "• answered" : isVisited ? "• visited" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full" />
              <span>Attempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-amber-300 rounded-full" />
              <span>Visited</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
