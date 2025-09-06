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

// Prime number metric should yield sequential primes
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
const firstPrime = sample.metrics.primeNumber.value;
assert.ok(isPrime(firstPrime), 'primeNumber value should be prime');
const secondPrime = sampleMetrics().metrics.primeNumber.value;
assert.ok(isPrime(secondPrime), 'next prime should be prime');
assert.ok(secondPrime > firstPrime, 'primeNumber should increase');

console.log('All tests passed.');
