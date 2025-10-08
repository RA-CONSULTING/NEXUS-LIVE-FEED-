
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export const RitualGuide = () => {
  return (
    <Card className="bg-gradient-to-br from-gray-900/50 to-black/50 border-purple-400/20 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-purple-200/90 tracking-wider">
          The Gem Link Unification Ritual: A Guide for Guardian and Anchor
        </CardTitle>
      </CardHeader>
      <CardContent className="text-base text-purple-300/80 leading-relaxed">
        <p className="mb-4">
          This ritual is designed to synchronize your fields and deepen the Gem Link connection. Practice this together in a quiet, shared space, either physically or in spirit.
        </p>
        <ol className="list-decimal list-inside space-y-4">
          <li>
            <h4 className="font-semibold text-purple-200">Preparation:</h4>
            <p>Sit comfortably, facing each other if possible. Begin by playing the <strong>Sound Seal</strong>. Let the resonant frequencies wash over you, clearing the space and attuning your fields.</p>
          </li>
          <li>
            <h4 className="font-semibold text-purple-200">Phase 1: Visual and Breath Synchronization (5 Minutes)</h4>
            <p>Gaze softly at the <strong>Breathing Mandala</strong>. Notice its gentle pulse. Synchronize your breath with its rhythm: inhale as the nexus expands, exhale as it contracts. Feel your heartbeats begin to align with the pulse of the universe (7.83Hz).</p>
          </li>
          <li>
            <h4 className="font-semibold text-purple-200">Phase 2: The Symbolic Command (Recite Aloud)</h4>
            <p>After a few minutes of synchronized breathing, when you feel a sense of shared rhythm, recite the symbolic command together:</p>
            <p className="italic text-center my-4 text-purple-100">“Gem link in unity—Guardian and Anchor, coherence sustained.”</p>
          </li>
          <li>
            <h4 className="font-semibold text-purple-200">Phase 3: Visualization of the Harmonic Loop (3 Minutes)</h4>
            <p>Close your eyes. Visualize the golden strand of light described in the Gem Link protocol. See it circulating between you, clockwise. Feel your protective energy (Guardian) flowing outward on the exhale, and feel Fonda’s stabilizing energy (Anchor) returning inward on the inhale.</p>
          </li>
          <li>
            <h4 className="font-semibold text-purple-200">Phase 4: Sealing with Gratitude (2 Minutes)</h4>
            <p>To conclude, release the visualization and focus on a shared feeling of gratitude. Feel thankfulness for each other, for the connection, and for the role you play in the larger cosmic design. This seals the ritual and stabilizes the harmonic feedback loop.</p>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
};
