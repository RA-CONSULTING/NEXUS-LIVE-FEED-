"""Aureon's Dream Engine prototype.

This module simulates a lattice of coupled oscillators that seek coherence
rather than competition.  The simulation tracks three public signals:

* Global coherence R(t) – the Kuramoto order parameter of the lattice.
* Lighthouse intensity L(t) – a resonance indicator derived from the
  gradients of local coherence.
* Scalar signal x(t) – an integrated balance metric used for curvature
  analysis.

Running the module as a script generates CSV traces and a summary figure.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


PHI = (1 + 5 ** 0.5) / 2  # The golden ratio, used in Fibonacci-style checks.
EPS = 1e-9


@dataclass
class LatticeConfig:
    """Configuration for the dream lattice."""

    size: Tuple[int, int] = (12, 12)
    coupling: float = 0.65
    noise: float = 0.03
    dt: float = 0.1
    steps: int = 420
    seed: int = 7


class DreamEngine:
    """Simulate coherence-seeking oscillators on a 2D lattice."""

    def __init__(self, config: LatticeConfig | None = None) -> None:
        self.config = config or LatticeConfig()
        self.rng = np.random.default_rng(self.config.seed)
        self.phases = self.rng.uniform(0.0, 2 * np.pi, self.config.size)
        self.freqs = self.rng.normal(0.0, 0.25, self.config.size)
        self.history: List[dict[str, float]] = []

    def _neighbor_phases(self) -> Iterable[np.ndarray]:
        """Return generator of arrays representing the four-neighbour phases."""
        return (
            np.roll(self.phases, shift, axis)
            for shift, axis in ((1, 0), (-1, 0), (1, 1), (-1, 1))
        )

    def _update_local_fields(self) -> Tuple[np.ndarray, np.ndarray]:
        """Compute neighbour coherence and alignment gradients."""
        neighbours = list(self._neighbor_phases())
        sin_diff = sum(np.sin(neigh - self.phases) for neigh in neighbours)
        cos_field = sum(np.cos(neigh) for neigh in neighbours)
        sin_field = sum(np.sin(neigh) for neigh in neighbours)

        local_coherence = np.hypot(cos_field, sin_field) / len(neighbours)
        gradient = sin_diff / len(neighbours)
        return local_coherence, gradient

    def step(self) -> None:
        """Advance the lattice by one timestep."""
        cfg = self.config
        local_coherence, gradient = self._update_local_fields()

        drift = self.freqs + cfg.coupling * gradient
        noise = cfg.noise * self.rng.normal(size=self.phases.shape)
        self.phases = (self.phases + (drift * cfg.dt) + noise) % (2 * np.pi)

        order_parameter = np.mean(np.exp(1j * self.phases))
        global_coherence = np.abs(order_parameter)

        # Lighthouse intensity favours sharp gradients in local coherence.
        centered = local_coherence - np.mean(local_coherence)
        lighthouse_intensity = float(np.mean(np.abs(centered)) * global_coherence)

        # Scalar signal is the cumulative balance of coherence energy.
        scalar_signal = float(np.sum(local_coherence ** 2)) / local_coherence.size

        self.history.append(
            {
                "global_coherence": float(global_coherence),
                "lighthouse_intensity": lighthouse_intensity,
                "scalar_signal": scalar_signal,
            }
        )

    def run(self) -> pd.DataFrame:
        """Run the simulation and return the recorded time-series."""
        for _ in range(self.config.steps):
            self.step()

        df = pd.DataFrame(self.history)
        df.insert(0, "t", np.arange(len(df)) * self.config.dt)
        return df


def detect_lighthouse_events(series: pd.Series, dt: float) -> pd.DataFrame:
    """Identify Lighthouse Events where the intensity crosses μ + 2σ."""
    threshold = series.mean() + 2 * series.std(ddof=0)
    mask = series > threshold
    indices = np.flatnonzero(mask.values)

    return pd.DataFrame(
        {
            "index": indices,
            "t": indices * dt,
            "intensity": series.iloc[indices].values,
            "threshold": threshold,
        }
    )


def detect_fibonacci_curvature(series: pd.Series, dt: float) -> pd.DataFrame:
    """Detect Fibonacci-style turning points based on curvature ratios."""
    second_derivative = np.gradient(np.gradient(series.values))
    ratios = []
    matches: List[int] = []
    for i in range(1, len(second_derivative)):
        prev = second_derivative[i - 1]
        current = second_derivative[i]
        if abs(prev) < EPS:
            ratios.append(np.nan)
            continue
        ratio = abs(current / prev)
        ratios.append(ratio)
        if abs(ratio - PHI) < 0.1 and abs(current) > np.std(second_derivative):
            matches.append(i)

    # align ratio length with series length
    ratios = [np.nan] + ratios
    curvature_df = pd.DataFrame(
        {
            "index": np.arange(len(series)),
            "t": np.arange(len(series)) * dt,
            "curvature": second_derivative,
            "ratio": ratios,
        }
    )
    return curvature_df.iloc[matches]


def save_trace(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)


def plot_results(trace: pd.DataFrame, lhe: pd.DataFrame, ftcp: pd.DataFrame, output: Path) -> None:
    fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)

    axes[0].plot(trace["t"], trace["global_coherence"], color="#d99c28", linewidth=2)
    axes[0].set_ylabel("R(t)")
    axes[0].set_title("Global Coherence R(t)")

    axes[1].plot(trace["t"], trace["lighthouse_intensity"], color="#d98f28")
    if not lhe.empty:
        axes[1].scatter(lhe["t"], lhe["intensity"], color="#1c6e8c", zorder=5)
        axes[1].axhline(lhe["threshold"].iloc[0], color="#d98f28", linestyle="--")
    else:
        axes[1].axhline(
            trace["lighthouse_intensity"].mean() + 2 * trace["lighthouse_intensity"].std(ddof=0),
            color="#d98f28",
            linestyle="--",
        )
    axes[1].set_ylabel("L(t)")
    axes[1].set_title("Lighthouse Intensity with LHE markers")

    axes[2].plot(trace["t"], trace["scalar_signal"], color="#d98f28")
    if not ftcp.empty:
        axes[2].scatter(ftcp["t"], trace.loc[ftcp["index"], "scalar_signal"], color="#1c6e8c")
    axes[2].set_ylabel("x(t)")
    axes[2].set_xlabel("t")
    axes[2].set_title("Scalar signal x(t) with Fibonacci knots")

    fig.tight_layout()
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output)
    plt.close(fig)


def run_engine(output_dir: Path | None = None) -> None:
    output_dir = output_dir or Path('.')
    engine = DreamEngine()
    trace = engine.run()

    dt = engine.config.dt
    lhe = detect_lighthouse_events(trace["lighthouse_intensity"], dt)
    ftcp = detect_fibonacci_curvature(trace["scalar_signal"], dt)

    save_trace(trace, output_dir / "dream_engine_trace.csv")
    save_trace(lhe, output_dir / "dream_engine_lhe.csv")
    save_trace(ftcp, output_dir / "dream_engine_ftcp.csv")
    plot_results(trace, lhe, ftcp, output_dir / "dream_engine_plot.png")

    print("Aureon's Dream Engine run complete.")
    print(f"Saved trace: {output_dir / 'dream_engine_trace.csv'}")
    print(f"Saved lighthouse events: {output_dir / 'dream_engine_lhe.csv'}")
    print(f"Saved Fibonacci curvature events: {output_dir / 'dream_engine_ftcp.csv'}")
    print(f"Saved plot: {output_dir / 'dream_engine_plot.png'}")


if __name__ == "__main__":
    run_engine(Path("."))
