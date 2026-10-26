#!/usr/bin/env node
/**
 * Chakki CLI / TUI - Production Executable Entry Point (ESM)
 * Protocol JSON-RPC 2.0 Client & Direct Terminal Engine.
 */

import { CommandRegistry } from '../src/core/commands.ts';
import { KiloGatewayClient } from '../src/core/kiloGateway.ts';
import { sendLiveKiloCompletion } from '../src/core/liveProvider.ts';

const args = process.argv.slice(2);
const kiloClient = new KiloGatewayClient();
const registry = new CommandRegistry();

async function main() {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║ CHAKKI CLI · AUTONOMOUS AGENT RUNTIME v3.0                          ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
  chakki doctor               Inspect runtime, gateway, and sandbox health
  chakki models [--free]      Query live Kilo AI Gateway models
  chakki run <prompt>         Execute task with real live inference
  chakki <command> [args]     Execute any of the 28 engine commands (e.g. /plan, /search)
`);
    process.exit(0);
  }

  const subcmd = args[0];

  if (subcmd === 'doctor') {
    const res = await registry.execute('/doctor', {});
    console.log(res.message);
    process.exit(0);
  }

  if (subcmd === 'models') {
    console.log('Querying live Kilo Gateway catalogue...');
    try {
      const models = await kiloClient.getModels();
      const freeOnly = args.includes('--free');
      const filtered = freeOnly ? models.filter((m) => m.pricing?.is_free) : models;
      console.log(`Found ${filtered.length} models:`);
      filtered.slice(0, 20).forEach((m) => {
        console.log(`• ${m.id.padEnd(38)} [${m.pricing?.is_free ? 'FREE' : 'PAID'}] (ctx: ${m.context_length})`);
      });
    } catch (e) {
      console.error('Failed to query models:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  if (subcmd === 'run') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error('Error: missing prompt. Usage: chakki run "your prompt"');
      process.exit(1);
    }

    console.log(`[Chakki] Dispatching live inference for: "${prompt}"...`);
    try {
      const res = await sendLiveKiloCompletion({
        model: 'kilo-auto/free',
        messages: [{ role: 'user', content: prompt }],
      });
      console.log(`\n--- [MODEL RESPONSE via ${res.model} in ${res.latency_ms}ms] ---`);
      if (res.reasoning) {
        console.log(`[Reasoning]:\n${res.reasoning}\n`);
      }
      console.log(res.content);
      process.exit(0);
    } catch (e) {
      console.error('[Chakki CLI Error]:', e.message);
      process.exit(1);
    }
  }

  const cmdStr = subcmd.startsWith('/') ? subcmd : `/${subcmd}`;
  const fullCmd = [cmdStr, ...args.slice(1)].join(' ');
  const res = await registry.execute(fullCmd, { kiloClient });
  console.log(res.message);
  process.exit(res.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
