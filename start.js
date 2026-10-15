const { spawn } = require('child_process');
const path = require('path');

console.log('------------------------------------------------------------');
console.log('🚀 Starting Carbon Twin Decarbonization Platform...');
console.log('------------------------------------------------------------');

// Start Express Backend on port 5001
const server = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Start Vite Client on port 3000
const isWin = process.platform === 'win32';
const clientCommand = isWin ? 'cmd' : 'npx';
const clientArgs = isWin ? ['/c', 'npx', 'vite', '--port', '3000', '--host'] : ['vite', '--port', '3000', '--host'];

const client = spawn(clientCommand, clientArgs, {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('[Server Error]:', err);
});

client.on('error', (err) => {
  console.error('[Client Error]:', err);
});

const cleanup = () => {
  console.log('\nShutting down Carbon Twin platform...');
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
