import React, { useState } from 'react';
import Chronicles from './components/Chronicles';
import NexusLiveFeedDashboard from './components/NexusLiveFeedDashboard';
import NexusIntelligence from './components/NexusIntelligence';
import Actuation from './components/Actuation';
import MetaQuestLink from './components/MetaQuestLink';

import { SeroProvider } from './contexts/SeroProvider';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabStyle = (tabName: string) =>
    `py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 ` +
    (activeTab === tabName
      ? 'border-amber-500 text-amber-600'
      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300');

  return (
    <SeroProvider>
      <div className="p-6 bg-stone-50 min-h-screen">
        <nav className="flex -mb-px space-x-6 border-b border-stone-200">
          <button className={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
            Live Feed
          </button>
          <button className={tabStyle('chronicles')} onClick={() => setActiveTab('chronicles')}>
            Chronicles (Sense)
          </button>
          <button className={tabStyle('intelligence')} onClick={() => setActiveTab('intelligence')}>
            Nexus Intelligence (Understand)
          </button>
          <button className={tabStyle('actuation')} onClick={() => setActiveTab('actuation')}>
            Actuation (Act)
          </button>
          <button className={tabStyle('vr')} onClick={() => setActiveTab('vr')}>
            Meta Quest VR
          </button>
        </nav>
        <div className="mt-8">
          {activeTab === 'dashboard' && <NexusLiveFeedDashboard />}
          {activeTab === 'chronicles' && <Chronicles />}
          {activeTab === 'intelligence' && <NexusIntelligence />}
          {activeTab === 'actuation' && <Actuation />}
          {activeTab === 'vr' && <MetaQuestLink />}
        </div>
      </div>
    </SeroProvider>
  );
};

export default App;
