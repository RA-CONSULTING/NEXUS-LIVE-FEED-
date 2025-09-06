const assert = require('assert');
const { metrics, sampleMetrics } = require('../src/metrics');

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

console.log('All tests passed.');
