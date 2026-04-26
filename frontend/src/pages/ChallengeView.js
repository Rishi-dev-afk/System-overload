import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Lightbulb, Zap, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import axios from 'axios';

export const ChallengeView = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { startLevel, submitAnswer, useHint, timeLeft, hintsUsed, score } = useGameStore();
  
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeLevel = async () => {
      try {
        // Start the level
        const attemptResponse = await axios.post('/learning/start-level/', {
          level_id: levelId
        });
        
        // Fetch level details
        const levelResponse = await axios.get(`/levels/${levelId}/`);
        setLevel(levelResponse.data);
        
        // Fetch questions
        const questionsResponse = await axios.get('/questions/', {
          params: { level: levelId }
        });
        setQuestions(questionsResponse.data);
        
        startLevel(levelId);
      } catch (error) {
        console.error('Error initializing level:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeLevel();
  }, [levelId, startLevel]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const result = await submitAnswer(currentQuestion.id, selectedAnswer);
    
    if (result) {
      if (isLastQuestion) {
        // Complete level
        await axios.post('/learning/complete-level/', {
          attempt_id: result.attempt_id
        });
        navigate('/world');
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
        setShowHint(false);
      }
    }
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

  if (!level || !currentQuestion) {
    return (
      <div className="text-center text-text-secondary">
        Challenge not found
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
            <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={20} className="text-yellow-500" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Progress */}
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
          ></div>
        </div>
      </div>

      {/* Question */}
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
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="text-accent-blue focus:ring-accent-blue"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <textarea
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Enter your answer..."
              className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-blue focus:outline-none"
              rows={4}
            />
          )}
        </div>

        {/* Hint */}
        {showHint && currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg">
            <p className="text-yellow-400">
              <strong>Hint:</strong> {currentQuestion.hints[0]}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleUseHint}
            disabled={showHint}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb size={16} />
            <span>Use Hint ({hintsUsed}/3)</span>
          </button>
          
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className="px-6 py-2 bg-accent-blue text-dark-bg font-semibold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastQuestion ? 'Complete Level' : 'Next Question'}
          </button>
        </div>
      </div>

      {/* Power-ups */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
        <h3 className="font-semibold mb-3">Power-ups</h3>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors">
            <Zap size={16} />
            <span>Time Freeze</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-purple transition-colors">
            <Lightbulb size={16} />
            <span>Extra Hint</span>
          </button>
        </div>
      </div>
    </div>
  );
};