/**
 * Chakki Master Execution Contract v2.0 - Core Types
 * Complete specification for Canonical Ledger, JSON-RPC 2.0, Tools, Commands, and Orchestration.
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
// Canonical SHA-256 Event Ledger
// ==========================================

export type LedgerEventKind =
  | 'session.created'
  | 'session.resumed'
  | 'session.closed'
  | 'task.queued'
  | 'task.started'
  | 'task.progress'
  | 'task.waiting_approval'
  | 'task.cancelled'
  | 'task.completed'
  | 'task.failed'
  | 'tool.requested'
  | 'tool.approved'
  | 'tool.rejected'
  | 'tool.started'
  | 'tool.output_chunk'
  | 'tool.completed'
  | 'tool.failed'
  | 'file.change_proposed'
  | 'file.change_applied'
  | 'file.change_rejected'
  | 'file.change_rolled_back'
  | 'provider.request_started'
  | 'provider.first_token'
  | 'provider.retry'
  | 'provider.completed'
  | 'provider.failed'
  | 'memory.record_appended'
  | 'memory.index_updated'
  | 'agent.spawned'
  | 'agent.progress'
  | 'agent.completed'
  | 'agent.failed'
  | 'verification.started'
  | 'verification.completed'
  | 'verification.failed';

export interface LedgerEvent<T = any> {
  schema_version: '2.0';
  session_id: string;
  event_seq: number; // Monotonic sequence within session
  event_id: string; // UUID v4
  kind: LedgerEventKind;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'engine' | 'verifier';
  timestamp: number; // Unix ms
  content: T;
  payload_length: number;
  prev_hash: string; // SHA-256 hex
  current_hash: string; // SHA-256 hex
  provenance?: {
    agent_id?: string;
    parent_task_id?: string;
    turn_number?: number;
    source_artifact?: string;
  };
}

// ==========================================
// Memory & Retrieval
// ==========================================

export interface MemoryRecord {
  record_id: string;
  session_id: string;
  turn_number: number;
  event_seq: number;
  role: string;
  text_content: string;
  identifiers: string[]; // Paths, SHAs, symbols, error codes
  timestamp: number;
}

export interface RetrievalResult {
  record: MemoryRecord;
  score: number;
  match_type: 'exact_id' | 'bm25' | 'turn_number';
  excerpt: string;
}

// ==========================================
// Kilo Gateway & Providers
// ==========================================

export interface KiloModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  pricing: {
    input_per_m?: number;
    output_per_m?: number;
    is_free: boolean;
    is_unknown: boolean;
  };
  capabilities: {
    tool_calling: boolean;
    streaming: boolean;
    reasoning_effort: boolean;
    supported_reasoning_levels?: ('low' | 'medium' | 'high')[];
  };
  status: 'active' | 'degraded' | 'unavailable';
}

// ==========================================
// Tool Runtime & Permissions
// ==========================================

export type PermissionMode = 'review' | 'workspace' | 'autopilot';

export type ToolRisk = 'read_only' | 'workspace_write' | 'destructive_shell' | 'network_egress';

export interface ToolDefinition {
  name: string;
  family: 'fs' | 'code' | 'shell' | 'git' | 'memory' | 'agent' | 'mcp' | 'skill';
  description: string;
  risk: ToolRisk;
  requires_approval_by_default: boolean;
  execute: (args: any, context: ToolExecutionContext) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionContext {
  workspace_root: string;
  session_id: string;
  agent_id: string;
  permission_mode: PermissionMode;
  redacted_env: Record<string, string>;
}

export interface ToolExecutionResult {
  success: boolean;
  exit_code?: number;
  output: string;
  duration_ms: number;
  artifacts?: Array<{ name: string; path: string; hash?: string }>;
  diff?: {
    file_path: string;
    original_hash: string;
    new_hash: string;
    unified_diff: string;
    added_lines: number;
    removed_lines: number;
  };
  error?: string;
}

// ==========================================
// Agent Orchestration & Roles
// ==========================================

export type AgentRole = 'director' | 'explorer' | 'worker' | 'verifier' | 'reviewer';

export interface AgentTask {
  task_id: string;
  parent_task_id?: string;
  role: AgentRole;
  objective: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  write_scope: string[]; // Whitelist of paths worker is authorized to edit
  assigned_worker_id: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
  evidence?: string[];
  verification_passed?: boolean;
}

// ==========================================
// Built-in 28 Commands
// ==========================================

export interface CommandDefinition {
  name: string;
  usage: string;
  description: string;
  category: 'session' | 'model' | 'agent' | 'git' | 'memory' | 'system';
  execute: (args: string[], engineContext: any) => Promise<CommandResult>;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}
