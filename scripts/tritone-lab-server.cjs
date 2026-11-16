#!/usr/bin/env node
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, 'tritone-lab.html');
const port = Number(process.env.PORT) || 4400;

const server = http.createServer((request, response) => {
  if (request.url !== '/' && request.url !== '/tritone-lab.html') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const html = fs.readFileSync(file);
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Tritone lab: http://127.0.0.1:${port}/`);
  console.log('Pulsa Ctrl+C para parar.');
});
