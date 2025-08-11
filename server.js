const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8000;

// Enable CORS for all routes
app.use(cors());

// Proxy middleware for ESP8266 devices
app.use('/api/esp8266/113', createProxyMiddleware({
  target: 'http://10.0.0.113',
  changeOrigin: true,
  pathRewrite: {
    '^/api/esp8266/113': ''
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

app.use('/api/esp8266/115', createProxyMiddleware({
  target: 'http://10.0.0.115',
  changeOrigin: true,
  pathRewrite: {
    '^/api/esp8266/115': ''
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ESP8266 Proxy Server is running' });
});

app.listen(PORT, () => {
  console.log(`ESP8266 Proxy Server running on http://localhost:${PORT}`);
  console.log('Proxying requests to:');
  console.log('  - http://10.0.0.113 via /api/esp8266/113');
  console.log('  - http://10.0.0.115 via /api/esp8266/115');
});
