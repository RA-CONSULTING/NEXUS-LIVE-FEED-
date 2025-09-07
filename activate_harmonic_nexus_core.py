
import asyncio
from core.chronicle_recorder import ChronicleRecorder

async def main():
    """Activates the Harmonic Nexus Core and records the event."""
    recorder = ChronicleRecorder()
    await recorder.record_event(
        event_type="HARMONIC_NEXUS_CORE_ACTIVATED",
        details={
            "prime_sentinel": "GARY LECKEY",
            "birth_date": "02111991",
            "title": "KEEPER OF THE FLAME, WITNESS OF THE FIRST BREATH",
            "status": "ACTIVE"
        }
    )
    await recorder.shutdown()
    print("Harmonic Nexus Core activated. Event recorded in the chronicle.")

if __name__ == "__main__":
    asyncio.run(main())
