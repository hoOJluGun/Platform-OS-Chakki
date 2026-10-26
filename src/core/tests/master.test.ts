import test from 'node:test';
import assert from 'node:assert/strict';
import { CanonicalLedger, GENESIS_HASH, scrubCredentials } from '../ledger';
import { DeterministicMemoryIndex } from '../memory';
import { ToolRegistry, validateWorkspacePath } from '../tools';
import { CommandRegistry } from '../commands';
import { KiloGatewayClient, RECORDED_KILO_FIXTURE_MODELS } from '../kiloGateway';
import { Orchestrator } from '../orchestrator';

// ==========================================
// 1. CANONICAL HASH-CHAINED EVENT LEDGER TESTS
// ==========================================

test('Ledger computes unbroken SHA-256 hash chain with monotonic sequence', () => {
  const ledger = new CanonicalLedger('sess_alpha');
  const e1 = ledger.append('task.started', 'user', { prompt: 'Audit security' });
  const e2 = ledger.append('task.progress', 'assistant', { step: 'Examining AST' });
  const e3 = ledger.append('task.completed', 'assistant', { summary: 'Pass' });

  assert.equal(e1.event_seq, 1);
  assert.equal(e2.event_seq, 2);
  assert.equal(e3.event_seq, 3);

  assert.equal(e1.prev_hash, GENESIS_HASH);
  assert.equal(e2.prev_hash, e1.current_hash);
  assert.equal(e3.prev_hash, e2.current_hash);

  const verification = CanonicalLedger.verifyLedgerIntegrity(ledger.getEvents());
  assert.equal(verification.valid, true);
});

test('Ledger integrity detects content tampering', () => {
  const ledger = new CanonicalLedger('sess_beta');
  ledger.append('task.started', 'user', { prompt: 'Deploy code' });
  ledger.append('task.completed', 'assistant', { summary: 'Deed done' });

  const events = JSON.parse(JSON.stringify(ledger.getEvents()));
  // Tamper with event 1 content
  events[0].content = { prompt: 'Malicious modification' };

  const verification = CanonicalLedger.verifyLedgerIntegrity(events);
  assert.equal(verification.valid, false);
  assert.ok(verification.error?.includes('Tampering detected'));
});

test('Ledger scrubs sensitive credentials from persisted records', () => {
  const scrubbed = scrubCredentials('Authorization: Bearer mySecretToken1234567890 and sk-proj-12345678901234567890');
  assert.ok(!scrubbed.includes('mySecretToken1234567890'));
  assert.ok(!scrubbed.includes('sk-proj-12345678901234567890'));
  assert.ok(scrubbed.includes('[REDACTED_TOKEN]'));
  assert.ok(scrubbed.includes('[REDACTED_API_KEY]'));
});

test('Ledger export and import JSONL roundtrip preserves integrity', () => {
  const ledger = new CanonicalLedger('sess_gamma');
  ledger.append('task.started', 'user', 'Hello world');
  ledger.append('task.completed', 'assistant', 'Task done');

  const jsonl = ledger.exportJsonl();
  const imported = CanonicalLedger.fromJsonl(jsonl);

  assert.equal(imported.getEventCount(), 2);
  assert.equal(imported.getHeadHash(), ledger.getHeadHash());
  assert.equal(CanonicalLedger.verifyLedgerIntegrity(imported.getEvents()).valid, true);
});

// ==========================================
// 2. DETERMINISTIC MEMORY RETRIEVAL TESTS
// ==========================================

test('Memory retrieval enforces strict cross-session isolation', () => {
  const memory = new DeterministicMemoryIndex();

  memory.indexRecord({
    record_id: 'rec_1',
    session_id: 'session_A',
    turn_number: 1,
    event_seq: 1,
    role: 'user',
    text_content: 'Secret project codename is Phoenix in /src/core/secret.ts',
    identifiers: ['/src/core/secret.ts', 'Phoenix'],
    timestamp: 1000,
  });

  memory.indexRecord({
    record_id: 'rec_2',
    session_id: 'session_B',
    turn_number: 1,
    event_seq: 1,
    role: 'user',
    text_content: 'Public task on user authentication',
    identifiers: ['authentication'],
    timestamp: 1001,
  });

  // Querying from Session B must NEVER retrieve Session A's secret
  const resultsB = memory.search('Phoenix', 'session_B');
  assert.equal(resultsB.length, 0);

  // Querying from Session A finds it
  const resultsA = memory.search('Phoenix', 'session_A');
  assert.equal(resultsA.length, 1);
  assert.equal(resultsA[0].record.record_id, 'rec_1');
});

test('Memory exact turn lookup resolves correctly', () => {
  const memory = new DeterministicMemoryIndex();
  memory.indexRecord({
    record_id: 'rec_turn_42',
    session_id: 'session_main',
    turn_number: 42,
    event_seq: 105,
    role: 'assistant',
    text_content: 'Recommendation 42: Refactor token rate limiter',
    identifiers: [],
    timestamp: 2000,
  });

  const rec = memory.getRecordByTurn('session_main', 42);
  assert.ok(rec);
  assert.equal(rec?.record_id, 'rec_turn_42');
  assert.ok(rec?.text_content.includes('Recommendation 42'));
});

// ==========================================
// 3. TOOL REGISTRY & PATH JAIL SECURITY TESTS
// ==========================================

test('Path jail rejects traversal escapes (../)', () => {
  assert.throws(
    () => validateWorkspacePath('/home/app/project', '../../etc/passwd'),
    /SECURITY POLICY VIOLATION/
  );
  assert.throws(
    () => validateWorkspacePath('/home/app/project', '/etc/shadow'),
    /SECURITY POLICY VIOLATION/
  );
});

test('Path jail accepts valid paths inside workspace root', () => {
  const safe = validateWorkspacePath('/home/app/project', 'src/main.ts');
  assert.equal(safe, '/home/app/project/src/main.ts');
});

// ==========================================
// 4. THE 28 BUILT-IN COMMANDS TESTS
// ==========================================

test('Command registry contains all 28 required commands with zero dummy handlers', async () => {
  const registry = new CommandRegistry();
  const required = [
    '/help', '/new', '/sessions', '/resume', '/models', '/agents', '/mode',
    '/plan', '/undo', '/redo', '/diff', '/search', '/tests', '/review',
    '/doctor', '/settings', '/permissions', '/mcp', '/skills', '/plugins',
    '/hooks', '/memory', '/history', '/export', '/import', '/status',
    '/cancel', '/quit',
  ];

  assert.equal(required.length, 28);

  for (const cmd of required) {
    const def = registry.get(cmd);
    assert.ok(def, `Missing required command: ${cmd}`);

    let testArgs = cmd;
    if (cmd === '/resume') testArgs = '/resume sess_1';
    else if (cmd === '/mode') testArgs = '/mode review';
    else if (cmd === '/search') testArgs = '/search symbol';
    else if (cmd === '/memory') testArgs = '/memory query';
    else if (cmd === '/history') testArgs = '/history 1';
    else if (cmd === '/import') testArgs = '/import export.jsonl';

    const res = await registry.execute(testArgs, { kiloClient: new KiloGatewayClient() });
    assert.equal(res.success, true, `Command ${cmd} returned failure: ${res.message}`);
  }
});

// ==========================================
// 5. KILO GATEWAY & SSE PARSER TESTS
// ==========================================

test('Kilo model catalogue correctly classifies free versus paid routes', () => {
  const client = new KiloGatewayClient();
  const models = client.parseModelCatalogue({
    data: [
      { id: 'free/qwen-32b', pricing: { input: 0, output: 0 } },
      { id: 'claude-3-7', pricing: { input: 0.000003, output: 0.000015 } },
    ],
  });

  assert.equal(models[0].pricing.is_free, true);
  assert.equal(models[1].pricing.is_free, false);
});

test('Kilo SSE chunk parser extracts delta tokens and reasoning', () => {
  const client = new KiloGatewayClient();
  const sampleSse = `data: {"choices":[{"delta":{"content":"Hello "}}]}\n\ndata: {"choices":[{"delta":{"reasoning_content":"Step 1: check invariants"}}]}\n\ndata: {"choices":[{"delta":{"content":"world!"}}]}\n\ndata: [DONE]\n`;

  const parsed = client.parseSseChunk(sampleSse);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].token, 'Hello ');
  assert.equal(parsed[1].reasoning, 'Step 1: check invariants');
  assert.equal(parsed[2].token, 'world!');
});

// ==========================================
// 6. ORCHESTRATOR SUBAGENT ROLES TESTS
// ==========================================

test('Orchestrator enforces Explorer read-only scope and Worker write scope', async () => {
  const toolRegistry = new ToolRegistry();
  const orchestrator = new Orchestrator(toolRegistry);

  const explorerTask = orchestrator.createTask('explorer', 'Map files');
  assert.deepEqual(explorerTask.write_scope, []); // Explorer cannot have write scope

  const workerTask = orchestrator.createTask('worker', 'Apply patch', ['src/core/security.ts']);
  assert.deepEqual(workerTask.write_scope, ['src/core/security.ts']);
});
