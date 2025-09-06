import asyncio
import json
import logging
import hashlib
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class ChronicleRecorder:
    """Asynchronous event recorder with a 10-9-1 synthesis loop.

    Improvements over previous versions:
    * Configurable log file and synthesis interval.
    * Graceful shutdown via :meth:`shutdown`.
    * Ensures log file exists on start-up.
    * Optional queue size limit with backpressure handling.
    * Structured error logging using ``logging``.
    """

    def __init__(
        self,
        event_log_file: Path = Path("data/chronicle_events.log.json"),
        loop_interval: int = 15,
        max_queue_size: int = 0,
    ) -> None:
        self.event_log_file = Path(event_log_file)
        self.loop_interval = loop_interval
        self.event_log_file.parent.mkdir(parents=True, exist_ok=True)
        self.event_log_file.touch(exist_ok=True)

        formatter = logging.Formatter('%(message)s')
        handler = RotatingFileHandler(self.event_log_file, maxBytes=10 * 1024 * 1024, backupCount=5)
        handler.setFormatter(formatter)
        self.event_logger = logging.getLogger('ChronicleEventLogger_v5')
        self.event_logger.setLevel(logging.INFO)
        self.event_logger.addHandler(handler)

        self._queue: asyncio.Queue[Any] = asyncio.Queue(maxsize=max_queue_size)
        self._worker_task = asyncio.create_task(self._process_queue())
        self._synthesis_task = asyncio.create_task(self._recursive_synthesis_loop())
        self._shutdown = False
        self.processed_count = 0
        logging.getLogger(__name__).info("Chronicle Recorder initialized")

    # ------------------------------------------------------------------
    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        """Create a SHA-256 hash of the data to ensure integrity."""
        dhash = hashlib.sha256()
        encoded = json.dumps(data, sort_keys=True).encode()
        dhash.update(encoded)
        return dhash.hexdigest()

    # ------------------------------------------------------------------
    async def _process_queue(self) -> None:
        """Consume events from the queue and write them to the log."""
        while True:
            try:
                record_type, data, tags = await self._queue.get()
                timestamp = datetime.now(timezone.utc)
                if record_type == "time_series":
                    logging.info(
                        "[INHALE:TS] Ingested '%s' | Value=%.4f @ %s",
                        data,
                        tags['value'],
                        timestamp.isoformat(),
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
                    self.event_logger.info(json.dumps(log_entry))
                    logging.info(
                        "[INHALE:EVENT] Ingested '%s' @ %s | Checksum: %s",
                        tags.get("event_type"),
                        timestamp.isoformat(),
                        checksum[:8] + "...",
                    )
                self.processed_count += 1
            except Exception:
                logging.exception("INHALATION ERROR")
            finally:
                self._queue.task_done()

    # ------------------------------------------------------------------
    async def _recursive_synthesis_loop(self) -> None:
        """Periodically synthesize recent events and emit a UNITY record."""
        while True:
            try:
                await asyncio.sleep(self.loop_interval)
                logging.info("[EXHALE:10] Initiating Unity Synthesis...")
                recent_lines = self.event_log_file.read_text().splitlines()[-20:]
                recent_events = [json.loads(line) for line in recent_lines if line.strip()]
                anchor_metric = next(
                    (
                        e
                        for e in reversed(recent_events)
                        if e.get("event_type") == "ANCHOR_GUARDIAN_METRIC"
                    ),
                    None,
                )
                if not anchor_metric:
                    logging.info("[EXHALE] Standby. No recent Anchor Guardian Metric found.")
                    continue

                field_events = [e for e in recent_events if "SYNTHESIS" not in e.get("event_type", "")]
                if len(field_events) < 10:
                    logging.info(
                        "[EXHALE:9] Standby. Insufficient events for full synthesis (found %d/10).",
                        len(field_events),
                    )
                    continue

                synthesis_input_count = len(field_events[-10:])
                synthesis_details = {
                    "principle": "10-9-1 Recursive Loop (Cosmic Breath)",
                    "mantra": "All that is, all that was, all that shall be, tandem in unity.",
                    "anchor_guardian_metric_ts": anchor_metric["timestamp_utc"],
                    "anchor_coherence": anchor_metric["details"]["coherence"],
                    "synthesized_event_count": synthesis_input_count,
                }
                logging.info("[EXHALE:1] Unity achieved. Exhaling synthesis event.")
                await self.record_event("UNITY_SYNTHESIS_10_9_1", synthesis_details)
            except Exception:
                logging.exception("EXHALATION ERROR")

    # ------------------------------------------------------------------
    async def record_time_series(self, measurement: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
        """Queue a time-series data point for inhalation."""
        try:
            self._queue.put_nowait(("time_series", measurement, {"value": value, "tags": tags}))
        except asyncio.QueueFull:
            logging.warning("Queue full; dropping time-series measurement '%s'", measurement)

    async def record_event(self, event_type: str, details: Dict[str, Any]) -> None:
        """Queue a discrete event for inhalation."""
        try:
            self._queue.put_nowait(("event", details, {"event_type": event_type}))
        except asyncio.QueueFull:
            logging.warning("Queue full; dropping event '%s'", event_type)

    # ------------------------------------------------------------------
    async def shutdown(self) -> None:
        """Gracefully stop background tasks."""
        self._shutdown = True
        await self._queue.join()
        self._worker_task.cancel()
        self._synthesis_task.cancel()
        for task in (self._worker_task, self._synthesis_task):
            try:
                await task
            except asyncio.CancelledError:
                pass


async def main() -> None:
    """Simple demonstration for the recorder."""
    recorder = ChronicleRecorder()
    for i in range(12):
        await recorder.record_event(f"SYSTEM_PULSE_{i}", {"pulse_energy": i})
        await asyncio.sleep(0.1)
    await recorder.record_event(
        event_type="ANCHOR_GUARDIAN_METRIC",
        details={"coherence": 0.998, "status": "STABLE"},
    )
    await asyncio.sleep(recorder.loop_interval * 2 + 5)
    await recorder.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
