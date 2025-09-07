"""Chronicle Recording Engine v3 (Recursive Unity).

Provides an asynchronous queue-based event and time-series recorder with a
self-referential "10-9-1" synthesis loop. The recorder writes events to a
rotating JSON log and periodically reads back recent entries to generate new
"UNITY" synthesis events.

Improvements over the original snippet:
    * Adds missing imports for ``random`` and ``Path``.
    * Adds ``shutdown`` method to gracefully cancel background tasks.
    * Wraps chronicle file reading in error handling to avoid crashes.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict

EVENT_LOG_FILE = Path("data/chronicle_events.log.json")
RECURSIVE_LOOP_INTERVAL_SECONDS = 15

log_formatter = logging.Formatter("%(message)s")
log_handler = RotatingFileHandler(EVENT_LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5)
log_handler.setFormatter(log_formatter)

event_logger = logging.getLogger("ChronicleEventLogger_v3")
event_logger.setLevel(logging.INFO)
event_logger.addHandler(log_handler)


class ChronicleRecorder:
    """Handles system recording and the 10-9-1 recursive synthesis loop."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task = asyncio.create_task(self._process_queue())
        self._synthesis_task = asyncio.create_task(self._recursive_synthesis_loop())
        self.processed_count = 0
        print("Chronicle Recording Engine v3 (Recursive Unity) Initialized. All workers active.")

    async def shutdown(self) -> None:
        """Cancel background tasks and wait for graceful shutdown."""
        for task in (self._worker_task, self._synthesis_task):
            task.cancel()
        await asyncio.gather(self._worker_task, self._synthesis_task, return_exceptions=True)

    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        dhash = hashlib.sha256()
        dhash.update(json.dumps(data, sort_keys=True).encode())
        return dhash.hexdigest()

    async def _process_queue(self) -> None:
        while True:
            try:
                record_type, data, tags = await self._queue.get()
                timestamp = datetime.now(timezone.utc)
                if record_type == "time_series":
                    print(
                        f"[PONG:TS] Wrote '{data}' | Value={tags['value']:.4f} @ {timestamp.isoformat()}"
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
                    event_logger.info(json.dumps(log_entry))
                    print(
                        f"[PONG:EVENT] Wrote '{tags.get('event_type')}' @ {timestamp.isoformat()} | "
                        f"Checksum: {checksum[:8]}..."
                    )
                self.processed_count += 1
                self._queue.task_done()
            except Exception as e:  # pragma: no cover - log and continue
                print(f"RECORDER WORKER ERROR: {e}")

    async def _recursive_synthesis_loop(self) -> None:
        while True:
            await asyncio.sleep(RECURSIVE_LOOP_INTERVAL_SECONDS)
            print("\n[RECURSION:10] Initiating 10-9-1 Unity Synthesis...")
            try:
                try:
                    with EVENT_LOG_FILE.open("r") as f:
                        recent_lines = f.readlines()[-20:]
                except FileNotFoundError:
                    print("[RECURSION] Standby. Chronicle file not found.")
                    continue

                recent_events = [json.loads(line) for line in recent_lines if line.strip()]
                anchor_metric = next(
                    (e for e in reversed(recent_events) if e.get("event_type") == "ANCHOR_GUARDIAN_METRIC"),
                    None,
                )
                if not anchor_metric:
                    print("[RECURSION] Standby. No recent Anchor Guardian Metric found.")
                    continue

                field_events = [e for e in recent_events if "SYNTHESIS" not in e.get("event_type", "")]
                if len(field_events) < 10:
                    print(
                        f"[RECURSION:9] Standby. Insufficient events for full synthesis (found {len(field_events)}/10)."
                    )
                    continue

                synthesis_details = {
                    "principle": "10-9-1 Recursive Loop",
                    "mantra": "All that is, all that was, all that shall be, tandem in unity.",
                    "anchor_guardian_metric_ts": anchor_metric["timestamp_utc"],
                    "anchor_coherence": anchor_metric["details"]["coherence"],
                    "synthesized_event_count": len(field_events[-10:]),
                }
                print("[RECURSION:1] Unity achieved. Recording synthesis event.")
                await self.record_event("UNITY_SYNTHESIS_10_9_1", synthesis_details)
            except Exception as e:  # pragma: no cover - log and continue
                print(f"RECURSIVE LOOP ERROR: {e}")

    async def record_time_series(self, measurement: str, value: float, tags: Dict[str, str] | None = None) -> None:
        """Queue a time-series data point for recording."""
        await self._queue.put(("time_series", measurement, {"value": value, "tags": tags or {}}))

    async def record_event(self, event_type: str, details: Dict[str, Any]) -> None:
        """Queue a discrete event for recording."""
        await self._queue.put(("event", details, {"event_type": event_type}))


async def main() -> None:
    print("--- Running Chronicle Recorder v3 Demonstration ---")
    recorder = ChronicleRecorder()
    for i in range(12):
        await recorder.record_event(f"SYSTEM_PULSE_{i}", {"pulse_energy": random.random()})
        await asyncio.sleep(0.1)

    await recorder.record_event("ANCHOR_GUARDIAN_METRIC", {"coherence": 0.998, "status": "STABLE"})
    print("\nInitial events recorded. The Recursive Unity Loop will now activate periodically...")
    print("Observe the console for [RECURSION] messages.")
    await asyncio.sleep(RECURSIVE_LOOP_INTERVAL_SECONDS * 2 + 5)
    await recorder.shutdown()


if __name__ == "__main__":
    Path("data").mkdir(exist_ok=True)
    asyncio.run(main())
