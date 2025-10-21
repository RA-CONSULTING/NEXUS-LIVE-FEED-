import React from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LiveStreamsPage from './pages/LiveStreamsPage';

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Layout: React.FC = () => {
  useAuth();

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
              Harmonia Nexus Live Interface
            </span>
            <h1 className="text-3xl font-semibold uppercase tracking-[0.4em] text-[#f3f7ff] drop-shadow-[0_0_25px_rgba(120,76,255,0.35)] sm:text-4xl">
              NEXUS · LIVE · FEED
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[#c8d4ff]/85 sm:text-base">
              All attention is tuned to the Nexus live field systems. Real-time monitoring and analytics streams remain in the
              foreground for rapid awareness and response.
            </p>
            {/* Bio-monitoring systems remain authenticated via context providers but are no longer surfaced in the interface. */}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[rgba(102,76,255,0.45)] bg-[rgba(14,24,58,0.76)] p-6 text-center shadow-[0_0_45px_rgba(56,189,248,0.28)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#a7b5ff]/85">Live Field Monitoring Priority</p>
            <p className="mt-2 text-sm text-[#c8d4ff]/85">
              Summary mode keeps telemetry responsive—open the Live Data Streams console for the full, tabbed instrumentation when deeper dives are needed.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.32em] text-[#c8d4ff]/80 sm:justify-start">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center justify-center rounded-full border px-5 py-2 font-semibold transition ${
                  isActive
                    ? 'border-sky-400/70 bg-sky-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                    : 'border-white/15 text-[#c8d4ff]/80 hover:border-sky-400/60 hover:text-white'
                }`
              }
              end
            >
              Summary View
            </NavLink>
            <NavLink
              to="/streams"
              className={({ isActive }) =>
                `inline-flex items-center justify-center rounded-full border px-5 py-2 font-semibold transition ${
                  isActive
                    ? 'border-emerald-400/70 bg-emerald-500/20 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : 'border-white/15 text-[#c8d4ff]/80 hover:border-emerald-400/60 hover:text-white'
                }`
              }
            >
              Live Data Streams
            </NavLink>
          </nav>
        </header>

        <main className="mt-10 flex-1 pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/streams" element={<LiveStreamsPage />} />
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
