import { create } from 'zustand';
import axios from 'axios';

export const useGameStore = create((set, get) => ({
  currentAttempt: null,   // { id, levelId }
  currentQuestion: null,
  timeLeft: 0,
  hintsUsed: 0,
  powerUps: [],
  score: 0,

  // Call the backend to create an attempt, then store the real attempt id
  startLevel: async (levelId) => {
    try {
      const response = await axios.post('/learning/start-level/', { level_id: levelId });
      const attempt = response.data;
      set({
        currentAttempt: { id: attempt.id, levelId },
        timeLeft: attempt.time_limit || 300,
        hintsUsed: 0,
        score: 0,
      });
      return attempt;
    } catch (error) {
      console.error('Error starting level:', error);
      throw error;
    }
  },

  submitAnswer: async (questionId, answer) => {
    const { currentAttempt, hintsUsed } = get();
    if (!currentAttempt) {
      console.error('No active attempt');
      return null;
    }

    try {
      const response = await axios.post('/learning/submit-answer/', {
        attempt_id: currentAttempt.id,
        question_id: questionId,
        answer,
        time_taken: 30,
        hints_used: hintsUsed,
      });

      const result = response.data;
      if (result.xp_earned) {
        set({ score: get().score + result.xp_earned });
      }
      return result;
    } catch (error) {
      console.error('Error submitting answer:', error);
      return null;
    }
  },

  completeLevel: async () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return null;

    try {
      const response = await axios.post('/learning/complete-level/', {
        attempt_id: currentAttempt.id,
      });

      const result = response.data;
      set({ currentAttempt: null, currentQuestion: null });
      return result;
    } catch (error) {
      console.error('Error completing level:', error);
      return null;
    }
  },

  useHint: () => {
    set({ hintsUsed: get().hintsUsed + 1 });
  },

  usePowerUp: (powerUpId) => {
    const powerUps = get().powerUps.filter(p => p.id !== powerUpId);
    set({ powerUps });
  },
}));
