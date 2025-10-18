"""Utilities for integrating Guardian–Anchor dynamics into the lattice drive pipeline."""

from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence, Tuple

import numpy as np


def _sigmoid(value: float) -> float:
    """Return a smooth logistic activation used for gain saturation."""

    return 1.0 / (1.0 + math.exp(-value))


@dataclass
class SymbolicCompiler:
    """Map intent keywords into a harmonic waveform."""

    keyword_map: Mapping[str, Tuple[float, float]]
    base_decay: float = 1.4
    default_frequency: float = 528.0
    default_decay: float = 1.2

    _token_pattern: re.Pattern[str] = re.compile(r"[\s,+]+")

    def lookup(self, intent: str) -> Tuple[List[float], List[float]]:
        """Return ordered frequencies and decays for ``intent``."""

        tokens = [token.strip().lower() for token in self._token_pattern.split(intent or "") if token.strip()]
        if not tokens:
            return [self.default_frequency], [self.default_decay]

        frequencies: List[float] = []
        decays: List[float] = []
        for token in tokens:
            freq, decay = self.keyword_map.get(token, (self.default_frequency, self.default_decay))
            frequencies.append(float(freq))
            decays.append(float(decay if decay > 0 else self.base_decay))

        return frequencies, decays

    def synthesize(self, intent: str, *, sample_rate: int = 128, duration: float = 1.0) -> List[float]:
        """Generate a normalized waveform for the provided ``intent``."""

        frequencies, decays = self.lookup(intent)
        if not frequencies:
            frequencies = [self.default_frequency]
            decays = [self.default_decay]

        num_samples = max(8, int(sample_rate * duration))
        time = np.linspace(0.0, duration, num_samples, endpoint=False)

        waveform = np.zeros_like(time)
        for freq, decay in zip(frequencies, decays):
            envelope = np.exp(-decay * time)
            harmonic = np.sin(2.0 * math.pi * freq * time)
            waveform += envelope * harmonic

        max_amp = float(np.max(np.abs(waveform))) if waveform.size else 0.0
        if max_amp > 0:
            waveform = waveform / max_amp
        return waveform.astype(float).tolist()


@dataclass
class UnityTensorField:
    """Nearest-neighbour sampler for the Unity TensorField TSV values."""

    samples: Sequence[Mapping[str, float]]
    default_tsv: float = 0.82

    @classmethod
    def from_path(cls, path: Path) -> "UnityTensorField":
        if not path.exists():
            return cls(samples=[], default_tsv=0.82)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = []
        if not isinstance(data, list):
            data = []
        return cls(samples=[row for row in data if isinstance(row, MutableMapping)], default_tsv=0.82)

    def sample(self, phi: float, kappa: float, psi: float) -> float:
        if not self.samples:
            return self.default_tsv

        best_distance = float("inf")
        best_value = self.default_tsv
        for row in self.samples:
            r_phi = float(row.get("phi", 0.0))
            r_kappa = float(row.get("kappa", 0.0))
            r_psi = float(row.get("psi", 0.0))
            distance = (phi - r_phi) ** 2 + (kappa - r_kappa) ** 2 + (psi - r_psi) ** 2
            if distance < best_distance:
                best_distance = distance
                best_value = float(row.get("tsv", self.default_tsv))
        return best_value


@dataclass
class LatticeIntegrationConfig:
    alpha: float = 0.9
    beta: float = 0.7
    gamma: float = 0.55
    delta: float = 0.6
    epsilon: float = 0.08
    eta: float = 1.35
    u_max: float = 0.85
    slew_max: float = 0.18
    phi_threshold: float = 0.2
    dissonance_cap: float = 0.35
    x_safe: float = 1.0
    crossfade: float = 0.4
    psi_safe: float = 12.0
    sensitivities: Mapping[str, float] = field(
        default_factory=lambda: {
            "cp": 0.65,
            "d": 0.8,
            "energy": 0.75,
            "lambda": 0.55,
        }
    )


@dataclass
class LatticeState:
    intent: str
    cp: float
    coherence: float
    phi_ga: float
    dissonance: float
    x_norm: float
    phi: float
    kappa: float
    psi: float
    psi_max: float
    previous_drive: float = 0.0
    yield_metric: Optional[float] = None


@dataclass
class LatticeIntegrationResult:
    drive: float
    waveform: List[float]
    gain: float
    tsv: float
    balance_value: float
    balance_terms: Dict[str, float]
    sandbox: Dict[str, bool]
    yield_metric: Optional[float]


class LatticeIntegrator:
    """Coordinate lattice drive updates with Lyapunov balance monitoring."""

    def __init__(
        self,
        *,
        compiler: SymbolicCompiler,
        tensor_field: UnityTensorField,
        config: Optional[LatticeIntegrationConfig] = None,
    ) -> None:
        self.compiler = compiler
        self.tensor_field = tensor_field
        self.config = config or LatticeIntegrationConfig()
        self._last_drive: float = 0.0
        self._last_t_sign: Optional[int] = None
        self._last_yield: Optional[float] = None

    def integrate(self, state: LatticeState) -> LatticeIntegrationResult:
        config = self.config

        waveform = self.compiler.synthesize(state.intent, duration=0.75)
        tsv_value = self.tensor_field.sample(state.phi, state.kappa, state.psi)
        gain = _sigmoid(config.eta * tsv_value)

        cp_error = 1.0 - state.cp
        excess_energy = max(0.0, state.x_norm - config.x_safe)
        balance_value = (
            config.alpha * cp_error ** 2
            + config.beta * state.dissonance ** 2
            + config.gamma * excess_energy ** 2
            - config.delta * state.coherence
        )

        gradient = (
            -2.0 * config.alpha * cp_error * config.sensitivities["cp"]
            + 2.0 * config.beta * state.dissonance * config.sensitivities["d"]
            + 2.0 * config.gamma * excess_energy * config.sensitivities["energy"]
            - config.delta * config.sensitivities["lambda"] * state.coherence
        )

        candidate_drive = state.previous_drive - config.epsilon * gradient

        candidate_drive = max(-config.u_max, min(config.u_max, candidate_drive))
        slew_delta = candidate_drive - state.previous_drive
        if abs(slew_delta) > config.slew_max:
            candidate_drive = state.previous_drive + math.copysign(config.slew_max, slew_delta)

        prime_window = 1.0 if (abs(state.phi_ga) < config.phi_threshold and state.dissonance <= config.dissonance_cap) else 0.0

        t_sign = 1 if tsv_value >= 0 else -1
        if self._last_t_sign is None:
            self._last_t_sign = t_sign
        if t_sign != self._last_t_sign:
            prime_window *= config.crossfade
            self._last_t_sign = t_sign

        drive_output = gain * candidate_drive * prime_window

        waveform_scaled = [gain * prime_window * sample for sample in waveform]

        sandbox_status = {
            "stability_alert": state.psi_max > config.psi_safe,
            "phase_lock": abs(state.phi_ga) < config.phi_threshold,
            "memory_alert": state.dissonance > config.dissonance_cap or cp_error > 0.4,
        }

        yield_metric = state.yield_metric
        if yield_metric is not None and self._last_yield is not None:
            sandbox_status["yield_monotonic"] = yield_metric >= self._last_yield - 1e-6
        elif yield_metric is not None:
            sandbox_status["yield_monotonic"] = True

        self._last_drive = drive_output
        self._last_yield = yield_metric

        return LatticeIntegrationResult(
            drive=drive_output,
            waveform=waveform_scaled,
            gain=gain,
            tsv=tsv_value,
            balance_value=balance_value,
            balance_terms={
                "cp_term": config.alpha * cp_error ** 2,
                "d_term": config.beta * state.dissonance ** 2,
                "energy_term": config.gamma * excess_energy ** 2,
                "lambda_term": -config.delta * state.coherence,
            },
            sandbox=sandbox_status,
            yield_metric=yield_metric,
        )


__all__ = [
    "LatticeIntegrator",
    "LatticeIntegrationConfig",
    "LatticeIntegrationResult",
    "LatticeState",
    "SymbolicCompiler",
    "UnityTensorField",
]
