const { spawn } = require('child_process');

const colors = { server: '\x1b[34m', client: '\x1b[32m', reset: '\x1b[0m' };

function prefix(name, color, line) {
  return `${color}[${name}]${colors.reset} ${line}`;
}

function spawnWithPrefix(name, color, cmd, args, env) {
  const proc = spawn(cmd, args, {
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });

  proc.stdout.on('data', (data) => {
    String(data).split('\n').filter(Boolean).forEach((l) => console.log(prefix(name, color, l)));
  });
  proc.stderr.on('data', (data) => {
    String(data).split('\n').filter(Boolean).forEach((l) => console.error(prefix(name, color, l)));
  });
  proc.on('exit', (code) => {
    console.log(prefix(name, color, `exited with code ${code}`));
  });

  return proc;
}

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const serverEnv = { PORT: process.env.PORT ?? '8080' };
const server = spawnWithPrefix(
  'server',
  colors.server,
  pnpmCmd,
  ['--filter', '@workspace/server', 'run', 'dev'],
  serverEnv
);
const client = spawnWithPrefix('client', colors.client, pnpmCmd, ['--filter', '@workspace/client', 'run', 'dev'], {});

function shutdown() {
  server.kill('SIGTERM');
  client.kill('SIGTERM');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
