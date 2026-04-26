import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Zap, Shield, Sword } from 'lucide-react';

export const BossBattle = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [bossHealth, setBossHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions] = useState([
    {
      question: "What is the time complexity of quicksort in the worst case?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      correct: 2
    },
    {
      question: "Which scheduling algorithm can lead to starvation?",
      options: ["Round Robin", "FCFS", "Priority Scheduling", "SJF"],
      correct: 2
    },
    {
      question: "What does ACID stand for in database transactions?",
      options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Automatic, Concurrent, Isolated, Distributed", "All, Create, Insert, Delete"],
      correct: 0
    }
  ]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setBattleResult('defeat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    setShowResult(true);

    setTimeout(() => {
      if (isCorrect) {
        setBossHealth(prev => Math.max(0, prev - 25));
        if (bossHealth <= 25) {
          setBattleResult('victory');
        }
      } else {
        setPlayerHealth(prev => Math.max(0, prev - 20));
        if (playerHealth <= 20) {
          setBattleResult('defeat');
        }
      }

      if (currentQuestion < questions.length - 1 && !battleResult) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      }
    }, 2000);
  };

  const handleBattleEnd = () => {
    navigate('/world');
  };

  if (battleResult) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className={`text-6xl ${battleResult === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
          {battleResult === 'victory' ? '🏆' : '💀'}
        </div>
        <h1 className={`text-4xl font-bold ${battleResult === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
          {battleResult === 'victory' ? 'Victory!' : 'Defeated!'}
        </h1>
        <p className="text-xl text-text-secondary">
          {battleResult === 'victory' 
            ? 'You have conquered this boss level! Great job!' 
            : 'The boss was too strong this time. Keep practicing and try again!'}
        </p>
        <div className="space-y-4">
          <div className="text-2xl font-bold text-accent-purple">
            +500 XP Earned
          </div>
          <button
            onClick={handleBattleEnd}
            className="px-8 py-3 bg-accent-blue text-dark-bg font-semibold rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Return to World Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Battle Header */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-red-400">Boss Battle: Algorithm Overlord</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock size={20} className="text-text-secondary" />
              <span className="font-mono text-lg">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-accent-purple font-semibold">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Health Bars */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="text-blue-400" size={20} />
              <span className="font-semibold">Your Health</span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-4">
              <div 
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${playerHealth}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-text-secondary mt-1">{playerHealth}/100</p>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sword className="text-red-400" size={20} />
              <span className="font-semibold">Boss Health</span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-4">
              <div 
                className="bg-red-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${bossHealth}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-text-secondary mt-1">{bossHealth}/100</p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-semibold mb-6">{questions[currentQuestion].question}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              disabled={showResult}
              className={`p-4 text-left rounded-lg border transition-colors ${
                selectedAnswer === index
                  ? 'border-accent-blue bg-accent-blue bg-opacity-10'
                  : 'border-dark-border hover:border-accent-purple'
              } ${showResult ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className={`p-4 rounded-lg mb-4 ${
            selectedAnswer === questions[currentQuestion].correct
              ? 'bg-green-500 bg-opacity-10 border border-green-500'
              : 'bg-red-500 bg-opacity-10 border border-red-500'
          }`}>
            <p className={`font-semibold ${
              selectedAnswer === questions[currentQuestion].correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {selectedAnswer === questions[currentQuestion].correct ? 'Correct! Boss takes damage!' : 'Wrong! You take damage!'}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleAnswerSubmit}
            disabled={selectedAnswer === null || showResult}
            className="px-6 py-3 bg-accent-blue text-dark-bg font-semibold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showResult ? 'Next Question' : 'Submit Answer'}
          </button>
        </div>
      </div>

      {/* Power-ups */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
        <h3 className="font-semibold mb-3">Emergency Power-ups</h3>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-colors">
            <Zap size={16} />
            <span>50/50 (Cost: 25 XP)</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-colors">
            <Shield size={16} />
            <span>Shield (Cost: 50 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};