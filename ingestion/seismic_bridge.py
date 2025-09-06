import json
from dataclasses import asdict

from seismic_adapter import fetch_recent_events


def main() -> None:
    events = fetch_recent_events()[:5]
    data = [asdict(ev) for ev in events]
    for ev in data:
        ev["timestamp"] = ev["timestamp"].isoformat()
    print(json.dumps(data))


if __name__ == "__main__":
    main()
