import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJsonRpcRequest,
  buildJsonRpcNotification,
  buildJsonRpcResponse,
  parseJsonRpcPacket,
  computeDiffLines,
  applyToolCallToMessages,
  appendReasoningToMessages,
  appendContentToMessages,
} from './protocol';
import { ChatMessage, ToolCallState } from '../types/protocol';

test('JSON-RPC 2.0 request builder creates compliant object', () => {
  const req = buildJsonRpcRequest('engine.start_task', { prompt: 'Audit codebase' }, 42);
  assert.equal(req.jsonrpc, '2.0');
  assert.equal(req.id, 42);
  assert.equal(req.method, 'engine.start_task');
  assert.deepEqual(req.params, { prompt: 'Audit codebase' });
});

test('JSON-RPC 2.0 notification builder creates compliant object without id', () => {
  const notif = buildJsonRpcNotification('task.reasoning_chunk', { chunk: 'Analyzing AST' });
  assert.equal(notif.jsonrpc, '2.0');
  assert.equal(notif.method, 'task.reasoning_chunk');
  assert.equal((notif as any).id, undefined);
});

test('JSON-RPC 2.0 response builder returns result and id', () => {
  const res = buildJsonRpcResponse(10, { status: 'ok', pid: 9021 });
  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.id, 10);
  assert.deepEqual(res.result, { status: 'ok', pid: 9021 });
});

test('parseJsonRpcPacket differentiates requests, notifications, responses, and errors', () => {
  // Valid Request
  const reqPacket = parseJsonRpcPacket('{"jsonrpc":"2.0","id":1,"method":"engine.initialize","params":{}}');
  assert.equal(reqPacket.type, 'request');
  assert.equal(reqPacket.payload.method, 'engine.initialize');

  // Valid Notification
  const notifPacket = parseJsonRpcPacket('{"jsonrpc":"2.0","method":"task.token_chunk","params":{"chunk":"hello"}}');
  assert.equal(notifPacket.type, 'notification');

  // Valid Response
  const respPacket = parseJsonRpcPacket('{"jsonrpc":"2.0","id":1,"result":{"success":true}}');
  assert.equal(respPacket.type, 'response');

  // Malformed JSON
  const errPacket = parseJsonRpcPacket('invalid json string');
  assert.equal(errPacket.type, 'error');

  // Invalid JSON-RPC missing version
  const invalidVersion = parseJsonRpcPacket('{"method":"test"}');
  assert.equal(invalidVersion.type, 'error');
});

test('computeDiffLines detects insertions, deletions, and unchanged lines', () => {
  const original = 'line 1\nold line 2\nline 3';
  const updated = 'line 1\nnew line 2\nline 3\nline 4';

  const diff = computeDiffLines(original, updated);
  assert.ok(diff.added > 0);
  assert.ok(diff.removed > 0);
  assert.equal(diff.lines[0].type, 'same');
  assert.equal(diff.lines[0].text, 'line 1');
});

test('applyToolCallToMessages correctly attaches and updates tool call state', () => {
  const initialMessages: ChatMessage[] = [
    {
      id: 'm1',
      role: 'user',
      content: 'Refactor auth',
      timestamp: 1000,
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'I will inspect the files.',
      timestamp: 1001,
    },
  ];

  const toolCall: ToolCallState = {
    id: 'tool_1',
    toolName: 'bash',
    args: { command: 'cargo test' },
    requiresApproval: true,
    status: 'pending_approval',
    createdAt: 1002,
  };

  const updated1 = applyToolCallToMessages(initialMessages, toolCall);
  assert.equal(updated1[1].toolCalls?.length, 1);
  assert.equal(updated1[1].toolCalls?.[0].status, 'pending_approval');

  // Update tool call to approved
  const approvedToolCall: ToolCallState = {
    ...toolCall,
    status: 'approved',
  };
  const updated2 = applyToolCallToMessages(updated1, approvedToolCall);
  assert.equal(updated2[1].toolCalls?.length, 1);
  assert.equal(updated2[1].toolCalls?.[0].status, 'approved');
});

test('appendReasoningToMessages correctly streams thought tokens', () => {
  const initialMessages: ChatMessage[] = [
    {
      id: 'm2',
      role: 'assistant',
      content: '',
      timestamp: 1000,
    },
  ];

  const step1 = appendReasoningToMessages(initialMessages, 'Checking security invariants...');
  const step2 = appendReasoningToMessages(step1, ' Verified token expiration.');

  assert.equal(step2[0].reasoning, 'Checking security invariants... Verified token expiration.');
});
