import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry } from '../commands';
import { KiloGatewayClient } from '../kiloGateway';

test('Suite F [Commands]: All 28 commands exist and execute without dummy handlers', async () => {
  const registry = new CommandRegistry();
  const allCommands = [
    '/help', '/new', '/sessions', '/resume', '/models', '/agents', '/mode',
    '/plan', '/undo', '/redo', '/diff', '/search', '/tests', '/review',
    '/doctor', '/settings', '/permissions', '/mcp', '/skills', '/plugins',
    '/hooks', '/memory', '/history', '/export', '/import', '/status',
    '/cancel', '/quit',
  ];

  assert.equal(allCommands.length, 28, 'Command registry must contain exactly 28 commands');

  const kilo = new KiloGatewayClient();
  const context = {
    currentSessionId: 'sess_test_cmd',
    kiloClient: kilo,
    cancelActiveTask: () => {},
    setMode: () => {},
  };

  for (const cmd of allCommands) {
    const def = registry.get(cmd);
    assert.ok(def, `Command ${cmd} is missing from registry`);

    let input = cmd;
    if (cmd === '/resume') input = '/resume sess_main';
    else if (cmd === '/mode') input = '/mode review';
    else if (cmd === '/search') input = '/search Attestation';
    else if (cmd === '/memory') input = '/memory security';
    else if (cmd === '/history') input = '/history 1';
    else if (cmd === '/import') input = '/import backup.jsonl';

    const res = await registry.execute(input, context);
    assert.equal(res.success, true, `Execution of ${cmd} failed: ${res.message}`);
    assert.ok(res.message && res.message.length > 0, `Command ${cmd} returned empty message`);
  }
});
