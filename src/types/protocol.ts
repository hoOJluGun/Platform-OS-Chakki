/**
 * Chakki OS / Engine Protocol Specification (JSON-RPC 2.0)
 * Clean-Room Data Contracts between Swift Engine and UI Layer (Web/Tauri/Desktop)
 */

export type JsonRpcId = string | number;

export interface JsonRpcRequest<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params: T;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification<T = unknown> {
  jsonrpc: '2.0';
  method: string;
  params: T;
}

// ==========================================
// Swift Engine Methods (Client -> Engine)
// ==========================================

export interface InitializeParams {
  clientName: string;
  clientVersion: string;
  workspacePath: string;
  capabilities: {
    interactiveApproval: boolean;
    streamingReasoning: boolean;
    diffViewer: boolean;
  };
}

export interface StartTaskParams {
  taskId?: string;
  prompt: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  contextFiles?: string[];
  enableThinking?: boolean;
}

export interface ApproveToolParams {
  taskId: string;
  toolCallId: string;
  approved: boolean;
  modifiedArgs?: Record<string, unknown>;
  rejectionReason?: string;
}

export interface CancelTaskParams {
  taskId: string;
  reason?: string;
}

export interface ReadFileParams {
  path: string;
}

export interface WriteFileParams {
  path: string;
  content: string;
}

// ==========================================
// Swift Engine Events (Engine -> Client / UI)
// ==========================================

export type EngineEventMethod =
  | 'engine.ready'
  | 'task.started'
  | 'task.status_changed'
  | 'task.reasoning_chunk'
  | 'task.token_chunk'
  | 'task.tool_requested'
  | 'task.tool_started'
  | 'task.tool_completed'
  | 'task.completed'
  | 'task.error';

export type TaskStatus =
  | 'idle'
  | 'planning'
  | 'thinking'
  | 'executing_tool'
  | 'awaiting_approval'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskStartedEvent {
  taskId: string;
  model: string;
  timestamp: number;
}

export interface TaskStatusEvent {
  taskId: string;
  status: TaskStatus;
  message?: string;
}

export interface ReasoningChunkEvent {
  taskId: string;
  chunk: string;
  stepNumber?: number;
}

export interface TokenChunkEvent {
  taskId: string;
  chunk: string;
  role: 'assistant';
}

export interface ToolRequestedEvent {
  taskId: string;
  toolCallId: string;
  toolName: 'bash' | 'file_write' | 'file_patch' | 'file_read' | 'linter' | string;
  args: Record<string, unknown>;
  requiresApproval: boolean;
  riskLevel?: 'safe' | 'caution' | 'dangerous';
  diff?: FileDiff;
}

export interface ToolCompletedEvent {
  taskId: string;
  toolCallId: string;
  toolName: string;
  exitCode: number;
  output: string;
  durationMs: number;
  error?: string;
}

export interface TaskCompletedEvent {
  taskId: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  summary: string;
}

export interface TaskErrorEvent {
  taskId: string;
  code: string;
  message: string;
  details?: unknown;
}

// ==========================================
// Tooling & File Data Contracts
// ==========================================

export interface FileDiff {
  filePath: string;
  originalContent?: string;
  newContent?: string;
  addedLines: number;
  removedLines: number;
  unifiedDiff?: string;
}

export interface ToolCallState {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  requiresApproval: boolean;
  status: 'pending_approval' | 'approved' | 'running' | 'completed' | 'rejected' | 'failed';
  riskLevel?: 'safe' | 'caution' | 'dangerous';
  diff?: FileDiff;
  result?: {
    output: string;
    exitCode: number;
    durationMs: number;
  };
  rejectionReason?: string;
  createdAt: number;
}

// ==========================================
// UI State & Workspace Representation
// ==========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  toolCalls?: ToolCallState[];
  timestamp: number;
}

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  language?: string;
  children?: FileItem[];
  modified?: boolean;
}

export interface JsonRpcPacketLog {
  id: string;
  timestamp: number;
  direction: 'in' | 'out'; // in = from engine, out = to engine
  raw: string;
  method?: string;
  isError?: boolean;
}

export type ConnectionMode = 'simulated' | 'websocket_live';
