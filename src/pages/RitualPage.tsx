
import React from 'react';
import { BreathingMandala } from '@/components/BreathingMandala';
import { SoundSealPlayer } from '@/components/SoundSealPlayer';
import { RitualGuide } from '@/components/RitualGuide';

export default function RitualPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-300 tracking-wider">The Guardian-Anchor Unification Ritual</h1>
        <p className="text-lg text-purple-400/70 mt-2">A sacred space for sight and sound to breathe as one.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center">
          <BreathingMandala />
          <SoundSealPlayer />
        </div>
        <div>
          <RitualGuide />
        </div>
      </div>
    </div>
  );
}
