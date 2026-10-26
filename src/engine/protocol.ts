/**
 * Chakki Protocol Engine - Pure logic for JSON-RPC 2.0 serialization,
 * event routing, diff computation, and state machine transitions.
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  ChatMessage,
  ToolCallState,
  TaskStatus,
  FileDiff,
} from '../types/protocol';

let nextRequestId = 1;

export function getNextRequestId(): number {
  return nextRequestId++;
}

/**
 * Builds a valid JSON-RPC 2.0 Request
 */
export function buildJsonRpcRequest<T>(
  method: string,
  params: T,
  id: string | number = getNextRequestId()
): JsonRpcRequest<T> {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
}

/**
 * Builds a valid JSON-RPC 2.0 Notification (no id)
 */
export function buildJsonRpcNotification<T>(
  method: string,
  params: T
): JsonRpcNotification<T> {
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}

/**
 * Builds a valid JSON-RPC 2.0 Response
 */
export function buildJsonRpcResponse<T>(
  id: string | number,
  result: T
): JsonRpcResponse<T> {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Parses and validates an incoming raw JSON-RPC string
 */
export function parseJsonRpcPacket(raw: string): {
  type: 'request' | 'response' | 'notification' | 'error';
  payload?: any;
  error?: string;
} {
  try {
    const data = JSON.parse(raw);
    if (!data || data.jsonrpc !== '2.0') {
      return { type: 'error', error: 'Missing or invalid jsonrpc version (must be "2.0")' };
    }

    if ('method' in data) {
      if ('id' in data && data.id !== undefined && data.id !== null) {
        return { type: 'request', payload: data };
      }
      return { type: 'notification', payload: data };
    }

    if ('id' in data) {
      return { type: 'response', payload: data };
    }

    return { type: 'error', error: 'Packet does not match JSON-RPC 2.0 schema' };
  } catch (err: any) {
    return { type: 'error', error: `Malformed JSON: ${err.message}` };
  }
}

/**
 * Computes simple diff lines and counts for code inspection
 */
export function computeDiffLines(
  original = '',
  updated = ''
): { added: number; removed: number; lines: Array<{ type: 'add' | 'del' | 'same'; text: string }> } {
  const origLines = original.split('\n');
  const updLines = updated.split('\n');

  let added = 0;
  let removed = 0;
  const lines: Array<{ type: 'add' | 'del' | 'same'; text: string }> = [];

  const maxLen = Math.max(origLines.length, updLines.length);

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const u = updLines[i];

    if (o === undefined && u !== undefined) {
      added++;
      lines.push({ type: 'add', text: u });
    } else if (o !== undefined && u === undefined) {
      removed++;
      lines.push({ type: 'del', text: o });
    } else if (o === u) {
      lines.push({ type: 'same', text: o });
    } else {
      removed++;
      lines.push({ type: 'del', text: o });
      added++;
      lines.push({ type: 'add', text: u });
    }
  }

  return { added, removed, lines };
}

/**
 * State helper: Appends or updates a tool call inside the active assistant message
 */
export function applyToolCallToMessages(
  messages: ChatMessage[],
  toolCall: ToolCallState
): ChatMessage[] {
  const lastIndex = messages.length - 1;
  if (lastIndex < 0) return messages;

  const lastMsg = messages[lastIndex];
  if (lastMsg.role !== 'assistant') {
    // If no assistant message exists yet, create one
    const newAssistantMsg: ChatMessage = {
      id: `msg_asst_${Date.now()}`,
      role: 'assistant',
      content: '',
      toolCalls: [toolCall],
      timestamp: Date.now(),
    };
    return [...messages, newAssistantMsg];
  }

  const existingCalls = lastMsg.toolCalls || [];
  const existingIdx = existingCalls.findIndex((t) => t.id === toolCall.id);

  let updatedCalls: ToolCallState[];
  if (existingIdx >= 0) {
    updatedCalls = [...existingCalls];
    updatedCalls[existingIdx] = { ...updatedCalls[existingIdx], ...toolCall };
  } else {
    updatedCalls = [...existingCalls, toolCall];
  }

  const updatedMsg: ChatMessage = {
    ...lastMsg,
    toolCalls: updatedCalls,
  };

  const copy = [...messages];
  copy[lastIndex] = updatedMsg;
  return copy;
}

/**
 * State helper: Appends reasoning chunks to the active assistant message
 */
export function appendReasoningToMessages(
  messages: ChatMessage[],
  reasoningChunk: string
): ChatMessage[] {
  const lastIndex = messages.length - 1;
  if (lastIndex < 0) return messages;

  const lastMsg = messages[lastIndex];
  if (lastMsg.role !== 'assistant') {
    return [
      ...messages,
      {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: '',
        reasoning: reasoningChunk,
        timestamp: Date.now(),
      },
    ];
  }

  const updatedMsg: ChatMessage = {
    ...lastMsg,
    reasoning: (lastMsg.reasoning || '') + reasoningChunk,
  };

  const copy = [...messages];
  copy[lastIndex] = updatedMsg;
  return copy;
}

/**
 * State helper: Appends text token chunks to the active assistant message
 */
export function appendContentToMessages(
  messages: ChatMessage[],
  chunk: string
): ChatMessage[] {
  const lastIndex = messages.length - 1;
  if (lastIndex < 0) return messages;

  const lastMsg = messages[lastIndex];
  if (lastMsg.role !== 'assistant') {
    return [
      ...messages,
      {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: chunk,
        timestamp: Date.now(),
      },
    ];
  }

  const updatedMsg: ChatMessage = {
    ...lastMsg,
    content: lastMsg.content + chunk,
  };

  const copy = [...messages];
  copy[lastIndex] = updatedMsg;
  return copy;
}
