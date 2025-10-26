import React from 'react';
import { BrowserRouter as Router, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import LiveTab from './pages/LiveTab';
import MapTab from './pages/MapTab';
import PersonalTab from './pages/PersonalTab';
import InsightsTab from './pages/InsightsTab';
import MoreTab from './pages/MoreTab';

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/live', label: 'Live', emoji: '📡', description: 'Real-time planetary data feed' },
  { path: '/map', label: 'Map', emoji: '🌍', description: 'Global sensor network & ley lines' },
  { path: '/me', label: 'Me', emoji: '💚', description: 'Personal resonance profile' },
  { path: '/insights', label: 'Insights', emoji: '⚛️', description: 'AI analysis & patterns' },
  { path: '/more', label: 'More', emoji: '☰', description: 'Settings & advanced tools' },
] as const;

const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden text-[#e8f1ff]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,114,255,0.28),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(32,209,255,0.2),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,210,106,0.18),_transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.6em] text-[#a7b5ff]/80">
              Harmonia Nexus Architecture
            </span>
            <h1 className="text-3xl font-semibold uppercase tracking-[0.4em] text-[#f3f7ff] drop-shadow-[0_0_25px_rgba(120,76,255,0.35)] sm:text-4xl">
              COMPLETE APP MATRIX
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[#c8d4ff]/85 sm:text-base">
              Five primary tabs orchestrate the entire Nexus experience. Every screen, tap, gesture, and notification is mapped
              for rapid guardianship and immersive exploration.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-[rgba(102,76,255,0.45)] bg-[rgba(14,24,58,0.76)] p-6 shadow-[0_0_45px_rgba(56,189,248,0.28)] backdrop-blur sm:grid-cols-3">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[#a7b5ff]/85">Current Tab</p>
              <p className="mt-2 text-sm text-white">
                {NAV_ITEMS.find((item) => item.path === location.pathname)?.description ?? 'Navigate the Nexus system tree.'}
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 text-sm text-[#c8d4ff]/80 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[#a7b5ff]/85">Process Tree</p>
              <p>Root → Onboarding → Live Dashboard → Map → Personal → Insights → More.</p>
            </div>
            <div className="border-t border-white/10 pt-3 text-sm text-[#c8d4ff]/80 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[#a7b5ff]/85">Guardian</p>
              <p>{user ? `${user.name} · ${user.placeOfBirth}` : 'Authenticated Guardian'}</p>
            </div>
          </div>

          <nav className="grid gap-3 text-[11px] uppercase tracking-[0.32em] text-[#c8d4ff]/80 sm:grid-cols-2 lg:grid-cols-5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-2xl border px-5 py-4 font-semibold transition ${
                    isActive
                      ? 'border-sky-400/70 bg-sky-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                      : 'border-white/15 text-[#c8d4ff]/80 hover:border-sky-400/60 hover:text-white'
                  }`
                }
              >
                <span className="text-xl">{item.emoji}</span>
                <span>{item.label}</span>
                <span className="text-[0.55rem] tracking-[0.35em] text-[#c8d4ff]/60">{item.description}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mt-10 flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/live" replace />} />
            <Route path="/live" element={<LiveTab />} />
            <Route path="/map" element={<MapTab />} />
            <Route path="/me" element={<PersonalTab />} />
            <Route path="/insights" element={<InsightsTab />} />
            <Route path="/more" element={<MoreTab />} />
            <Route path="*" element={<Navigate to="/live" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <Layout />
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
