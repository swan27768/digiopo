require('dotenv').config();
const http = require('http');
const https = require('https');
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY puuttuu .env-tiedostosta!'); process.exit(1); }
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/v1/messages') { res.writeHead(404); res.end('Not found'); return; }
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body) }
    };
    const apiReq = https.request(options, apiRes => { res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' }); apiRes.pipe(res); });
    apiReq.on('error', err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    apiReq.write(body); apiReq.end();
  });
});
server.listen(PORT, () => console.log('✅ Proxy kaynnissa: http://localhost:' + PORT));
