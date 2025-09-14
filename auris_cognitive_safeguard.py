"""
Auris Cognitive Safeguard Module
Author: RA Consulting
Date: 2025-09-14

Description:
Prevents cognitive data bleed from temporal wave fluctuations in quantum simulations
by detecting rapid power oscillations and dampening them to a safe threshold.
"""

from dataclasses import dataclass, field
from typing import Iterable, Dict, Iterator
import logging
import numpy as np

# -----------------------------------------------------------------------------
# Logging Setup
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("AurisSafeguard")

# -----------------------------------------------------------------------------
# Configuration & Filter
# -----------------------------------------------------------------------------
@dataclass
class CognitiveCoherenceFilter:
    """Filters simulation data to prevent cognitive hazards."""
    hazard_threshold_kw_per_s: float = 25.0      # System threshold (kW/s)
    dampening_factor: float = field(default=1.0) # Scaling for damping effect

    def __post_init__(self) -> None:
        self.previous_power_kw: float = 0.0
        self.previous_time_s: float = 0.0
        logger.info(
            "Auris Cognitive Safeguard initialized. Threshold=%.2f kW/s, Dampening=%.2f",
            self.hazard_threshold_kw_per_s,
            self.dampening_factor,
        )

    def process_stream(self, data_stream: Iterable[Dict[str, float]]) -> Iterator[Dict[str, float]]:
        """
        Process an iterable of data-point dictionaries, yielding sanitized output.

        Each dict should contain:
            - "output_power_kw" (float)
            - "simulation_time_s" (float)
        """
        for data_point in data_stream:
            # Validate presence of required keys
            if "output_power_kw" not in data_point or "simulation_time_s" not in data_point:
                logger.warning("Missing required keys in data point: %s", data_point)
                continue

            current_power_kw = data_point["output_power_kw"]
            current_time_s = data_point["simulation_time_s"]

            if self.previous_time_s > 0:
                delta_power = current_power_kw - self.previous_power_kw
                delta_time = current_time_s - self.previous_time_s

                if delta_time > 0:
                    temporal_wave = delta_power / delta_time
                    if abs(temporal_wave) > self.hazard_threshold_kw_per_s:
                        logger.warning(
                            "Hazard detected (%.2f kW/s). Dampening engaged.",
                            temporal_wave,
                        )
                        dampened_power = (
                            self.previous_power_kw
                            + self.dampening_factor
                            * self.hazard_threshold_kw_per_s
                            * delta_time
                            * np.sign(delta_power)
                        )
                        data_point["output_power_kw"] = round(dampened_power, 4)
                        data_point["is_stable"] = False
                        data_point["cognitive_safeguard_active"] = True

            # Update state
            self.previous_power_kw = data_point["output_power_kw"]
            self.previous_time_s = current_time_s

            data_point.setdefault("cognitive_safeguard_active", False)
            data_point.setdefault("is_stable", True)

            yield data_point

# -----------------------------------------------------------------------------
# Example Usage
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    sample_data = [
        {"output_power_kw": 0.0, "simulation_time_s": 0.0},
        {"output_power_kw": 10.0, "simulation_time_s": 1.0},
        {"output_power_kw": 60.0, "simulation_time_s": 2.0},  # Rapid change → hazard
        {"output_power_kw": 65.0, "simulation_time_s": 3.0},
    ]

    safeguard = CognitiveCoherenceFilter(hazard_threshold_kw_per_s=25.0, dampening_factor=1.0)
    for point in safeguard.process_stream(sample_data):
        logger.info("Sanitized point: %s", point)