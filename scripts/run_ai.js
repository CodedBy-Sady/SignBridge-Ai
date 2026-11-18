/**
 * SignBridge AI: Python AI Engine Process Launcher
 * Cross-platform runner script for executing the FastAPI AI microservice (ai_engine/app.py).
 * Triggered via: npm run dev:ai (or as part of npm run dev:all)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const aiDir = path.join(rootDir, 'ai_engine');
const appFile = path.join(aiDir, 'app.py');

// Candidate python paths in order of preference
const isWindows = process.platform === 'win32';
const candidates = [
  path.join(aiDir, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  path.join(aiDir, 'venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  isWindows ? 'python' : 'python3',
  'py'
];

function findPython() {
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } else {
      return candidate; // system fallback
    }
  }
  return isWindows ? 'python' : 'python3';
}

const pythonBin = findPython();

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[32m%s\x1b[0m', '🧠 SignBridge AI - Starting Python AI Microservice');
console.log('\x1b[90m%s\x1b[0m', `📁 AI Engine Path: ${aiDir}`);
console.log('\x1b[90m%s\x1b[0m', `🐍 Python Interpreter: ${pythonBin}`);
console.log('\x1b[36m%s\x1b[0m', '==================================================\n');

if (!fs.existsSync(appFile)) {
  console.error('\x1b[31m%s\x1b[0m', `[Error] app.py not found at: ${appFile}`);
  process.exit(1);
}

// Spawn python app.py inside ai_engine directory
const aiProcess = spawn(pythonBin, ['app.py'], {
  cwd: aiDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1'
  }
});

aiProcess.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', `[Failed to start AI Engine] ${err.message}`);
  console.log('\nTip: Make sure Python is installed and the virtual environment in ai_engine/.venv is activated.');
  process.exit(1);
});

aiProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log('\x1b[33m%s\x1b[0m', `\n[AI Engine Process exited with code ${code}]`);
  }
  process.exit(code || 0);
});

// Handle graceful shutdown on Ctrl+C
const cleanExit = () => {
  if (aiProcess && !aiProcess.killed) {
    aiProcess.kill('SIGINT');
  }
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
