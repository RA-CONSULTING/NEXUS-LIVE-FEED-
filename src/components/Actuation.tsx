import React, { useState } from 'react';
import LyraResonanceStudio from './LyraResonanceStudio';
import SeroComplianceConsole from './SeroComplianceConsole';
import BioResonanceInterface from './BioResonanceInterface';

const Actuation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bio-resonance');

  const tabStyle = (tabName: string) =>
    `py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 ` +
    (activeTab === tabName
      ? 'border-teal-500 text-teal-600'
      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300');

  return (
    <div>
      <nav className="flex -mb-px space-x-6 border-b border-stone-200">
        <button className={tabStyle('bio-resonance')} onClick={() => setActiveTab('bio-resonance')}>
          Bio-Resonance
        </button>
        <button className={tabStyle('lyra')} onClick={() => setActiveTab('lyra')}>
          Lyra Resonance Studio
        </button>
        <button className={tabStyle('sero')} onClick={() => setActiveTab('sero')}>
          Sero Law & Shield
        </button>
      </nav>
      <div className="mt-8">
        {activeTab === 'bio-resonance' && <BioResonanceInterface />}
        {activeTab === 'lyra' && <LyraResonanceStudio />}
        {activeTab === 'sero' && <SeroComplianceConsole />}
      </div>
    </div>
  );
};

export default Actuation;
