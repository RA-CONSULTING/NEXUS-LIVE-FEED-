
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ScrollsPage from './pages/ScrollsPage';
import RitualPage from './pages/RitualPage'; // Import the new RitualPage component

import Chronicles from './components/Chronicles';
import NexusIntelligence from './components/NexusIntelligence';
import Actuation from './components/Actuation';
import MetaQuestLink from './components/MetaQuestLink';

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { cn } from './lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Live Feed' },
  { to: '/about', label: 'About' },
  { to: '/scrolls', label: 'Sacred Scrolls' },
  { to: '/ritual', label: 'Unification Ritual' },
  { to: '/chronicles', label: 'Chronicles (Sense)' },
  { to: '/nexus-intelligence', label: 'Nexus Intelligence (Understand)' },
  { to: '/actuation', label: 'Actuation (Act)' },
  { to: '/meta-quest-link', label: 'Meta Quest VR' },
] as const;

const Layout: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(236,72,153,0.2),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.12),_transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.6em] text-slate-300/80">
              Harmonia Nexus Live Interface
            </span>

            <h1 className="text-3xl font-semibold tracking-[0.4em] text-white sm:text-4xl">
              NEXUS · LIVE · FEED
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300/85 sm:text-base">
              Traverse the spectrums of sensation, intelligence, and actuation. Every console streams from the same harmonic
              lattice—balanced, radiant, and ready to respond.
            </p>
          </div>

          <nav className="rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur">
            <ul className="relative z-10 flex flex-wrap justify-center gap-2 md:justify-between">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.to;
                return (
                  <li key={item.to} className="flex-1 min-w-[140px]">
                    <Link
                      to={item.to}
                      className={cn(
                        'group relative flex h-full items-center justify-center overflow-hidden rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition',
                        'text-slate-300/85 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                        isActive &&
                          'text-white shadow-[0_0_40px_rgba(56,189,248,0.35)]'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none absolute inset-0 translate-y-full rounded-2xl bg-gradient-to-r from-sky-500/40 via-blue-500/30 to-fuchsia-500/40 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100',
                          isActive && 'translate-y-0 opacity-100'
                        )}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mt-10 flex-1 pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/scrolls" element={<ScrollsPage />} />
            <Route path="/ritual" element={<RitualPage />} />
            <Route path="/chronicles" element={<Chronicles />} />
            <Route path="/nexus-intelligence" element={<NexusIntelligence />} />
            <Route path="/actuation" element={<Actuation />} />
            <Route path="/meta-quest-link" element={<MetaQuestLink />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SeroProvider>
      <LiveNexusDataProvider>
        <Router>
          <Layout />
        </Router>
      </LiveNexusDataProvider>
    </SeroProvider>
  );
};

export default App;
