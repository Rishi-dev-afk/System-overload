import React, { useEffect, useState } from 'react';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';
import axios from 'axios';

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/dashboard/');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-text-secondary">
        Failed to load dashboard data
      </div>
    );
  }

  const { user, progress, achievements, quests } = dashboardData;

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Trophy className="text-accent-purple" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Level</p>
              <p className="text-2xl font-bold text-text-primary">{user.level}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-accent-blue" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Total XP</p>
              <p className="text-2xl font-bold text-text-primary">{user.total_xp}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Flame className="text-red-500" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Streak</p>
              <p className="text-2xl font-bold text-text-primary">{user.streak_days} days</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Target className="text-green-500" size={24} />
            <div>
              <p className="text-text-secondary text-sm">Accuracy</p>
              <p className="text-2xl font-bold text-text-primary">
                {progress.length > 0 ? 
                  Math.round(progress.reduce((acc, p) => acc + p.accuracy_rate, 0) / progress.length * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Subject Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.map((subject) => (
            <div key={subject.subject} className="bg-dark-bg p-4 rounded border border-dark-border">
              <h3 className="font-semibold text-accent-blue mb-2">{subject.subject}</h3>
              <div className="space-y-1 text-sm">
                <p>Level: {subject.current_level}</p>
                <p>XP: {subject.total_xp}</p>
                <p>Accuracy: {Math.round(subject.accuracy_rate * 100)}%</p>
                <p className="text-red-400">Weak Areas: {subject.weak_topics_count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Recent Achievements</h2>
        {achievements.length > 0 ? (
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-dark-bg rounded">
                <Trophy className="text-yellow-500" size={20} />
                <div>
                  <p className="font-semibold">{achievement.name}</p>
                  <p className="text-text-secondary text-sm">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">No achievements yet. Start learning to earn some!</p>
        )}
      </div>

      {/* Active Quests */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Active Quests</h2>
        {quests.length > 0 ? (
          <div className="space-y-3">
            {quests.map((quest, index) => (
              <div key={index} className="p-3 bg-dark-bg rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{quest.title}</h3>
                  <span className="text-accent-purple">{Math.round(quest.progress * 100)}%</span>
                </div>
                <p className="text-text-secondary text-sm">{quest.description}</p>
                <div className="mt-2 bg-dark-border rounded-full h-2">
                  <div 
                    className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${quest.progress * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">No active quests. Check back later!</p>
        )}
      </div>
    </div>
  );
};