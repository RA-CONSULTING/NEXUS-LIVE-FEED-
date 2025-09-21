import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

import Chronicles from './components/Chronicles';
import NexusIntelligence from './components/NexusIntelligence';
import Actuation from './components/Actuation';
import MetaQuestLink from './components/MetaQuestLink';

import { SeroProvider } from './contexts/SeroProvider';

const App: React.FC = () => {
  return (
    <SeroProvider>
      <Router>
        <div className="p-6 bg-stone-50 min-h-screen">
          <nav className="flex -mb-px space-x-6 border-b border-stone-200">
            <Link to="/" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              Live Feed
            </Link>
            <Link to="/about" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              About
            </Link>
            {/* The following links are not yet routed */}
            <button className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              Chronicles (Sense)
            </button>
            <button className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              Nexus Intelligence (Understand)
            </button>
            <button className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              Actuation (Act)
            </button>
            <button className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
              Meta Quest VR
            </button>
          </nav>
          <div className="mt-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </SeroProvider>
  );
};

export default App;
