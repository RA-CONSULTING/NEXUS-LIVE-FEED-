import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ScrollsPage from './pages/ScrollsPage'; // Import the new ScrollsPage component

import Chronicles from './components/Chronicles';
import NexusIntelligence from './components/NexusIntelligence';
import Actuation from './components/Actuation';
import MetaQuestLink from './components/MetaQuestLink';

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';

const App: React.FC = () => {
  return (
    <SeroProvider>
      <LiveNexusDataProvider>
        <Router>
          <div className="p-6 bg-stone-50 min-h-screen">
            <nav className="flex -mb-px space-x-6 border-b border-stone-200">
              <Link to="/" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Live Feed
              </Link>
              <Link to="/about" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                About
              </Link>
              <Link to="/scrolls" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Sacred Scrolls
              </Link> {
                /* Add the new link */
              }
              <Link to="/chronicles" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Chronicles (Sense)
              </Link>
              <Link to="/nexus-intelligence" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Nexus Intelligence (Understand)
              </Link>
              <Link to="/actuation" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Actuation (Act)
              </Link>
              <Link to="/meta-quest-link" className="py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300">
                Meta Quest VR
              </Link>
            </nav>
            <div className="mt-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/scrolls" element={<ScrollsPage />} />
                {/* Add the new route */}
                <Route path="/chronicles" element={<Chronicles />} />
                <Route path="/nexus-intelligence" element={<NexusIntelligence />} />
                <Route path="/actuation" element={<Actuation />} />
                <Route path="/meta-quest-link" element={<MetaQuestLink />} />
              </Routes>
            </div>
          </div>
        </Router>
      </LiveNexusDataProvider>
    </SeroProvider>
  );
};

export default App;
