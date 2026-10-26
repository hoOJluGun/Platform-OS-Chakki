import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry, computeSha256 } from '../tools';

test('Suite E [Atomic FS]: fs.apply_patch succeeds when expected hash matches', async () => {
  const tools = new ToolRegistry();
  const ctx: import('../types').ToolExecutionContext = {
    workspace_root: '/workspace',
    session_id: 'sess_patch_1',
    agent_id: 'agent_1',
    permission_mode: 'review',
    redacted_env: {},
  };

  // First write initial content
  const initialContent = 'line1\nline2\nline3\n';
  await tools.execute('fs.write', { path: 'test_file.txt', content: initialContent }, ctx);

  const initialHash = computeSha256(initialContent);

  // Apply patch with correct precondition hash
  const patchedContent = 'line1\nmodified line 2\nline3\n';
  const result = await tools.execute(
    'fs.apply_patch',
    {
      path: 'test_file.txt',
      new_content: patchedContent,
      expected_hash: initialHash,
    },
    ctx
  );

  assert.equal(result.success, true);
  assert.ok(result.output.includes('Applied atomic patch'));
});

test('Suite E [Atomic FS]: fs.apply_patch rejects with error if expected hash is mismatched', async () => {
  const tools = new ToolRegistry();
  const ctx: import('../types').ToolExecutionContext = {
    workspace_root: '/workspace',
    session_id: 'sess_patch_2',
    agent_id: 'agent_2',
    permission_mode: 'review',
    redacted_env: {},
  };

  const initialContent = 'version 1.0';
  await tools.execute('fs.write', { path: 'version.txt', content: initialContent }, ctx);

  // Intentionally pass an incorrect expected hash
  const wrongHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const result = await tools.execute(
    'fs.apply_patch',
    {
      path: 'version.txt',
      new_content: 'version 2.0',
      expected_hash: wrongHash,
    },
    ctx
  );

  assert.equal(result.success, false);
  assert.ok(result.error?.includes('PRECONDITION FAILED'));
});
