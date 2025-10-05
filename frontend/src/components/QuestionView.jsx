
import React, { useEffect, useRef, useState } from "react";
import { useQuizStore } from "../store/useQuizStore";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function QuestionView({ questionObj, index }) {
  const markVisited = useQuizStore((s) => s.markVisited);
  const answers = useQuizStore((s) => s.answers);
  const setAnswer = useQuizStore((s) => s.setAnswer);
  const selected = answers[index] ?? null;
  const [focusedIdx, setFocusedIdx] = useState(() => {
    // if already selected, focus that index initially
    return questionObj.choices?.indexOf(selected) ?? 0;
  });
  const listRef = useRef(null);

  useEffect(() => {
    markVisited(index);
  }, [index, markVisited]);

  const choices = questionObj.choices || [];

  // keep focused index within bounds when choices change
  useEffect(() => {
    if (focusedIdx >= choices.length) setFocusedIdx(0);
  }, [choices.length, focusedIdx]);

  // keyboard handling inside this component (Arrow keys navigate options)
  useEffect(() => {
    function onKey(e) {
      if (!choices || choices.length === 0) return;
      // Only act when an option is focused or when user is on this question (we can't know focus high-level reliably),
      // we check if any element inside listRef is document.activeElement's ancestor.
      const el = listRef.current;
      if (!el) return;
      const active = document.activeElement;
      if (!el.contains(active)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (focusedIdx + 1) % choices.length;
        setFocusedIdx(next);
        setAnswer(index, choices[next]);
        // move focus to the corresponding button
        const btn = el.querySelectorAll("button")[next];
        btn && btn.focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = (focusedIdx - 1 + choices.length) % choices.length;
        setFocusedIdx(prev);
        setAnswer(index, choices[prev]);
        const btn = el.querySelectorAll("button")[prev];
        btn && btn.focus();
      } else if (e.key === " " || e.key === "Enter") {
        // space/enter should toggle current focused option (already setAnswer used above)
        e.preventDefault();
        const cur = focusedIdx;
        setAnswer(index, choices[cur]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, focusedIdx, index, setAnswer]);

  // small helper for accessibility label of a choice
  function choiceLabel(i, c) {
    return `Option ${LETTERS[i]}: ${c.replace(/(<([^>]+)>)/gi, "")}`;
  }

  return (
    <article className="space-y-4" aria-labelledby={`q-${index}-title`}>
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">
            Question {index + 1} / {useQuizStore.getState().questions.length}
          </div>
          <h2
            id={`q-${index}-title`}
            className="mt-1 text-lg md:text-xl font-semibold text-slate-800 leading-tight"
            dangerouslySetInnerHTML={{ __html: questionObj.question }}
          />
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            {questionObj.category && (
              <span className="px-2 py-0.5 bg-slate-100 rounded">
                {questionObj.category}
              </span>
            )}
            {questionObj.difficulty && (
              <span
                className="px-2 py-0.5 rounded capitalize"
                style={{
                  background:
                    questionObj.difficulty === "easy"
                      ? "#ECFCCB"
                      : questionObj.difficulty === "hard"
                      ? "#FFE8D6"
                      : "#DBEAFE",
                  color:
                    questionObj.difficulty === "hard" ? "#C2410C" : "#065F46",
                }}
              >
                {questionObj.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div className="hidden sm:flex sm:flex-col items-end">
          <div className="text-xs text-slate-500 mb-1">Progress</div>
          <div className="w-40 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-indigo-600 transition-all"
              style={{
                width: `${Math.round(
                  ((index + 1) /
                    Math.max(1, useQuizStore.getState().questions.length)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* choices */}
      <div
        ref={listRef}
        role="radiogroup"
        aria-labelledby={`q-${index}-title`}
        className="grid gap-3"
      >
        {choices.map((c, i) => {
          const isSelected = selected === c;
          return (
            <button
              key={i}
              role="radio"
              aria-checked={isSelected}
              aria-label={choiceLabel(i, c)}
              onClick={() => {
                setAnswer(index, c);
                setFocusedIdx(i);
              }}
              onFocus={() => setFocusedIdx(i)}
              className={`text-left w-full p-3 rounded-lg border transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-200
                ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 shadow-sm"
                    : "bg-white border-slate-200 hover:shadow"
                } 
                flex items-start gap-4`}
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center font-medium ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {LETTERS[i]}
              </div>

              <div className="flex-1">
                <div
                  className={`text-sm ${
                    isSelected
                      ? "text-indigo-800 font-semibold"
                      : "text-slate-700"
                  }`}
                  dangerouslySetInnerHTML={{ __html: c }}
                />
                <div className="mt-1 text-xs text-slate-400">
                </div>
              </div>

              <div className="ml-2">
                {isSelected ? (
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-200" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
