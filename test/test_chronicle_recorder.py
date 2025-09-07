
import unittest
import asyncio
import json
import hashlib
from unittest.mock import patch, AsyncMock

from chronicle_recorder import ChronicleRecorder

class TestChronicleRecorder(unittest.IsolatedAsyncioTestCase):

    @patch('chronicle_recorder.Path')
    @patch('chronicle_recorder.RotatingFileHandler')
    @patch('chronicle_recorder.logging')
    def setUp(self, mock_logging, mock_handler, mock_path):
        # Stop background tasks for predictable testing
        patcher = patch('asyncio.create_task')
        self.addCleanup(patcher.stop)
        self.mock_create_task = patcher.start()

        self.recorder = ChronicleRecorder()

    def test_generate_checksum(self):
        """
        Test the checksum generation logic for correctness.
        """
        data = {"message": "Hello, world!", "id": 123}
        # Pre-calculated checksum for the given data using the same logic
        dhash = hashlib.sha256()
        encoded = json.dumps(data, sort_keys=True).encode()
        dhash.update(encoded)
        expected_checksum = dhash.hexdigest()

        self.assertEqual(self.recorder._generate_checksum(data), expected_checksum)
        self.assertIsInstance(self.recorder._generate_checksum(data), str)
        self.assertEqual(len(self.recorder._generate_checksum(data)), 64)

    async def test_record_event(self):
        """
        Test that `record_event` correctly puts the event onto the asyncio Queue.
        """
        # We need to mock the queue's put method to be an async mock
        self.recorder._queue.put = AsyncMock()
        
        event_type = "TEST_EVENT"
        details = {"data": "some_data"}
        
        await self.recorder.record_event(event_type, details)
        
        # Assert that put was called once with the correct event structure
        self.recorder._queue.put.assert_awaited_once_with(("event", details, {"event_type": event_type}))

    @patch('chronicle_recorder.event_logger')
    async def test_inhalation_loop_processes_event(self, mock_event_logger):
        """
        Test that the _inhalation_loop correctly processes an event from the queue and logs it.
        """
        # Replace the real queue with a mock one for this test
        self.recorder._queue = asyncio.Queue()
        
        # Manually create and cancel the worker task to control its execution
        self.recorder._worker_task = asyncio.create_task(self.recorder._inhalation_loop())
        
        event_type = "UNIT_TEST_EVENT"
        data = {"payload": "test_data"}
        checksum = self.recorder._generate_checksum(data)
        
        # Put a sample event on the queue
        await self.recorder._queue.put(("event", data, {"event_type": event_type}))
        
        # Allow the loop to process the event
        await asyncio.sleep(0.1)

        # Check that the event was logged correctly
        self.assertEqual(mock_event_logger.info.call_count, 1)
        logged_call = mock_event_logger.info.call_args[0][0]
        logged_data = json.loads(logged_call)

        self.assertEqual(logged_data['event_type'], event_type)
        self.assertEqual(logged_data['details'], data)
        self.assertEqual(logged_data['validation_checksum'], checksum)
        self.assertEqual(logged_data['sentinel_signature'], "GARY LECKEY 02111991")

        # Clean up the task
        self.recorder._worker_task.cancel()
        try:
            await self.recorder._worker_task
        except asyncio.CancelledError:
            pass # Task cancellation is expected

if __name__ == "__main__":
    unittest.main()
