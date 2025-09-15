import React, { useRef } from 'react';

declare global {
  interface Navigator {
    xr?: any;
  }
}

const MetaQuestLink: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startVR = async () => {
    if (!navigator.xr) {
      alert('WebXR not supported in this browser.');
      return;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr');
      console.log('Meta Quest session started', session);
      session.addEventListener('end', () => console.log('XR session ended'));
    } catch (err) {
      console.error('Failed to start XR session', err);
    }
  };

  return (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-amber-500 text-white rounded" onClick={startVR}>
        Enter Meta Quest VR
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default MetaQuestLink;
