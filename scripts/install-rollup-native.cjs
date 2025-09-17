#!/usr/bin/env node

const { platform, arch, report } = process;

if (process.env.MYPA_SKIP_NATIVE_INSTALL === '1') {
  process.exit(0);
}

if (platform !== 'linux' || arch !== 'x64') {
  process.exit(0);
}

let isGlibc = true;
try {
  const glibcVersion = report?.getReport?.().header?.glibcVersionRuntime;
  isGlibc = Boolean(glibcVersion);
} catch (error) {
  // If detection fails, assume glibc to attempt install
  isGlibc = true;
}

if (!isGlibc) {
  console.log('Skipping Rollup native binary install: non-glibc libc detected.');
  process.exit(0);
}

const { execSync } = require('node:child_process');

try {
  execSync('npm install --no-save --ignore-scripts @rollup/rollup-linux-x64-gnu@4.50.2', {
    stdio: 'inherit',
    env: {
      ...process.env,
      MYPA_SKIP_NATIVE_INSTALL: '1',
    },
  });
} catch (error) {
  console.warn('Optional install of Rollup native binary failed:', error?.message ?? error);
}
