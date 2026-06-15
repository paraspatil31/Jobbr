const { existsSync, unlinkSync } = require('fs');

for (const f of ['package-lock.json', 'yarn.lock']) {
  try {
    if (existsSync(f)) unlinkSync(f);
  } catch {}
}

const agent = process.env.npm_config_user_agent ?? '';
if (!agent.startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}
