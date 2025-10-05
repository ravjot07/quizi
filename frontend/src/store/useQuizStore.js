import { create } from "zustand"; 

export const useQuizStore = create((set, get) => ({
  sessionId: null,
  email: null,
  questions: [], // questions as received from /api/start (sanitized, contains choices)
  startedAt: null,
  expiresAt: null,
  visited: {}, // { idx: true }
  answers: {}, // { idx: 'answer string' }
  finishedAt: null,
  score: null,
  perQuestionCorrect: null,
  // set session in one call (overwrites previous session)
  setSession: (payload) =>
    set(() => ({
      sessionId: payload.sessionId ?? null,
      email: payload.email ?? null,
      questions: payload.questions ?? [],
      startedAt: payload.startedAt ?? null,
      expiresAt: payload.expiresAt ?? null,
      visited: {},
      answers: {},
      finishedAt: null,
      score: null,
      perQuestionCorrect: null,
    })),
  // clear all state
  clear: () =>
    set({
      sessionId: null,
      email: null,
      questions: [],
      startedAt: null,
      expiresAt: null,
      visited: {},
      answers: {},
      finishedAt: null,
      score: null,
      perQuestionCorrect: null,
    }),
  markVisited: (index) =>
    set((state) => ({ visited: { ...state.visited, [index]: true } })),
  setAnswer: (index, answer) =>
    set((state) => ({ answers: { ...state.answers, [index]: answer } })),
  setFinished: (finishedAt, { score = null, perQuestionCorrect = null } = {}) =>
    set({ finishedAt, score, perQuestionCorrect }),
}));
