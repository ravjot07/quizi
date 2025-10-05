// backend/routes/api.js
const express = require("express");
const fetch = require("node-fetch"); // v2 (2.6.9) works with require(); if using v3+, switch to ESM
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../mongo");

const router = express.Router();

const QUIZ_TTL_MS = 30 * 60 * 1000; // 30 minutes

function err(res, code, msg) {
  return res.status(code).json({ message: msg });
}
function okJSON(res, payload) {
  // ensure content-type is JSON and send payload
  res.type("application/json");
  return res.json(payload);
}

// Simple HTML entity decode (same as before)
function decodeHTMLEntities(str) {
  if (!str || typeof str !== "string") return str;
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ent[0] === "#") {
      const isHex = ent[1] === "x" || ent[1] === "X";
      const code = parseInt(ent.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (!isNaN(code)) return String.fromCharCode(code);
      return m;
    }
    const map = { quot: '"', amp: "&", apos: "'", lt: "<", gt: ">", nbsp: " " };
    return map[ent] || m;
  });
}

// Deterministic shuffle (same as previous)
function seededShuffle(arr, seedStr) {
  const a = arr.slice();
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++)
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  function rand() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * POST /api/start
 * Persist session doc into MongoDB collection "sessions"
 */
router.post("/start", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return err(res, 400, "Invalid email");
    }
    const resp = await fetch("https://opentdb.com/api.php?amount=15");
    if (!resp.ok)
      return err(res, 502, "Failed to fetch questions from OpenTDB");
    const json = await resp.json();
    if (
      !json.results ||
      !Array.isArray(json.results) ||
      json.results.length < 1
    ) {
      return err(res, 502, "No questions returned");
    }

    const sessionId = uuidv4();
    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + QUIZ_TTL_MS).toISOString();

    const fullQuestions = json.results.map((q) => ({
      category: decodeHTMLEntities(q.category),
      type: q.type,
      difficulty: q.difficulty,
      question: decodeHTMLEntities(q.question),
      correct_answer: decodeHTMLEntities(q.correct_answer),
      incorrect_answers: Array.isArray(q.incorrect_answers)
        ? q.incorrect_answers.map(decodeHTMLEntities)
        : [],
    }));

    const safeQuestions = fullQuestions.map((q, idx) => {
      const seed = `${sessionId}-${idx}`;
      const choices = seededShuffle(
        [q.correct_answer, ...q.incorrect_answers],
        seed
      );
      return {
        category: q.category,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        choices,
      };
    });

    // Persist session in MongoDB
    const db = getDb();
    const sessions = db.collection("sessions");
    const doc = {
      sessionId,
      email,
      questions: fullQuestions, // server-side: keep correct answers
      createdAt: new Date(),
      startedAt,
      expiresAt,
      userAnswers: {},
      finishedAt: null,
      score: null,
      perQuestionCorrect: null,
      expiredAtSubmission: false,
    };
    await sessions.insertOne(doc);

    return okJSON(res, {
      sessionId,
      questions: safeQuestions,
      startedAt,
      expiresAt,
    });
  } catch (e) {
    console.error(e);
    return err(res, 500, "Server error");
  }
});

/**
 * POST /api/submit
 * Update the session document with answers, compute score, and persist results.
 */
router.post("/submit", async (req, res) => {
  try {
    const { sessionId, answers, finishedAt } = req.body || {};
    if (!sessionId) return err(res, 400, "Missing sessionId");
    const db = getDb();
    const sessions = db.collection("sessions");
    const session = await sessions.findOne({ sessionId });
    if (!session) return err(res, 404, "Session not found");

    if (!Array.isArray(answers))
      return err(res, 400, "Answers must be an array");
    const updatedAnswers = { ...(session.userAnswers || {}) };
    answers.forEach((a) => {
      if (typeof a.questionIndex !== "number" || typeof a.answer !== "string") {
        throw new Error("Invalid answer item");
      }
      updatedAnswers[a.questionIndex] = a.answer;
    });

    const finalFinishedAt = finishedAt || new Date().toISOString();
    const total = Array.isArray(session.questions)
      ? session.questions.length
      : 0;
    let score = 0;
    const perQuestionCorrect = [];
    for (let i = 0; i < total; i++) {
      const correct = session.questions[i].correct_answer;
      const user = updatedAnswers[i] ?? null;
      const isCorrect = user !== null && user === correct;
      perQuestionCorrect.push(isCorrect);
      if (isCorrect) score++;
    }
    const expired = new Date(session.expiresAt) < new Date(finalFinishedAt);

    // update doc
    const update = {
      $set: {
        userAnswers: updatedAnswers,
        finishedAt: finalFinishedAt,
        score,
        perQuestionCorrect,
        expiredAtSubmission: expired,
        updatedAt: new Date(),
      },
    };
    await sessions.updateOne({ sessionId }, update);

    return okJSON(res, { sessionId, score, total });
  } catch (e) {
    console.error(e);
    return err(res, 500, "Invalid submission payload or server error");
  }
});

/**
 * GET /api/report/:sessionId
 * Read session from DB and return report (including correct answers).
 */
router.get("/report/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return err(res, 400, "Missing sessionId");
    const db = getDb();
    const sessions = db.collection("sessions");
    const session = await sessions.findOne({ sessionId });
    if (!session) return err(res, 404, "Session not found");

    const total = Array.isArray(session.questions)
      ? session.questions.length
      : 0;
    const score =
      typeof session.score === "number"
        ? session.score
        : Object.keys(session.userAnswers || {}).reduce((acc, idx) => {
            const i = Number(idx);
            if (!session.questions || !session.questions[i]) return acc;
            return (
              acc +
              (session.questions[i].correct_answer === session.userAnswers[i]
                ? 1
                : 0)
            );
          }, 0);

    const perQuestionTime = new Array(total).fill(null);

    return okJSON(res, {
      sessionId: session.sessionId,
      email: session.email,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      expiredAtSubmission: session.expiredAtSubmission || false,
      total,
      score,
      questions: (session.questions || []).map((q) => ({
        question: q.question,
        correct_answer: q.correct_answer,
        incorrect_answers: q.incorrect_answers,
        category: q.category,
        difficulty: q.difficulty,
      })),
      userAnswers: session.userAnswers,
      perQuestionTime,
      timeUsed: session.finishedAt
        ? `${Math.round(
            (new Date(session.finishedAt) - new Date(session.startedAt)) / 1000
          )}s`
        : "approx 30m",
    });
  } catch (e) {
    console.error(e);
    return err(res, 500, "Server error");
  }
});

module.exports = router;
