import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  currentAttempt: null,
  currentQuestion: null,
  timeLeft: 0,
  hintsUsed: 0,
  powerUps: [],
  score: 0,

  startLevel: (levelId) => {
    // API call to start level
    set({ 
      currentAttempt: { id: 'temp', levelId },
      timeLeft: 300, // 5 minutes
      hintsUsed: 0,
      score: 0
    });
  },

  submitAnswer: async (questionId, answer) => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;

    try {
      const response = await fetch(`/api/learning/submit-answer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attempt_id: currentAttempt.id,
          question_id: questionId,
          answer,
          time_taken: 30, // Calculate actual time
          hints_used: get().hintsUsed
        })
      });

      const result = await response.json();
      set({ score: get().score + (result.xp_earned || 0) });
      return result;
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  },

  useHint: () => {
    set({ hintsUsed: get().hintsUsed + 1 });
  },

  usePowerUp: (powerUpId) => {
    // Implement power-up logic
    const powerUps = get().powerUps.filter(p => p.id !== powerUpId);
    set({ powerUps });
  },

  completeLevel: async () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;

    try {
      const response = await fetch(`/api/learning/complete-level/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attempt_id: currentAttempt.id
        })
      });

      const result = await response.json();
      set({ currentAttempt: null, currentQuestion: null });
      return result;
    } catch (error) {
      console.error('Error completing level:', error);
    }
  }
}));