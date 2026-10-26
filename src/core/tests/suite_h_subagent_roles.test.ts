import test from 'node:test';
import assert from 'node:assert/strict';
import { Orchestrator } from '../orchestrator';
import { ToolRegistry } from '../tools';

test('Suite H [Subagents]: Explorer is strictly confined to read-only scope', () => {
  const tools = new ToolRegistry();
  const orchestrator = new Orchestrator(tools);

  const explorer = orchestrator.createTask('explorer', 'Examine AST topology');
  assert.equal(explorer.role, 'explorer');
  assert.deepEqual(explorer.write_scope, [], 'Explorer must have empty write scope');
});

test('Suite H [Subagents]: Worker accepts restricted write scope', () => {
  const tools = new ToolRegistry();
  const orchestrator = new Orchestrator(tools);

  const worker = orchestrator.createTask(
    'worker',
    'Patch replay vulnerability',
    ['Sources/ChakkiEngine/Security/Attestation.swift']
  );
  assert.equal(worker.role, 'worker');
  assert.deepEqual(worker.write_scope, ['Sources/ChakkiEngine/Security/Attestation.swift']);
});

test('Suite H [Subagents]: Verifier and Reviewer roles enforce independent evaluation', () => {
  const tools = new ToolRegistry();
  const orchestrator = new Orchestrator(tools);

  const verifier = orchestrator.createTask('verifier', 'Execute regression test suite');
  assert.equal(verifier.role, 'verifier');
  assert.deepEqual(verifier.write_scope, []);

  const reviewer = orchestrator.createTask('reviewer', 'Code review diff');
  assert.equal(reviewer.role, 'reviewer');
  assert.deepEqual(reviewer.write_scope, []);
});
