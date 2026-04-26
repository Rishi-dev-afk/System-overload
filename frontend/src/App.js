import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorldMap } from './pages/WorldMap';
import { TopicView } from './pages/TopicView';
import { ChallengeView } from './pages/ChallengeView';
import { BossBattle } from './pages/BossBattle';
import { ProgressView } from './pages/ProgressView';
import { Login } from './pages/Login';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  // On mount, validate the stored token and fetch user profile
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/world" element={<WorldMap />} />
        <Route path="/topic/:topicId" element={<TopicView />} />
        <Route path="/challenge/:levelId" element={<ChallengeView />} />
        <Route path="/boss/:levelId" element={<BossBattle />} />
        <Route path="/progress" element={<ProgressView />} />
      </Routes>
    </Layout>
  );
}

export default App;
