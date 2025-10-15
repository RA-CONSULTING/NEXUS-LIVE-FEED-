"""Temporal Aura Scan Engine.

This module provides utilities for generating synthetic aura scan reports based on
Schumann resonance data. It supports single-run and batch processing plus
plotting helpers that persist output artefacts for downstream services.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import datetime as dt
import hashlib
import json
import os
import zipfile

import matplotlib.pyplot as plt
import numpy as np


BASELINE_FREQUENCY_HZ = 7.83
DEFAULT_STD_FALLBACK = 0.05
SCANS_DIR = Path("data/scans")
PLOTS_SUBDIR_NAME = "plots"


@dataclass
class SchumannAggregate:
    """Aggregated information derived from Schumann samples."""

    mean_hz: float
    std_hz: float
    samples: np.ndarray


@dataclass
class AuraReport:
    """Structured representation for an aura scan."""

    operator: str
    location: Optional[str]
    timestamp_utc: str
    mean_frequency_hz: float
    std_frequency_hz: float
    coherence: float
    phase_lock: float
    quantum_alignment: float
    seal_hash: str
    seal_payload: Dict[str, object]
    plots: Dict[str, Optional[str]]
    status: str

    def to_json(self) -> Dict[str, object]:
        return {
            "operator": self.operator,
            "location": self.location,
            "timestamp_utc": self.timestamp_utc,
            "mean_frequency_hz": self.mean_frequency_hz,
            "std_frequency_hz": self.std_frequency_hz,
            "coherence": self.coherence,
            "phase_lock": self.phase_lock,
            "quantum_alignment": self.quantum_alignment,
            "seal_hash": self.seal_hash,
            "seal_payload": self.seal_payload,
            "plots": self.plots,
            "status": self.status,
        }


def load_schumann_data(zip_path: str | os.PathLike[str]) -> SchumannAggregate:
    """Load Schumann resonance values from a zipped archive of CSV files.

    The expected CSV layout is flexible: the first numeric column after the
    header is interpreted as the Schumann frequency reading in Hz.
    """

    path = Path(zip_path)
    if not path.exists():
        return SchumannAggregate(BASELINE_FREQUENCY_HZ, DEFAULT_STD_FALLBACK, np.array([]))

    frequencies: List[float] = []
    try:
        with zipfile.ZipFile(path, "r") as archive:
            for member in archive.namelist():
                if not member.lower().endswith(".csv"):
                    continue
                with archive.open(member) as file_obj:
                    lines = file_obj.read().decode("utf-8", errors="ignore").splitlines()
                    if not lines:
                        continue
                    for line in lines[1:]:  # skip header
                        parts = [segment.strip() for segment in line.split(",") if segment.strip()]
                        if not parts:
                            continue
                        for token in parts:
                            try:
                                value = float(token)
                                frequencies.append(value)
                                break
                            except ValueError:
                                continue
        if not frequencies:
            return SchumannAggregate(BASELINE_FREQUENCY_HZ, DEFAULT_STD_FALLBACK, np.array([]))
    except zipfile.BadZipFile:
        return SchumannAggregate(BASELINE_FREQUENCY_HZ, DEFAULT_STD_FALLBACK, np.array([]))

    samples = np.array(frequencies, dtype=float)
    return SchumannAggregate(float(np.mean(samples)), float(np.std(samples)), samples)


def compute_temporal_vector(mean_freq: float, std_freq: float) -> Tuple[float, float, float]:
    """Compute coherence metrics based on Schumann data."""

    delta = abs(mean_freq - BASELINE_FREQUENCY_HZ)
    coherence = max(0.0, min(1.0, 1.0 - (delta * 5.0 + std_freq)))

    # phase_lock oscillates gently around 0.96-0.99 depending on coherence.
    phase_lock = 0.95 + coherence * 0.05

    # quantum_alignment trends towards 1 with higher coherence, with a mild bias.
    quantum_alignment = 0.97 + coherence * 0.03

    return coherence, phase_lock, quantum_alignment


def generate_quantum_seal(payload: Dict[str, object]) -> str:
    """Create a deterministic SHA3-512 hash for the provided payload."""

    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha3_512(canonical.encode("utf-8")).hexdigest()


def _sanitize_for_filename(text: str) -> str:
    safe = "".join(char if char.isalnum() or char in ("-", "_") else "_" for char in text)
    return safe.strip("_") or "scan"


def _plot_frequency_series(
    frequencies: np.ndarray,
    save_dir: Path,
    operator_tag: str,
    baseline: float,
) -> Dict[str, Optional[str]]:
    if frequencies.size == 0:
        return {"frequency_plot": None, "coherence_plot": None}

    save_dir.mkdir(parents=True, exist_ok=True)

    x_axis = np.arange(frequencies.size)
    coherence_series = np.maximum(0.0, 1.0 - (np.abs(frequencies - baseline) * 5.0))

    freq_path = save_dir / f"{operator_tag}_frequency.png"
    coherence_path = save_dir / f"{operator_tag}_coherence.png"

    plt.figure(figsize=(9, 4))
    plt.plot(x_axis, frequencies, label="Schumann Frequency")
    plt.axhline(baseline, color="gold", linestyle="--", label=f"Baseline {baseline:.2f} Hz")
    plt.title("Schumann Frequency Drift")
    plt.xlabel("Sample")
    plt.ylabel("Frequency (Hz)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(freq_path)
    plt.close()

    plt.figure(figsize=(9, 4))
    plt.plot(x_axis, coherence_series, color="teal", label="Temporal Coherence")
    plt.ylim(0.0, 1.05)
    plt.title("Temporal Coherence Field")
    plt.xlabel("Sample")
    plt.ylabel("Coherence")
    plt.legend()
    plt.tight_layout()
    plt.savefig(coherence_path)
    plt.close()

    return {
        "frequency_plot": str(freq_path),
        "coherence_plot": str(coherence_path),
    }


def _store_report(report: AuraReport, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    timestamp = report.timestamp_utc.replace(":", "-")
    tag = _sanitize_for_filename(report.operator)
    filename = directory / f"{timestamp}_{tag}.json"
    with filename.open("w", encoding="utf-8") as fp:
        json.dump(report.to_json(), fp, indent=2)
    return filename


def run_temporal_aura_scan(
    operator_name: str,
    location: Optional[str],
    zip_path: str | os.PathLike[str],
    output_dir: Path | None = None,
) -> Dict[str, object]:
    """Execute a single temporal aura scan."""

    aggregate = load_schumann_data(zip_path)
    coherence, phase_lock, quantum_alignment = compute_temporal_vector(
        aggregate.mean_hz, aggregate.std_hz
    )

    timestamp = dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat()
    seal_payload = {
        "operator": operator_name,
        "location": location,
        "timestamp_utc": timestamp,
        "coherence": round(coherence, 6),
        "phase_lock": round(phase_lock, 6),
        "quantum_alignment": round(quantum_alignment, 6),
    }
    seal_hash = generate_quantum_seal(seal_payload)

    plots_dir = (output_dir or SCANS_DIR) / PLOTS_SUBDIR_NAME
    operator_tag = _sanitize_for_filename(operator_name or "operator")
    plots = _plot_frequency_series(aggregate.samples, plots_dir, operator_tag, BASELINE_FREQUENCY_HZ)

    status = _derive_status(coherence)

    report = AuraReport(
        operator=operator_name,
        location=location,
        timestamp_utc=timestamp,
        mean_frequency_hz=round(aggregate.mean_hz, 6),
        std_frequency_hz=round(aggregate.std_hz, 6),
        coherence=round(coherence, 6),
        phase_lock=round(phase_lock, 6),
        quantum_alignment=round(quantum_alignment, 6),
        seal_hash=seal_hash,
        seal_payload=seal_payload,
        plots=plots,
        status=status,
    )

    reports_dir = output_dir or SCANS_DIR
    stored_path = _store_report(report, reports_dir)

    result = report.to_json()
    result["report_path"] = str(stored_path)
    return result


def _derive_status(coherence: float) -> str:
    if coherence >= 0.85:
        return "Prime Sentinel Field Stable"
    if coherence >= 0.65:
        return "Field Harmonizing"
    if coherence >= 0.45:
        return "Temporal Drift Detected"
    return "Field Destabilized"


def batch_run_temporal_scans(
    users: Iterable[Dict[str, object]],
    zip_path: str | os.PathLike[str],
    output_dir: Path | None = None,
) -> List[Dict[str, object]]:
    """Run scans for multiple users sequentially."""

    results: List[Dict[str, object]] = []
    for entry in users:
        name = str(entry.get("name", "Unknown Operator"))
        location = entry.get("location")
        report = run_temporal_aura_scan(name, location, zip_path, output_dir=output_dir)
        results.append(report)
    return results


