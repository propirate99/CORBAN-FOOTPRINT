const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('============================================================');
console.log('🌿 Starting Carbon Twin Decarbonization Platform...');
console.log('============================================================');
console.log('📍 Client Dashboard : http://localhost:3000');
console.log('📍 Backend API       : http://localhost:5001');
console.log('🛡️  Verified Mode     : Production Edge Telemetry (Zero Synthetic Data)');
console.log('============================================================\n');

const isWin = process.platform === 'win32';

// 1. Start Express Backend on port 5001
const server = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: isWin
});

// 2. Start Vite Client on port 3000
const clientBin = isWin ? 'npx.cmd' : 'npx';
const client = spawn(clientBin, ['vite', '--port', '3000', '--host'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: isWin
});

server.on('error', (err) => {
  console.error('[Server Error]:', err);
});

client.on('error', (err) => {
  console.error('[Client Error]:', err);
});

const cleanup = () => {
  console.log('\nShutting down Carbon Twin platform...');
  
  if (isWin) {
    try {
      if (server.pid) execSync(`taskkill /pid ${server.pid} /T /F 2>nul`);
    } catch (e) {}
    try {
      if (client.pid) execSync(`taskkill /pid ${client.pid} /T /F 2>nul`);
    } catch (e) {}
  } else {
    try { server.kill('SIGTERM'); } catch (e) {}
    try { client.kill('SIGTERM'); } catch (e) {}
  }
  
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
