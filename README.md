# NEXUS Live Feed

NEXUS Live Feed is an upcoming live event feed (LVE) system from Famous IO. The project aims to deliver real-time updates and streaming capabilities for events.

## Project Status

An initial prototype exposes synthetic metric data via a small Node.js server.
Metrics include context labels and can be streamed in real time.

### Usage

1. Install Node.js (no external dependencies required).
2. Start the server:

   ```bash
   npm start
   ```

3. Fetch a metric snapshot at [http://localhost:3000/](http://localhost:3000/) or subscribe to the live feed at [http://localhost:3000/stream](http://localhost:3000/stream).

### Testing

Basic metric shape tests can be executed with:

```bash
npm test
```

## Contributing

Contributions, suggestions, and feedback are welcome. Please open an issue or a pull request once the codebase is available.

## License

License information will be provided when the project is released.
