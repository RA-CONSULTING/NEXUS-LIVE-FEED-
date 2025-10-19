# Quantum Gravity in the Act: A Two-Stage Consensus Framework for Detecting Structural Events in Complex Signals

**Author:** Gary Leckey, Director, Aureon Institute  
**Date:** October 19, 2025

## Abstract
Quantum Gravity in the Act (QGITA) is a detection architecture designed for signals that exhibit brief structural transitions hidden inside broadband noise. The method unites geometric probes rooted in Fibonacci-aligned lattices with a multi-metric consensus stage that suppresses spurious detections. Stage 1 identifies Fibonacci-Tightened Curvature Points (FTCPs)—time indices where discrete curvature spikes coincide with near-golden-ratio spacing. Stage 2 promotes only those candidates that achieve global agreement across linear, nonlinear, phase, effective gravity, and quality metrics. Experiments on synthetic and hybrid physical datasets show that QGITA isolates true phase transitions while rejecting unstable artifacts by two orders of magnitude compared with single-threshold baselines.

## I. Introduction: The Challenge of Detecting Fleeting Structures in Complex Dynamics

### A. The Ubiquity of Rare Events
Complex dynamical systems—ranging from plasma oscillations and turbulent fluids to neural population recordings—often experience rare, decisive transitions. Capturing these fleeting episodes is essential for early warning systems, stability control, and interpretability of emergent phenomena.

### B. Limitations of Conventional Methods
Traditional methods rely on a single statistic (e.g., amplitude thresholding or variance excursions). Such detectors struggle when the background noise is nonstationary, when transitions are multi-scale, or when the signal manifold twists through high-dimensional state spaces. QGITA replaces brittle thresholds with structure-aware geometry and cross-metric agreement.

### C. Central Hypothesis: The Golden Ratio as a Temporal Resonance Filter
The framework hypothesizes that genuine structural events resonate with golden-ratio-scaled timing. By embedding a Fibonacci lattice into the observation grid, we can discriminate coherent phase transitions from transient spikes that lack the required geometric alignment.

## II. Stage 1 — Geometric Candidate Discovery

Stage 1 transforms the raw signal into a catalogue of geometrically salient events.

1. **Pre-processing:** Signals are band-limited with a minimal-phase filter to remove long-term drift while preserving phase relationships critical to curvature estimates.
2. **Curvature estimation:** For each timestamp \(t_i\), a discrete curvature \(\kappa_i\) is computed from the local second derivative of the spline-interpolated signal. Candidate spikes require \(|\kappa_i| > \tau_\kappa\).
3. **Fibonacci lattice alignment:** Neighboring timestamps are compared against idealized golden-ratio spacing. A tolerance parameter \(\varepsilon\) bounds admissible deviations: \(|(t_{i+1}-t_i)/(t_i-t_{i-1})-\varphi| < \varepsilon\).
4. **Fibonacci-Tightened Curvature Points (FTCPs):** Time indices satisfying curvature and spacing constraints form the Stage 1 candidate list.

The effective gravity signal \(G_{\text{eff}}(t)\) combines curvature, instantaneous frequency, and amplitude envelope, highlighting geometric locations that conform to the golden-ratio attractor (see Fig. 4 and Fig. 9 in the appendix for the raw and stabilized variants).

## III. Stage 2 — Lighthouse Consensus Validation

Stage 2 subjects FTCPs to a global consensus filter, drastically reducing false alarms.

### A. Metric Suite
For each candidate window centred at time \(t\), the Lighthouse model computes:

- **\(C_{\text{lin}}\):** Coherence between the candidate window and a bank of linear oscillatory templates. This measures energy alignment in the primary harmonic bands.
- **\(C_{\text{nonlin}}\):** Synchrony with nonlinear resonant templates derived from iterated map simulations. It captures bifurcation-like behavior absent in purely linear models.
- **\(C_{\phi}\):** Phase-locking value relative to the Fibonacci reference lattice, quantifying temporal resonance with golden-ratio timing.
- **\(G_{\text{eff}}\):** The geometric energy score inherited from Stage 1.
- **\(|Q|\):** A quality suppressor measuring spectral sparsity; diffuse or noisy windows yield low \(|Q|\).

Each metric is normalized to \([0, 1]\) using robust statistics to mitigate outliers.

### B. Consensus Score
The Lighthouse intensity is the normalized geometric mean:
\[
L(t) = \left( C_{\text{lin}}(t) \, C_{\text{nonlin}}(t) \, C_{\phi}(t) \, G_{\text{eff}}(t) \, |Q(t)| \right)^{1/5}.
\]
A Lighthouse Event (LHE) is declared when two conditions hold simultaneously:

1. \(L(t) > \mu_L + 2\sigma_L\), where \(\mu_L\) and \(\sigma_L\) are running estimates from a 512-sample background window.
2. An FTCP exists within a tolerance window \(\Delta t\) around \(t\).

The consensus stage yields a sparse set of globally validated events (see Fig. 2 for an example time series and detection markers).

### C. Algorithmic Overview
```
for each signal window centered at t:
    if is_FTCP(t):
        metrics = compute_metrics(window)
        L = geometric_mean(metrics)
        if L > mu_L + 2 * sigma_L:
            register Lighthouse Event at t
```

## IV. Experimental Evaluation

### A. Synthetic Golden-Lattice System
A synthetic dataset mimicking golden-ratio coupling was generated using a hierarchical oscillator chain with stochastic forcing. Signals were sampled at 1 kHz over 40 time units. Known phase transitions were inserted at \(t = \{6.2, 12.9, 24.7, 33.4\}\).

- Stage 1 produced 463 FTCP candidates.
- Stage 2 reduced detections to 7 LHEs, of which 4 matched the ground-truth transitions and 3 were labelled as anticipatory precursors.
- Precision improved from 0.014 (Stage 1 alone) to 0.571 after consensus filtering.

Figure summaries:
- **Figure 1** (Global coherence \(R(t)\)): illustrates the gradual rise in system-wide alignment preceding the confirmed transitions.
- **Figure 2** (Lighthouse intensity): shows the consensus score surpassing the adaptive threshold at transition times while suppressing noise bursts.
- **Figure 3** (Scalar signal with Fibonacci knots): highlights the lattice overlay that guides FTCP discovery.

### B. FTCP Robustness Studies
Ablation experiments varied the golden-ratio tolerance \(\varepsilon\) and curvature scaling (see Fig. 10). Only \(\varepsilon\) values targeting \(\varphi\) preserved FTCP counts; tolerances targeting \(1/\varphi\) or arbitrary ratios suppressed detections, supporting the resonance hypothesis.

### C. Lighthouse Metric Ablations
Removing individual metrics from the consensus stage revealed the following drops in F1 score:

| Removed Metric | F1 Score | Relative Change |
|----------------|----------|-----------------|
| None           | 0.71     | —               |
| \(G_{\text{eff}}\) | 0.42     | −41%           |
| \(C_{\text{nonlin}}\) | 0.47     | −34%           |
| \(C_{\phi}\) | 0.63     | −11%           |
| \(C_{\text{lin}}\) | 0.60     | −15%           |
| \(|Q|\)       | 0.69     | −3%            |

The results confirm that \(G_{\text{eff}}\) and \(C_{\text{nonlin}}\) are critical to consensus performance, while \(|Q|\) acts as a gentle suppressor for diffuse events.

### D. Stabilization via Temporal \(\varphi\) Ping-Pong
The temporal ping-pong procedure alternates coarse and fine reconstructions aligned to Fibonacci knots (see Fig. 6–8). After 30 iterations, the scale-curvature mismatch converges below 5% of its initial value, and the stabilized signal \(\psi\) inherits the golden-ratio attractor.

## V. Discussion

### A. Emergence of a Stabilized Waveform
Iterative stabilization reveals a waveform whose curvature statistics match the Fibonacci lattice. Figures 6 and 7 show the base signal against its stabilized counterpart and the corresponding curvature collapse.

### B. Differentiating Stable vs. Transient Events
FTCPs capture local geometric anomalies, whereas LHEs demonstrate global consensus. Figure 5 compares raw and cleaned FTCP distributions, illustrating how consensus validation prunes isolated spikes while retaining coherent structures.

### C. Broader Implications and Limitations
QGITA suggests that irrational temporal filters can expose hidden order in chaotic systems. Future deployments must consider computational cost—the Stage 2 consensus requires maintaining adaptive statistics and template banks in real time. Additionally, empirical confirmation on physical sensors (power grids, biosignals) remains ongoing work.

## VI. Conclusion and Future Work
QGITA combines geometric structure with consensus validation to detect true system transitions amid complex dynamics. By enforcing golden-ratio timing and cross-metric agreement, the framework attains high precision without sacrificing recall. Future directions include:

- Integrating machine-learned embeddings into the metric suite while retaining interpretability.
- Extending Fibonacci lattices to multi-dimensional sensor arrays.
- Exploring alternative irrational attractors (e.g., silver ratio) for systems with different resonance properties.

## Appendix: Figure Guide
1. **Global Coherence \(R(t)\)** — demonstrates rising coherence approaching the attractor.
2. **Lighthouse Intensity with LHE Markers** — highlights consensus threshold crossings.
3. **Scalar Signal with Fibonacci Knots** — visualizes Stage 1 lattice alignment.
4. **FTCPs (synthetic demo)** — overlays \(x(t)\) with \(G_{\text{eff}}\) and marked FTCPs.
5. **FTCPs (cleaned)** — shows post-consensus pruning of spurious candidates.
6. **Temporal \(\varphi\) Ping-Pong** — compares base and stabilized signals.
7. **Curvature Before vs. After Ping-Pong** — reveals curvature compression.
8. **Ping-Pong Convergence** — traces scale-curvature mismatch decay.
9. **\(G_{\text{eff}}\) on Fibonacci Knots** — depicts stabilized \(G_{\text{eff}}\) against the signal.
10. **FTCP Count vs. \(\varepsilon\)** — shows sensitivity to golden-ratio tolerance.

These visualizations accompany the manuscript to illustrate each stage of the QGITA pipeline.
