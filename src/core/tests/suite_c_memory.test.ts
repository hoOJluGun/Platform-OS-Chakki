import test from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicMemoryIndex } from '../memory';
import { CanonicalLedger } from '../ledger';

test('Suite C [Memory]: Enforces strict cross-session isolation', () => {
  const memory = new DeterministicMemoryIndex();

  memory.indexRecord({
    record_id: 'rec_tenant_1',
    session_id: 'session_A',
    turn_number: 1,
    event_seq: 1,
    role: 'user',
    text_content: 'Tenant A private key stored in /vault/key.pem',
    identifiers: ['/vault/key.pem'],
    timestamp: 1000,
  });

  memory.indexRecord({
    record_id: 'rec_tenant_2',
    session_id: 'session_B',
    turn_number: 1,
    event_seq: 1,
    role: 'user',
    text_content: 'Tenant B public task on build tooling',
    identifiers: ['tooling'],
    timestamp: 1001,
  });

  const queryInB = memory.search('vault', 'session_B');
  assert.equal(queryInB.length, 0);

  const queryInA = memory.search('vault', 'session_A');
  assert.equal(queryInA.length, 1);
  assert.equal(queryInA[0].record.record_id, 'rec_tenant_1');
});

test('Suite C [Memory]: Exact turn resolution retrieves target turn record', () => {
  const memory = new DeterministicMemoryIndex();

  memory.indexRecord({
    record_id: 'rec_turn_10',
    session_id: 'sess_prod',
    turn_number: 10,
    event_seq: 34,
    role: 'assistant',
    text_content: 'Turn 10: Fixed memory leak in websocket stream',
    identifiers: ['leak'],
    timestamp: 2500,
  });

  const record = memory.getRecordByTurn('sess_prod', 10);
  assert.ok(record);
  assert.equal(record?.record_id, 'rec_turn_10');
  assert.ok(record?.text_content.includes('Turn 10'));
});

test('Suite C [Memory]: Rebuilds memory state deterministically from ledger events', () => {
  const ledger = new CanonicalLedger('sess_rebuild');
  ledger.append('task.started', 'user', { prompt: 'Investigate deadlock in worker pool' });
  ledger.append('task.completed', 'engine', { summary: 'Deadlock resolved with mutex' });

  const memory = DeterministicMemoryIndex.rebuildFromLedger(ledger);
  const found = memory.search('deadlock', 'sess_rebuild');

  assert.ok(found.length >= 1);
  assert.ok(found[0].record.text_content.toLowerCase().includes('deadlock'));
});
