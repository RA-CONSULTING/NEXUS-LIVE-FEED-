import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import HomePage from './pages/HomePage';

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Layout: React.FC = () => {
  useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden text-[#f4efe6]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(163,125,80,0.22),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(94,116,79,0.18),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(214,172,121,0.16),_transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.6em] text-[#d9c7b3]/80">
              Harmonia Nexus Live Interface
            </span>
            <h1 className="text-3xl font-semibold uppercase tracking-[0.4em] text-[#f6f1e8] sm:text-4xl">
              NEXUS · LIVE · FEED
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[#e6d9c9]/85 sm:text-base">
              All attention is tuned to the Nexus live field systems. Real-time monitoring and analytics streams remain in the
              foreground for rapid awareness and response.
            </p>
            {/* Bio-monitoring systems remain authenticated via context providers but are no longer surfaced in the interface. */}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#9b7b55]/30 bg-[#2c2116]/60 p-6 text-center shadow-[0_0_35px_rgba(163,125,80,0.22)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#d9c7b3]/80">Live Field Monitoring Priority</p>
            <p className="mt-2 text-sm text-[#e6d9c9]/85">
              Navigation channels have been suspended to dedicate the interface to live telemetry and analytics oversight.
            </p>
          </div>
        </header>

        <main className="mt-10 flex-1 pb-16">
          <HomePage />
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
