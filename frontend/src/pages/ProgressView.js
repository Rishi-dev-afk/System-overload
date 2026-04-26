import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';
import axios from 'axios';

export const ProgressView = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await axios.get('/user-progress/');
        // DRF may return paginated { count, results } or a plain array
        const data = response.data;
        setProgressData(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading progress...</div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center text-text-secondary">
        Failed to load progress data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent-blue mb-2">Your Learning Progress</h1>
        <p className="text-text-secondary">Track your journey through System Overload</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-accent-blue" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Total XP</p>
              <p className="text-2xl font-bold text-text-primary">
                {progressData.reduce((acc, p) => acc + p.total_xp, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Target className="text-green-500" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Avg Accuracy</p>
              <p className="text-2xl font-bold text-text-primary">
                {progressData.length > 0 ? 
                  Math.round(progressData.reduce((acc, p) => acc + p.accuracy_rate, 0) / progressData.length * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Clock className="text-yellow-500" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Avg Time</p>
              <p className="text-2xl font-bold text-text-primary">
                {progressData.length > 0 ? 
                  Math.round(progressData.reduce((acc, p) => acc + p.average_time, 0) / progressData.length) : 0}s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Award className="text-purple-500" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Weak Areas</p>
              <p className="text-2xl font-bold text-text-primary">
                {progressData.reduce((acc, p) => acc + p.weak_topics_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-6">Subject Breakdown</h2>
        <div className="space-y-6">
          {progressData.map((subject) => (
            <div key={subject.subject} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-accent-blue">{subject.subject_name}</h3>
                <div className="text-right">
                  <p className="text-sm text-text-secondary">Level {subject.current_level}</p>
                  <p className="text-sm text-accent-purple">{subject.total_xp} XP</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accuracy</span>
                    <span>{Math.round(subject.accuracy_rate * 100)}%</span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${subject.accuracy_rate * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round((subject.current_level / 10) * 100)}%</span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div 
                      className="bg-accent-blue h-2 rounded-full"
                      style={{ width: `${(subject.current_level / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weak Topics</span>
                    <span>{subject.weak_topics_count}</span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(subject.weak_topics_count * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Areas */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-6">Areas Needing Practice</h2>
        <div className="space-y-4">
          {progressData.filter(p => p.weak_topics_count > 0).length > 0 ? (
            progressData.filter(p => p.weak_topics_count > 0).map((subject) => (
              <div key={subject.subject} className="p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
                <h3 className="font-semibold text-red-400 mb-2">{subject.subject_name}</h3>
                <p className="text-text-secondary">
                  {subject.weak_topics_count} topic{subject.weak_topics_count > 1 ? 's' : ''} need reinforcement.
                  Consider revisiting these areas for better understanding.
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Award className="mx-auto text-green-400 mb-4" size={48} />
              <p className="text-green-400 font-semibold">Excellent progress!</p>
              <p className="text-text-secondary">No weak areas detected. Keep up the great work!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-4 p-3 bg-dark-bg rounded">
            <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Completed Level 3 in Algorithms</p>
              <p className="text-text-secondary text-sm">2 hours ago • +100 XP</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-dark-bg rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Achieved 95% accuracy in Operating Systems</p>
              <p className="text-text-secondary text-sm">1 day ago • Achievement unlocked</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-dark-bg rounded">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Started learning Cloud Computing</p>
              <p className="text-text-secondary text-sm">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};