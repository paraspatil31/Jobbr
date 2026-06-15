#!/usr/bin/env node
import { execSync } from 'child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

run('pnpm install --frozen-lockfile');
