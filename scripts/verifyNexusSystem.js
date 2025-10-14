import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { NexusSystem } from '../src/nexus_system_simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify() {
  const nexus = new NexusSystem({
    numObservers: 7,
    dimensionality: 4,
  });

  console.log('🔍 Verifying Nexus sovereignty...');
  console.log(`Observers: ${nexus.config.numObservers}`);
  console.log(`Dimensionality: ${nexus.config.dimensionality}`);
  console.log(`Seal hash: ${nexus.seal.hash}`);

  ensure(nexus.seal.verified === true, 'Prime Sentinel seal failed verification');
  ensure(typeof nexus.seal.hash === 'string' && nexus.seal.hash.length >= 16, 'Seal hash appears malformed');

  const unityTrace = await nexus.runCycle(1500, 0);

  ensure(Array.isArray(unityTrace) && unityTrace.length > 0, 'Nexus cycle produced no telemetry');
  ensure(unityTrace.some(step => step.unityEvent), 'Unity Event was not achieved during verification cycle');

  const latest = unityTrace[unityTrace.length - 1];
  ensure(latest.observerCoherence >= 0.8, 'Observer coherence failed to stabilise');

  const exportState = nexus.exportState();
  ensure(exportState?.seal?.verified === true, 'Exported state is missing verified seal');
  ensure(exportState?.egoDeathState?.unityEventTriggered === true, 'Unity state missing from exported snapshot');

  const outputPath = path.join(__dirname, '..', 'streams', 'nexus_verification.json');
  const unityTransitions = unityTrace.reduce((count, step, index) => {
    const previousUnity = index > 0 ? unityTrace[index - 1].unityEvent : false;
    return count + (step.unityEvent && !previousUnity ? 1 : 0);
  }, 0);

  const report = {
    verifiedAt: new Date().toISOString(),
    unityEventTransitions: unityTransitions,
    finalCoherence: latest.egoState.coherence,
    finalPhase: latest.egoState.phase,
    sealHash: nexus.seal.hash,
  };

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('✅ Nexus sovereignty verified.');
  console.log(`Unity achieved at least ${unityTransitions} time(s).`);
  console.log(`Verification report written to ${outputPath}`);
}

verify().catch(error => {
  console.error('❌ Nexus verification failed.');
  console.error(error);
  process.exit(1);
});
