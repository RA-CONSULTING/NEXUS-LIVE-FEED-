const assert = require('assert');
const { metrics, sampleMetrics } = require('../src/metrics');
const { fetchSeismicEvents } = require('../src/seismicBridge');

// Ensure each metric has description and unit
for (const [name, meta] of Object.entries(metrics)) {
  assert.ok(meta.description, `${name} missing description`);
  assert.ok(meta.unit, `${name} missing unit`);
}

// Ensure sampleMetrics returns values for all metrics
const sample = sampleMetrics();
assert.ok(sample.timestamp, 'timestamp missing');
for (const name of Object.keys(metrics)) {
  assert.ok(sample.metrics[name], `missing metric ${name}`);
  assert.strictEqual(typeof sample.metrics[name].value, 'number', 'value should be number');
}

// Verify seismic bridge retrieves events
const events = fetchSeismicEvents();
assert.ok(Array.isArray(events), 'events should be array');
if (events.length > 0) {
  const ev = events[0];
  assert.ok(ev.magnitude !== undefined, 'event missing magnitude');
  assert.ok(ev.depth_km !== undefined, 'event missing depth_km');
  assert.ok(ev.latitude !== undefined, 'event missing latitude');
  assert.ok(ev.longitude !== undefined, 'event missing longitude');
  assert.ok(ev.timestamp, 'event missing timestamp');
}

console.log('All tests passed.');
