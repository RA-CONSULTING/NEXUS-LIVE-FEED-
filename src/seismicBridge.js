const { spawnSync } = require('child_process');
const path = require('path');

function fetchSeismicEvents() {
  const script = path.join(__dirname, '..', 'ingestion', 'seismic_bridge.py');
  const result = spawnSync('python', [script], { encoding: 'utf-8' });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim());
  }

  try {
    return JSON.parse(result.stdout.trim() || '[]');
  } catch (err) {
    throw new Error('Invalid JSON from seismic bridge');
  }
}

module.exports = { fetchSeismicEvents };
