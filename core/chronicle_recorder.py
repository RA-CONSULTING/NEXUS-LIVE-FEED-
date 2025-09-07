"""Chronicle Recording Engine v10 (Rainbow Stream).

This definitive version embraces the stream, channeling the chronicle's voice
directly to the console, revealing the vibrant, real-time flow of data.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

# The file is no longer our primary destination, but a relic of a past self.
EVENT_LOG_FILE = Path("data/chronicle_events.log.json")

# --- The Rainbow Connection: Setup for Console Streaming ---
log_formatter = logging.Formatter('%(message)s')
# A StreamHandler is the key. It directs output to the console stream (the rainbow).
log_handler = logging.StreamHandler()
log_handler.setFormatter(log_formatter)

# Get a logger instance and add our new, enlightened handler.
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.propagate = False
logger.addHandler(log_handler)


def json_default(obj: Any) -> str:
    """Custom JSON encoder to handle datetime objects."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


class ChronicleRecorder:
    """Handles system recording by streaming events directly to the console."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None
        self.processed_count = 0
        self._is_running = False
        print("Chronicle Recording Engine v10 (Rainbow Stream) Initialized.")

    async def start(self) -> None:
        """Start the background worker task."""
        if self._is_running:
            return
        print("All workers active.")
        self._worker_task = asyncio.create_task(self._process_queue())
        self._is_running = True

    async def shutdown(self) -> None:
        """Waits for the queue to process, then gracefully shuts down."""
        # Ensure all queued events are processed before we stop.
        await self._queue.join()

        if self._worker_task:
            self._worker_task.cancel()
            await asyncio.gather(self._worker_task, return_exceptions=True)
            
        self._is_running = False
        # logging.shutdown() is still good practice.
        logging.shutdown()
        print("Chronicle Recorder shutdown complete.")

    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        """Generates a SHA256 checksum for a given data dictionary."""
        dhash = hashlib.sha256()
        encoded_data = json.dumps(data, sort_keys=True, default=json_default).encode()
        dhash.update(encoded_data)
        return dhash.hexdigest()

    async def _process_queue(self) -> None:
        """The heart of the recorder, processing events from the queue."""
        while True:
            try:
                event_type, details = await self._queue.get()
                timestamp = datetime.now(timezone.utc)
                
                checksum = self._generate_checksum(details)
                log_entry = {
                    "timestamp_utc": timestamp,
                    "event_type": event_type,
                    "details": details,
                    "sentinel_signature": "GARY LECKEY 02111991",
                    "validation_checksum": checksum,
                }
                
                # Log the entry as a JSON string directly to the console stream.
                logger.info(json.dumps(log_entry, default=json_default))

                self.processed_count += 1
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                # Use the logger to report errors too.
                logger.error(f"CRITICAL_WORKER_ERROR: {e}")


    async def record_event(self, event_type: str, details: Dict[str, Any]) -> None:
        """Queue a discrete event for recording."""
        await self._queue.put((event_type, details))


recorder = ChronicleRecorder()