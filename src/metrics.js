// Prime number helpers
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

let lastPrime = 1;
function nextPrime() {
  let candidate = lastPrime + 1;
  while (!isPrime(candidate)) {
    candidate++;
  }
  lastPrime = candidate;
  return candidate;
}

const metrics = {
  quantumCoherence: {
    description: 'Relative phase alignment of quantum events.',
    unit: 'qbits',
    value: () => Math.random()
  },
  harmonicResonance: {
    description: 'Amplitude alignment across frequencies.',
    unit: 'Hz',
    value: () => Math.random() * 100
  },
  schumannResonance: {
    description: 'Global electromagnetic resonances measured in Hertz.',
    unit: 'Hz',
    value: () => 7.83 + Math.random() * 0.1
  },
  rainbowSpectrum: {
    description: 'Representation of spectral energy distribution.',
    unit: 'spectrum',
    value: () => Math.random()
  },
  consciousnessMetric: {
    description: 'Synthetic metric for collective consciousness shifts.',
    unit: 'psi',
    value: () => Math.random()
  },
  primeNumber: {
    description: 'Sequential prime numbers demonstrating prime number logic.',
    unit: 'number',
    value: () => nextPrime()
  }
};

function sampleMetrics() {
  const timestamp = Date.now();
  const data = {};
  for (const [key, meta] of Object.entries(metrics)) {
    data[key] = {
      value: typeof meta.value === 'function' ? meta.value() : meta.value,
      unit: meta.unit,
      description: meta.description
    };
  }
  return { timestamp, metrics: data };
}

module.exports = { metrics, sampleMetrics };
