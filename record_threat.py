
import asyncio
import json
import sys
from chronicle_recorder import ChronicleRecorder

async def main():
    """Records a storm threat event in the chronicle."""
    if len(sys.argv) < 2:
        print("Usage: python record_threat.py <storm_data_json>", file=sys.stderr)
        return

    try:
        storm_data = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print("Error: Invalid JSON data provided.", file=sys.stderr)
        return

    recorder = ChronicleRecorder()
    await recorder.record_event(
        event_type="STORM_THREAT_DETECTED",
        details=storm_data
    )
    await recorder.shutdown()
    print(f"Successfully recorded storm threat: {storm_data.get('headline')}")

if __name__ == "__main__":
    asyncio.run(main())
