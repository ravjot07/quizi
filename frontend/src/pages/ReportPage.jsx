import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid
} from "recharts";

const COLORS = {
  correct: "#10B981", // emerald
  incorrect: "#EF4444", // red-500
  unanswered: "#F59E0B", // amber-500
  easy: "#34D399",
  medium: "#60A5FA",
  hard: "#F97316"
};

function smallCard({ title, value, subtitle }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-sm text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
        const res = await fetch(`/api/report/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const metrics = useMemo(() => {
    if (!report) return null;
    const total = report.total || report.questions.length || 0;
    const score = report.score ?? 0;
    // userAnswers keys might be strings
    const ua = report.userAnswers || {};
    let correct = 0, incorrect = 0, unanswered = 0;
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    const difficultyCorrect = { easy: 0, medium: 0, hard: 0 };

    for (let i = 0; i < total; i++) {
      const q = report.questions[i];
      const user = ua[i] ?? ua[String(i)] ?? null;
      const isCorrect = user !== null && user === q.correct_answer;
      if (user === null || user === undefined) unanswered++;
      else if (isCorrect) correct++;
      else incorrect++;

      const d = (q.difficulty || "medium").toLowerCase();
      if (d in difficultyCounts) difficultyCounts[d]++;
      else difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
      if (isCorrect) {
        difficultyCorrect[d] = (difficultyCorrect[d] || 0) + 1;
      }
    }

    // parse timeUsed (server returns like "123s" or "approx 30m")
    let totalSeconds = null;
    if (report.timeUsed) {
      const m = report.timeUsed.match(/(\d+)\s*s/);
      if (m) totalSeconds = Number(m[1]);
      else {
        const mm = report.timeUsed.match(/(\d+)\s*m/);
        if (mm) totalSeconds = Number(mm[1]) * 60;
      }
    }
    // fallback: if startedAt/finishedAt present
    if (!totalSeconds && report.startedAt && report.finishedAt) {
      totalSeconds = Math.max(0, Math.round((new Date(report.finishedAt) - new Date(report.startedAt)) / 1000));
    }

    // compute per-question time: if server returned perQuestionTime non-null use them, else approximate evenly
    let perQuestionSeconds = [];
    if (report.perQuestionTime && report.perQuestionTime.length === total && report.perQuestionTime.some(Boolean)) {
      perQuestionSeconds = report.perQuestionTime.map((t) => (typeof t === "number" ? t : null));
    } else if (totalSeconds) {
      const avg = Math.floor(totalSeconds / Math.max(1, total));
      perQuestionSeconds = new Array(total).fill(avg);
    } else {
      perQuestionSeconds = new Array(total).fill(null);
    }

    return {
      total,
      score,
      correct,
      incorrect,
      unanswered,
      percent: total ? Math.round((score / total) * 100) : 0,
      difficultyCounts,
      difficultyCorrect,
      totalSeconds,
      perQuestionSeconds
    };
  }, [report]);

  if (loading) return <div>Loading report...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!report) return <div>No report available</div>;

  const donutData = [
    { name: "Correct", value: metrics.correct, color: COLORS.correct },
    { name: "Incorrect", value: metrics.incorrect, color: COLORS.incorrect },
    { name: "Unanswered", value: metrics.unanswered, color: COLORS.unanswered }
  ];

  const difficultyData = [
    { difficulty: "Easy", total: metrics.difficultyCounts.easy || 0, correct: metrics.difficultyCorrect.easy || 0, color: COLORS.easy },
    { difficulty: "Medium", total: metrics.difficultyCounts.medium || 0, correct: metrics.difficultyCorrect.medium || 0, color: COLORS.medium },
    { difficulty: "Hard", total: metrics.difficultyCounts.hard || 0, correct: metrics.difficultyCorrect.hard || 0, color: COLORS.hard }
  ];

  const perQuestionChartData = report.questions.map((q, idx) => ({
    name: `Q${idx + 1}`,
    time: metrics.perQuestionSeconds[idx] ?? 0,
    correct: (report.userAnswers && (report.userAnswers[idx] ?? report.userAnswers[String(idx)]) === q.correct_answer) ? 1 : 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Quiz Report</h2>
          <div className="text-sm text-slate-500">Session: <span className="font-mono">{report.sessionId}</span></div>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200">Back to start</Link>
          <button
            onClick={() => {
              // simple print/export
              window.print();
            }}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Print report
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {smallCard({ title: "Score", value: `${metrics.score} / ${metrics.total}`, subtitle: `Percent: ${metrics.percent}%` })}
        {smallCard({ title: "Time used", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 60)}m ${metrics.totalSeconds % 60}s` : report.timeUsed || "N/A", subtitle: `${metrics.totalSeconds ? `${Math.round(metrics.totalSeconds / metrics.total)}s / question (avg)` : ""}` })}
        {smallCard({ title: "Answered", value: `${metrics.total - metrics.unanswered}`, subtitle: `${metrics.unanswered} unanswered` })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Result Breakdown</div>
            <div className="text-sm text-slate-500">Correct vs Incorrect</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {donutData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-3 justify-center">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span style={{ background: d.color }} className="w-3 h-3 rounded-full inline-block" />
                <span>{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Performance by Difficulty</div>
            <div className="text-sm text-slate-500">Correct answers per difficulty</div>
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" name="Total" stackId="a" fill="#E5E7EB" />
                <Bar dataKey="correct" name="Correct" stackId="a" fill={COLORS.correct} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-sm text-slate-500">
            Correct ratios:{" "}
            {difficultyData.map((d, i) => {
              const ratio = d.total ? Math.round((d.correct / d.total) * 100) : 0;
              return <span key={d.difficulty} className="mr-2">{d.difficulty}: <strong>{ratio}%</strong></span>;
            })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Time Spent per Question</div>
            <div className="text-sm text-slate-500">Approximate</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={perQuestionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="time" name="Seconds" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Note: per-question times are approximate when exact timings are not available.
          </div>
        </div>
      </div>

      {/* Detailed Q/A list */}
      <div className="space-y-4">
        {report.questions.map((q, idx) => {
          const userAns = (report.userAnswers && (report.userAnswers[idx] ?? report.userAnswers[String(idx)])) ?? null;
          const isCorrect = q.correct_answer === userAns;
          return (
            <div key={idx} className="p-4 bg-white rounded shadow-sm flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm text-slate-500 mb-1">Question {idx + 1} • {q.category} • {q.difficulty}</div>
                <div className="font-medium mb-2" dangerouslySetInnerHTML={{ __html: q.question }} />
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className={`px-2 py-1 rounded ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    Your answer: <span className="font-semibold" dangerouslySetInnerHTML={{ __html: userAns ?? "No answer" }} />
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-100 text-slate-800">
                    Correct answer: <span className="font-semibold" dangerouslySetInnerHTML={{ __html: q.correct_answer }} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-400">Time spent: {metrics.perQuestionSeconds[idx] ? `${metrics.perQuestionSeconds[idx]}s` : "approx N/A"}</div>
              </div>
              <div className="flex items-start md:items-center">
                <div className={`px-3 py-1 rounded text-sm font-semibold ${isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                  {isCorrect ? "Correct ✓" : (userAns ? "Incorrect ✕" : "No answer")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
