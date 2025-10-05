import React, { useEffect, useState, useRef } from "react";
import { useQuizStore } from "../store/useQuizStore";

function format(hms) {
  const h = String(Math.floor(hms / 3600)).padStart(2, "0");
  const m = String(Math.floor((hms % 3600) / 60)).padStart(2, "0");
  const s = String(hms % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function Timer({ onExpire }) {
  const expiresAt = useQuizStore((s) => s.expiresAt);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!expiresAt) return 30 * 60;
    return Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
  });
  const ticking = useRef(true);

  useEffect(() => {
    function tick() {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (ticking.current) {
            ticking.current = false;
            onExpire && onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  useEffect(() => {
    if (expiresAt) {
      setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)));
    }
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-lg">Time left:</div>
      <div className="bg-slate-100 px-3 py-1 rounded font-semibold tracking-wide">
        {format(secondsLeft)}
      </div>
    </div>
  );
}
