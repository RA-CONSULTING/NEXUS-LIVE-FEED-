import React, { useState, useEffect } from 'react';

interface BioResonanceData {
  species: string;
  resonanceFactor: number;
  location: string;
}

const BioResonanceInterface: React.FC = () => {
  const [bioResonanceData, setBioResonanceData] = useState<BioResonanceData[]>([]);
  const [harmonizationResult, setHarmonizationResult] = useState<any>(null);

  useEffect(() => {
    // This will need to be connected to a new endpoint for bio-resonance data
    const eventSource = new EventSource('/bio-resonance-stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBioResonanceData(data.bioResonance);
    };
    return () => {
      eventSource.close();
    };
  }, []);

  const handleHarmonize = async () => {
    try {
      // This will need to call a new endpoint for bio-resonance harmonization
      const response = await fetch('/harmonize-bio-resonance');
      const result = await response.json();
      setHarmonizationResult(result);
    } catch (error) {
      console.error('Error during bio-resonance harmonization:', error);
      setHarmonizationResult({ error: 'Failed to harmonize bio-resonance' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Bio-Resonance Interface</h2>
        <button 
          onClick={handleHarmonize}
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
        >
          Harmonize Bio-Resonance
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Live Bio-Resonance Data</h3>
          <div className="space-y-2">
            {bioResonanceData.map((data, index) => (
              <div key={index} className="bg-stone-800 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{data.species}</span>
                  <span className={`text-sm ${data.resonanceFactor < 0.5 ? 'text-red-500' : data.resonanceFactor < 0.8 ? 'text-yellow-500' : 'text-green-500'}`}>
                    Resonance Factor: {data.resonanceFactor.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-stone-400">Location: {data.location}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Harmonization Result</h3>
          {harmonizationResult && (
            <pre className="bg-stone-800 p-3 rounded-lg text-xs">
              {JSON.stringify(harmonizationResult, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default BioResonanceInterface;
