import React, { useState } from 'react';
import LyraResonanceStudio from './LyraResonanceStudio';
import SeroComplianceConsole from './SeroComplianceConsole';
import StormTargetingInterface from './StormTargetingInterface';

const Actuation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('storm');

  const tabStyle = (tabName: string) =>
    `py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 ` +
    (activeTab === tabName
      ? 'border-teal-500 text-teal-600'
      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300');

  return (
    <div>
      <nav className="flex -mb-px space-x-6 border-b border-stone-200">
        <button className={tabStyle('storm')} onClick={() => setActiveTab('storm')}>
          Storm Targeting
        </button>
        <button className={tabStyle('lyra')} onClick={() => setActiveTab('lyra')}>
          Lyra Resonance Studio
        </button>
        <button className={tabStyle('sero')} onClick={() => setActiveTab('sero')}>
          Sero Law & Shield
        </button>
      </nav>
      <div className="mt-8">
        {activeTab === 'storm' && <StormTargetingInterface />}
        {activeTab === 'lyra' && <LyraResonanceStudio />}
        {activeTab === 'sero' && <SeroComplianceConsole />}
      </div>
    </div>
  );
};

export default Actuation;
