import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Trophy, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Layout = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/world', icon: Map, label: 'World Map' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-accent-blue">System Overload</h1>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-text-secondary">Level {user.level}</span>
                <span className="text-accent-purple">{user.total_xp} XP</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-dark-card border-r border-dark-border min-h-screen">
          <div className="p-6">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-accent-blue bg-opacity-20 text-accent-blue'
                          : 'text-text-secondary hover:text-text-primary hover:bg-dark-border'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};