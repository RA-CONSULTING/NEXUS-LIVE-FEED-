const http = require('http');
const { sampleMetrics } = require('./metrics');
const { fetchSeismicEvents } = require('./seismicBridge');

const server = http.createServer((req, res) => {
  if (req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const interval = setInterval(() => {
      const data = sampleMetrics();
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } else if (req.url === '/seismic') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      const events = fetchSeismicEvents();
      res.end(JSON.stringify(events));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sampleMetrics()));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Nexus Live Feed listening on ${PORT}`);
});
