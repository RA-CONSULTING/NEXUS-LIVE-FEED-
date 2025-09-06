# NEXUS Live Feed

NEXUS Live Feed is an upcoming live event feed (LVE) system from Famous IO. The project aims to deliver real-time updates and streaming capabilities for events.

## Project Status

This repository contains an initial prototype for the data ingestion layer of the NEXUS Live Feed system. The first module ingests live seismic activity from the United States Geological Survey (USGS) feed.

## Usage

To fetch and display recent seismic events, run:

```bash
python -m ingestion.seismic_adapter
```

## Configuration

A `.env.sample` file is included with suggested cadences and SLA thresholds for the planned data streams. Copy it to `.env` and adjust the values to fit your deployment.

## Contributing

Contributions, suggestions, and feedback are welcome. Please open an issue or a pull request once the codebase is available.

## License

License information will be provided when the project is released.
