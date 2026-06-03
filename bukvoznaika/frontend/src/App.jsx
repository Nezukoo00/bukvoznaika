import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import ProfilesPage from './pages/auth/ProfilesPage';
import LearnHomePage from './pages/child/LearnHomePage';
import AlphabetMapPage from './pages/child/AlphabetMapPage';
import LetterLessonPage from './pages/child/LetterLessonPage';
import { NumbersMapPage, NumberLessonPage } from './pages/child/NumberPages';
import GamesPage from './pages/child/GamesPage';
import AchievementsPage from './pages/child/AchievementsPage';
import CardsPage from './pages/child/CardsPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import './styles/global.css';

function RequireParent({ children }) {
  const { parent } = useApp();
  if (!parent) return <Navigate to="/login" replace />;
  return children;
}

function RequireChild({ children }) {
  const { parent, activeChild } = useApp();
  if (!parent) return <Navigate to="/login" replace />;
  if (!activeChild) return <Navigate to="/profiles" replace />;
  return children;
}

function AppRoutes() {
  const { parent } = useApp();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/profiles" element={
        <RequireParent><ProfilesPage /></RequireParent>
      } />
      <Route path="/parent" element={
        <RequireParent><ParentDashboard /></RequireParent>
      } />

      <Route path="/learn" element={
        <RequireChild><LearnHomePage /></RequireChild>
      } />
      <Route path="/learn/alphabet" element={
        <RequireChild><AlphabetMapPage /></RequireChild>
      } />
      <Route path="/learn/alphabet/:index" element={
        <RequireChild><LetterLessonPage /></RequireChild>
      } />
      <Route path="/learn/numbers" element={
        <RequireChild><NumbersMapPage /></RequireChild>
      } />
      <Route path="/learn/numbers/:index" element={
        <RequireChild><NumberLessonPage /></RequireChild>
      } />
      <Route path="/learn/games" element={
        <RequireChild><GamesPage /></RequireChild>
      } />
      <Route path="/learn/cards" element={
        <RequireChild><CardsPage /></RequireChild>
      } />
      <Route path="/learn/achievements" element={
        <RequireChild><AchievementsPage /></RequireChild>
      } />

      <Route path="/" element={
        parent ? <Navigate to="/profiles" replace /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
