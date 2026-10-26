import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJsonRpcRequest,
  buildJsonRpcNotification,
  buildJsonRpcResponse,
  parseJsonRpcPacket,
} from '../../engine/protocol';

test('Suite A [Protocol]: JSON-RPC 2.0 Request builder creates valid 2.0 envelope', () => {
  const req = buildJsonRpcRequest('task.start', { prompt: 'Audit codebase' }, 'req_101');
  assert.equal(req.jsonrpc, '2.0');
  assert.equal(req.id, 'req_101');
  assert.equal(req.method, 'task.start');
  assert.deepEqual(req.params, { prompt: 'Audit codebase' });
});

test('Suite A [Protocol]: JSON-RPC 2.0 Notification builder omits ID', () => {
  const notif = buildJsonRpcNotification('task.reasoning_chunk', { chunk: 'Thought step' });
  assert.equal(notif.jsonrpc, '2.0');
  assert.equal(notif.method, 'task.reasoning_chunk');
  assert.equal((notif as any).id, undefined);
});

test('Suite A [Protocol]: JSON-RPC 2.0 Response builder pairs id and result', () => {
  const res = buildJsonRpcResponse('req_101', { status: 'acknowledged', task_id: 'task_xyz' });
  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.id, 'req_101');
  assert.equal(res.result?.status, 'acknowledged');
});

test('Suite A [Protocol]: Packet parser handles request, notification, response and errors', () => {
  const req = parseJsonRpcPacket('{"jsonrpc":"2.0","id":1,"method":"engine.init","params":{}}');
  assert.equal(req.type, 'request');

  const notif = parseJsonRpcPacket('{"jsonrpc":"2.0","method":"task.token","params":{"token":"abc"}}');
  assert.equal(notif.type, 'notification');

  const resp = parseJsonRpcPacket('{"jsonrpc":"2.0","id":1,"result":{"ok":true}}');
  assert.equal(resp.type, 'response');

  const malformed = parseJsonRpcPacket('bad json');
  assert.equal(malformed.type, 'error');
});
