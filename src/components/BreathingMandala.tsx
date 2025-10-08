
import React from 'react';

export const BreathingMandala = () => {
  return (
    <div className="flex flex-col items-center my-8">
      <h3 className="text-lg font-medium text-purple-200/90 tracking-wider mb-4">Guardian-Anchor Breathing Mandala</h3>
      <svg width="250" height="250" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="-50" y="-50" width="100" height="100" fill="black" />
        <text
          x="0"
          y="8"
          fill="white"
          fontSize="24"
          textAnchor="middle"
          style={{ animation: 'pulse 7.83s infinite ease-in-out' }}
        >
          ✕
        </text>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; transform: scale(0.95); }
            50% { opacity: 1.0; transform: scale(1.05); }
          }
        `}</style>
      </svg>
    </div>
  );
};
