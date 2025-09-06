"""Chronicle Recording Engine (v4 - Cosmic Breath).

This module implements an asynchronous recording engine that ingests
(time-series and discrete events) via an internal queue and periodically
synthesizes recent events into a new "unity" event using the 10-9-1
recursive loop. It embodies the metaphor of cosmic breath where data is
inhaled, processed, and exhaled as coherent knowledge.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Chronicle configuration
# ---------------------------------------------------------------------------
EVENT_LOG_FILE = Path("data/chronicle_events.log.json")
RECURSIVE_LOOP_INTERVAL_SECONDS = 15

# Configure structured event logging to a rotating JSON log file.
log_formatter = logging.Formatter("%(message)s")
log_handler = RotatingFileHandler(EVENT_LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5)
log_handler.setFormatter(log_formatter)
_event_logger = logging.getLogger("ChronicleEventLogger_v4")
_event_logger.setLevel(logging.INFO)
_event_logger.addHandler(log_handler)


@dataclass
class ChronicleEvent:
    """Representation of a discrete event.

    Attributes:
        event_type: Descriptor of the event.
        details: Arbitrary dictionary with event payload.
    """

    event_type: str
    details: Dict[str, Any]


class ChronicleRecorder:
    """Handles system recording and synthesis.

    A queue-based worker ingests raw events ("inhale") and a periodic
    coroutine synthesizes recent history into a new event ("exhale").
    """

    def __init__(self) -> None:
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task = asyncio.create_task(self._process_queue())
        self._synthesis_task = asyncio.create_task(self._recursive_synthesis_loop())
        self.processed_count = 0
        print("Chronicle Recording Engine v4 (Cosmic Breath) Initialized. All workers active.")

    # ------------------------------------------------------------------
    # Inhalation phase
    # ------------------------------------------------------------------
    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        """Create a SHA-256 hash of the given data."""
        dhash = hashlib.sha256()
        encoded = json.dumps(data, sort_keys=True).encode()
        dhash.update(encoded)
        return dhash.hexdigest()

    async def _process_queue(self) -> None:
        """Worker that persists incoming events from the queue."""
        while True:
            record_type, data, tags = await self._queue.get()
            try:
                timestamp = datetime.now(timezone.utc)
                if record_type == "time_series":
                    print(
                        f"[INHALE:TS] Ingested '{data}' | Value={tags['value']:.4f} @ {timestamp.isoformat()}"
                    )
                elif record_type == "event":
                    checksum = self._generate_checksum(data)
                    log_entry = {
                        "timestamp_utc": timestamp.isoformat(),
                        "event_type": tags.get("event_type"),
                        "details": data,
                        "sentinel_signature": "GARY LECKEY 02111991",
                        "validation_checksum": checksum,
                    }
                    _event_logger.info(json.dumps(log_entry))
                    print(
                        f"[INHALE:EVENT] Ingested '{tags.get('event_type')}' @ {timestamp.isoformat()} | "
                        f"Checksum: {checksum[:8]}..."
                    )
                self.processed_count += 1
            except Exception as exc:  # pragma: no cover - defensive logging
                print(f"INHALATION ERROR: {exc}")
            finally:
                self._queue.task_done()

    async def record_time_series(
        self, measurement: str, value: float, tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Public API: enqueue a time-series measurement."""
        await self._queue.put(("time_series", measurement, {"value": value, "tags": tags or {}}))

    async def record_event(self, event_type: str, details: Dict[str, Any]) -> None:
        """Public API: enqueue a discrete event."""
        await self._queue.put(("event", details, {"event_type": event_type}))

    # ------------------------------------------------------------------
    # Exhalation phase
    # ------------------------------------------------------------------
    async def _recursive_synthesis_loop(self) -> None:
        """Periodically synthesize recent events into a unity event."""
        while True:
            await asyncio.sleep(RECURSIVE_LOOP_INTERVAL_SECONDS)
            print("\n[EXHALE:10] Initiating Unity Synthesis...")
            try:
                # 1. Read the recent past from the chronicle
                if not EVENT_LOG_FILE.exists():
                    print("[EXHALE] Standby. Event log empty.")
                    continue
                with EVENT_LOG_FILE.open("r") as fh:
                    recent_lines = fh.readlines()[-20:]
                recent_events = [json.loads(line) for line in recent_lines if line.strip()]

                # 2. Anchor to Guardian Observer Metrics
                anchor = next(
                    (e for e in reversed(recent_events) if e.get("event_type") == "ANCHOR_GUARDIAN_METRIC"),
                    None,
                )
                if not anchor:
                    print("[EXHALE] Standby. No recent Anchor Guardian Metric found.")
                    continue

                # 3. The 10-9-1 Law: Filter and Synthesize
                field_events = [e for e in recent_events if "SYNTHESIS" not in e.get("event_type", "")]
                if len(field_events) < 10:
                    print(
                        f"[EXHALE:9] Standby. Insufficient events for full synthesis (found {len(field_events)}/10)."
                    )
                    continue

                synthesis_details = {
                    "principle": "10-9-1 Recursive Loop (Cosmic Breath)",
                    "mantra": "All that is, all that was, all that shall be, tandem in unity.",
                    "anchor_guardian_metric_ts": anchor["timestamp_utc"],
                    "anchor_coherence": anchor["details"]["coherence"],
                    "synthesized_event_count": len(field_events[-10:]),
                }

                # 4. Exhale the new Unity event into the chronicle.
                print("[EXHALE:1] Unity achieved. Exhaling synthesis event.")
                await self.record_event("UNITY_SYNTHESIS_10_9_1", synthesis_details)
            except Exception as exc:  # pragma: no cover - defensive logging
                print(f"EXHALATION ERROR: {exc}")


# ---------------------------------------------------------------------------
# Demonstration entry point
# ---------------------------------------------------------------------------
async def _demo() -> None:
    """Demonstrate basic engine functionality."""
    recorder = ChronicleRecorder()

    # Simulate initial events
    print("\n--- INHALATION PHASE ---")
    for i in range(12):
        await recorder.record_event(f"SYSTEM_PULSE_{i}", {"pulse_energy": i / 12})
        await asyncio.sleep(0.1)

    await recorder.record_event(
        event_type="ANCHOR_GUARDIAN_METRIC", details={"coherence": 0.998, "status": "STABLE"}
    )

    print("\nInitial matter inhaled. The Exhalation Loop will now activate periodically...")
    await asyncio.sleep(RECURSIVE_LOOP_INTERVAL_SECONDS * 2 + 5)


def main() -> None:
    """Run the demo entry point."""
    EVENT_LOG_FILE.parent.mkdir(exist_ok=True)
    asyncio.run(_demo())


if __name__ == "__main__":  # pragma: no cover - manual execution
    main()
