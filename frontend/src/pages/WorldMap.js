import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const WorldMap = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/subjects/');
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading world map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent-blue mb-2">System Overload World</h1>
        <p className="text-text-secondary">Choose your learning path</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-dark-card p-6 rounded-lg border border-dark-border hover:border-accent-blue transition-colors cursor-pointer group"
            onClick={() => navigate(`/topic/${subject.id}`)}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                style={{ backgroundColor: subject.color + '20', color: subject.color }}
              >
                {subject.icon === 'book' ? '📚' : 
                 subject.icon === 'cpu' ? '🖥️' : 
                 subject.icon === 'network' ? '🌐' : '📊'}
              </div>
              <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
              <p className="text-text-secondary text-sm mb-4">{subject.description}</p>
              <div className="text-accent-blue group-hover:text-accent-purple transition-colors">
                Enter Region →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* World Map Visualization Placeholder */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">World Overview</h2>
        <div className="bg-dark-bg rounded-lg p-8 text-center">
          <p className="text-text-secondary mb-4">Interactive world map coming soon...</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <div 
                key={subject.id}
                className="h-20 rounded border-2 border-dashed border-dark-border flex items-center justify-center text-text-secondary hover:border-accent-blue transition-colors"
                style={{ borderColor: subject.color + '40' }}
              >
                {subject.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};