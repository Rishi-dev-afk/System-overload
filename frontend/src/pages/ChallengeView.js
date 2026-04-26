import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Lightbulb, Zap, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import axios from 'axios';

export const ChallengeView = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { startLevel, submitAnswer, completeLevel, useHint, timeLeft, hintsUsed, score } = useGameStore();

  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { is_correct, feedback }
  const [error, setError] = useState('');

  const initializeLevel = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Start level via gameStore (which calls the API and stores the real attempt id)
      await startLevel(levelId);

      // Fetch level details and questions in parallel
      const [levelResponse, questionsResponse] = await Promise.all([
        axios.get(`/levels/${levelId}/`),
        axios.get('/questions/', { params: { level: levelId } }),
      ]);

      setLevel(levelResponse.data);

      // Handle both paginated and non-paginated responses
      const qData = questionsResponse.data;
      setQuestions(Array.isArray(qData) ? qData : (qData.results || []));
    } catch (err) {
      console.error('Error initializing level:', err);
      setError('Failed to load this level. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [levelId, startLevel]);

  useEffect(() => {
    initializeLevel();
  }, [initializeLevel]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || submitting) return;

    setSubmitting(true);
    const result = await submitAnswer(currentQuestion.id, selectedAnswer);
    setSubmitting(false);

    if (!result) {
      setError('Failed to submit answer. Please try again.');
      return;
    }

    setLastResult(result);

    // Show result briefly, then advance
    setTimeout(async () => {
      setLastResult(null);
      if (isLastQuestion) {
        const completion = await completeLevel();
        if (completion) {
          navigate('/world', { state: { levelComplete: true, xpEarned: completion.xp_earned } });
        } else {
          navigate('/world');
        }
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
        setShowHint(false);
      }
    }, 1500);
  };

  const handleUseHint = () => {
    useHint();
    setShowHint(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-accent-blue text-dark-bg rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!level || questions.length === 0) {
    return (
      <div className="text-center text-text-secondary">
        No questions found for this level.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Exit Challenge</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock size={20} className="text-text-secondary" />
            <span className="font-mono">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={20} className="text-yellow-500" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{level.title}</h2>
          <span className="text-text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-dark-border rounded-full h-2">
          <div
            className="bg-accent-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">{currentQuestion.question_text}</h3>

          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnswer === option
                      ? 'border-accent-blue bg-accent-blue bg-opacity-10'
                      : 'border-dark-border hover:border-accent-purple'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={e => setSelectedAnswer(e.target.value)}
                    className="text-accent-blue focus:ring-accent-blue"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <div className="space-y-3">
              {['True', 'False'].map(option => (
                <label
                  key={option}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnswer === option
                      ? 'border-accent-blue bg-accent-blue bg-opacity-10'
                      : 'border-dark-border hover:border-accent-purple'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={e => setSelectedAnswer(e.target.value)}
                    className="text-accent-blue focus:ring-accent-blue"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'code') && (
            <textarea
              value={selectedAnswer}
              onChange={e => setSelectedAnswer(e.target.value)}
              placeholder={currentQuestion.question_type === 'code' ? 'Write your code here...' : 'Enter your answer...'}
              className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-blue focus:outline-none font-mono"
              rows={currentQuestion.question_type === 'code' ? 8 : 4}
            />
          )}
        </div>

        {/* Hint */}
        {showHint && currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg">
            <p className="text-yellow-400">
              <strong>Hint:</strong> {currentQuestion.hints[Math.min(hintsUsed - 1, currentQuestion.hints.length - 1)]}
            </p>
          </div>
        )}

        {/* Answer result feedback */}
        {lastResult && (
          <div className={`mb-4 p-4 rounded-lg flex items-start space-x-3 ${
            lastResult.is_correct
              ? 'bg-green-500 bg-opacity-10 border border-green-500 border-opacity-40'
              : 'bg-red-500 bg-opacity-10 border border-red-500 border-opacity-40'
          }`}>
            {lastResult.is_correct
              ? <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
              : <XCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
            }
            <p className={lastResult.is_correct ? 'text-green-400' : 'text-red-400'}>
              {lastResult.feedback}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleUseHint}
            disabled={showHint || !currentQuestion.hints?.length}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb size={16} />
            <span>Use Hint ({hintsUsed}/3)</span>
          </button>

          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || submitting || !!lastResult}
            className="px-6 py-2 bg-accent-blue text-dark-bg font-semibold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : isLastQuestion ? 'Complete Level' : 'Submit Answer'}
          </button>
        </div>
      </div>

      {/* Power-ups */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
        <h3 className="font-semibold mb-3">Power-ups</h3>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors opacity-60 cursor-not-allowed" disabled>
            <Zap size={16} />
            <span>Time Freeze</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors opacity-60 cursor-not-allowed" disabled>
            <Lightbulb size={16} />
            <span>Extra Hint</span>
          </button>
        </div>
      </div>
    </div>
  );
};
