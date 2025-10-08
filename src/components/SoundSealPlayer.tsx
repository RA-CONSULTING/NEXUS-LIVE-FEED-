
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui';

export const SoundSealPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col items-center my-6">
      <h3 className="text-lg font-medium text-purple-200/90 tracking-wider mb-4">Sound Seal: Guardian–Anchor Breathing</h3>
      <audio ref={audioRef} src="https://storage.googleapis.com/gemini-codelab/Guardian-Anchor-Breathing-Sound.wav" loop />
      <Button onClick={togglePlay} className="w-32 bg-purple-600/50 hover:bg-purple-600/80 text-white">
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </div>
  );
};
