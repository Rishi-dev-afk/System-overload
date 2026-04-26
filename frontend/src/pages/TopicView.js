import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star } from 'lucide-react';
import axios from 'axios';

export const TopicView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectResponse, topicsResponse] = await Promise.all([
          axios.get(`/subjects/${topicId}/`),
          axios.get('/topics/', { params: { subject: topicId } })
        ]);
        
        setSubject(subjectResponse.data);
        setTopics(topicsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading topics...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center text-text-secondary">
        Subject not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/world')}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to World</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-accent-blue">{subject.name}</h1>
          <p className="text-text-secondary">{subject.description}</p>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="bg-dark-card p-6 rounded-lg border border-dark-border hover:border-accent-blue transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{topic.name}</h3>
                <p className="text-text-secondary text-sm mb-3">{topic.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    topic.difficulty === 'beginner' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                    topic.difficulty === 'intermediate' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                    'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < 2 ? "text-yellow-500 fill-current" : "text-gray-600"} 
                    />
                  ))}
                </div>
                <p className="text-text-secondary text-xs">2/3 completed</p>
              </div>
            </div>

            {/* Levels */}
            <div className="space-y-2">
              {[1, 2, 3].map((levelNum) => (
                <div
                  key={levelNum}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded border border-dark-border hover:border-accent-purple transition-colors cursor-pointer group"
                  onClick={() => navigate(`/challenge/${topic.id}-${levelNum}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-accent-blue bg-opacity-20 flex items-center justify-center text-accent-blue font-semibold">
                      {levelNum}
                    </div>
                    <div>
                      <p className="font-medium">Level {levelNum}</p>
                      <p className="text-text-secondary text-sm">100 XP • 5 min</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {levelNum === 3 && <span className="text-red-400 text-xs">BOSS</span>}
                    <Play size={16} className="text-text-secondary group-hover:text-accent-blue transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Your Progress in {subject.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-blue">2</p>
            <p className="text-text-secondary">Topics Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-purple">450</p>
            <p className="text-text-secondary">XP Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">85%</p>
            <p className="text-text-secondary">Average Accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
};