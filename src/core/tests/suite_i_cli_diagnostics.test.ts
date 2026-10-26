import test from 'node:test';
import assert from 'node:assert/strict';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);
const cliPath = path.resolve('bin/chakki.js');

test('Suite I [CLI Diagnostics]: chakki doctor executes and passes diagnostics', async () => {
  const { stdout } = await execAsync(`npx tsx ${cliPath} doctor`);
  assert.ok(stdout.includes('Chakki Doctor Diagnostics'));
  assert.ok(stdout.includes('Node.js'));
  assert.ok(stdout.includes('Kilo Gateway'));
  assert.ok(stdout.includes('Sandbox'));
});

test('Suite I [CLI Diagnostics]: chakki models queries models catalogue', async () => {
  const { stdout } = await execAsync(`npx tsx ${cliPath} models --free`);
  assert.ok(stdout.includes('Kilo Gateway catalogue'));
  assert.ok(stdout.includes('Found'));
  assert.ok(stdout.includes('[FREE]'));
});
